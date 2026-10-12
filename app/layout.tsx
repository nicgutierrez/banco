import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: { default: 'Banco', template: '%s · Banco' },
  description: "Preparazione all'esame di idoneità del primo biennio, un modulo alla volta.",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500;12..96,700&family=Literata:opsz,wght@7..72,400;7..72,600&display=swap"
        />
      </head>
      <body>{children}</body>
    </html>
  )
}
