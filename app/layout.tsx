import type { Metadata } from 'next'
import { Syne, DM_Sans } from 'next/font/google'
import './globals.css'
import './aurora.css'
import { Providers } from './providers'

const syne = Syne({
  variable: '--font-syne',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
})

const dmSans = DM_Sans({
  variable: '--font-dm-sans',
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Foreman — Gestion de chantier',
  description: 'SaaS de gestion de chantier pour architectes',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="fr" className={`${syne.variable} ${dmSans.variable}`}>
      <body style={{ fontFamily: 'var(--font-dm-sans), DM Sans, sans-serif', background: '#0D0D0B', color: '#F0EDE6' }}>
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0, pointerEvents: 'none', overflow: 'hidden', background: '#0D0D0B' }}>
          <div style={{ width: '600px', height: '500px', background: '#F97316', borderRadius: '50%', position: 'absolute', top: '-150px', left: '-100px', filter: 'blur(120px)', opacity: 0.13, animation: 'auroraBlob1 20s linear infinite' }} />
          <div style={{ width: '450px', height: '380px', background: '#c2450a', borderRadius: '50%', position: 'absolute', bottom: '-100px', right: '-80px', filter: 'blur(140px)', opacity: 0.09, animation: 'auroraBlob2 28s linear infinite' }} />
          <div style={{ width: '300px', height: '280px', background: '#F97316', borderRadius: '50%', position: 'absolute', top: '50%', left: '50%', filter: 'blur(100px)', opacity: 0.06, animation: 'auroraBlob3 35s linear infinite' }} />
        </div>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <Providers>{children}</Providers>
        </div>
      </body>
    </html>
  )
}
