import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import type { Subject, Unit } from '@/lib/types'

const ROOT = path.join(process.cwd(), 'content')
const catalog = JSON.parse(readFileSync(path.join(ROOT, 'materie.json'), 'utf8')) as Subject[]
const readyUnits = catalog.flatMap((s) => s.units.filter((u) => u.ready).map((u) => ({ s, u })))

describe('catalogo', () => {
  it('ha id unici per materie e unità', () => {
    const ids = catalog.map((s) => s.id)
    expect(new Set(ids).size).toBe(ids.length)
    catalog.forEach((s) => {
      const u = s.units.map((x) => x.id)
      expect(new Set(u).size).toBe(u.length)
    })
  })
  it('ha almeno una unità scritta', () => {
    expect(readyUnits.length).toBeGreaterThan(0)
  })
})

describe.each(readyUnits.map(({ s, u }) => [`${s.id}/${u.id}`, s, u] as const))('unità %s', (_name, s, entry) => {
  const dir = path.join(ROOT, s.id, entry.id)
  const unit = JSON.parse(readFileSync(path.join(dir, 'unit.json'), 'utf8')) as Unit
  const all = [...unit.modules.flatMap((m) => m.quiz), ...unit.test.questions]

  it('ha id e titolo coerenti con il catalogo', () => {
    expect(unit.id).toBe(entry.id)
    expect(unit.title).toBe(entry.title)
    expect(unit.number).toBe(s.units.findIndex((x) => x.id === entry.id) + 1)
  })
  it('ha lezioni esistenti e non vuote', () => {
    unit.modules.forEach((m) => {
      const file = path.join(dir, m.file)
      expect(existsSync(file)).toBe(true)
      expect(readFileSync(file, 'utf8').trim().length).toBeGreaterThan(500)
    })
  })
  it('ha mini test da 5 domande e una verifica da 20', () => {
    unit.modules.forEach((m) => expect(m.quiz).toHaveLength(5))
    expect(unit.test.questions).toHaveLength(20)
  })
  it('ha domande ben formate', () => {
    const ids = all.map((q) => q.id)
    expect(new Set(ids).size).toBe(ids.length)
    all.forEach((q) => {
      expect(q.options).toHaveLength(4)
      expect(new Set(q.options).size).toBe(4)
      expect(q.answer).toBeGreaterThanOrEqual(0)
      expect(q.answer).toBeLessThan(q.options.length)
      expect(q.explanation.length).toBeGreaterThan(10)
    })
    unit.test.questions.forEach((q) => expect(q.topic).toBeTruthy())
  })
  it('non mette la risposta giusta sempre nella stessa posizione', () => {
    const counts = [0, 0, 0, 0]
    all.forEach((q) => counts[q.answer]++)
    counts.forEach((c) => expect(c).toBeLessThan(all.length * 0.4))
  })
})
