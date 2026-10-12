'use client'

import Link from 'next/link'
import { useState, useTransition } from 'react'
import { recordMiniTest, type MiniTestResult } from '@/lib/actions'
import type { Question } from '@/lib/types'

type Props = {
  subjectId: string
  unitId: string
  moduleId: string
  heading: string
  eyebrow: string
  questions: Question[]
  lessonHref: string
  nextHref: string
  nextLabel: string
}

const LETTERS = 'ABCDEF'

export function MiniTest(p: Props) {
  const [index, setIndex] = useState(0)
  const [answers, setAnswers] = useState<(number | null)[]>(() => p.questions.map(() => null))
  const [checked, setChecked] = useState<boolean[]>(() => p.questions.map(() => false))
  const [result, setResult] = useState<MiniTestResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [saving, startSaving] = useTransition()

  const q = p.questions[index]
  const choice = answers[index]
  const isChecked = checked[index]
  const isLast = index === p.questions.length - 1

  const pick = (i: number) => setAnswers((a) => a.map((v, k) => (k === index ? i : v)))
  const check = () => setChecked((c) => c.map((v, k) => (k === index ? true : v)))
  const finish = () =>
    startSaving(async () => {
      try {
        setError(null)
        setResult(await recordMiniTest(p.subjectId, p.unitId, p.moduleId, answers))
      } catch {
        setError('Non sono riuscito a salvare il risultato. Controlla la connessione e riprova.')
      }
    })
  const restart = () => {
    setIndex(0)
    setAnswers(p.questions.map(() => null))
    setChecked(p.questions.map(() => false))
    setResult(null)
  }

  const pipClass = (k: number) => {
    if (checked[k]) return answers[k] === p.questions[k].answer ? 'pip right' : 'pip wrong'
    return k === index && !result ? 'pip current' : 'pip'
  }

  return (
    <>
      <header className="focusbar">
        <div className="grow" style={{ flex: '1 1 280px' }}>
          <div className="eyebrow">{p.eyebrow}</div>
          <div style={{ fontWeight: 700, fontSize: 18 }}>{p.heading}</div>
        </div>
        <div className="pips" aria-label={`Domanda ${index + 1} di ${p.questions.length}`}>
          {p.questions.map((x, k) => <span key={x.id} className={pipClass(k)} />)}
        </div>
        <Link href={p.lessonHref}>Torna alla lezione</Link>
      </header>
      <main className="main">
        <div className="page" style={{ maxWidth: 820 }}>
          {!result ? (
            <section className="question" aria-live="polite">
              <div className="eyebrow">Domanda {index + 1} di {p.questions.length}</div>
              <p className="question-text">{q.text}</p>
              <div className="options" role="group" aria-label="Risposte">
                {q.options.map((o, i) => {
                  const cls = ['option', isChecked && i === q.answer ? 'is-right' : '', isChecked && i === choice && i !== q.answer ? 'is-wrong' : ''].join(' ')
                  return (
                    <button key={i} type="button" className={cls} aria-pressed={choice === i} disabled={isChecked} onClick={() => pick(i)}>
                      <span className="letter">{LETTERS[i]}</span>{o}
                    </button>
                  )
                })}
              </div>
              {isChecked && (
                <div className={`feedback ${choice === q.answer ? 'right' : 'wrong'}`}>
                  <b>{choice === q.answer ? 'Giusto.' : 'Non è questa.'}</b> {q.explanation}
                </div>
              )}
              {error && <p className="notice error" role="alert">{error}</p>}
              <div className="actions" style={{ justifyContent: 'flex-end' }}>
                {!isChecked && (
                  <button type="button" className="btn btn-primary" disabled={choice === null} onClick={check}>Controlla</button>
                )}
                {isChecked && !isLast && (
                  <button type="button" className="btn btn-primary" onClick={() => setIndex(index + 1)}>Domanda successiva</button>
                )}
                {isChecked && isLast && (
                  <button type="button" className="btn btn-primary" disabled={saving} onClick={finish}>
                    {saving ? 'Salvo…' : 'Vedi il risultato'}
                  </button>
                )}
              </div>
            </section>
          ) : (
            <section className="question">
              <div className="eyebrow">Mini test finito</div>
              <h1 style={{ fontSize: 32 }}>
                {result.correct} su {result.total}: {result.passed ? 'modulo completato' : 'ancora un giro'}
              </h1>
              <p className="muted" style={{ margin: 0 }}>
                {result.passed
                  ? result.firstCompletion
                    ? 'Hai guadagnato 10 punti.'
                    : 'Il modulo era già completato: questo giro conta come ripasso.'
                  : 'Ne servono almeno 4 giuste. Rileggi i punti delle domande sbagliate e riprova.'}
              </p>
              <div className="actions" style={{ justifyContent: 'flex-start' }}>
                {result.passed ? (
                  <Link className="btn btn-primary" href={p.nextHref}>{p.nextLabel}</Link>
                ) : (
                  <Link className="btn btn-primary" href={p.lessonHref}>Rileggi la lezione</Link>
                )}
                <button type="button" className="btn btn-quiet" onClick={restart}>Rifai il mini test</button>
              </div>
            </section>
          )}
        </div>
      </main>
    </>
  )
}
