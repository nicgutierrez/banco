import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { BoltIcon } from '@/components/Icons'
import { Bar } from '@/components/Bar'
import { getSubject, getUnit } from '@/lib/content'
import { formatGrade, RULES } from '@/lib/game'
import { getSnapshot } from '@/lib/progress'
import { paths } from '@/lib/view'

export const metadata: Metadata = { title: 'Risultato' }

export default async function RisultatoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const snap = await getSnapshot()
  const attempt = snap.attempts.find((a) => a.id === id)
  if (!attempt) notFound()
  const [materia, unita] = attempt.unit_key.split('/')
  const subject = getSubject(materia)
  const unit = await getUnit(materia, unita)
  if (!subject || !unit) notFound()

  const questions = unit.test.questions
  const mistakes = questions
    .map((q, i) => ({ q, i, given: attempt.answers[i] }))
    .filter(({ q, given }) => given !== q.answer)

  const topics = new Map<string, { right: number; total: number }>()
  questions.forEach((q, i) => {
    const t = topics.get(q.topic ?? 'Altro') ?? { right: 0, total: 0 }
    t.total++
    if (attempt.answers[i] === q.answer) t.right++
    topics.set(q.topic ?? 'Altro', t)
  })

  const passed = attempt.grade >= RULES.passGrade
  const mastered = attempt.grade >= RULES.masteryGrade
  const minutes = attempt.duration_seconds ? Math.max(1, Math.round(attempt.duration_seconds / 60)) : null
  const weakest = [...topics.entries()].sort((a, b) => a[1].right / a[1].total - b[1].right / b[1].total)[0]

  return (
    <div className="page">
      <section className="hero" style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: '24px 40px' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
          <div className="grade">{formatGrade(attempt.grade)}</div>
          <div className="muted" style={{ fontSize: 18 }}>su 10</div>
        </div>
        <div style={{ flex: '1 1 300px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div className="eyebrow">{subject.name} · Unità {unit.number}, {unit.title}</div>
          <div style={{ fontSize: 28, fontWeight: 700, lineHeight: 1.1 }}>
            {mastered ? 'Unità padroneggiata' : passed ? 'Unità superata' : 'Non ancora superata'}
          </div>
          <div className="muted">
            {attempt.correct} risposte giuste su {attempt.total}{minutes ? ` in ${minutes} ${minutes === 1 ? 'minuto' : 'minuti'}` : ''}.{' '}
            {mastered
              ? 'Ottimo lavoro.'
              : passed
                ? `Con ${RULES.masteryGrade} l'unità diventa padroneggiata: puoi ritentare quando vuoi.`
                : `Serve ${RULES.passGrade}. Ripassa gli argomenti qui sotto e ritentala.`}
          </div>
        </div>
        {attempt.points_awarded > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, fontSize: 18 }}>
            <BoltIcon />+{attempt.points_awarded} punti
          </div>
        )}
      </section>

      <div className="row">
        <section className="col-main">
          <h2 className="section-title">
            {mistakes.length === 0 ? 'Nessun errore' : mistakes.length === 1 ? 'La risposta sbagliata' : `Le ${mistakes.length} risposte sbagliate`}
          </h2>
          {mistakes.length > 0 && (
            <div className="card flush">
              {mistakes.map(({ q, i, given }) => (
                <div key={q.id} className="mistake">
                  <div className="small muted">Domanda {i + 1}{q.topic ? ` · ${q.topic}` : ''}</div>
                  <div className="q">{q.text}</div>
                  <div className="yours">{given === null || given === undefined ? 'Non hai risposto' : `Hai risposto: ${q.options[given]}`}</div>
                  <div className="right">Corretta: {q.options[q.answer]}</div>
                  <div className="muted">{q.explanation}</div>
                </div>
              ))}
            </div>
          )}
        </section>
        <aside className="col-side">
          <div className="card">
            <h2>Per argomento</h2>
            {[...topics.entries()].map(([name, t]) => (
              <div key={name} className={`topic-row${t.right / t.total < 0.7 ? ' weak' : ''}`}>
                <div className="grow">
                  <div style={{ fontWeight: 500 }}>{name}</div>
                  <Bar pct={(t.right / t.total) * 100} label={`Risposte giuste su ${name}`} />
                </div>
                <div className="small muted nowrap">{t.right} su {t.total}</div>
              </div>
            ))}
          </div>
          {weakest && weakest[1].right < weakest[1].total && (
            <p className="muted small" style={{ margin: 0 }}>Il punto più debole è «{weakest[0]}»: rileggi il modulo che ne parla prima di ritentare.</p>
          )}
          <Link className="btn btn-primary" href={paths.unit(materia, unita)}>Torna all&apos;unità</Link>
          <Link className="btn btn-quiet" href={paths.test(materia, unita)}>Ritenta la verifica</Link>
        </aside>
      </div>
    </div>
  )
}
