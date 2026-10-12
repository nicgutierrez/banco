import type { ModuleProgress, TestAttempt } from './types'

/** Regole di gioco in un posto solo, così si tarano senza cercarle nel codice. */
export const RULES = {
  /** Risposte giuste minime per completare un modulo, sul totale del mini test. */
  miniTestPassRatio: 0.8,
  passGrade: 6,
  masteryGrade: 8,
  /** Dopo quanti giorni senza attività un'unità superata si incrina. */
  crackAfterDays: 21,
  points: {
    modulo: 10,
    unita_superata: 100,
    unita_padroneggiata: 50,
    ripasso: 20,
  },
} as const

/** Voto in decimi, arrotondato al mezzo voto, minimo 2 come in classe. */
export function gradeFromScore(correct: number, total: number): number {
  if (total <= 0) return 2
  return Math.max(2, Math.round((correct / total) * 20) / 2)
}

export function formatGrade(grade: number): string {
  const whole = Math.floor(grade)
  return grade - whole >= 0.5 ? `${whole}½` : String(whole)
}

export function miniTestPassed(correct: number, total: number): boolean {
  return total > 0 && correct >= Math.ceil(total * RULES.miniTestPassRatio)
}

/** Soglia minima di punti per il livello n: 0, 100, 300, 600, 1000, 1500… */
export const levelFloor = (level: number) => 50 * level * (level - 1)

export function levelFor(points: number) {
  let level = 1
  while (levelFloor(level + 1) <= points) level++
  const floor = levelFloor(level)
  const next = levelFloor(level + 1)
  return {
    level,
    toNext: next - points,
    next,
    pct: Math.round(((points - floor) / (next - floor)) * 100),
  }
}

export type UnitState = 'da-fare' | 'in-corso' | 'pronta' | 'superata' | 'padroneggiata' | 'incrinata'

export const UNIT_STATE_LABEL: Record<UnitState, string> = {
  'da-fare': 'Da fare',
  'in-corso': 'In corso',
  pronta: 'Verifica sbloccata',
  superata: 'Superata',
  padroneggiata: 'Padroneggiata',
  incrinata: 'Incrinata',
}

export type UnitStatus = {
  state: UnitState
  completedModules: number
  totalModules: number
  testUnlocked: boolean
  bestGrade: number | null
  lastActivity: Date | null
}

const DAY = 24 * 60 * 60 * 1000

export function unitStatus(
  moduleKeys: string[],
  progress: Map<string, ModuleProgress>,
  attempts: TestAttempt[],
  now: Date = new Date(),
): UnitStatus {
  const rows = moduleKeys.map((k) => progress.get(k)).filter((r): r is ModuleProgress => !!r)
  const completedModules = rows.filter((r) => r.completed_at).length
  const totalModules = moduleKeys.length
  const testUnlocked = totalModules > 0 && completedModules === totalModules
  const bestGrade = attempts.length ? Math.max(...attempts.map((a) => Number(a.grade))) : null

  const times = [
    ...rows.map((r) => new Date(r.last_activity_at).getTime()),
    ...attempts.map((a) => new Date(a.created_at).getTime()),
  ]
  const lastActivity = times.length ? new Date(Math.max(...times)) : null

  let state: UnitState
  if (bestGrade !== null && bestGrade >= RULES.passGrade) {
    const idle = lastActivity ? now.getTime() - lastActivity.getTime() : 0
    if (idle > RULES.crackAfterDays * DAY) state = 'incrinata'
    else state = bestGrade >= RULES.masteryGrade ? 'padroneggiata' : 'superata'
  } else if (testUnlocked) state = 'pronta'
  else if (rows.length > 0) state = 'in-corso'
  else state = 'da-fare'

  return { state, completedModules, totalModules, testUnlocked, bestGrade, lastActivity }
}

export type Stats = {
  modulesCompleted: number
  unitsPassed: number
  unitsMastered: number
  repairs: number
  subjectsClosed: number
}

export type Achievement = { id: string; title: string; detail: string; earned: boolean }

export function achievements(s: Stats): Achievement[] {
  const count = (n: number, target: number) => `${Math.min(n, target)} su ${target}`
  return [
    { id: 'primo-modulo', title: 'Primo modulo', detail: 'Il primo mini test superato', earned: s.modulesCompleted >= 1 },
    { id: 'dieci-moduli', title: 'Dieci moduli', detail: count(s.modulesCompleted, 10), earned: s.modulesCompleted >= 10 },
    { id: 'prima-unita', title: 'Prima unità superata', detail: 'Una verifica di unità con 6 o più', earned: s.unitsPassed >= 1 },
    { id: 'padronanza', title: 'Unità padroneggiata', detail: 'Una verifica di unità con 8 o più', earned: s.unitsMastered >= 1 },
    { id: 'riparatore', title: 'Riparatore', detail: "Un'unità incrinata ripassata", earned: s.repairs >= 1 },
    { id: 'cinquanta-moduli', title: 'Cinquanta moduli', detail: count(s.modulesCompleted, 50), earned: s.modulesCompleted >= 50 },
    { id: 'materia-chiusa', title: 'Materia chiusa', detail: 'Tutte le unità di una materia superate', earned: s.subjectsClosed >= 1 },
  ]
}

/** «1 unità superata», «3 unità superate». */
export const superate = (n: number) => `${n} ${n === 1 ? 'unità superata' : 'unità superate'}`
