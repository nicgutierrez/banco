import Link from 'next/link'
import { Bar } from '@/components/Bar'
import { SubjectGrid } from '@/components/SubjectGrid'
import { levelFor, RULES } from '@/lib/game'
import { loadOverview, paths } from '@/lib/view'

export default async function Home() {
  const { snap, overview } = await loadOverview()
  const { resume, cracked, testsReady, achievements } = overview
  const lvl = levelFor(snap.points)
  const nextBadge = achievements.find((a) => !a.earned)
  const started = snap.progress.size > 0

  return (
    <div className="page">
      <div className="row" style={{ alignItems: 'stretch' }}>
        <section className="hero" style={{ flex: '2 1 420px', minWidth: 0 }}>
          {resume?.kind === 'modulo' && (() => {
            const { view, moduleIndex } = resume
            const mod = view.unit.modules[moduleIndex]
            return (
              <>
                <div className="eyebrow">{started ? 'Riprendi da dove eri' : 'Inizia da qui'}</div>
                <h1>{mod.title}</h1>
                <div className="muted">
                  {view.subject.name} · Unità {view.unit.number}, {view.unit.title} · modulo {moduleIndex + 1} di{' '}
                  {view.unit.modules.length} · circa {mod.minutes} minuti più il mini test
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap', marginTop: 6 }}>
                  <Link className="btn btn-light" href={paths.lesson(view.subject.id, view.unit.id, mod.id)}>
                    {started ? 'Continua' : 'Comincia la lezione'}
                  </Link>
                  <div style={{ flex: '1 1 160px' }}>
                    <Bar pct={(view.status.completedModules / view.status.totalModules) * 100} label="Moduli completati nell'unità" />
                  </div>
                </div>
              </>
            )
          })()}
          {resume?.kind === 'verifica' && (
            <>
              <div className="eyebrow">Moduli finiti</div>
              <h1>Verifica: {resume.view.unit.title}</h1>
              <div className="muted">
                {resume.view.subject.name} · Unità {resume.view.unit.number} · {resume.view.unit.test.questions.length} domande ·{' '}
                {resume.view.unit.test.minutes} minuti. Falla quando ti senti pronto.
              </div>
              <div>
                <Link className="btn btn-light" href={paths.test(resume.view.subject.id, resume.view.unit.id)}>Fai la verifica</Link>
              </div>
            </>
          )}
          {!resume && (
            <>
              <div className="eyebrow">Tutto fatto</div>
              <h1>Hai finito le unità disponibili</h1>
              <div className="muted">Le prossime unità sono in preparazione. Intanto puoi ripassare o ritentare una verifica.</div>
            </>
          )}
        </section>

        <section className="card" style={{ flex: '1 1 300px', minWidth: 0 }}>
          <div className="eyebrow">Livello {lvl.level}</div>
          <div style={{ fontSize: 22, fontWeight: 700, lineHeight: 1.15 }}>
            {lvl.toNext.toLocaleString('it-IT')} punti al livello {lvl.level + 1}
          </div>
          <Bar pct={lvl.pct} label="Avanzamento verso il prossimo livello" />
          <div className="muted">
            Ogni modulo completato vale {RULES.points.modulo} punti, una verifica superata {RULES.points.unita_superata}, con 8 o più
            altri {RULES.points.unita_padroneggiata}.
          </div>
          {nextBadge && (
            <div className="muted">
              Prossimo traguardo: <b style={{ color: 'var(--ink)' }}>{nextBadge.title}</b>, {nextBadge.detail.toLowerCase()}.
            </div>
          )}
        </section>
      </div>

      <div className="row">
        <section className="col-side" style={{ flex: '1 1 340px' }}>
          <h2 className="section-title">Da riparare</h2>
          <div className="card flush">
            {cracked.length === 0 && (
              <p className="muted" style={{ margin: 0, padding: 18 }}>
                Niente da riparare. Un&apos;unità superata si incrina se non la tocchi per {RULES.crackAfterDays} giorni.
              </p>
            )}
            {cracked.map((v) => (
              <div key={v.key} className="list-row">
                <div className="grow">
                  <div style={{ fontWeight: 700 }}>{v.unit.title}</div>
                  <div className="small" style={{ color: 'var(--warn)' }}>{v.subject.name} · non la ripassi da più di {RULES.crackAfterDays} giorni</div>
                </div>
                <Link className="nowrap" style={{ fontWeight: 700 }} href={paths.test(v.subject.id, v.unit.id)}>Ritenta la verifica</Link>
              </div>
            ))}
          </div>
        </section>
        <section className="col-side" style={{ flex: '1 1 340px' }}>
          <h2 className="section-title">Verifiche sbloccate</h2>
          <div className="card flush">
            {testsReady.length === 0 && (
              <p className="muted" style={{ margin: 0, padding: 18 }}>
                Nessuna verifica da fare. Si sblocca quando completi tutti i moduli di un&apos;unità.
              </p>
            )}
            {testsReady.map((v) => (
              <div key={v.key} className="list-row">
                <div className="grow">
                  <div style={{ fontWeight: 700 }}>{v.subject.name} · Unità {v.unit.number}, {v.unit.title}</div>
                  <div className="small muted">{v.unit.test.questions.length} domande · {v.unit.test.minutes} minuti</div>
                </div>
                <Link className="btn btn-outline" href={paths.test(v.subject.id, v.unit.id)}>Fai la verifica</Link>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <h2 className="section-title">Materie del biennio</h2>
        <SubjectGrid subjects={overview.subjects} />
      </section>
    </div>
  )
}
