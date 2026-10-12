import Link from 'next/link'
import { notFound } from 'next/navigation'
import Markdown from 'react-markdown'
import { getLesson } from '@/lib/content'
import { moduleKey } from '@/lib/keys'
import { getSnapshot } from '@/lib/progress'
import { paths } from '@/lib/view'

type Params = { materia: string; unita: string; modulo: string }

export default async function LezionePage({ params }: { params: Promise<Params> }) {
  const { materia, unita, modulo } = await params
  const lesson = await getLesson(materia, unita, modulo)
  if (!lesson) notFound()
  const { unit, module: mod, markdown } = lesson
  const snap = await getSnapshot()
  const index = unit.modules.findIndex((m) => m.id === mod.id)
  const done = (id: string) => !!snap.progress.get(moduleKey(materia, unita, id))?.completed_at

  return (
    <div className="page" style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'flex-start' }}>
      <aside style={{ flex: '1 1 240px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <Link href={paths.unit(materia, unita)} className="small">Unità {unit.number}</Link>
        <div style={{ fontWeight: 700, fontSize: 18, lineHeight: 1.2 }}>{unit.title}</div>
        <nav className="card flush steps" aria-label="Moduli dell'unità">
          {unit.modules.map((m, i) => (
            <Link
              key={m.id}
              href={paths.lesson(materia, unita, m.id)}
              className={[m.id === mod.id ? 'current' : '', done(m.id) ? 'done' : ''].join(' ')}
              aria-current={m.id === mod.id ? 'page' : undefined}
            >
              <span className="step-dot" />
              <span>{i + 1} · {m.title}</span>
            </Link>
          ))}
          <div className={unit.modules.every((m) => done(m.id)) ? 'done' : ''}>
            <span className="step-dot" />
            <span>Verifica di unità</span>
          </div>
        </nav>
        <p className="small muted" style={{ margin: 0 }}>Ogni modulo è una lezione più il suo mini test. La verifica si sblocca a {unit.modules.length} moduli su {unit.modules.length}.</p>
      </aside>

      <div style={{ flex: '999 1 560px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 20 }}>
        <article className="lesson">
          <div className="eyebrow">Modulo {index + 1} di {unit.modules.length} · lezione, circa {mod.minutes} minuti</div>
          <h1 style={{ fontSize: 32, lineHeight: 1.1 }}>{mod.title}</h1>
          <div className="prose"><Markdown>{markdown}</Markdown></div>
          <p className="small muted" style={{ margin: 0 }}>Sul tuo libro: il riferimento al capitolo arriva quando carichi il PDF.</p>
        </article>
        <section className="callout">
          <div style={{ flex: '1 1 320px', minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: 18 }}>{done(mod.id) ? 'Modulo completato' : 'Finito? Ora il mini test'}</div>
            <div className="muted">
              {mod.quiz.length} domande solo su questa lezione, correzione subito, nessun voto.
              {done(mod.id) ? ' Puoi rifarlo quando vuoi per ripassare.' : ' Con 4 giuste il modulo è completato.'}
            </div>
          </div>
          <Link className="btn btn-primary" href={paths.miniTest(materia, unita, mod.id)}>
            {done(mod.id) ? 'Rifai il mini test' : 'Fai il mini test'}
          </Link>
          <div className="small muted" style={{ flex: '1 1 100%' }}>Non ti torna qualcosa? Portalo in chat con Claude: te lo rispiega da un altro punto di vista.</div>
        </section>
      </div>
    </div>
  )
}
