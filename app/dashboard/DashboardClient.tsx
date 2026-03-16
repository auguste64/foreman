'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

const NAV_ITEMS: { id: string; label: string; icon: string; href: string; separator?: boolean }[] = [
  { id: 'dashboard',      label: 'Tableau de bord', icon: '\u{1F3E0}',          href: '/dashboard' },
  { id: 'chantiers',      label: 'Chantiers',        icon: '\u{1F3D7}\uFE0F',   href: '/dashboard/chantiers' },
  { id: 'comptes-rendus', label: 'Comptes rendus',   icon: '\u{1F4CB}',         href: '/dashboard/comptes-rendus' },
  { id: 'artisans',       label: 'Artisans',          icon: '\u{1F477}',         href: '/dashboard/artisans' },
  { id: 'planning',       label: 'Planning',          icon: '\u{1F4C5}',         href: '/dashboard/planning' },
  { id: 'parametres',     label: 'Paramètres',        icon: '\u2699\uFE0F',      href: '/dashboard/parametres', separator: true },
]

type Stats = { total: number; actifs: number; artisans: number; comptesRendus: number }

type ChantierEnCours = {
  id: string
  nom: string
  adresse: string
  client: string
  statut: string
  avancement?: number
}

type Evenement = {
  id: string
  titre: string
  date_debut: string
  chantier_id: string
  chantiers: { nom: string } | null
}

export function Sidebar({ user }: { user: User }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <aside className="flex flex-col w-[250px] flex-shrink-0 h-full bg-[#0D0D0B] border-r border-[#1E1E1C] overflow-y-auto">

      {/* Logo */}
      <div className="px-6 pt-6 pb-8">
        <Link href="/dashboard" className="no-underline">
          <span
            className="tracking-widest font-black text-xl text-[#E8C547] hover:opacity-80 transition-opacity"
            style={{ fontFamily: 'var(--font-syne), sans-serif' }}
          >
            FOREMAN
          </span>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 flex flex-col gap-0.5">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
          return (
            <div key={item.id}>
              {item.separator && <div className="border-t border-[#1E1E1C] my-2" />}
              <Link
                href={item.href}
                className={[
                  'group flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200',
                  'hover:bg-[rgba(232,197,71,0.08)] hover:text-[#E8C547] hover:translate-x-1 hover:shadow-[inset_2px_0_0_#E8C547]',
                  isActive
                    ? 'bg-[rgba(232,197,71,0.1)] text-[#E8C547] shadow-[inset_2px_0_0_#E8C547]'
                    : 'text-[#8A8880]',
                ].join(' ')}
                style={{ fontFamily: 'var(--font-dm-sans), sans-serif', textDecoration: 'none' }}
              >
                <span className="text-lg transition-transform duration-200 group-hover:scale-125">{item.icon}</span>
                {item.label}
              </Link>
            </div>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-[#1E1E1C]">
        <div className="bg-[rgba(232,197,71,0.04)] border border-[#1E1E1C] rounded-lg px-3 py-2 mb-2">
          <p
            className="text-xs text-[#7A7870] truncate"
            style={{ fontFamily: 'var(--font-dm-sans), sans-serif' }}
          >
            {user.email}
          </p>
        </div>
        <button
          onClick={handleSignOut}
          className="group flex items-center gap-3 px-4 py-3 rounded-lg text-sm w-full transition-all duration-200 hover:bg-[rgba(232,197,71,0.08)] hover:text-[#E85447] active:scale-95"
          style={{ fontFamily: 'var(--font-dm-sans), sans-serif', background: 'none', border: 'none', cursor: 'pointer', color: '#8A8880', textAlign: 'left' }}
        >
          <span className="text-lg transition-transform duration-200 group-hover:scale-125">{'↩'}</span>
          Déconnexion
        </button>
      </div>
    </aside>
  )
}

export default function DashboardClient({
  user: _user,
  stats,
  chantiersEnCours,
  prochainsEvenements,
}: {
  user: User
  stats: Stats
  chantiersEnCours: ChantierEnCours[]
  prochainsEvenements: Evenement[]
}) {
  const statCards = [
    { label: '\u{1F3D7}\uFE0F Chantiers actifs', value: stats.actifs },
    { label: '\u{1F4C1} Total chantiers',        value: stats.total },
    { label: '\u{1F477} Artisans',               value: stats.artisans },
    { label: '\u{1F4CB} Comptes rendus',          value: stats.comptesRendus },
  ]

  return (
    <main style={{ flex: 1, padding: '40px', overflowY: 'auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '40px' }}>
        <h1
          style={{
            fontFamily: 'var(--font-syne), sans-serif',
            fontSize: '24px',
            fontWeight: 700,
            color: '#F0EDE6',
            margin: 0,
          }}
        >
          Tableau de bord
        </h1>
        <p
          style={{
            color: '#8A8880',
            fontSize: '14px',
            marginTop: '6px',
            fontFamily: 'var(--font-dm-sans), sans-serif',
          }}
        >
          {'\u{1F44B}'} Bienvenue sur Foreman — votre espace de gestion de chantier.
        </p>
      </div>

      {/* Stat cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '16px',
          marginBottom: '32px',
        }}
      >
        {statCards.map((card) => (
          <div
            key={card.label}
            className="stat-card transition-all duration-300 hover:scale-105 hover:border-[#E8C547] hover:shadow-[0_0_30px_rgba(232,197,71,0.2)]"
            style={{
              backgroundColor: '#111110',
              border: '1px solid #1E1E1C',
              borderRadius: '10px',
              padding: '24px',
            }}
          >
            <p
              style={{
                fontSize: '13px',
                color: '#8A8880',
                marginBottom: '10px',
                fontFamily: 'var(--font-dm-sans), sans-serif',
              }}
            >
              {card.label}
            </p>
            <p
              className="stat-number"
              style={{
                fontFamily: 'var(--font-syne), sans-serif',
                fontSize: '32px',
                fontWeight: 700,
                color: '#F0EDE6',
                margin: 0,
              }}
            >
              {card.value}
            </p>
          </div>
        ))}
      </div>

      {/* Actions rapides */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '40px' }}>
        <Link
          href="/dashboard/comptes-rendus/nouveau"
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 0 28px rgba(232,197,71,0.55)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
          style={{
            display: 'inline-block',
            padding: '10px 20px',
            backgroundColor: '#E8C547',
            color: '#0D0D0B',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: 600,
            textDecoration: 'none',
            fontFamily: 'var(--font-dm-sans), sans-serif',
            letterSpacing: '0.01em',
            transition: 'all 0.2s ease',
          }}
        >
          + Nouveau compte rendu
        </Link>
        <Link
          href="/dashboard/chantiers/nouveau"
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 0 28px rgba(232,197,71,0.55)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
          style={{
            display: 'inline-block',
            padding: '10px 20px',
            backgroundColor: 'transparent',
            color: '#F0EDE6',
            border: '1px solid #1E1E1C',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: 500,
            textDecoration: 'none',
            fontFamily: 'var(--font-dm-sans), sans-serif',
            letterSpacing: '0.01em',
            transition: 'all 0.2s ease',
          }}
        >
          + Nouveau chantier
        </Link>
      </div>

      {/* Two-column layout for bottom sections */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>

        {/* Chantiers en cours */}
        <div
          className="card-animated transition-all duration-300 hover:scale-[1.01] hover:border-[#E8C547] hover:shadow-[0_0_30px_rgba(232,197,71,0.2)]"
          style={{
            backgroundColor: '#111110',
            border: '1px solid #1E1E1C',
            borderRadius: '12px',
            padding: '24px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <h3
              style={{
                fontFamily: 'var(--font-syne), sans-serif',
                fontSize: '15px',
                fontWeight: 600,
                color: '#F0EDE6',
                margin: 0,
              }}
            >
              {'\u{1F3D7}\uFE0F'} Chantiers en cours
            </h3>
            <Link
              href="/dashboard/chantiers"
              className="transition-all duration-200 hover:opacity-70"
              style={{ fontSize: '13px', color: '#E8C547', textDecoration: 'none', fontFamily: 'var(--font-dm-sans), sans-serif', fontWeight: 500 }}
            >
              Voir tous →
            </Link>
          </div>

          {chantiersEnCours.length === 0 ? (
            <p style={{ fontSize: '14px', color: '#8A8880', fontFamily: 'var(--font-dm-sans), sans-serif' }}>
              Aucun chantier en cours.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {chantiersEnCours.map((c) => {
                const avancement = c.avancement ?? 0
                return (
                  <Link
                    key={c.id}
                    href={`/dashboard/chantiers/${c.id}`}
                    className="row-animated block hover:bg-[rgba(232,197,71,0.04)] transition-all duration-150 cursor-pointer"
                    style={{ textDecoration: 'none' }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '16px',
                        padding: '12px 14px',
                        backgroundColor: '#0D0D0B',
                        borderRadius: '8px',
                        border: '1px solid #1E1E1C',
                      }}
                    >
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <p
                          style={{
                            fontSize: '14px',
                            color: '#F0EDE6',
                            fontFamily: 'var(--font-dm-sans), sans-serif',
                            fontWeight: 600,
                            margin: '0 0 4px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {c.nom}
                        </p>
                        <p style={{ fontSize: '13px', color: '#7A7870', fontFamily: 'var(--font-dm-sans), sans-serif', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {c.adresse}
                        </p>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0, width: '110px' }}>
                        <div style={{ flex: 1, height: '6px', backgroundColor: '#1E1E1C', borderRadius: '999px', overflow: 'hidden' }}>
                          <div style={{ height: '6px', backgroundColor: '#E8C547', borderRadius: '999px', width: `${avancement}%`, transition: 'width 0.3s ease' }} />
                        </div>
                        <span style={{ fontSize: '12px', fontWeight: 600, color: '#E8C547', fontFamily: 'var(--font-syne), sans-serif', flexShrink: 0, width: '30px', textAlign: 'right' }}>
                          {avancement}%
                        </span>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>

        {/* Prochains événements */}
        <div
          className="card-animated transition-all duration-300 hover:scale-[1.01] hover:border-[#E8C547] hover:shadow-[0_0_30px_rgba(232,197,71,0.2)]"
          style={{
            backgroundColor: '#111110',
            border: '1px solid #1E1E1C',
            borderRadius: '12px',
            padding: '24px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <h3
              style={{
                fontFamily: 'var(--font-syne), sans-serif',
                fontSize: '15px',
                fontWeight: 600,
                color: '#F0EDE6',
                margin: 0,
              }}
            >
              {'\u{1F5D3}\uFE0F'} Prochains événements
            </h3>
            <Link
              href="/dashboard/planning"
              className="transition-all duration-200 hover:opacity-70"
              style={{ fontSize: '13px', color: '#E8C547', textDecoration: 'none', fontFamily: 'var(--font-dm-sans), sans-serif', fontWeight: 500 }}
            >
              Voir tous →
            </Link>
          </div>

          {prochainsEvenements.length === 0 ? (
            <p style={{ fontSize: '14px', color: '#8A8880', fontFamily: 'var(--font-dm-sans), sans-serif' }}>
              Aucun événement à venir.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {prochainsEvenements.map((ev) => (
                <Link
                  key={ev.id}
                  href="/dashboard/planning"
                  className="block hover:bg-[rgba(232,197,71,0.04)] transition-all duration-150 cursor-pointer"
                  style={{ textDecoration: 'none' }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 14px',
                      backgroundColor: '#0D0D0B',
                      borderRadius: '8px',
                      border: '1px solid #1E1E1C',
                    }}
                  >
                    <div>
                      <p
                        style={{
                          fontSize: '14px',
                          color: '#F0EDE6',
                          fontFamily: 'var(--font-dm-sans), sans-serif',
                          fontWeight: 500,
                          margin: '0 0 4px',
                        }}
                      >
                        {ev.titre}
                      </p>
                      <p style={{ fontSize: '12px', color: '#8A8880', fontFamily: 'var(--font-dm-sans), sans-serif', margin: 0 }}>
                        {ev.chantiers?.nom ?? ev.chantier_id}
                      </p>
                    </div>
                    <span
                      style={{
                        fontSize: '12px',
                        color: '#8A8880',
                        fontFamily: 'var(--font-dm-sans), sans-serif',
                        whiteSpace: 'nowrap',
                        marginLeft: '12px',
                      }}
                    >
                      {new Date(ev.date_debut).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

      </div>
    </main>
  )
}
