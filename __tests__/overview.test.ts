import { buildOverview } from '@/lib/overview'
import type { ModuleProgress, Subject, Unit } from '@/lib/types'

const q = { id: 'q', text: 't', options: ['a', 'b'], answer: 0, explanation: 'e' }
const unit = (id: string, n: number): Unit => ({
  id,
  number: n,
  title: `Unità ${n}`,
  summary: '',
  modules: ['m1', 'm2'].map((m) => ({ id: m, title: m, minutes: 10, file: `${m}.md`, quiz: [q] })),
  test: { minutes: 10, questions: [q] },
})
const subject: Subject = {
  id: 'storia',
  name: 'Storia',
  units: [
    { id: 'u1', title: 'Unità 1', ready: true },
    { id: 'u2', title: 'Unità 2', ready: true },
    { id: 'u3', title: 'Unità 3', ready: false },
  ],
}
const ready = [{ subject, unit: unit('u1', 1) }, { subject, unit: unit('u2', 2) }]
const done = (key: string, at: string): ModuleProgress => ({
  module_key: key, best_correct: 1, total: 1, attempts: 1, completed_at: at, last_activity_at: at,
})
const base = { catalog: [subject], ready, attempts: [], events: [], now: new Date('2026-10-12T12:00:00Z') }

describe('riprendi', () => {
  it('senza attività parte dal primo modulo della prima unità', () => {
    const o = buildOverview({ ...base, progress: new Map() })
    expect(o.resume).toMatchObject({ kind: 'modulo', moduleIndex: 0 })
    expect(o.resume?.view.unit.id).toBe('u1')
  })
  it('continua con il modulo successivo non completato', () => {
    const p = new Map([['storia/u1/m1', done('storia/u1/m1', '2026-10-10T10:00:00Z')]])
    const o = buildOverview({ ...base, progress: p })
    expect(o.resume).toMatchObject({ kind: 'modulo', moduleIndex: 1 })
  })
  it('a moduli finiti propone la verifica', () => {
    const p = new Map([
      ['storia/u1/m1', done('storia/u1/m1', '2026-10-10T10:00:00Z')],
      ['storia/u1/m2', done('storia/u1/m2', '2026-10-11T10:00:00Z')],
    ])
    const o = buildOverview({ ...base, progress: p })
    expect(o.resume?.kind).toBe('verifica')
    expect(o.testsReady.map((v) => v.unit.id)).toEqual(['u1'])
  })
  it("con l'unità superata passa alla successiva", () => {
    const p = new Map([
      ['storia/u1/m1', done('storia/u1/m1', '2026-10-10T10:00:00Z')],
      ['storia/u1/m2', done('storia/u1/m2', '2026-10-11T10:00:00Z')],
    ])
    const attempts = [{ id: 'a', unit_key: 'storia/u1', correct: 1, total: 1, grade: 7, answers: [0], duration_seconds: 60, points_awarded: 100, created_at: '2026-10-11T11:00:00Z' }]
    const o = buildOverview({ ...base, progress: p, attempts })
    expect(o.resume).toMatchObject({ kind: 'modulo', moduleIndex: 0 })
    expect(o.resume?.view.unit.id).toBe('u2')
    expect(o.subjects[0]).toMatchObject({ passed: 1, total: 3, written: 2 })
    expect(o.stats.unitsPassed).toBe(1)
  })
})
