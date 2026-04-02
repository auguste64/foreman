'use client'
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Syne } from 'next/font/google'

import { createClient } from '@/lib/supabase/client'
import { usePlan } from '@/lib/usePlan'
import { useIsMobile } from '@/lib/useIsMobile'
import { useNotifications } from '@/hooks/useNotifications'
import NotificationPanel from '@/components/NotificationPanel'
import OnboardingOverlay from '@/components/OnboardingOverlay'

const syne = Syne({ subsets: ['latin'], weight: ['400', '500', '600', '700', '800'] })

const GearIcon = ({ size = 14, color = '#8A8880' }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
    <path d="M8 10a2 2 0 100-4 2 2 0 000 4z" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    <path d="M13.3 6.7l-.7-1.7-1.3.3-1-1 .3-1.3-1.7-.7-.8 1.1H7l-.8-1.1-1.7.7.3 1.3-1 1-1.3-.3-.7 1.7 1.1.8v.6l-1.1.8.7 1.7 1.3-.3 1 1-.3 1.3 1.7.7.8-1.1h.6l.8 1.1 1.7-.7-.3-1.3 1-1 1.3.3.7-1.7-1.1-.8v-.6l1.1-.8z" stroke={color} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

function EmailAvatarTooltip({ email, initial }: { email: string; initial: string }) {
  const [hovered, setHovered] = useState(false)
  return (
    <div
      style={{ position: 'relative', display: 'flex', alignItems: 'center', padding: '4px 12px' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div style={{ width: 32, height: 32, borderRadius: '50%', backgroundColor: '#ea580c', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-syne)', fontWeight: 700, fontSize: 13, color: '#fff', cursor: 'default', flexShrink: 0 }}>
        {initial}
      </div>
      {hovered && (
        <div style={{ position: 'absolute', bottom: 'calc(100% + 6px)', left: 12, backgroundColor: '#1E1E1C', border: '1px solid #2A2A27', color: '#F0EDE6', fontSize: 11, padding: '6px 10px', borderRadius: 6, whiteSpace: 'nowrap', fontFamily: 'var(--font-dm-sans), sans-serif', zIndex: 100, boxShadow: '0 4px 16px rgba(0,0,0,0.5)', pointerEvents: 'none' }}>
          {email}
        </div>
      )}
    </div>
  )
}

function GearIconHoverable() {
  return (
    <span
      style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}
      onMouseEnter={e => { (e.currentTarget.querySelectorAll('path') as NodeListOf<SVGPathElement>).forEach(p => p.setAttribute('stroke', '#ea580c')) }}
      onMouseLeave={e => { (e.currentTarget.querySelectorAll('path') as NodeListOf<SVGPathElement>).forEach(p => p.setAttribute('stroke', '#8A8880')) }}
    >
      <GearIcon size={14} color="#8A8880" />
    </span>
  )
}

type NavItem = { href: string; label: string; requiresPro?: boolean; id?: string }

const navItems: NavItem[] = [
  { href: '/dashboard', label: 'Tableau de bord' },
  { href: '/dashboard/chantiers', label: 'Chantiers', id: 'nav-chantiers' },
  { href: '/dashboard/comptes-rendus', label: 'Comptes rendus', id: 'nav-comptes-rendus' },
  { href: '/dashboard/artisans', label: 'Artisans', id: 'nav-artisans' },
  { href: '/dashboard/planning', label: 'Planning', id: 'nav-planning' },
  { href: '/dashboard/clients', label: 'Clients' },
  { href: '/dashboard/parametres', label: 'Paramètres' },
  { href: '/dashboard/comptabilite', label: 'Comptabilité', requiresPro: true },
  { href: '/dashboard/documents', label: 'Documents', requiresPro: true, id: 'nav-documents' },
  { href: '/dashboard/contrats', label: 'Contrats', requiresPro: true },
  { href: '/dashboard/finances', label: 'Analyse', requiresPro: true },
  { href: '/dashboard/stats', label: 'Statistiques', requiresPro: true },
]


export default function Sidebar({ email }: { email: string }) {
  const pathname = usePathname()
  const router = useRouter()
  const isMobile = useIsMobile()
  const [mobileOpen, setMobileOpen] = useState(false)
  const { isPro } = usePlan()
  const emailFallback = email?.split('@')[0] ?? ''
  const [displayName, setDisplayName] = useState(emailFallback)
  const [initial, setInitial] = useState(email?.[0]?.toUpperCase() ?? '?')

  // Notifications
  const { notifications: notifs, nonLuCount, marquerCommeLu, marquerTousCommeLus } = useNotifications()
  const [showNotifs, setShowNotifs] = useState(false)
  const notifRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    async function fetchName() {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      const userId = session?.user?.id
      if (!userId) return

      const { data: entreprise } = await supabase
        .from('entreprise_infos')
        .select('raison_sociale')
        .eq('user_id', userId)
        .single()

      const raisonSociale = entreprise?.raison_sociale?.trim()
      if (raisonSociale) { setDisplayName(raisonSociale); setInitial(raisonSociale[0].toUpperCase()); return }

      const { data: profile } = await supabase
        .from('profiles')
        .select('entreprise, prenom')
        .eq('id', userId)
        .single()

      const profileEntreprise = profile?.entreprise?.trim()
      if (profileEntreprise) { setDisplayName(profileEntreprise); setInitial(profileEntreprise[0].toUpperCase()); return }

      const prenom = profile?.prenom?.trim()
      if (prenom) { setDisplayName(prenom); setInitial(prenom[0].toUpperCase()); return }
    }
    fetchName()
  }, [])

  // Close drawer on navigation
  useEffect(() => { setMobileOpen(false) }, [pathname])

  const navContent = (
    <>
      {/* Logo + cloche */}
      <div style={{ padding: '24px', borderBottom: '1px solid #1E1E1C', background: '#0D0D0B', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link href="/dashboard" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', flexShrink: 0 }}>
            <div style={{ display: 'flex', gap: '3px' }}>
              <div style={{ width: '18px', height: '8px', borderRadius: '2px', background: '#ea580c' }} />
              <div style={{ width: '12px', height: '8px', borderRadius: '2px', background: '#ea580c', opacity: 0.6 }} />
            </div>
            <div style={{ display: 'flex', gap: '3px' }}>
              <div style={{ width: '12px', height: '8px', borderRadius: '2px', background: '#ea580c', opacity: 0.6 }} />
              <div style={{ width: '18px', height: '8px', borderRadius: '2px', background: '#ea580c' }} />
            </div>
            <div style={{ display: 'flex', gap: '3px' }}>
              <div style={{ width: '18px', height: '8px', borderRadius: '2px', background: '#ea580c', opacity: 0.8 }} />
              <div style={{ width: '12px', height: '8px', borderRadius: '2px', background: '#ea580c', opacity: 0.5 }} />
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
            <span style={{ fontFamily: 'var(--font-syne)', fontWeight: 400, fontSize: '0.6rem', letterSpacing: '0.2em', color: '#8A8880' }}>THE</span>
            <span style={{ fontFamily: 'var(--font-syne)', fontWeight: 800, fontSize: '1rem', letterSpacing: '0.05em', color: '#F0EDE6' }}>BUILDER</span>
          </div>
        </Link>
        {/* Cloche */}
        <button
          onClick={() => setShowNotifs(v => !v)}
          style={{ position: 'relative', background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: nonLuCount > 0 ? '#F0EDE6' : '#8A8880', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 6, transition: 'color 0.15s' }}
          aria-label="Notifications"
        >
          <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
            <path d="M10 2a6 6 0 00-6 6v3l-1.5 2.5A1 1 0 003.5 15h13a1 1 0 00.86-1.5L16 11V8a6 6 0 00-6-6z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
            <path d="M8 15a2 2 0 004 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          {nonLuCount > 0 && (
            <span style={{ position: 'absolute', top: -2, right: -2, width: 16, height: 16, borderRadius: '50%', backgroundColor: '#dc2626', color: '#fff', fontSize: 9, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-dm-sans), sans-serif' }}>
              {nonLuCount > 9 ? '9+' : nonLuCount}
            </span>
          )}
        </button>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: 16, display: 'flex', flexDirection: 'column', gap: 4, background: '#0D0D0B' }}>
        {navItems.map(item => {
          const locked = !!item.requiresPro && !isPro
          const active = !locked && (pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href)))
          const sharedStyle: React.CSSProperties = {
            display: 'flex', alignItems: 'center', gap: 0, padding: '10px 16px', borderRadius: 8,
            fontSize: 14, fontWeight: 500, transition: 'all 0.2s ease', fontFamily: 'var(--font-syne)',
            borderLeft: active ? '3px solid #ea580c' : '3px solid transparent',
            color: active ? '#ea580c' : '#F0EDE6',
            background: active ? 'rgba(249,115,22,0.08)' : 'transparent',
            cursor: locked ? 'pointer' : undefined,
            textDecoration: 'none',
            opacity: locked ? 0.4 : 1,
          }

          if (locked) {
            return (
              <div key={item.href} id={item.id}
                style={sharedStyle}
                onClick={() => router.push('/dashboard/upgrade')}
                onMouseEnter={e => { e.currentTarget.style.opacity = '0.7' }}
                onMouseLeave={e => { e.currentTarget.style.opacity = '0.4' }}
              >
                <span style={{ flex: 1 }}>{item.label}</span>
                <span style={{ background: '#ea580c', color: '#fff', fontSize: '0.6rem', fontWeight: 700, padding: '2px 6px', borderRadius: '4px', flexShrink: 0, letterSpacing: '0.05em', marginLeft: 6 }}>PRO</span>
              </div>
            )
          }

          return (
            <Link key={item.href} href={item.href} id={item.id}
              style={sharedStyle}
              onMouseEnter={e => { if (!active) { e.currentTarget.style.color = '#ea580c'; e.currentTarget.style.background = 'rgba(249,115,22,0.06)'; e.currentTarget.style.paddingLeft = '20px' } }}
              onMouseLeave={e => { if (!active) { e.currentTarget.style.color = '#F0EDE6'; e.currentTarget.style.background = 'transparent'; e.currentTarget.style.paddingLeft = '16px' } }}
            >
              <span style={{ flex: 1 }}>{item.label}</span>
            </Link>
          )
        })}
        <div style={{ borderTop: '1px solid #1E1E1C', margin: '8px 0' }} />
      </nav>

      {/* Footer */}
      <div style={{ padding: 16, borderTop: '1px solid #1E1E1C', display: 'flex', flexDirection: 'column', gap: 8, background: '#0D0D0B' }}>
        <Link
          href="/dashboard/parametres"
          style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 12px', borderRadius: 8, textDecoration: 'none', transition: 'background 0.2s ease' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(249,115,22,0.06)' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
        >
          <div style={{ width: 36, height: 36, borderRadius: '50%', backgroundColor: '#ea580c', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-syne)', fontWeight: 700, fontSize: 16, color: '#fff', flexShrink: 0 }}>
            {initial}
          </div>
          <span style={{ fontSize: 13, color: '#F0EDE6', fontFamily: 'var(--font-dm-sans), sans-serif', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
            {displayName}
          </span>
          <GearIconHoverable />
        </Link>
        <form action="/auth/signout" method="post">
          <button type="submit" style={{ width: '100%', textAlign: 'left', fontSize: 12, color: '#7A7870', padding: '8px 12px', borderRadius: 8, border: 'none', background: 'transparent', cursor: 'pointer', transition: 'all 0.2s ease', fontFamily: 'var(--font-syne)' }}
            onMouseEnter={e => { e.currentTarget.style.color = '#ea580c'; e.currentTarget.style.background = 'rgba(249,115,22,0.08)' }}
            onMouseLeave={e => { e.currentTarget.style.color = '#7A7870'; e.currentTarget.style.background = 'transparent' }}
          >← Déconnexion</button>
        </form>
      </div>
    </>
  )

  if (isMobile) {
    return (
      <>
        {/* Fixed top bar */}
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, height: 56, backgroundColor: '#0D0D0B', borderBottom: '1px solid #1E1E1C', display: 'flex', alignItems: 'center', padding: '0 16px', zIndex: 40, gap: 12 }}>
          <button
            onClick={() => setMobileOpen(true)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '8px', color: '#F0EDE6', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 6 }}
            aria-label="Ouvrir le menu"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M2 5h16M2 10h16M2 15h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
          </button>
          <Link href="/dashboard" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', flexShrink: 0 }}>
              <div style={{ display: 'flex', gap: '2px' }}>
                <div style={{ width: '14px', height: '6px', borderRadius: '2px', background: '#ea580c' }} />
                <div style={{ width: '10px', height: '6px', borderRadius: '2px', background: '#ea580c', opacity: 0.6 }} />
              </div>
              <div style={{ display: 'flex', gap: '2px' }}>
                <div style={{ width: '10px', height: '6px', borderRadius: '2px', background: '#ea580c', opacity: 0.6 }} />
                <div style={{ width: '14px', height: '6px', borderRadius: '2px', background: '#ea580c' }} />
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
              <span style={{ fontFamily: 'var(--font-syne)', fontWeight: 400, fontSize: '0.55rem', letterSpacing: '0.2em', color: '#8A8880' }}>THE</span>
              <span style={{ fontFamily: 'var(--font-syne)', fontWeight: 800, fontSize: '0.85rem', letterSpacing: '0.05em', color: '#F0EDE6' }}>BUILDER</span>
            </div>
          </Link>
          {/* Cloche mobile */}
          <button
            onClick={() => setShowNotifs(v => !v)}
            style={{ position: 'relative', background: 'none', border: 'none', cursor: 'pointer', padding: '8px', color: nonLuCount > 0 ? '#F0EDE6' : '#8A8880', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 6 }}
            aria-label="Notifications"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M10 2a6 6 0 00-6 6v3l-1.5 2.5A1 1 0 003.5 15h13a1 1 0 00.86-1.5L16 11V8a6 6 0 00-6-6z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
              <path d="M8 15a2 2 0 004 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            {nonLuCount > 0 && (
              <span style={{ position: 'absolute', top: 4, right: 4, width: 16, height: 16, borderRadius: '50%', backgroundColor: '#dc2626', color: '#fff', fontSize: 9, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {nonLuCount > 9 ? '9+' : nonLuCount}
              </span>
            )}
          </button>
        </div>

        {/* Backdrop menu */}
        {mobileOpen && (
          <div
            onClick={() => setMobileOpen(false)}
            style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.65)', zIndex: 49 }}
          />
        )}

        {/* Drawer */}
        <aside
          className={syne.className}
          style={{
            position: 'fixed',
            top: 0,
            left: mobileOpen ? 0 : -260,
            width: 240,
            height: '100vh',
            zIndex: 50,
            transition: 'left 0.25s ease',
            background: '#0D0D0B',
            borderRight: '1px solid #1E1E1C',
            display: 'flex',
            flexDirection: 'column',
            overflowY: 'auto',
          }}
        >
          <button
            onClick={() => setMobileOpen(false)}
            style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', color: '#8A8880', cursor: 'pointer', fontSize: 20, lineHeight: 1, padding: 4, zIndex: 1 }}
            aria-label="Fermer le menu"
          >
            ✕
          </button>
          {navContent}
        </aside>

        {/* Panneau notifications — mobile */}
        {showNotifs && (
          <NotificationPanel
            notifications={notifs} isMobile top={56} left={0} width="100vw"
            panelRef={notifRef} onClose={() => setShowNotifs(false)}
            onMarquerCommeLu={marquerCommeLu} onMarquerTousCommeLus={() => { marquerTousCommeLus(); setShowNotifs(false) }}
          />
        )}
      </>
    )
  }

  return (
    <>
      <aside className={syne.className} style={{ width: 240, flexShrink: 0, display: 'flex', flexDirection: 'column', height: '100vh', borderRight: '1px solid #1E1E1C', background: '#0D0D0B', position: 'relative', zIndex: 1 }}>
        {navContent}
      </aside>

      {/* Panneau notifications — desktop */}
      {showNotifs && (
        <NotificationPanel
          notifications={notifs} isMobile={false} top={0} left={240} width="360px"
          panelRef={notifRef} onClose={() => setShowNotifs(false)}
          onMarquerCommeLu={marquerCommeLu} onMarquerTousCommeLus={() => { marquerTousCommeLus(); setShowNotifs(false) }}
        />
      )}

      <OnboardingOverlay />
    </>
  )
}

