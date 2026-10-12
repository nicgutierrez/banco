import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { MiniTest } from '@/components/MiniTest'
import { getUnit } from '@/lib/content'
import { paths } from '@/lib/view'

export const metadata: Metadata = { title: 'Mini test' }

type Params = { materia: string; unita: string; modulo: string }

export default async function MiniTestPage({ params }: { params: Promise<Params> }) {
  const { materia, unita, modulo } = await params
  const unit = await getUnit(materia, unita)
  const index = unit?.modules.findIndex((m) => m.id === modulo) ?? -1
  if (!unit || index < 0) notFound()
  const mod = unit.modules[index]
  const next = unit.modules[index + 1]

  return (
    <MiniTest
      subjectId={materia}
      unitId={unita}
      moduleId={mod.id}
      heading={mod.title}
      eyebrow={`Mini test · unità ${unit.number}, modulo ${index + 1}`}
      questions={mod.quiz}
      lessonHref={paths.lesson(materia, unita, mod.id)}
      nextHref={next ? paths.lesson(materia, unita, next.id) : paths.unit(materia, unita)}
      nextLabel={next ? `Passa al modulo ${index + 2}` : "Torna all'unità"}
    />
  )
}
