'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Syne } from 'next/font/google'

const syne = Syne({ subsets: ['latin'], weight: ['400', '500', '600', '700', '800'] })

const navItems = [
  { href: '/dashboard', label: 'Tableau de bord' },
  { href: '/dashboard/chantiers', label: 'Chantiers' },
  { href: '/dashboard/comptes-rendus', label: 'Comptes rendus' },
  { href: '/dashboard/artisans', label: 'Artisans' },
  { href: '/dashboard/planning', label: 'Planning' },
]

export default function Sidebar({ email }: { email: string }) {
  const pathname = usePathname()
  return (
    <aside className={syne.className} style={{ width: 240, flexShrink: 0, display: 'flex', flexDirection: 'column', height: '100vh', borderRight: '1px solid #1E1E1C', background: '#0D0D0B' }}>
      <div style={{ padding: '24px', borderBottom: '1px solid #1E1E1C' }}>
        <Link href="/dashboard" style={{ color: '#E8C547', fontWeight: 900, fontSize: 20, letterSpacing: '0.15em', textDecoration: 'none', fontFamily: 'var(--font-syne)' }}>FOREMAN</Link>
      </div>
      <nav style={{ flex: 1, padding: 16, display: 'flex', flexDirection: 'column', gap: 4 }}>
        {navItems.map(item => {
          const active = pathname === item.href
          return (
            <Link key={item.href} href={item.href}
              style={{ display: 'flex', alignItems: 'center', padding: '10px 16px', borderRadius: 8, fontSize: 14, fontWeight: 500, color: active ? '#E8C547' : '#F0EDE6', background: active ? 'rgba(232,197,71,0.08)' : 'transparent', textDecoration: 'none', transition: 'all 0.2s ease', fontFamily: 'var(--font-syne)', borderLeft: active ? '3px solid #E8C547' : '3px solid transparent' }}
              onMouseEnter={e => { if (!active) { e.currentTarget.style.color = '#E8C547'; e.currentTarget.style.background = 'rgba(232,197,71,0.06)'; e.currentTarget.style.paddingLeft = '20px'; } }}
              onMouseLeave={e => { if (!active) { e.currentTarget.style.color = '#F0EDE6'; e.currentTarget.style.background = 'transparent'; e.currentTarget.style.paddingLeft = '16px'; } }}
            >{item.label}</Link>
          )
        })}
        <div style={{ borderTop: '1px solid #1E1E1C', margin: '8px 0' }} />
      </nav>
      <div style={{ padding: 16, borderTop: '1px solid #1E1E1C', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ background: 'rgba(232,197,71,0.04)', border: '1px solid #1E1E1C', borderRadius: 8, padding: '8px 12px', fontSize: 12, color: '#7A7870', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{email}</div>
        <form action="/auth/signout" method="post">
          <button type="submit" style={{ width: '100%', textAlign: 'left', fontSize: 12, color: '#7A7870', padding: '8px 12px', borderRadius: 8, border: 'none', background: 'transparent', cursor: 'pointer', transition: 'all 0.2s ease', fontFamily: 'var(--font-syne)' }}
            onMouseEnter={e => { e.currentTarget.style.color = '#E8C547'; e.currentTarget.style.background = 'rgba(232,197,71,0.08)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = '#7A7870'; e.currentTarget.style.background = 'transparent'; }}
          >← Déconnexion</button>
        </form>
      </div>
    </aside>
  )
}
