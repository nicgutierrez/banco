import type { Metadata } from 'next'
import { SubjectGrid } from '@/components/SubjectGrid'
import { loadOverview } from '@/lib/view'

export const metadata: Metadata = { title: 'Materie' }

export default async function Materie() {
  const { overview } = await loadOverview()
  const units = overview.subjects.reduce((n, s) => n + s.subject.units.length, 0)
  const modules = overview.subjects.reduce((n, s) => n + s.subject.units.reduce((m, u) => m + u.plan.length, 0), 0)
  return (
    <div className="page">
      <div>
        <div className="eyebrow">Istituto tecnico economico · primo e secondo anno</div>
        <h1 className="page-title">Materie</h1>
        <p className="muted" style={{ marginBottom: 0 }}>
          Programma del primo biennio, indirizzo Amministrazione, finanza e marketing: {overview.subjects.length} materie,{' '}
          {units} unità, {modules} moduli. Le unità ancora da scrivere mostrano i moduli previsti.
        </p>
      </div>
      <SubjectGrid subjects={overview.subjects} />
    </div>
  )
}
