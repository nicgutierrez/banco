import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { UnitTestClient as UnitTest } from '@/components/UnitTestClient'
import { getSubject, getUnit, toPublic } from '@/lib/content'
import { unitKey } from '@/lib/keys'
import { loadOverview, paths } from '@/lib/view'

export const metadata: Metadata = { title: 'Verifica di unità' }

export default async function VerificaPage({ params }: { params: Promise<{ materia: string; unita: string }> }) {
  const { materia, unita } = await params
  const subject = getSubject(materia)
  const unit = await getUnit(materia, unita)
  if (!subject || !unit) notFound()
  const { overview } = await loadOverview()
  if (!overview.byKey.get(unitKey(materia, unita))?.status.testUnlocked) redirect(paths.unit(materia, unita))

  return (
    <UnitTest
      subjectId={materia}
      unitId={unita}
      eyebrow={`Verifica di unità · ${subject.name}`}
      heading={`Unità ${unit.number}. ${unit.title}`}
      minutes={unit.test.minutes}
      questions={unit.test.questions.map(toPublic)}
      exitHref={paths.unit(materia, unita)}
    />
  )
}
