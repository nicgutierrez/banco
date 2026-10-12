import Link from 'next/link'
import { NavLinks } from '@/components/NavLinks'
import { BoltIcon } from '@/components/Icons'
import { signOut } from '@/lib/actions'
import { levelFor } from '@/lib/game'
import { getSnapshot } from '@/lib/progress'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const snap = await getSnapshot()
  const { level } = levelFor(snap.points)
  return (
    <div className="shell">
      <header className="topbar">
        <Link href="/" className="brand">Banco</Link>
        <NavLinks />
        <div className="topbar-end">
          <span className="chip-points"><BoltIcon />{snap.points.toLocaleString('it-IT')} punti</span>
          <span className="chip-level">Livello {level}</span>
          <form action={signOut}>
            <button type="submit" className="link-button">Esci</button>
          </form>
        </div>
      </header>
      <main className="main">{children}</main>
    </div>
  )
}
