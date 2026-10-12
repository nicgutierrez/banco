import { readFile } from 'node:fs/promises'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { cache } from 'react'
import type { Question, Subject, Unit } from './types'
import { moduleKey } from './keys'

const ROOT = path.join(process.cwd(), 'content')

/** Catalogo delle materie e delle unità previste, scritte o no. */
export const getCatalog = cache((): Subject[] => {
  return JSON.parse(readFileSync(path.join(ROOT, 'materie.json'), 'utf8')) as Subject[]
})

export function getSubject(subjectId: string): Subject | undefined {
  return getCatalog().find((s) => s.id === subjectId)
}

export const getUnit = cache(async (subjectId: string, unitId: string): Promise<Unit | undefined> => {
  const entry = getSubject(subjectId)?.units.find((u) => u.id === unitId)
  if (!entry?.ready) return undefined
  const raw = await readFile(path.join(ROOT, subjectId, unitId, 'unit.json'), 'utf8')
  return JSON.parse(raw) as Unit
})

export async function getLesson(subjectId: string, unitId: string, moduleId: string) {
  const unit = await getUnit(subjectId, unitId)
  const mod = unit?.modules.find((m) => m.id === moduleId)
  if (!unit || !mod) return undefined
  const markdown = await readFile(path.join(ROOT, subjectId, unitId, mod.file), 'utf8')
  return { unit, module: mod, markdown }
}

/** Tutte le unità scritte, in ordine di catalogo. */
export const getReadyUnits = cache(async () => {
  const out: { subject: Subject; unit: Unit }[] = []
  for (const subject of getCatalog()) {
    for (const entry of subject.units) {
      if (!entry.ready) continue
      const unit = await getUnit(subject.id, entry.id)
      if (unit) out.push({ subject, unit })
    }
  }
  return out
})

export const moduleKeysOf = (subjectId: string, unit: Unit) =>
  unit.modules.map((m) => moduleKey(subjectId, unit.id, m.id))

/** Domande della verifica senza soluzioni: è questo che arriva al browser. */
export type PublicQuestion = Omit<Question, 'answer' | 'explanation'>

export const toPublic = (q: Question): PublicQuestion => ({
  id: q.id,
  text: q.text,
  options: q.options,
  topic: q.topic,
})
