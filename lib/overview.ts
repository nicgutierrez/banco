import { achievements, unitStatus, type Stats, type UnitStatus } from './game'
import { moduleKey, unitKey, unitKeyOfModule } from './keys'
import type { ModuleProgress, PointsEvent, Subject, TestAttempt, Unit } from './types'

export type UnitView = {
  key: string
  subject: Subject
  unit: Unit
  status: UnitStatus
}

export type Resume =
  | { kind: 'modulo'; view: UnitView; moduleIndex: number }
  | { kind: 'verifica'; view: UnitView }
  | null

type Input = {
  catalog: Subject[]
  ready: { subject: Subject; unit: Unit }[]
  progress: Map<string, ModuleProgress>
  attempts: TestAttempt[]
  events: PointsEvent[]
  now?: Date
}

const PASSED = new Set(['superata', 'padroneggiata', 'incrinata'])

export function buildOverview({ catalog, ready, progress, attempts, events, now = new Date() }: Input) {
  const views: UnitView[] = ready.map(({ subject, unit }) => {
    const key = unitKey(subject.id, unit.id)
    const keys = unit.modules.map((m) => moduleKey(subject.id, unit.id, m.id))
    const status = unitStatus(
      keys,
      progress,
      attempts.filter((a) => a.unit_key === key),
      now,
    )
    return { key, subject, unit, status }
  })
  const byKey = new Map(views.map((v) => [v.key, v]))

  const nextStep = (v: UnitView): Resume => {
    const i = v.unit.modules.findIndex((m) => !progress.get(moduleKey(v.subject.id, v.unit.id, m.id))?.completed_at)
    if (i >= 0) return { kind: 'modulo', view: v, moduleIndex: i }
    if (!PASSED.has(v.status.state)) return { kind: 'verifica', view: v }
    return null
  }

  let resume: Resume = null
  const latest = [...progress.values()]
    .filter((r) => byKey.has(unitKeyOfModule(r.module_key)))
    .sort((a, b) => b.last_activity_at.localeCompare(a.last_activity_at))[0]
  if (latest) {
    const start = views.indexOf(byKey.get(unitKeyOfModule(latest.module_key))!)
    for (let i = start; i < views.length && !resume; i++) resume = nextStep(views[i])
  }
  for (let i = 0; i < views.length && !resume; i++) resume = nextStep(views[i])

  const subjects = catalog.map((subject) => {
    const own = views.filter((v) => v.subject.id === subject.id)
    const passed = own.filter((v) => PASSED.has(v.status.state)).length
    return { subject, passed, total: subject.units.length, written: own.length }
  })

  const stats: Stats = {
    modulesCompleted: [...progress.values()].filter((r) => r.completed_at).length,
    unitsPassed: views.filter((v) => PASSED.has(v.status.state)).length,
    unitsMastered: views.filter((v) => (v.status.bestGrade ?? 0) >= 8).length,
    repairs: events.filter((e) => e.kind === 'ripasso').length,
    subjectsClosed: subjects.filter((s) => s.total > 0 && s.passed === s.total).length,
  }

  return {
    views,
    byKey,
    resume,
    cracked: views.filter((v) => v.status.state === 'incrinata'),
    testsReady: views.filter((v) => v.status.state === 'pronta'),
    subjects,
    stats,
    achievements: achievements(stats),
  }
}
