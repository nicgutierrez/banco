import type { Metadata } from 'next'
import Link from 'next/link'
import { Bar } from '@/components/Bar'
import { formatGrade, levelFor, RULES, superate } from '@/lib/game'
import { loadOverview, paths } from '@/lib/view'

export const metadata: Metadata = { title: 'Andamento' }

export default async function AndamentoPage() {
  const { snap, overview } = await loadOverview()
  const lvl = levelFor(snap.points)
  const attempts = snap.attempts.slice(-10)
  const totalUnits = overview.subjects.reduce((s, x) => s + x.total, 0)
  const firstTry = [...snap.progress.values()].filter((r) => r.completed_at && r.attempts === 1).length

  return (
    <div className="page">
      <div className="row" style={{ alignItems: 'flex-end' }}>
        <h1 className="page-title grow" style={{ flex: '1 1 320px' }}>Andamento</h1>
        <div className="muted">{superate(overview.stats.unitsPassed)} su {totalUnits} · esame di idoneità: data da confermare</div>
      </div>
      <div className="row">
        <div className="col-main">
          <section className="card">
            <h2>Voti delle verifiche</h2>
            {attempts.length === 0 ? (
              <p className="muted" style={{ margin: 0 }}>Ancora nessuna verifica. Il primo voto arriva quando finisci i moduli di un&apos;unità.</p>
            ) : (
              <>
                <div className="chart">
                  <div className="threshold" style={{ bottom: `${RULES.passGrade * 10}%` }}><span>sufficienza</span></div>
                  {attempts.map((a) => (
                    <Link key={a.id} href={paths.result(a.id)} className={`col${a.grade < RULES.passGrade ? ' low' : ''}`} style={{ textDecoration: 'none', color: 'var(--ink)' }}>
                      <span className="v">{formatGrade(a.grade)}</span>
                      <i style={{ height: `${a.grade * 10}%` }} />
                    </Link>
                  ))}
                </div>
                <div className="chart-labels">
                  {attempts.map((a) => {
                    const v = overview.byKey.get(a.unit_key)
                    return <span key={a.id}>{v ? `${v.subject.name}, unità ${v.unit.number}` : a.unit_key}</span>
                  })}
                </div>
              </>
            )}
          </section>
          <section className="card">
            <h2>Traguardi</h2>
            <div className="badges">
              {overview.achievements.map((a) => (
                <div key={a.id} className={`badge${a.earned ? ' earned' : ''}`}>
                  <div className="seal" aria-hidden="true" />
                  <div style={{ fontWeight: 700, lineHeight: 1.2 }}>{a.title}</div>
                  <div className="small muted">{a.earned ? 'Ottenuto' : a.detail}</div>
                </div>
              ))}
            </div>
          </section>
        </div>
        <aside className="col-side">
          <section className="card">
            <h2>Livello {lvl.level}</h2>
            <Bar pct={lvl.pct} label="Avanzamento verso il prossimo livello" />
            <div className="small muted">{snap.points.toLocaleString('it-IT')} punti · ne mancano {lvl.toNext.toLocaleString('it-IT')} al livello {lvl.level + 1}</div>
          </section>
          <section className="card">
            <h2>Quello che hai fatto</h2>
            <div>
              <div className="kv"><span>Moduli completati</span><b>{overview.stats.modulesCompleted}</b></div>
              <div className="kv"><span>Mini test superati al primo colpo</span><b>{firstTry}</b></div>
              <div className="kv"><span>Unità superate</span><b>{overview.stats.unitsPassed}</b></div>
              <div className="kv"><span>Verifiche fatte</span><b>{snap.attempts.length}</b></div>
            </div>
            <div className="small muted">Nessun obiettivo da rispettare: conta solo quello che fai.</div>
          </section>
          {overview.cracked.length > 0 && (
            <section className="card">
              <h2>Da riparare</h2>
              {overview.cracked.map((v) => (
                <Link key={v.key} href={paths.unit(v.subject.id, v.unit.id)}>{v.subject.name}: {v.unit.title}</Link>
              ))}
            </section>
          )}
        </aside>
      </div>
    </div>
  )
}
