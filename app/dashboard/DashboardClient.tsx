'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

const NAV_ITEMS: { id: string; label: string; icon: string; href: string; separator?: boolean }[] = [
  { id: 'dashboard',      label: 'Tableau de bord', icon: '\u{1F3E0}',          href: '/dashboard' },
  { id: 'chantiers',      label: 'Chantiers',        icon: '\u{1F3D7}\uFE0F',   href: '/dashboard/chantiers' },
  { id: 'comptes-rendus', label: 'Comptes rendus',   icon: '\u{1F4CB}',         href: '/dashboard/comptes-rendus' },
  { id: 'artisans',       label: 'Artisans',          icon: '\u{1F477}',         href: '/dashboard/artisans' },
  { id: 'planning',       label: 'Planning',          icon: '\u{1F4C5}',         href: '/dashboard/planning' },
  { id: 'stats',          label: 'Statistiques',      icon: '\u{1F4CA}',         href: '/dashboard/stats' },
  { id: 'finances',       label: 'Finances',           icon: '\u{1F4B0}',         href: '/dashboard/finances' },
  { id: 'parametres',     label: 'Paramètres',        icon: '\u2699\uFE0F',      href: '/dashboard/parametres', separator: true },
]

type Stats = { total: number; actifs: number }

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
  chantiers: { nom: string }[] | null
}

export function Sidebar({ user }: { user: User }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const fallback = user.email?.split('@')[0] ?? ''
  const [displayName, setDisplayName] = useState(fallback)

  useEffect(() => {
    supabase
      .from('profiles')
      .select('entreprise, prenom')
      .eq('id', user.id)
      .single()
      .then(({ data }) => {
        if (data?.entreprise) setDisplayName(data.entreprise)
        else if (data?.prenom) setDisplayName(data.prenom)
      })
  }, [user.id])

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
            className="tracking-widest font-black text-xl hover:opacity-80 transition-opacity"
            style={{ fontFamily: 'var(--font-syne), sans-serif', color: '#F0EDE6' }}
          >
            FORE<span style={{ color: '#F97316' }}>MAN</span>
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
                  'hover:bg-[rgba(249,115,22,0.08)] hover:text-[#F97316] hover:translate-x-1 hover:shadow-[inset_2px_0_0_#F97316]',
                  isActive
                    ? 'bg-[rgba(249,115,22,0.1)] text-[#F97316] shadow-[inset_2px_0_0_#F97316]'
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
        {/* Avatar — cliquable vers paramètres */}
        <Link
          href="/dashboard/parametres"
          className="flex items-center gap-2.5 rounded-lg transition-all duration-200 hover:bg-[rgba(249,115,22,0.06)]"
          style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 4px', textDecoration: 'none' }}
        >
          <div style={{ width: 36, height: 36, borderRadius: '50%', backgroundColor: '#F97316', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-syne), sans-serif', fontWeight: 700, fontSize: 16, color: '#fff', flexShrink: 0 }}>
            {user.email?.[0]?.toUpperCase() ?? '?'}
          </div>
          <span style={{ fontSize: 13, color: '#F0EDE6', fontFamily: 'var(--font-dm-sans), sans-serif', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
            {displayName}
          </span>
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0, opacity: 0.5 }}>
            <path d="M8 10a2 2 0 100-4 2 2 0 000 4z" stroke="#8A8880" strokeWidth="1.5" strokeLinecap="round"/>
            <path d="M13.3 6.7l-.7-1.7-1.3.3-1-1 .3-1.3-1.7-.7-.8 1.1H7l-.8-1.1-1.7.7.3 1.3-1 1-1.3-.3-.7 1.7 1.1.8v.6l-1.1.8.7 1.7 1.3-.3 1 1-.3 1.3 1.7.7.8-1.1h.6l.8 1.1 1.7-.7-.3-1.3 1-1 1.3.3.7-1.7-1.1-.8v-.6l1.1-.8z" stroke="#8A8880" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </Link>
        <div className="bg-[rgba(249,115,22,0.04)] border border-[#1E1E1C] rounded-lg px-3 py-2 mb-2">
          <p
            className="text-xs text-[#7A7870] truncate"
            style={{ fontFamily: 'var(--font-dm-sans), sans-serif' }}
          >
            {user.email}
          </p>
        </div>
        <button
          onClick={handleSignOut}
          className="group flex items-center gap-3 px-4 py-3 rounded-lg text-sm w-full transition-all duration-200 hover:bg-[rgba(249,115,22,0.08)] hover:text-[#E85447] active:scale-95"
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
  displayName,
  stats,
  chantiersEnCours,
  prochainsEvenements,
}: {
  user: User
  displayName: string
  stats: Stats
  chantiersEnCours: ChantierEnCours[]
  prochainsEvenements: Evenement[]
}) {
  const router = useRouter()
  const [greeting, setGreeting] = useState('')
  const [dateStr, setDateStr] = useState('')
  const [hoveredCard, setHoveredCard] = useState<number | null>(null)
  const [devisAcceptes, setDevisAcceptes] = useState<{ count: number; montant: number }>({ count: 0, montant: 0 })
  const [impayes, setImpayes] = useState<{ count: number; montant: number }>({ count: 0, montant: 0 })

  useEffect(() => {
    async function loadFinances() {
      const supabase = createClient()
      const [devisRes, facturesRes] = await Promise.all([
        supabase.from('devis').select('total_ttc').eq('statut', 'accepte'),
        supabase.from('factures').select('total_ttc, montant_paye').in('statut', ['envoyee', 'partiellement_payee']),
      ])
      const devisData = devisRes.data ?? []
      setDevisAcceptes({
        count: devisData.length,
        montant: devisData.reduce((s, d) => s + (d.total_ttc ?? 0), 0),
      })
      const facturesData = facturesRes.data ?? []
      setImpayes({
        count: facturesData.length,
        montant: facturesData.reduce((s, f) => s + Math.max(0, (f.total_ttc ?? 0) - (f.montant_paye ?? 0)), 0),
      })
    }
    loadFinances()
  }, [])

  useEffect(() => {
    const h = new Date().getHours()
    setGreeting(
      h >= 5 && h < 12 ? 'Bonjour'
      : h >= 12 && h < 18 ? 'Bon après-midi'
      : 'Bonsoir'
    )
    setDateStr(new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }))
  }, [])

  const fmtEur = (n: number) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n)

  const statCards = [
    { label: 'CHANTIERS ACTIFS', value: String(stats.actifs), color: '#F97316', desc: 'en cours actuellement', hint: stats.actifs > 0 ? { text: '● Actif', color: '#F97316' } : null, href: null },
    { label: 'TOTAL CHANTIERS',  value: String(stats.total),  color: '#3B82F6', desc: 'depuis le début',       hint: null, href: null },
    {
      label: 'DEVIS ACCEPTÉS',
      value: fmtEur(devisAcceptes.montant),
      color: '#10B981',
      desc: `${devisAcceptes.count} devis accepté${devisAcceptes.count !== 1 ? 's' : ''}`,
      hint: null,
      href: '/dashboard/documents?tab=devis&statut=accepte',
    },
    {
      label: 'IMPAYÉS',
      value: fmtEur(impayes.montant),
      color: '#EF4444',
      desc: `${impayes.count} facture${impayes.count !== 1 ? 's' : ''} en attente`,
      hint: null,
      href: '/dashboard/finances',
    },
  ]

  return (
    <main className="page-enter" style={{ flex: 1, padding: '40px', overflowY: 'auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '40px', gap: '16px', flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-syne), sans-serif', fontSize: '24px', fontWeight: 700, color: '#F0EDE6', margin: 0 }}>
            Tableau de bord
          </h1>
          <p style={{ color: '#8A8880', fontSize: '14px', marginTop: '6px', fontFamily: 'var(--font-dm-sans), sans-serif' }}>
            {greeting && (
              <>{greeting}, <span style={{ color: '#F97316', fontFamily: 'var(--font-syne)', fontWeight: 700 }}>{displayName}</span> — Voici l&apos;état de vos chantiers.</>
            )}
          </p>
        </div>
        {dateStr && (
          <div style={{
            background: 'rgba(249,115,22,0.06)',
            border: '1px solid rgba(249,115,22,0.12)',
            borderRadius: '6px',
            padding: '6px 12px',
            fontSize: '13px',
            color: '#7A7870',
            fontFamily: 'var(--font-dm-sans), sans-serif',
            whiteSpace: 'nowrap',
            alignSelf: 'center',
          }}>
            {dateStr}
          </div>
        )}
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '32px' }}>
        {statCards.map((card, idx) => (
          <div
            key={card.label}
            className="stat-card"
            onClick={() => card.href && router.push(card.href)}
            onMouseEnter={() => setHoveredCard(idx)}
            onMouseLeave={() => setHoveredCard(null)}
            style={{
              backgroundColor: '#111110',
              border: '1px solid #1E1E1C',
              borderTop: `2px solid ${card.color}`,
              borderRadius: '10px',
              padding: '24px',
              transition: 'all 0.2s ease',
              transform: hoveredCard === idx ? 'scale(1.03)' : 'scale(1)',
              boxShadow: hoveredCard === idx ? '0 0 24px rgba(249,115,22,0.12)' : 'none',
              cursor: card.href ? 'pointer' : 'default',
            }}
          >
            <p style={{ fontFamily: 'var(--font-syne), Syne, sans-serif', fontWeight: 600, fontSize: '11px', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#7A7870', margin: 0 }}>
              {card.label}
            </p>
            <p className="stat-number" style={{ fontFamily: 'var(--font-syne), Syne, sans-serif', fontWeight: 800, fontSize: '30px', letterSpacing: '-0.04em', color: card.color, lineHeight: 1, marginTop: '12px', marginBottom: 0 }}>
              {card.value}
            </p>
            <p style={{ fontSize: '12px', color: '#7A7870', marginTop: '6px', marginBottom: 0, fontFamily: 'var(--font-dm-sans), sans-serif' }}>
              {card.desc}
            </p>
            {card.hint && (
              <p style={{ fontSize: '11px', color: card.hint.color, margin: '6px 0 0', fontFamily: 'var(--font-dm-sans), sans-serif', fontWeight: 500 }}>
                {card.hint.text}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Actions rapides */}
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '40px' }}>
        <Link
          href="/dashboard/chantiers/nouveau"
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 0 28px rgba(249,115,22,0.55)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
          style={{ display: 'inline-block', padding: '8px 14px', backgroundColor: '#F97316', color: '#0D0D0B', borderRadius: '8px', fontSize: '13px', fontWeight: 600, textDecoration: 'none', fontFamily: 'var(--font-dm-sans), sans-serif', letterSpacing: '0.01em', transition: 'all 0.2s ease', whiteSpace: 'nowrap' }}
        >
          + Nouveau chantier
        </Link>
        <Link
          href="/dashboard/comptes-rendus/nouveau"
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 0 28px rgba(249,115,22,0.55)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
          style={{ display: 'inline-block', padding: '8px 14px', backgroundColor: 'transparent', color: '#F0EDE6', border: '1px solid #1E1E1C', borderRadius: '8px', fontSize: '13px', fontWeight: 500, textDecoration: 'none', fontFamily: 'var(--font-dm-sans), sans-serif', letterSpacing: '0.01em', transition: 'all 0.2s ease', whiteSpace: 'nowrap' }}
        >
          + Nouveau compte rendu
        </Link>
        <Link
          href="/dashboard/documents/devis/nouveau"
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 0 28px rgba(249,115,22,0.55)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
          style={{ display: 'inline-block', padding: '8px 14px', backgroundColor: 'transparent', color: '#F0EDE6', border: '1px solid #1E1E1C', borderRadius: '8px', fontSize: '13px', fontWeight: 500, textDecoration: 'none', fontFamily: 'var(--font-dm-sans), sans-serif', letterSpacing: '0.01em', transition: 'all 0.2s ease', whiteSpace: 'nowrap' }}
        >
          + Nouveau devis
        </Link>
        <Link
          href="/dashboard/documents/factures/nouveau"
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 0 28px rgba(249,115,22,0.55)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
          style={{ display: 'inline-block', padding: '8px 14px', backgroundColor: 'transparent', color: '#F0EDE6', border: '1px solid #1E1E1C', borderRadius: '8px', fontSize: '13px', fontWeight: 500, textDecoration: 'none', fontFamily: 'var(--font-dm-sans), sans-serif', letterSpacing: '0.01em', transition: 'all 0.2s ease', whiteSpace: 'nowrap' }}
        >
          + Nouvelle facture
        </Link>
        <Link
          href="/dashboard/artisans/nouveau"
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 0 28px rgba(249,115,22,0.55)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
          style={{ display: 'inline-block', padding: '8px 14px', backgroundColor: 'transparent', color: '#F0EDE6', border: '1px solid #1E1E1C', borderRadius: '8px', fontSize: '13px', fontWeight: 500, textDecoration: 'none', fontFamily: 'var(--font-dm-sans), sans-serif', letterSpacing: '0.01em', transition: 'all 0.2s ease', whiteSpace: 'nowrap' }}
        >
          + Ajouter un artisan
        </Link>
        <Link
          href="/dashboard/clients/nouveau"
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 0 28px rgba(249,115,22,0.55)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
          style={{ display: 'inline-block', padding: '8px 14px', backgroundColor: 'transparent', color: '#F0EDE6', border: '1px solid #1E1E1C', borderRadius: '8px', fontSize: '13px', fontWeight: 500, textDecoration: 'none', fontFamily: 'var(--font-dm-sans), sans-serif', letterSpacing: '0.01em', transition: 'all 0.2s ease', whiteSpace: 'nowrap' }}
        >
          + Ajouter un client
        </Link>
      </div>

      {/* Two-column layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>

        {/* Chantiers en cours */}
        <div
          className="card-animated"
          style={{ background: '#111110', border: '1px solid #1E1E1C', borderRadius: '12px', padding: '28px', display: 'flex', flexDirection: 'column', gap: '0' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h3 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '13px', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#7A7870', margin: 0 }}>
              Chantiers en cours
            </h3>
            <Link href="/dashboard/chantiers" className="transition-all duration-200 hover:opacity-70"
              style={{ fontSize: '12px', fontWeight: 500, color: '#F97316', textDecoration: 'none', letterSpacing: '0.04em', transition: 'opacity 0.2s' }}>
              Voir tous →
            </Link>
          </div>
          <div style={{ borderBottom: '1px solid #1E1E1C', margin: '16px 0' }} />

          {chantiersEnCours.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 16px' }}>
              <svg width="40" height="40" viewBox="0 0 40 40" fill="none" style={{ margin: '0 auto 12px', display: 'block', opacity: 0.3 }}>
                <rect x="4" y="20" width="32" height="16" rx="2" stroke="#F97316" strokeWidth="1.5"/>
                <path d="M10 20V14a2 2 0 012-2h16a2 2 0 012 2v6" stroke="#F97316" strokeWidth="1.5"/>
                <path d="M16 28v-4h8v4" stroke="#F97316" strokeWidth="1.5"/>
                <path d="M2 20h36" stroke="#F97316" strokeWidth="1.5"/>
              </svg>
              <p style={{ fontSize: '14px', color: '#7A7870', fontFamily: 'Inter, sans-serif', margin: '0 0 16px' }}>
                Aucun chantier en cours
              </p>
              <Link href="/dashboard/chantiers/nouveau"
                style={{ display: 'inline-block', padding: '8px 16px', backgroundColor: 'rgba(249,115,22,0.1)', color: '#F97316', border: '1px solid rgba(249,115,22,0.2)', borderRadius: '6px', fontSize: '13px', fontWeight: 500, textDecoration: 'none', fontFamily: 'Inter, sans-serif' }}>
                + Créer un chantier
              </Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {chantiersEnCours.map((c) => (
                  <Link
                    key={c.id}
                    href={`/dashboard/chantiers/${c.id}`}
                    className="row-animated block cursor-pointer"
                    style={{ textDecoration: 'none' }}
                  >
                    <div style={{ padding: '12px 14px', backgroundColor: '#0D0D0B', borderRadius: '8px', border: '1px solid #1E1E1C' }}>
                      <p style={{ fontSize: '14px', color: '#F0EDE6', fontFamily: 'Inter, sans-serif', fontWeight: 600, margin: '0 0 4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {c.nom}
                      </p>
                      <p style={{ fontSize: '13px', color: '#7A7870', fontFamily: 'Inter, sans-serif', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {c.adresse}
                      </p>
                    </div>
                  </Link>
              ))}
            </div>
          )}
        </div>

        {/* Prochains événements */}
        <div
          className="card-animated"
          style={{ background: '#111110', border: '1px solid #1E1E1C', borderRadius: '12px', padding: '28px', display: 'flex', flexDirection: 'column', gap: '0' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h3 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '13px', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#7A7870', margin: 0 }}>
              Prochains événements
            </h3>
            <Link href="/dashboard/planning" className="transition-all duration-200 hover:opacity-70"
              style={{ fontSize: '12px', fontWeight: 500, color: '#F97316', textDecoration: 'none', letterSpacing: '0.04em', transition: 'opacity 0.2s' }}>
              Voir tous →
            </Link>
          </div>
          <div style={{ borderBottom: '1px solid #1E1E1C', margin: '16px 0' }} />

          {prochainsEvenements.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 16px' }}>
              <svg width="40" height="40" viewBox="0 0 40 40" fill="none" style={{ margin: '0 auto 12px', display: 'block', opacity: 0.3 }}>
                <rect x="4" y="8" width="32" height="28" rx="2" stroke="#F97316" strokeWidth="1.5"/>
                <path d="M4 16h32" stroke="#F97316" strokeWidth="1.5"/>
                <path d="M13 4v8M27 4v8" stroke="#F97316" strokeWidth="1.5" strokeLinecap="round"/>
                <rect x="10" y="22" width="6" height="5" rx="1" fill="#F97316" opacity="0.4"/>
              </svg>
              <p style={{ fontSize: '14px', color: '#7A7870', fontFamily: 'Inter, sans-serif', margin: '0 0 16px' }}>
                Aucun événement prévu
              </p>
              <Link href="/dashboard/planning"
                style={{ display: 'inline-block', padding: '8px 16px', backgroundColor: 'rgba(249,115,22,0.1)', color: '#F97316', border: '1px solid rgba(249,115,22,0.2)', borderRadius: '6px', fontSize: '13px', fontWeight: 500, textDecoration: 'none', fontFamily: 'Inter, sans-serif' }}>
                + Planifier
              </Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {prochainsEvenements.map((ev) => (
                <Link
                  key={ev.id}
                  href="/dashboard/planning"
                  className="row-animated block cursor-pointer"
                  style={{ textDecoration: 'none' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', backgroundColor: '#0D0D0B', borderRadius: '8px', border: '1px solid #1E1E1C' }}>
                    <div>
                      <p style={{ fontSize: '14px', color: '#F0EDE6', fontFamily: 'Inter, sans-serif', fontWeight: 500, margin: '0 0 4px' }}>
                        {ev.titre}
                      </p>
                      <p style={{ fontSize: '12px', color: '#8A8880', fontFamily: 'Inter, sans-serif', margin: 0 }}>
                        {(Array.isArray(ev.chantiers) ? ev.chantiers[0]?.nom : null) ?? ev.chantier_id}
                      </p>
                    </div>
                    <span style={{ fontSize: '12px', color: '#8A8880', fontFamily: 'Inter, sans-serif', whiteSpace: 'nowrap', marginLeft: '12px' }}>
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
