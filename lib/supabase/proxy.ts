import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { SUPABASE_ANON_KEY, SUPABASE_URL, supabaseConfigured } from './env'

const PUBLIC_PATHS = ['/login', '/auth']

/** Rinnova la sessione a ogni richiesta e manda al login chi non è autenticato. */
export async function updateSession(request: NextRequest) {
  if (!supabaseConfigured()) return NextResponse.next({ request })

  let response = NextResponse.next({ request })

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(toSet) {
        toSet.forEach(({ name, value }) => request.cookies.set(name, value))
        response = NextResponse.next({ request })
        toSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
      },
    },
  })

  // getClaims verifica il JWT: non fidarsi di getSession lato server.
  const { data } = await supabase.auth.getClaims()
  const isPublic = PUBLIC_PATHS.some((p) => request.nextUrl.pathname.startsWith(p))

  if (!data?.claims && !isPublic) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.search = ''
    return NextResponse.redirect(url)
  }

  return response
}
