import { cache } from 'react'
import { redirect } from 'next/navigation'
import { connection } from 'next/server'
import { createClient } from './supabase/server'
import { supabaseConfigured } from './supabase/env'
import type { ModuleProgress, PointsEvent, TestAttempt } from './types'

export type Snapshot = {
  email: string | null
  progress: Map<string, ModuleProgress>
  attempts: TestAttempt[]
  events: PointsEvent[]
  points: number
}

/** Tutto lo stato dell'utente, letto una volta per richiesta. */
export const getSnapshot = cache(async (): Promise<Snapshot> => {
  // Sempre dinamico: dipende dall'utente, mai da prerenderizzare.
  await connection()
  if (!supabaseConfigured()) redirect('/login')
  const supabase = await createClient()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) redirect('/login')

  const [progress, attempts, events] = await Promise.all([
    supabase.from('module_progress').select('module_key, best_correct, total, attempts, completed_at, last_activity_at'),
    supabase
      .from('test_attempts')
      .select('id, unit_key, correct, total, grade, answers, duration_seconds, points_awarded, created_at')
      .order('created_at', { ascending: true }),
    supabase.from('points_events').select('kind, ref, points, created_at'),
  ])

  const error = progress.error ?? attempts.error ?? events.error
  if (error) throw new Error(`Lettura dei progressi non riuscita: ${error.message}`)

  const ev = (events.data ?? []) as PointsEvent[]
  return {
    email: auth.user.email ?? null,
    progress: new Map((progress.data as ModuleProgress[]).map((r) => [r.module_key, r])),
    attempts: ((attempts.data ?? []) as TestAttempt[]).map((a) => ({ ...a, grade: Number(a.grade) })),
    events: ev,
    points: ev.reduce((sum, e) => sum + e.points, 0),
  }
})

export const attemptsFor = (s: Snapshot, unitKey: string) => s.attempts.filter((a) => a.unit_key === unitKey)
