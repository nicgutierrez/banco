import Link from 'next/link'
import { Bar } from './Bar'
import { superate } from '@/lib/game'
import type { Subject } from '@/lib/types'

type Item = { subject: Subject; passed: number; total: number; written: number }

export function SubjectGrid({ subjects }: { subjects: Item[] }) {
  return (
    <div className="subject-grid">
      {subjects.map(({ subject, passed, total, written }) => (
        <Link key={subject.id} href={`/materie/${subject.id}`} className={`subject-card${written === 0 ? ' not-ready' : ''}`}>
          <div style={{ fontWeight: 700, fontSize: 16 }}>{subject.name}</div>
          <Bar pct={total ? (passed / total) * 100 : 0} label={`Unità superate in ${subject.name}`} />
          <div className="small muted">
            {written === 0 ? `In preparazione · ${total} unità` : `${superate(passed)} su ${total}`}
          </div>
        </Link>
      ))}
    </div>
  )
}
