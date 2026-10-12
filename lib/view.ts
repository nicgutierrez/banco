import { getCatalog, getReadyUnits } from './content'
import { buildOverview } from './overview'
import { getSnapshot } from './progress'

/** Snapshot dell'utente più la panoramica calcolata: quello che serve a quasi ogni pagina. */
export async function loadOverview() {
  const [snap, ready] = await Promise.all([getSnapshot(), getReadyUnits()])
  const overview = buildOverview({ catalog: getCatalog(), ready, ...snap })
  return { snap, overview }
}

export const paths = {
  subject: (s: string) => `/materie/${s}`,
  unit: (s: string, u: string) => `/materie/${s}/${u}`,
  lesson: (s: string, u: string, m: string) => `/materie/${s}/${u}/${m}`,
  miniTest: (s: string, u: string, m: string) => `/mini-test/${s}/${u}/${m}`,
  test: (s: string, u: string) => `/verifica/${s}/${u}`,
  result: (id: string) => `/risultati/${id}`,
}
