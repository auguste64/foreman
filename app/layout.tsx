import type { Metadata } from 'next'
import { Viewport } from 'next'
import { Syne, DM_Sans, Plus_Jakarta_Sans } from 'next/font/google'
import './globals.css'
import './aurora.css'
import { Providers } from './providers'
import { ToastProvider } from '@/components/Toast'

const syne = Syne({
  variable: '--font-syne',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
})

const plusJakarta = Plus_Jakarta_Sans({
  variable: '--font-jakarta',
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  display: 'swap',
})

const dmSans = DM_Sans({
  variable: '--font-dm-sans',
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  display: 'swap',
})

export const viewport: Viewport = { width: 'device-width', initialScale: 1, themeColor: '#0D0D0B' }

export const metadata: Metadata = {
  metadataBase: new URL('https://thebuilder.io'),
  title: 'The Builder — Gestion de chantier',
  description: 'SaaS de gestion de chantier pour architectes et maîtres d\'œuvre',
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
    apple: '/favicon.svg',
  },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true } },
  alternates: { canonical: '/' },
  openGraph: {
    title: 'The Builder — Gestion de chantier',
    description: "SaaS de gestion de chantier pour architectes et maîtres d'œuvre. Dès 11,90€/mois.",
    url: 'https://thebuilder.io',
    siteName: 'The Builder',
    locale: 'fr_FR',
    type: 'website',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'The Builder — Gestion de chantier' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'The Builder — Gestion de chantier',
    description: "SaaS de gestion de chantier pour architectes et maîtres d'œuvre.",
    images: ['/og-image.png'],
  },
}

const organizationSchema = { '@context': 'https://schema.org', '@type': 'Organization', name: 'The Builder', url: 'https://thebuilder.io', description: "Éditeur de logiciel SaaS de gestion de chantier pour les professionnels du bâtiment en France.", foundingLocation: { '@type': 'Place', addressCountry: 'FR' }, inLanguage: 'fr' }
const websiteSchema = { '@context': 'https://schema.org', '@type': 'WebSite', name: 'The Builder', url: 'https://thebuilder.io', inLanguage: 'fr' }

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="fr" className={`${syne.variable} ${dmSans.variable} ${plusJakarta.variable}`}>
      <head>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }} />
      </head>
      <body style={{ fontFamily: 'var(--font-dm-sans), DM Sans, sans-serif', background: '#0D0D0B', color: '#F0EDE6' }}>
        <div style={{ position: 'fixed', top: 0, left: 0, width: '240px', height: '100%', background: '#0D0D0B', zIndex: 1, pointerEvents: 'none' }} />
        <div style={{ position: 'fixed', top: 0, left: '240px', right: 0, bottom: 0, zIndex: 0, pointerEvents: 'none', overflow: 'hidden', background: 'transparent' }}>
          <div style={{ width: '600px', height: '500px', background: '#ea580c', borderRadius: '50%', position: 'absolute', top: '-150px', left: '-100px', filter: 'blur(120px)', opacity: 0.13, animation: 'auroraBlob1 20s linear infinite' }} />
          <div style={{ width: '450px', height: '380px', background: '#dc2626', borderRadius: '50%', position: 'absolute', bottom: '-100px', right: '-80px', filter: 'blur(140px)', opacity: 0.09, animation: 'auroraBlob2 28s linear infinite' }} />
          <div style={{ width: '300px', height: '280px', background: '#d97706', borderRadius: '50%', position: 'absolute', top: '50%', left: '50%', filter: 'blur(100px)', opacity: 0.06, animation: 'auroraBlob3 35s linear infinite' }} />
        </div>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <Providers>{children}</Providers>
        </div>
        <ToastProvider />
      </body>
    </html>
  )
}
