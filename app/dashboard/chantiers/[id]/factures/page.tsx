'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, usePathname } from 'next/navigation'
import { getFacturesByChantier, type Facture } from '@/lib/supabase/factures'
import { createClient } from '@/lib/supabase/client'
import { usePlan } from '@/lib/usePlan'
import UpgradeGate from '@/components/UpgradeGate'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function formatMontant(val: any) {
  const n = parseFloat(val)
  return isNaN(n) ? '—' : n.toLocaleString('fr-FR', { minimumFractionDigits: 2 }) + ' €'
}

const STATUT_COLORS: Record<string, { bg: string; text: string }> = {
  brouillon:           { bg: 'rgba(138,136,128,0.15)', text: '#8A8880' },
  envoyee:             { bg: 'rgba(96,165,250,0.15)',  text: '#60a5fa' },
  partiellement_payee: { bg: 'rgba(249,115,22,0.15)',  text: '#ea580c' },
  payee:               { bg: '#15803d',                text: '#ffffff' },
  annulee:             { bg: 'rgba(232,84,71,0.15)',   text: '#E85447' },
}

const STATUT_LABELS: Record<string, string> = {
  brouillon:           'Brouillon',
  envoyee:             'Envoyée',
  partiellement_payee: 'Partiel',
  payee:               'Payée',
  annulee:             'Annulée',
}

function ChantierTabs({ chantierId, isPro }: { chantierId: string; isPro: boolean }) {
  const pathname = usePathname()
  const tabs = [
    { label: 'Infos',          href: `/dashboard/chantiers/${chantierId}`,                pro: false },
    { label: 'Lots & Devis',   href: `/dashboard/chantiers/${chantierId}/lots`,            pro: true },
    { label: 'Devis',          href: `/dashboard/chantiers/${chantierId}/devis`,           pro: true },
    { label: 'Factures',       href: `/dashboard/chantiers/${chantierId}/factures`,        pro: true },
    { label: 'Devis artisans', href: `/dashboard/chantiers/${chantierId}/devis-artisans`, pro: true },
  ]
  return (
    <div style={{ display: 'flex', gap: '4px', marginBottom: '32px', borderBottom: '1px solid #1E1E1C', paddingBottom: '0' }}>
      {tabs.map(tab => {
        const active = pathname === tab.href
        return (
          <Link
            key={tab.href}
            href={tab.href}
            style={{ padding: '10px 20px', fontSize: '13px', fontWeight: 500, fontFamily: 'var(--font-dm-sans), sans-serif', textDecoration: 'none', color: active ? '#ea580c' : '#8A8880', borderBottom: active ? '2px solid #ea580c' : '2px solid transparent', marginBottom: '-1px', transition: 'color 0.15s', display: 'inline-flex', alignItems: 'center', gap: 5 }}
          >
            {tab.label}
            {tab.pro && !isPro && (
              <span style={{ background: '#1E1E1C', color: '#ea580c', fontSize: '9px', fontWeight: 600, padding: '2px 5px', borderRadius: '4px' }}>Pro</span>
            )}
          </Link>
        )
      })}
    </div>
  )
}

export default function FacturesListPage() {
  const { isPro } = usePlan()
  const params = useParams()
  const chantierId = params.id as string
  const [factures, setFactures] = useState<Facture[]>([])
  const [loading, setLoading] = useState(true)
  const [chantierNom, setChantierNom] = useState('')

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const [facturesData, chantierRes] = await Promise.all([
        getFacturesByChantier(chantierId).catch(() => []),
        supabase.from('chantiers').select('nom').eq('id', chantierId).single(),
      ])
      setFactures(facturesData)
      setChantierNom(chantierRes.data?.nom ?? '')
      setLoading(false)
    }
    load()
  }, [chantierId])

  return (
    <div className="page-enter" style={{ flex: 1, padding: '40px', overflowY: 'auto', maxWidth: '800px' }}>
      <Link
        href="/dashboard/chantiers"
        style={{ display: 'inline-flex', alignItems: 'center', gap: 8, backgroundColor: '#111110', border: '1px solid #1E1E1C', borderRadius: 8, padding: '8px 14px', color: '#F0EDE6', fontSize: 13, fontWeight: 500, cursor: 'pointer', textDecoration: 'none', transition: 'all 0.15s ease', fontFamily: 'var(--font-dm-sans), sans-serif', marginBottom: 28 }}
        onMouseEnter={e => { e.currentTarget.style.background = '#1E1E1C'; e.currentTarget.style.borderColor = '#ea580c'; e.currentTarget.style.color = '#ea580c' }}
        onMouseLeave={e => { e.currentTarget.style.background = '#111110'; e.currentTarget.style.borderColor = '#1E1E1C'; e.currentTarget.style.color = '#F0EDE6' }}
      >
        <span style={{ color: '#ea580c' }}>←</span>
        Retour aux chantiers
      </Link>

      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontFamily: 'var(--font-syne), sans-serif', fontSize: '24px', fontWeight: 700, color: '#F0EDE6', margin: '0 0 4px' }}>
          {chantierNom}
        </h1>
      </div>

      <ChantierTabs chantierId={chantierId} isPro={isPro} />

      {!isPro ? (
        <UpgradeGate feature="Comptabilité" requiredPlan="pro" />
      ) : (
        <>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
            <h2 style={{ fontFamily: 'var(--font-syne), sans-serif', fontSize: '18px', fontWeight: 600, color: '#F0EDE6', margin: 0 }}>
              Factures {!loading && <span style={{ color: '#8A8880', fontSize: '14px', fontWeight: 400 }}>({factures.length})</span>}
            </h2>
            <Link
              href={`/dashboard/chantiers/${chantierId}/factures/nouveau`}
              style={{ padding: '9px 18px', backgroundColor: '#ea580c', color: '#0D0D0B', borderRadius: '8px', fontSize: '13px', fontWeight: 600, textDecoration: 'none', fontFamily: 'var(--font-dm-sans), sans-serif' }}
            >
              + Nouvelle facture
            </Link>
          </div>

          {loading && <p style={{ color: '#8A8880', fontSize: '14px', fontFamily: 'var(--font-dm-sans), sans-serif' }}>Chargement…</p>}

          {!loading && factures.length === 0 && (
            <div style={{ backgroundColor: '#111110', border: '1px dashed #1E1E1C', borderRadius: '12px', padding: '60px 24px', textAlign: 'center' }}>
              <p style={{ color: '#8A8880', fontSize: '14px', fontFamily: 'var(--font-dm-sans), sans-serif', marginBottom: '16px' }}>Aucune facture pour ce chantier.</p>
              <Link
                href={`/dashboard/chantiers/${chantierId}/factures/nouveau`}
                style={{ display: 'inline-block', padding: '10px 20px', backgroundColor: '#ea580c', color: '#0D0D0B', borderRadius: '8px', fontSize: '13px', fontWeight: 600, textDecoration: 'none', fontFamily: 'var(--font-dm-sans), sans-serif' }}
              >
                + Créer une facture
              </Link>
            </div>
          )}

          {!loading && factures.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {factures.map(f => {
                const sc = STATUT_COLORS[f.statut] ?? { bg: 'rgba(138,136,128,0.15)', text: '#8A8880' }
                return (
                  <Link
                    key={f.id}
                    href={`/dashboard/chantiers/${chantierId}/factures/${f.id}`}
                    style={{ backgroundColor: '#111110', border: '1px solid #1E1E1C', borderRadius: '10px', padding: '18px 20px', display: 'flex', alignItems: 'center', gap: '16px', textDecoration: 'none', transition: 'all 0.15s ease' }}
                    onMouseEnter={e => { e.currentTarget.style.transform = 'translateX(4px)'; e.currentTarget.style.borderColor = 'rgba(249,115,22,0.2)' }}
                    onMouseLeave={e => { e.currentTarget.style.transform = 'translateX(0)'; e.currentTarget.style.borderColor = '#1E1E1C' }}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', flexShrink: 0 }}>
                      <span style={{ padding: '2px 8px', backgroundColor: 'rgba(249,115,22,0.08)', color: '#ea580c', borderRadius: '4px', fontSize: '11px', fontWeight: 600, fontFamily: 'var(--font-dm-sans), sans-serif' }}>{f.numero}</span>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: '#F0EDE6', fontFamily: 'var(--font-dm-sans), sans-serif', paddingLeft: '2px' }}>{formatMontant(f.total_ttc)}</span>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: '14px', fontWeight: 500, color: '#F0EDE6', fontFamily: 'var(--font-dm-sans), sans-serif', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.client_nom || f.titre || '—'}</p>
                      {f.titre && f.client_nom && <p style={{ fontSize: '12px', color: '#7A7870', fontFamily: 'var(--font-dm-sans), sans-serif', margin: '2px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.titre}</p>}
                      {f.date_echeance && <p style={{ fontSize: '12px', color: '#7A7870', fontFamily: 'var(--font-dm-sans), sans-serif', margin: '2px 0 0' }}>Échéance : {new Date(f.date_echeance).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}</p>}
                    </div>
                    <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 500, fontFamily: 'var(--font-dm-sans), sans-serif', backgroundColor: sc.bg, color: sc.text, flexShrink: 0 }}>{STATUT_LABELS[f.statut] ?? f.statut}</span>
                    <span style={{ fontSize: '12px', color: '#8A8880', fontFamily: 'var(--font-dm-sans), sans-serif', flexShrink: 0 }}>{new Date(f.date_emission).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  </Link>
                )
              })}
            </div>
          )}
        </>
      )}
    </div>
  )
}
