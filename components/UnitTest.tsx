'use client'

import Link from 'next/link'
import { useEffect, useState, useTransition } from 'react'
import { submitTest } from '@/lib/actions'
import type { PublicQuestion } from '@/lib/content'

type Props = {
  subjectId: string
  unitId: string
  eyebrow: string
  heading: string
  minutes: number
  questions: PublicQuestion[]
  exitHref: string
}

type Draft = { answers: (number | null)[]; flagged: number[]; startedAt: number }
const LETTERS = 'ABCDEF'

function readDraft(key: string, length: number): Draft | null {
  try {
    const d = JSON.parse(localStorage.getItem(key) ?? 'null') as Draft | null
    return d && Array.isArray(d.answers) && d.answers.length === length ? d : null
  } catch {
    return null
  }
}

function writeDraft(key: string, d: Draft) {
  try {
    localStorage.setItem(key, JSON.stringify(d))
  } catch {}
}

const mmss = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

export function UnitTest(p: Props) {
  const storageKey = `banco:verifica:${p.subjectId}/${p.unitId}`
  // Bozza nel browser: chiudendo la pagina non si perde la verifica a metà.
  // Il componente gira solo nel browser (vedi UnitTestClient), quindi qui localStorage c'è.
  const [draft] = useState(() => readDraft(storageKey, p.questions.length))
  const [startedAt] = useState(() => draft?.startedAt ?? Date.now())
  const [answers, setAnswers] = useState<(number | null)[]>(() => draft?.answers ?? p.questions.map(() => null))
  const [flagged, setFlagged] = useState<Set<number>>(() => new Set(draft?.flagged ?? []))
  const [index, setIndex] = useState(0)
  const [elapsed, setElapsed] = useState(() => Math.floor((Date.now() - startedAt) / 1000))
  const [confirming, setConfirming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sending, startSending] = useTransition()

  useEffect(() => {
    const id = setInterval(() => setElapsed(Math.floor((Date.now() - startedAt) / 1000)), 1000)
    return () => clearInterval(id)
  }, [startedAt])

  useEffect(() => {
    writeDraft(storageKey, { answers, flagged: [...flagged], startedAt })
  }, [answers, flagged, startedAt, storageKey])

  const q = p.questions[index]
  const answeredCount = answers.filter((a) => a !== null).length
  const missing = p.questions.length - answeredCount
  const overtime = elapsed > p.minutes * 60

  const pick = (i: number) => {
    setConfirming(false)
    setAnswers((a) => a.map((v, k) => (k === index ? i : v)))
  }
  const toggleFlag = () =>
    setFlagged((f) => {
      const n = new Set(f)
      if (n.has(index)) n.delete(index)
      else n.add(index)
      return n
    })
  const submit = () => {
    if (missing > 0 && !confirming) {
      setConfirming(true)
      return
    }
    startSending(async () => {
      try {
        setError(null)
        try { localStorage.removeItem(storageKey) } catch {}
        await submitTest(p.subjectId, p.unitId, answers, elapsed)
      } catch (e) {
        // Il redirect di Next arriva come eccezione: va lasciato passare.
        if (e && typeof e === 'object' && 'digest' in e && String((e as { digest: unknown }).digest).startsWith('NEXT_REDIRECT')) throw e
        writeDraft(storageKey, { answers, flagged: [...flagged], startedAt })
        setError('Consegna non riuscita. Le risposte sono ancora qui: riprova tra poco.')
      }
    })
  }

  const cellClass = (k: number) =>
    ['qcell', k === index ? 'current' : flagged.has(k) ? 'flagged' : answers[k] !== null ? 'answered' : ''].join(' ')

  return (
    <>
      <header className="focusbar">
        <div className="grow" style={{ flex: '1 1 280px' }}>
          <div className="eyebrow">{p.eyebrow}</div>
          <div style={{ fontWeight: 700, fontSize: 18 }}>{p.heading}</div>
        </div>
        <div style={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: overtime ? '#ffb3bc' : undefined }}>
          {mmss(elapsed)} <span style={{ color: 'var(--hero-muted)', fontWeight: 500 }}>/ {p.minutes}:00</span>
        </div>
        <Link href={p.exitHref}>Esci, la bozza resta salvata</Link>
      </header>
      <div className="progress-line"><span style={{ width: `${(answeredCount / p.questions.length) * 100}%` }} /></div>
      <main className="main">
        <div className="page" style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'flex-start' }}>
          <section className="question" style={{ flex: '999 1 560px', minWidth: 0 }}>
            <div className="eyebrow">Domanda {index + 1} di {p.questions.length}{q.topic ? ` · ${q.topic}` : ''}</div>
            <p className="question-text">{q.text}</p>
            <div className="options" role="group" aria-label="Risposte">
              {q.options.map((o, i) => (
                <button key={i} type="button" className="option" aria-pressed={answers[index] === i} onClick={() => pick(i)}>
                  <span className="letter">{LETTERS[i]}</span>{o}
                </button>
              ))}
            </div>
            <div className="actions">
              <button type="button" className="btn btn-quiet" disabled={index === 0} onClick={() => setIndex(index - 1)}>Indietro</button>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <button type="button" className="btn btn-quiet" aria-pressed={flagged.has(index)} onClick={toggleFlag}>
                  {flagged.has(index) ? 'Togli il segno' : 'Segna e torna dopo'}
                </button>
                {index < p.questions.length - 1 && (
                  <button type="button" className="btn btn-primary" onClick={() => setIndex(index + 1)}>Avanti</button>
                )}
              </div>
            </div>
          </section>
          <aside className="col-side" style={{ flex: '1 1 250px' }}>
            <div className="card">
              <h2>Le tue risposte</h2>
              <div className="qgrid">
                {p.questions.map((x, k) => (
                  <button key={x.id} type="button" className={cellClass(k)} aria-label={`Vai alla domanda ${k + 1}`} onClick={() => setIndex(k)}>
                    {k + 1}
                  </button>
                ))}
              </div>
              <div className="small muted">{answeredCount} date · {flagged.size} segnate · {missing} da fare</div>
            </div>
            {confirming && (
              <p className="notice error" role="alert" style={{ margin: 0 }}>
                {missing === 1 ? 'Una domanda è' : `${missing} domande sono`} senza risposta e contano come sbagliate. Premi di nuovo per consegnare comunque.
              </p>
            )}
            {error && <p className="notice error" role="alert" style={{ margin: 0 }}>{error}</p>}
            <button type="button" className="btn btn-outline" disabled={sending} onClick={submit}>
              {sending ? 'Correggo…' : 'Consegna la verifica'}
            </button>
            <p className="small muted" style={{ margin: 0 }}>Niente correzione durante la prova: la vedi alla consegna, come in classe.</p>
          </aside>
        </div>
      </main>
    </>
  )
}
