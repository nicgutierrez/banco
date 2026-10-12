import type { Metadata } from 'next'
import { SubjectGrid } from '@/components/SubjectGrid'
import { loadOverview } from '@/lib/view'

export const metadata: Metadata = { title: 'Materie' }

export default async function Materie() {
  const { overview } = await loadOverview()
  return (
    <div className="page">
      <div>
        <div className="eyebrow">Istituto tecnico · primo e secondo anno</div>
        <h1 className="page-title">Materie</h1>
      </div>
      <SubjectGrid subjects={overview.subjects} />
    </div>
  )
}
