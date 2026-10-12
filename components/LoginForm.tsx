'use client'

import { useActionState } from 'react'
import { sendMagicLink, type LoginState } from '@/lib/auth-actions'

export function LoginForm({ error }: { error?: string }) {
  const [state, action, pending] = useActionState<LoginState, FormData>(sendMagicLink, { status: 'idle' })
  return (
    <form action={action} className="login-form">
      <h2 style={{ fontSize: 28 }}>Entra</h2>
      <p className="muted" style={{ margin: 0 }}>Ti mandiamo un link via email: lo apri e sei dentro, senza password.</p>
      {error && state.status === 'idle' && <p className="notice error" role="alert">{error}</p>}
      <div className="field">
        <label htmlFor="email">Email</label>
        <input id="email" name="email" type="email" autoComplete="email" required placeholder="nome@esempio.it" />
      </div>
      <button type="submit" className="btn btn-primary" disabled={pending}>
        {pending ? 'Invio in corso…' : 'Mandami il link di accesso'}
      </button>
      {state.status !== 'idle' && (
        <p className={`notice${state.status === 'error' ? ' error' : ''}`} role="status">{state.message}</p>
      )}
      <p className="small muted" style={{ margin: 0 }}>Accesso riservato: le registrazioni sono chiuse.</p>
    </form>
  )
}
