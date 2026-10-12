'use client'

import dynamic from 'next/dynamic'

/** La verifica legge la bozza da localStorage al primo render: la carichiamo solo nel browser. */
export const UnitTestClient = dynamic(() => import('./UnitTest').then((m) => m.UnitTest), {
  ssr: false,
  loading: () => <main className="main"><p className="muted">Preparo la verifica…</p></main>,
})
