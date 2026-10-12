import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Bar } from '@/components/Bar'
import { getSubject } from '@/lib/content'
import { formatGrade, superate, UNIT_STATE_LABEL } from '@/lib/game'
import { unitKey } from '@/lib/keys'
import { loadOverview, paths } from '@/lib/view'

export default async function MateriaPage({ params }: { params: Promise<{ materia: string }> }) {
  const { materia } = await params
  const subject = getSubject(materia)
  if (!subject) notFound()
  const { overview } = await loadOverview()
  const summary = overview.subjects.find((s) => s.subject.id === subject.id)!

  return (
    <div className="page">
      <div className="row" style={{ alignItems: 'flex-end' }}>
        <div className="grow" style={{ flex: '1 1 320px' }}>
          <div className="eyebrow">Materia · primo e secondo anno</div>
          <h1 className="page-title">{subject.name}</h1>
        </div>
        <div style={{ flex: '1 1 280px', display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div className="small">{superate(summary.passed)} su {summary.total}</div>
          <Bar pct={(summary.passed / summary.total) * 100} label={`Unità superate in ${subject.name}`} />
        </div>
      </div>

      <div className="row">
        <div className="col-main">
          {([1, 2] as const).map((year) => {
            const entries = subject.units.filter((u) => u.year === year)
            if (entries.length === 0) return null
            return (
              <section key={year} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <h2 className="section-title">{year === 1 ? 'Primo anno' : 'Secondo anno'}</h2>
                <div className="card flush">
                  {entries.map((entry) => {
                    const n = subject.units.indexOf(entry) + 1
                    const view = overview.byKey.get(unitKey(subject.id, entry.id))
                    if (!view) {
                      return (
                        <details key={entry.id} className="plan-row">
                          <summary className="list-row not-ready">
                            <div className="dot">{n}</div>
                            <div className="grow">
                              <div style={{ fontWeight: 700 }}>{entry.title}</div>
                              <div className="small muted">In preparazione · {entry.plan.length} moduli previsti</div>
                            </div>
                          </summary>
                          <ol className="plan-list">
                            {entry.plan.map((t) => <li key={t}>{t}</li>)}
                          </ol>
                        </details>
                      )
                    }
                    const s = view.status
                    const detail = [
                      `${s.completedModules} moduli su ${s.totalModules}`,
                      s.bestGrade !== null ? `miglior voto ${formatGrade(s.bestGrade)}` : null,
                    ].filter(Boolean).join(' · ')
                    return (
                      <Link key={entry.id} href={paths.unit(subject.id, entry.id)} className={`list-row state-${s.state}`}>
                        <div className="dot">{n}</div>
                        <div className="grow"><div style={{ fontWeight: 700 }}>{view.unit.title}</div><div className="small muted">{detail}</div></div>
                        <div className="state-label">{UNIT_STATE_LABEL[s.state]}</div>
                      </Link>
                    )
                  })}
                </div>
              </section>
            )
          })}
        </div>
        <aside className="col-side">
          <div className="card">
            <h2>Come funziona</h2>
            <p className="muted" style={{ margin: 0 }}>Ogni unità è fatta di moduli: una lezione breve e un mini test di 5 domande. Con 4 giuste il modulo è completato.</p>
            <p className="muted" style={{ margin: 0 }}>Completati tutti i moduli si sblocca la verifica di unità. Con 6 la superi, con 8 la padroneggi.</p>
          </div>
          <div className="card">
            <h2>Prova di orale</h2>
            <p className="muted" style={{ margin: 0 }}>All&apos;esame molte materie si portano all&apos;orale. Esponi un argomento in chat con Claude, che ti interroga come farebbe il professore.</p>
          </div>
          <div className="card">
            <h2>Test finale di {subject.name}</h2>
            <p className="muted" style={{ margin: 0 }}>Pesca da tutte le unità. Arriva quando le unità saranno complete.</p>
          </div>
        </aside>
      </div>
    </div>
  )
}
