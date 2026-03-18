'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { calcTotaux, formatEur, type Devis, type LigneDevis } from '@/lib/supabase/devis'
import { createClient } from '@/lib/supabase/client'

const STATUT_COLORS: Record<string, { bg: string; text: string }> = {
  brouillon: { bg: '#1E1E1C', text: '#8A8880' },
  envoye:    { bg: '#1a2035', text: '#60a5fa' },
  accepte:   { bg: '#1a2e1a', text: '#4ade80' },
  refuse:    { bg: '#2e1a1a', text: '#E85447' },
}

const STATUT_LABELS: Record<string, string> = {
  brouillon: 'Brouillon',
  envoye:    'Envoyé',
  accepte:   'Accepté',
  refuse:    'Refusé',
}

type DevisRow = Devis & { devis_lignes: LigneDevis[] }

function ChantierTabs({ chantierId }: { chantierId: string }) {
  const tabs = [
    { label: 'Infos', href: `/dashboard/chantiers/${chantierId}` },
    { label: 'Devis', href: `/dashboard/chantiers/${chantierId}/devis` },
    { label: 'Factures', href: `/dashboard/chantiers/${chantierId}/factures` },
  ]
  return (
    <div style={{ display: 'flex', gap: '4px', marginBottom: '32px', borderBottom: '1px solid #1E1E1C' }}>
      {tabs.map(tab => {
        const active = typeof window !== 'undefined' && window.location.pathname === tab.href
        return (
          <Link
            key={tab.href}
            href={tab.href}
            style={{ padding: '10px 20px', fontSize: '13px', fontWeight: 500, fontFamily: 'var(--font-dm-sans), sans-serif', textDecoration: 'none', color: active ? '#F97316' : '#8A8880', borderBottom: active ? '2px solid #F97316' : '2px solid transparent', marginBottom: '-1px', transition: 'color 0.15s' }}
          >
            {tab.label}
          </Link>
        )
      })}
    </div>
  )
}

export default function DevisListPage() {
  const params = useParams()
  const chantierId = params.id as string
  const [devis, setDevis] = useState<DevisRow[]>([])
  const [loading, setLoading] = useState(true)
  const [chantierNom, setChantierNom] = useState('')

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const [devisRes, chantierRes] = await Promise.all([
        supabase
          .from('devis')
          .select('*, devis_lignes(*)')
          .eq('chantier_id', chantierId)
          .order('created_at', { ascending: false }),
        supabase.from('chantiers').select('nom').eq('id', chantierId).single(),
      ])
      setDevis((devisRes.data ?? []) as DevisRow[])
      setChantierNom(chantierRes.data?.nom ?? '')
      setLoading(false)
    }
    load()
  }, [chantierId])

  return (
    <div className="page-enter" style={{ flex: 1, padding: '40px', overflowY: 'auto', maxWidth: '800px' }}>
      <Link
        href="/dashboard/chantiers"
        style={{ fontSize: '13px', color: '#8A8880', textDecoration: 'none', fontFamily: 'var(--font-dm-sans), sans-serif', display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '28px' }}
      >
        ← Retour aux chantiers
      </Link>

      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontFamily: 'var(--font-syne), sans-serif', fontSize: '24px', fontWeight: 700, color: '#F0EDE6', margin: '0 0 4px' }}>
          {chantierNom}
        </h1>
      </div>

      <ChantierTabs chantierId={chantierId} />

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <h2 style={{ fontFamily: 'var(--font-syne), sans-serif', fontSize: '18px', fontWeight: 600, color: '#F0EDE6', margin: 0 }}>
          Devis {!loading && <span style={{ color: '#8A8880', fontSize: '14px', fontWeight: 400 }}>({devis.length})</span>}
        </h2>
        <Link
          href={`/dashboard/chantiers/${chantierId}/devis/nouveau`}
          style={{ padding: '9px 18px', backgroundColor: '#F97316', color: '#0D0D0B', borderRadius: '8px', fontSize: '13px', fontWeight: 600, textDecoration: 'none', fontFamily: 'var(--font-dm-sans), sans-serif' }}
        >
          + Nouveau devis
        </Link>
      </div>

      {loading && <p style={{ color: '#8A8880', fontSize: '14px', fontFamily: 'var(--font-dm-sans), sans-serif' }}>Chargement…</p>}

      {!loading && devis.length === 0 && (
        <div style={{ backgroundColor: '#111110', border: '1px dashed #1E1E1C', borderRadius: '12px', padding: '60px 24px', textAlign: 'center' }}>
          <p style={{ color: '#8A8880', fontSize: '14px', fontFamily: 'var(--font-dm-sans), sans-serif', marginBottom: '16px' }}>Aucun devis pour ce chantier.</p>
          <Link
            href={`/dashboard/chantiers/${chantierId}/devis/nouveau`}
            style={{ display: 'inline-block', padding: '10px 20px', backgroundColor: '#F97316', color: '#0D0D0B', borderRadius: '8px', fontSize: '13px', fontWeight: 600, textDecoration: 'none', fontFamily: 'var(--font-dm-sans), sans-serif' }}
          >
            + Créer un devis
          </Link>
        </div>
      )}

      {!loading && devis.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {devis.map(d => {
            const sc = STATUT_COLORS[d.statut] ?? STATUT_COLORS.brouillon
            const totaux = calcTotaux(d.devis_lignes ?? [], d.tva_pct)
            return (
              <Link
                key={d.id}
                href={`/dashboard/chantiers/${chantierId}/devis/${d.id}`}
                style={{ backgroundColor: '#111110', border: '1px solid #1E1E1C', borderRadius: '10px', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '14px', textDecoration: 'none', transition: 'all 0.15s ease' }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateX(4px)'; e.currentTarget.style.borderColor = 'rgba(249,115,22,0.2)' }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateX(0)'; e.currentTarget.style.borderColor = '#1E1E1C' }}
              >
                {/* Numéro */}
                <span style={{ padding: '2px 8px', backgroundColor: 'rgba(249,115,22,0.08)', color: '#F97316', borderRadius: '4px', fontSize: '11px', fontWeight: 600, fontFamily: 'var(--font-dm-sans), sans-serif', flexShrink: 0 }}>
                  {d.numero}
                </span>

                {/* Client */}
                <span style={{ flex: 1, fontSize: '14px', color: d.client_nom ? '#F0EDE6' : '#8A8880', fontFamily: 'var(--font-dm-sans), sans-serif', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontStyle: d.client_nom ? 'normal' : 'italic' }}>
                  {d.client_nom || 'Sans client'}
                </span>

                {/* Total TTC */}
                <span style={{ fontSize: '14px', fontWeight: 600, color: '#F0EDE6', fontFamily: 'var(--font-dm-sans), sans-serif', flexShrink: 0 }}>
                  {formatEur(totaux.ttc)}
                </span>

                {/* Statut */}
                <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 500, fontFamily: 'var(--font-dm-sans), sans-serif', backgroundColor: sc.bg, color: sc.text, flexShrink: 0 }}>
                  {STATUT_LABELS[d.statut] ?? d.statut}
                </span>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
