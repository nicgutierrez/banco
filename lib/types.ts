/** Una domanda a scelta multipla. `answer` è l'indice dell'opzione giusta. */
export type Question = {
  id: string
  text: string
  options: string[]
  answer: number
  explanation: string
  /** Argomento, usato nel dettaglio per argomento del risultato. */
  topic?: string
}

export type Module = {
  id: string
  title: string
  minutes: number
  /** File Markdown della lezione, relativo alla cartella dell'unità. */
  file: string
  quiz: Question[]
}

export type Unit = {
  id: string
  number: number
  title: string
  summary: string
  modules: Module[]
  test: {
    minutes: number
    questions: Question[]
  }
}

/** Voce del catalogo: un'unità prevista dal programma, scritta o ancora da scrivere. */
export type UnitEntry = {
  id: string
  title: string
  ready: boolean
}

export type Subject = {
  id: string
  name: string
  units: UnitEntry[]
}

/** Riga di avanzamento di un modulo, come salvata su Supabase. */
export type ModuleProgress = {
  module_key: string
  best_correct: number
  total: number
  attempts: number
  completed_at: string | null
  last_activity_at: string
}

export type TestAttempt = {
  id: string
  unit_key: string
  correct: number
  total: number
  grade: number
  answers: (number | null)[]
  duration_seconds: number | null
  points_awarded: number
  created_at: string
}

export type PointsEvent = {
  kind: 'modulo' | 'unita_superata' | 'unita_padroneggiata' | 'ripasso'
  ref: string
  points: number
  created_at: string
}
