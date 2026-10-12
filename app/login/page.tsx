import type { Metadata } from 'next'
import { LoginForm } from '@/components/LoginForm'

export const metadata: Metadata = { title: 'Entra' }

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ errore?: string }> }) {
  const { errore } = await searchParams
  return (
    <div className="login">
      <section className="login-side">
        <div style={{ fontWeight: 700, fontSize: 26 }}>Banco</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <h1>Il biennio, un modulo alla volta.</h1>
          <p className="prose" style={{ color: 'var(--hero-muted)', margin: 0 }}>
            Lezioni brevi, un mini test alla fine di ognuna e la verifica di unità quando hai finito i moduli.
            Riprendi sempre da dove eri rimasto.
          </p>
        </div>
        <div style={{ color: 'var(--hero-muted)', fontSize: 14 }}>Preparazione all&apos;esame di idoneità · istituto tecnico economico AFM, primo biennio</div>
      </section>
      <div className="login-form-wrap">
        <LoginForm error={errore ? 'Il link non è valido o è scaduto. Fattene mandare uno nuovo.' : undefined} />
      </div>
    </div>
  )
}
