import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Bar } from '@/components/Bar'
import { getSubject, getUnit } from '@/lib/content'
import { formatGrade, RULES, UNIT_STATE_LABEL } from '@/lib/game'
import { moduleKey, unitKey } from '@/lib/keys'
import { attemptsFor } from '@/lib/progress'
import { loadOverview, paths } from '@/lib/view'

export default async function UnitaPage({ params }: { params: Promise<{ materia: string; unita: string }> }) {
  const { materia, unita } = await params
  const subject = getSubject(materia)
  const unit = await getUnit(materia, unita)
  if (!subject || !unit) notFound()
  const { snap, overview } = await loadOverview()
  const view = overview.byKey.get(unitKey(materia, unita))!
  const s = view.status
  const attempts = attemptsFor(snap, view.key).slice().reverse()

  return (
    <div className="page">
      <div>
        <Link href={paths.subject(materia)} className="small">{subject.name}</Link>
        <h1 className="page-title" style={{ marginTop: 4 }}>Unità {unit.number}. {unit.title}</h1>
        <p className="muted" style={{ maxWidth: '70ch' }}>{unit.summary}</p>
      </div>
      <div className="row">
        <div className="col-main">
          <div className="card flush steps-list">
            {unit.modules.map((m, i) => {
              const p = snap.progress.get(moduleKey(materia, unita, m.id))
              const state = p?.completed_at ? 'padroneggiata' : p ? 'in-corso' : 'da-fare'
              return (
                <Link key={m.id} href={paths.lesson(materia, unita, m.id)} className={`list-row state-${state}`}>
                  <div className="dot">{i + 1}</div>
                  <div className="grow">
                    <div style={{ fontWeight: 700 }}>{m.title}</div>
                    <div className="small muted">
                      Lezione di circa {m.minutes} minuti · mini test{p ? `: miglior risultato ${p.best_correct} su ${p.total}` : ''}
                    </div>
                  </div>
                  <div className="state-label">{p?.completed_at ? 'Completato' : p ? 'Da ripetere' : 'Da fare'}</div>
                </Link>
              )
            })}
          </div>
        </div>
        <aside className="col-side">
          <div className="card">
            <h2>Verifica di unità</h2>
            <div className={`state-${s.state}`}><span className="state-label">{UNIT_STATE_LABEL[s.state]}</span></div>
            <p className="muted" style={{ margin: 0 }}>
              {unit.test.questions.length} domande, {unit.test.minutes} minuti. Con {RULES.passGrade} superi l&apos;unità, con {RULES.masteryGrade} la padroneggi.
            </p>
            <Bar pct={(s.completedModules / s.totalModules) * 100} label="Moduli completati" />
            {s.testUnlocked ? (
              <Link className="btn btn-primary" href={paths.test(materia, unita)}>
                {attempts.length ? 'Ritenta la verifica' : 'Fai la verifica'}
              </Link>
            ) : (
              <div className="locked">Bloccata · {s.completedModules} moduli su {s.totalModules} completati</div>
            )}
          </div>
          {attempts.length > 0 && (
            <div className="card flush">
              <h2 style={{ padding: '16px 18px 0' }}>Tentativi</h2>
              {attempts.map((a) => (
                <Link key={a.id} href={paths.result(a.id)} className="list-row">
                  <div className="grow small muted">{new Date(a.created_at).toLocaleDateString('it-IT', { day: 'numeric', month: 'long' })}</div>
                  <b>{formatGrade(a.grade)}</b>
                </Link>
              ))}
            </div>
          )}
        </aside>
      </div>
    </div>
  )
}
