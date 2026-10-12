'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const LINKS = [
  { href: '/', label: 'Riprendi' },
  { href: '/materie', label: 'Materie' },
  { href: '/andamento', label: 'Andamento' },
]

export function NavLinks() {
  const pathname = usePathname()
  return (
    <nav className="nav" aria-label="Sezioni">
      {LINKS.map((l) => {
        const active = l.href === '/' ? pathname === '/' : pathname.startsWith(l.href)
        return (
          <Link key={l.href} href={l.href} aria-current={active ? 'page' : undefined}>
            {l.label}
          </Link>
        )
      })}
    </nav>
  )
}
