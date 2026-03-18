'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Syne } from 'next/font/google'

import { createClient } from '@/lib/supabase/client'

const syne = Syne({ subsets: ['latin'], weight: ['400', '500', '600', '700', '800'] })

const GearIcon = ({ size = 14, color = '#8A8880' }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
    <path d="M8 10a2 2 0 100-4 2 2 0 000 4z" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    <path d="M13.3 6.7l-.7-1.7-1.3.3-1-1 .3-1.3-1.7-.7-.8 1.1H7l-.8-1.1-1.7.7.3 1.3-1 1-1.3-.3-.7 1.7 1.1.8v.6l-1.1.8.7 1.7 1.3-.3 1 1-.3 1.3 1.7.7.8-1.1h.6l.8 1.1 1.7-.7-.3-1.3 1-1 1.3.3.7-1.7-1.1-.8v-.6l1.1-.8z" stroke={color} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

function GearIconHoverable() {
  return (
    <span
      style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}
      onMouseEnter={e => { (e.currentTarget.querySelectorAll('path') as NodeListOf<SVGPathElement>).forEach(p => p.setAttribute('stroke', '#F97316')) }}
      onMouseLeave={e => { (e.currentTarget.querySelectorAll('path') as NodeListOf<SVGPathElement>).forEach(p => p.setAttribute('stroke', '#8A8880')) }}
    >
      <GearIcon size={14} color="#8A8880" />
    </span>
  )
}

type NavItem = { href: string; label: string; icon?: React.ReactNode }

const navItems: NavItem[] = [
  { href: '/dashboard', label: 'Tableau de bord' },
  { href: '/dashboard/chantiers', label: 'Chantiers' },
  { href: '/dashboard/comptes-rendus', label: 'Comptes rendus' },
  { href: '/dashboard/documents', label: 'Comptabilité' },
  { href: '/dashboard/finances', label: 'Analyse' },
  { href: '/dashboard/artisans', label: 'Artisans' },
  { href: '/dashboard/clients', label: 'Clients' },
  { href: '/dashboard/planning', label: 'Planning' },
  { href: '/dashboard/parametres', label: 'Paramètres' },
]

export default function Sidebar({ email }: { email: string }) {
  const pathname = usePathname()
  const emailFallback = email?.split('@')[0] ?? ''
  const [displayName, setDisplayName] = useState(emailFallback)
  const [initial, setInitial] = useState(email?.[0]?.toUpperCase() ?? '?')

  useEffect(() => {
    async function fetchName() {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      const userId = session?.user?.id
      if (!userId) return

      // Priority 1: entreprise_infos.raison_sociale
      const { data: entreprise } = await supabase
        .from('entreprise_infos')
        .select('raison_sociale')
        .eq('user_id', userId)
        .single()

      const raisonSociale = entreprise?.raison_sociale?.trim()
      if (raisonSociale) {
        setDisplayName(raisonSociale)
        setInitial(raisonSociale[0].toUpperCase())
        return
      }

      // Priority 2: profiles.entreprise → prenom
      const { data: profile } = await supabase
        .from('profiles')
        .select('entreprise, prenom')
        .eq('id', userId)
        .single()

      const profileEntreprise = profile?.entreprise?.trim()
      if (profileEntreprise) {
        setDisplayName(profileEntreprise)
        setInitial(profileEntreprise[0].toUpperCase())
        return
      }

      const prenom = profile?.prenom?.trim()
      if (prenom) {
        setDisplayName(prenom)
        setInitial(prenom[0].toUpperCase())
        return
      }

      // Priority 4: email prefix (already set as default state)
    }
    fetchName()
  }, [])

  return (
    <aside className={syne.className} style={{ width: 240, flexShrink: 0, display: 'flex', flexDirection: 'column', height: '100vh', borderRight: '1px solid #1E1E1C', background: '#0D0D0B' }}>
      <div style={{ padding: '24px', borderBottom: '1px solid #1E1E1C' }}>
        <Link href="/dashboard" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, textDecoration: 'none' }}>
          <span style={{ width: 3, height: 18, backgroundColor: '#F97316', borderRadius: 1, flexShrink: 0 }} />
          <span style={{ fontFamily: 'var(--font-syne)', fontWeight: 800, fontSize: 20, letterSpacing: '-0.5px', color: '#F0EDE6' }}>
            FORE<span style={{ color: '#F97316' }}>MAN</span>
          </span>
        </Link>
      </div>
      <nav style={{ flex: 1, padding: 16, display: 'flex', flexDirection: 'column', gap: 4 }}>
        {navItems.map(item => {
          const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
          return (
            <Link key={item.href} href={item.href}
              style={{ display: 'flex', alignItems: 'center', gap: item.icon ? 8 : 0, padding: '10px 16px', borderRadius: 8, fontSize: 14, fontWeight: 500, color: active ? '#F97316' : '#F0EDE6', background: active ? 'rgba(249,115,22,0.08)' : 'transparent', textDecoration: 'none', transition: 'all 0.2s ease', fontFamily: 'var(--font-syne)', borderLeft: active ? '3px solid #F97316' : '3px solid transparent' }}
              onMouseEnter={e => { if (!active) { e.currentTarget.style.color = '#F97316'; e.currentTarget.style.background = 'rgba(249,115,22,0.06)'; e.currentTarget.style.paddingLeft = '20px' } }}
              onMouseLeave={e => { if (!active) { e.currentTarget.style.color = '#F0EDE6'; e.currentTarget.style.background = 'transparent'; e.currentTarget.style.paddingLeft = '16px' } }}
            >
              {item.icon && <span style={{ opacity: active ? 1 : 0.5, flexShrink: 0 }}>{item.icon}</span>}
              {item.label}
            </Link>
          )
        })}
        <div style={{ borderTop: '1px solid #1E1E1C', margin: '8px 0' }} />
      </nav>
      <div style={{ padding: 16, borderTop: '1px solid #1E1E1C', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <Link
          href="/dashboard/parametres"
          style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 12px', borderRadius: 8, textDecoration: 'none', transition: 'background 0.2s ease' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(249,115,22,0.06)' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
        >
          <div style={{ width: 36, height: 36, borderRadius: '50%', backgroundColor: '#F97316', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-syne)', fontWeight: 700, fontSize: 16, color: '#fff', flexShrink: 0 }}>
            {initial}
          </div>
          <span style={{ fontSize: 13, color: '#F0EDE6', fontFamily: 'var(--font-dm-sans), sans-serif', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
            {displayName}
          </span>
          <GearIconHoverable />
        </Link>
        <div style={{ background: 'rgba(249,115,22,0.04)', border: '1px solid #1E1E1C', borderRadius: 8, padding: '8px 12px', fontSize: 12, color: '#7A7870', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{email}</div>
        <form action="/auth/signout" method="post">
          <button type="submit" style={{ width: '100%', textAlign: 'left', fontSize: 12, color: '#7A7870', padding: '8px 12px', borderRadius: 8, border: 'none', background: 'transparent', cursor: 'pointer', transition: 'all 0.2s ease', fontFamily: 'var(--font-syne)' }}
            onMouseEnter={e => { e.currentTarget.style.color = '#F97316'; e.currentTarget.style.background = 'rgba(249,115,22,0.08)' }}
            onMouseLeave={e => { e.currentTarget.style.color = '#7A7870'; e.currentTarget.style.background = 'transparent' }}
          >← Déconnexion</button>
        </form>
      </div>
    </aside>
  )
}
