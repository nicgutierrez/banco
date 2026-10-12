'use server'

import { headers } from 'next/headers'
import { createClient } from './supabase/server'
import { supabaseConfigured } from './supabase/env'

export type LoginState = { status: 'idle' | 'sent' | 'error'; message?: string }

export async function sendMagicLink(_prev: LoginState, form: FormData): Promise<LoginState> {
  if (!supabaseConfigured()) {
    return { status: 'error', message: 'Supabase non è configurato: mancano le variabili in .env.local.' }
  }
  const email = String(form.get('email') ?? '').trim()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { status: 'error', message: "Scrivi un indirizzo email valido, per esempio nome@esempio.it." }
  }

  const h = await headers()
  const origin = process.env.NEXT_PUBLIC_SITE_URL || `${h.get('x-forwarded-proto') ?? 'http'}://${h.get('host')}`
  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithOtp({
    email,
    // Registrazioni chiuse: entra solo chi esiste già in Supabase.
    options: { shouldCreateUser: false, emailRedirectTo: `${origin}/auth/callback` },
  })
  if (error) {
    return { status: 'error', message: 'Non riesco a mandare il link. Controlla che questa email abbia accesso e riprova tra un minuto.' }
  }
  return { status: 'sent', message: `Link inviato a ${email}. Aprilo da questo stesso browser.` }
}
