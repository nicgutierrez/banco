'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { getUnit } from './content'
import { gradeFromScore, miniTestPassed, RULES, unitStatus } from './game'
import { moduleKey, unitKey } from './keys'
import { createClient } from './supabase/server'
import type { ModuleProgress, PointsEvent, TestAttempt } from './types'

async function requireUser() {
  const supabase = await createClient()
  const { data } = await supabase.auth.getUser()
  if (!data.user) redirect('/login')
  return { supabase, userId: data.user.id }
}

export type MiniTestResult = { correct: number; total: number; passed: boolean; firstCompletion: boolean }

/** Registra un mini test. La correzione si rifà qui: il browser manda solo le risposte. */
export async function recordMiniTest(
  subjectId: string,
  unitId: string,
  moduleId: string,
  answers: (number | null)[],
): Promise<MiniTestResult> {
  const unit = await getUnit(subjectId, unitId)
  const mod = unit?.modules.find((m) => m.id === moduleId)
  if (!mod) throw new Error('Modulo inesistente')

  const total = mod.quiz.length
  const correct = mod.quiz.filter((q, i) => answers[i] === q.answer).length
  const passed = miniTestPassed(correct, total)

  const { supabase, userId } = await requireUser()
  const key = moduleKey(subjectId, unitId, moduleId)
  const { data: existing } = await supabase
    .from('module_progress')
    .select('best_correct, attempts, completed_at')
    .eq('module_key', key)
    .maybeSingle<Pick<ModuleProgress, 'best_correct' | 'attempts' | 'completed_at'>>()

  const now = new Date().toISOString()
  const firstCompletion = passed && !existing?.completed_at
  const { error } = await supabase.from('module_progress').upsert({
    user_id: userId,
    module_key: key,
    best_correct: Math.max(correct, existing?.best_correct ?? 0),
    total,
    attempts: (existing?.attempts ?? 0) + 1,
    completed_at: existing?.completed_at ?? (passed ? now : null),
    last_activity_at: now,
  })
  if (error) throw new Error(`Salvataggio non riuscito: ${error.message}`)

  if (firstCompletion) {
    await supabase
      .from('points_events')
      .insert({ user_id: userId, kind: 'modulo', ref: key, points: RULES.points.modulo })
  }

  revalidatePath('/', 'layout')
  return { correct, total, passed, firstCompletion }
}

/** Corregge e salva una verifica di unità, assegna i premi e porta al risultato. */
export async function submitTest(
  subjectId: string,
  unitId: string,
  answers: (number | null)[],
  durationSeconds: number,
) {
  const unit = await getUnit(subjectId, unitId)
  if (!unit) throw new Error('Unità inesistente')
  const { supabase, userId } = await requireUser()
  const key = unitKey(subjectId, unitId)
  const keys = unit.modules.map((m) => moduleKey(subjectId, unitId, m.id))

  const [progressRes, attemptsRes, eventsRes] = await Promise.all([
    supabase.from('module_progress').select('*').in('module_key', keys),
    supabase.from('test_attempts').select('*').eq('unit_key', key),
    supabase.from('points_events').select('kind, ref').in('kind', ['unita_superata', 'unita_padroneggiata']).eq('ref', key),
  ])
  const progress = new Map(((progressRes.data ?? []) as ModuleProgress[]).map((r) => [r.module_key, r]))
  const before = unitStatus(keys, progress, (attemptsRes.data ?? []) as TestAttempt[])
  if (!before.testUnlocked) throw new Error('La verifica si sblocca quando hai completato tutti i moduli')

  const questions = unit.test.questions
  const correct = questions.filter((q, i) => answers[i] === q.answer).length
  const grade = gradeFromScore(correct, questions.length)

  const already = new Set(((eventsRes.data ?? []) as Pick<PointsEvent, 'kind'>[]).map((e) => e.kind))
  const awards: { kind: PointsEvent['kind']; points: number }[] = []
  if (grade >= RULES.passGrade && !already.has('unita_superata'))
    awards.push({ kind: 'unita_superata', points: RULES.points.unita_superata })
  if (grade >= RULES.masteryGrade && !already.has('unita_padroneggiata'))
    awards.push({ kind: 'unita_padroneggiata', points: RULES.points.unita_padroneggiata })
  if (grade >= RULES.passGrade && before.state === 'incrinata')
    awards.push({ kind: 'ripasso', points: RULES.points.ripasso })

  const { data: attempt, error } = await supabase
    .from('test_attempts')
    .insert({
      user_id: userId,
      unit_key: key,
      correct,
      total: questions.length,
      grade,
      answers: questions.map((_, i) => answers[i] ?? null),
      duration_seconds: Math.max(0, Math.round(durationSeconds)),
      points_awarded: awards.reduce((s, a) => s + a.points, 0),
    })
    .select('id')
    .single()
  if (error || !attempt) throw new Error(`Salvataggio non riuscito: ${error?.message}`)

  if (awards.length) {
    await supabase.from('points_events').insert(
      awards.map((a) => ({
        user_id: userId,
        kind: a.kind,
        ref: a.kind === 'ripasso' ? attempt.id : key,
        points: a.points,
      })),
    )
  }

  revalidatePath('/', 'layout')
  redirect(`/risultati/${attempt.id}`)
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
