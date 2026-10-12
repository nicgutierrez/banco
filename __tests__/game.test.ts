import { achievements, formatGrade, gradeFromScore, levelFor, miniTestPassed, unitStatus } from '@/lib/game'
import type { ModuleProgress, TestAttempt } from '@/lib/types'

const day = 24 * 60 * 60 * 1000
const now = new Date('2026-10-12T12:00:00Z')
const ago = (days: number) => new Date(now.getTime() - days * day).toISOString()

const row = (key: string, completed: boolean, daysAgo = 1): ModuleProgress => ({
  module_key: key,
  best_correct: completed ? 5 : 2,
  total: 5,
  attempts: 1,
  completed_at: completed ? ago(daysAgo) : null,
  last_activity_at: ago(daysAgo),
})

const attempt = (grade: number, daysAgo = 1): TestAttempt => ({
  id: `a${grade}${daysAgo}`,
  unit_key: 's/u',
  correct: 0,
  total: 20,
  grade,
  answers: [],
  duration_seconds: 600,
  points_awarded: 0,
  created_at: ago(daysAgo),
})

describe('voti', () => {
  it('arrotonda al mezzo voto con minimo 2', () => {
    expect(gradeFromScore(15, 20)).toBe(7.5)
    expect(gradeFromScore(20, 20)).toBe(10)
    expect(gradeFromScore(0, 20)).toBe(2)
    expect(gradeFromScore(13, 20)).toBe(6.5)
  })
  it('scrive il mezzo voto come in pagella', () => {
    expect(formatGrade(7.5)).toBe('7½')
    expect(formatGrade(6)).toBe('6')
  })
  it('il mini test si supera con 4 su 5', () => {
    expect(miniTestPassed(4, 5)).toBe(true)
    expect(miniTestPassed(3, 5)).toBe(false)
  })
})

describe('livelli', () => {
  it('parte da 1 e sale con soglie crescenti', () => {
    expect(levelFor(0)).toMatchObject({ level: 1, toNext: 100 })
    expect(levelFor(100).level).toBe(2)
    expect(levelFor(1240)).toMatchObject({ level: 5, toNext: 260 })
  })
})

describe('stato di unità', () => {
  const keys = ['s/u/1', 's/u/2']
  const map = (...rows: ModuleProgress[]) => new Map(rows.map((r) => [r.module_key, r]))

  it('da fare senza attività', () => {
    expect(unitStatus(keys, map(), [], now).state).toBe('da-fare')
  })
  it('in corso con un solo modulo e verifica bloccata', () => {
    const s = unitStatus(keys, map(row('s/u/1', true)), [], now)
    expect(s.state).toBe('in-corso')
    expect(s.testUnlocked).toBe(false)
  })
  it('un mini test non superato non completa il modulo', () => {
    const s = unitStatus(keys, map(row('s/u/1', true), row('s/u/2', false)), [], now)
    expect(s.completedModules).toBe(1)
    expect(s.testUnlocked).toBe(false)
  })
  it('verifica sbloccata a moduli completi', () => {
    expect(unitStatus(keys, map(row('s/u/1', true), row('s/u/2', true)), [], now).state).toBe('pronta')
  })
  it('superata con 6, padroneggiata con 8, conta il voto migliore', () => {
    const p = map(row('s/u/1', true), row('s/u/2', true))
    expect(unitStatus(keys, p, [attempt(5), attempt(6.5)], now).state).toBe('superata')
    expect(unitStatus(keys, p, [attempt(8), attempt(5)], now).state).toBe('padroneggiata')
    expect(unitStatus(keys, p, [attempt(5)], now).state).toBe('pronta')
  })
  it('si incrina dopo 21 giorni senza attività', () => {
    const p = map(row('s/u/1', true, 40), row('s/u/2', true, 30))
    expect(unitStatus(keys, p, [attempt(7, 25)], now).state).toBe('incrinata')
    expect(unitStatus(keys, p, [attempt(7, 10)], now).state).toBe('superata')
  })
})

describe('traguardi', () => {
  it('si sbloccano dalle statistiche', () => {
    const list = achievements({ modulesCompleted: 12, unitsPassed: 1, unitsMastered: 0, repairs: 0, subjectsClosed: 0 })
    const earned = list.filter((a) => a.earned).map((a) => a.id)
    expect(earned).toEqual(['primo-modulo', 'dieci-moduli', 'prima-unita'])
    expect(list.find((a) => a.id === 'cinquanta-moduli')?.detail).toBe('12 su 50')
  })
})
