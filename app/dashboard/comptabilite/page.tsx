'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Settings } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { formatEurDoc } from '@/lib/supabase/documents'
import type { DevisDoc, FactureDoc, AvoirDoc } from '@/lib/supabase/documents'
import { toast } from '@/components/Toast'
import CustomSelect from '@/components/CustomSelect'
import SortPills from '@/components/SortPills'
import UpgradeGate from '@/components/UpgradeGate'

type Tab = 'devis' | 'factures' | 'avoirs' | 'acomptes'

type Chantier = { id: string; nom: string }

type AcompteDoc = {
  id: string
  user_id: string
  numero: string
  statut: string
  client_nom: string
  objet: string | null
  montant_ttc: number
  date_emission: string
  chantier_id: string | null
}

const DEVIS_STATUT: Record<string, { label: string; bg: string; color: string }> = {
  brouillon:  { label: 'Brouillon',  bg: 'rgba(138,136,128,0.15)', color: '#8A8880' },
  envoye:     { label: 'Envoyé',     bg: 'rgba(96,165,250,0.15)',  color: '#60a5fa' },
  accepte:    { label: 'Accepté',    bg: 'rgba(74,222,128,0.15)',  color: '#4ade80' },
  refuse:     { label: 'Refusé',     bg: 'rgba(232,84,71,0.15)',   color: '#E85447' },
  expire:     { label: 'Expiré',     bg: 'rgba(249,115,22,0.15)',  color: '#ea580c' },
}

const FACTURE_STATUT: Record<string, { label: string; bg: string; color: string }> = {
  brouillon:           { label: 'Brouillon',  bg: 'rgba(138,136,128,0.15)', color: '#8A8880' },
  envoyee:             { label: 'Envoyée',    bg: 'rgba(96,165,250,0.15)',  color: '#60a5fa' },
  partiellement_payee: { label: 'Partiel',    bg: 'rgba(249,115,22,0.15)',  color: '#ea580c' },
  payee:               { label: 'Payée',      bg: 'rgba(74,222,128,0.15)',  color: '#4ade80' },
  annulee:             { label: 'Annulée',    bg: 'rgba(232,84,71,0.15)',   color: '#E85447' },
}

const AVOIR_STATUT: Record<string, { label: string; bg: string; color: string }> = {
  brouillon: { label: 'Brouillon', bg: 'rgba(138,136,128,0.15)', color: '#8A8880' },
  emis:      { label: 'Émis',      bg: 'rgba(96,165,250,0.15)',  color: '#60a5fa' },
  annule:    { label: 'Annulé',    bg: 'rgba(232,84,71,0.15)',   color: '#E85447' },
}

const ACOMPTE_STATUT: Record<string, { label: string; bg: string; color: string }> = {
  brouillon: { label: 'Brouillon', bg: 'rgba(138,136,128,0.15)', color: '#8A8880' },
  envoye:    { label: 'Envoyé',    bg: 'rgba(96,165,250,0.15)',  color: '#60a5fa' },
  paye:      { label: 'Payé',      bg: 'rgba(74,222,128,0.15)',  color: '#4ade80' },
  annule:    { label: 'Annulé',    bg: 'rgba(232,84,71,0.15)',   color: '#E85447' },
}

function Badge({ map, statut }: { map: Record<string, { label: string; bg: string; color: string }>; statut: string }) {
  const s = map[statut] ?? { label: statut, bg: 'rgba(138,136,128,0.15)', color: '#8A8880' }
  return (
    <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, backgroundColor: s.bg, color: s.color, fontFamily: 'var(--font-dm-sans), sans-serif', whiteSpace: 'nowrap' }}>
      {s.label}
    </span>
  )
}

function fmtDate(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export default function DocumentsPage() {
  const [tab, setTab] = useState<Tab>('devis')
  const [devis, setDevis] = useState<DevisDoc[]>([])
  const [factures, setFactures] = useState<FactureDoc[]>([])
  const [avoirs, setAvoirs] = useState<AvoirDoc[]>([])
  const [acomptes, setAcomptes] = useState<AcompteDoc[]>([])
  const [chantiers, setChantiers] = useState<Chantier[]>([])
  const [selectedChantier, setSelectedChantier] = useState<string | null>(null)
  const [hasSiret, setHasSiret] = useState(true)
  const [loading, setLoading] = useState(true)
  const [sort, setSort] = useState<'date_desc' | 'date_asc' | 'montant_desc' | 'montant_asc' | 'statut'>('date_desc')

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const [dr, fr, ar, acr, cr, er] = await Promise.all([
        supabase.from('devis').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('factures').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('avoirs').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('acomptes').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('chantiers').select('id, nom').eq('user_id', user.id).order('nom'),
        supabase.from('entreprise_infos').select('siret').eq('user_id', user.id).single(),
      ])
      setDevis((dr.data ?? []) as DevisDoc[])
      setFactures((fr.data ?? []) as FactureDoc[])
      setAvoirs((ar.data ?? []) as AvoirDoc[])
      setAcomptes((acr.data ?? []) as AcompteDoc[])
      setChantiers((cr.data ?? []) as Chantier[])
      setHasSiret(!!(er.data?.siret))
      setLoading(false)
    }
    load()
  }, [])

  // Filtered views
  function applySort<T extends { created_at?: string; date_emission?: string; total_ttc?: number | null; statut?: string }>(arr: T[]): T[] {
    return [...arr].sort((a, b) => {
      if (sort === 'montant_asc')  return (a.total_ttc ?? 0) - (b.total_ttc ?? 0)
      if (sort === 'montant_desc') return (b.total_ttc ?? 0) - (a.total_ttc ?? 0)
      if (sort === 'statut')       return (a.statut ?? '').localeCompare(b.statut ?? '', 'fr')
      const da = a.date_emission ?? a.created_at ?? ''
      const db = b.date_emission ?? b.created_at ?? ''
      if (sort === 'date_asc') return da.localeCompare(db)
      return db.localeCompare(da)
    })
  }
  const filteredDevis     = applySort(selectedChantier ? devis.filter(d => d.chantier_id === selectedChantier)     : devis)
  const filteredFactures  = applySort(selectedChantier ? factures.filter(f => f.chantier_id === selectedChantier)  : factures)
  const filteredAvoirs    = applySort(selectedChantier ? avoirs.filter(a => {
    const facture = factures.find(f => f.id === a.facture_id)
    return facture?.chantier_id === selectedChantier
  }) : avoirs)
  const filteredAcomptes  = applySort(selectedChantier ? acomptes.filter(a => a.chantier_id === selectedChantier)  : acomptes)

  // Chantier doc counts (computed from loaded data)
  function chantierCount(id: string) {
    return (
      devis.filter(d => d.chantier_id === id).length +
      factures.filter(f => f.chantier_id === id).length +
      acomptes.filter(a => a.chantier_id === id).length
    )
  }
  const totalCount = devis.length + factures.length + acomptes.length

  // KPIs
  const devisEnAttente = filteredDevis.filter(d => d.statut === 'envoye').reduce((s, d) => s + (d.total_ttc ?? 0), 0)
  const caFacture      = filteredFactures.filter(f => f.statut !== 'annulee').reduce((s, f) => s + (f.total_ttc ?? 0), 0)
  const caEncaisse     = filteredFactures.reduce((s, f) => s + (f.montant_paye ?? 0), 0)
  const impayes        = filteredFactures
    .filter(f => f.statut !== 'payee' && f.statut !== 'annulee')
    .reduce((s, f) => s + Math.max(0, (f.total_ttc ?? 0) - (f.montant_paye ?? 0)), 0)

  const kpis = [
    { label: 'DEVIS EN ATTENTE', value: formatEurDoc(devisEnAttente), color: '#60a5fa' },
    { label: 'CA FACTURÉ',       value: formatEurDoc(caFacture),      color: '#ea580c' },
    { label: 'CA ENCAISSÉ',      value: formatEurDoc(caEncaisse),     color: '#4ade80' },
    { label: 'IMPAYÉS',          value: formatEurDoc(impayes),        color: '#E85447' },
  ]

  async function handleStatutDevis(id: string, statut: string) {
    const supabase = createClient()
    await supabase.from('devis').update({ statut }).eq('id', id)
    setDevis(prev => prev.map(d => d.id === id ? { ...d, statut: statut as DevisDoc['statut'] } : d))
    toast.success('Statut mis à jour')
  }

  async function handleStatutFacture(id: string, statut: string) {
    const supabase = createClient()
    await supabase.from('factures').update({ statut }).eq('id', id)
    setFactures(prev => prev.map(f => f.id === id ? { ...f, statut: statut as FactureDoc['statut'] } : f))
    toast.success('Statut mis à jour')
  }

  const thStyle: React.CSSProperties = {
    padding: '10px 16px', fontSize: 11, fontWeight: 600, letterSpacing: '0.06em',
    textTransform: 'uppercase', color: '#7A7870', fontFamily: 'var(--font-dm-sans), sans-serif',
    textAlign: 'left', borderBottom: '1px solid #1E1E1C',
  }
  const tdStyle: React.CSSProperties = {
    padding: '12px 16px', fontSize: 13, color: '#F0EDE6',
    fontFamily: 'var(--font-dm-sans), sans-serif', borderBottom: '1px solid #1E1E1C', verticalAlign: 'middle',
  }

  const tabCounts: Record<Tab, number> = {
    devis:     filteredDevis.length,
    factures:  filteredFactures.length,
    avoirs:    filteredAvoirs.length,
    acomptes:  filteredAcomptes.length,
  }
  const tabLabels: Record<Tab, string> = {
    devis:    'Devis',
    factures: 'Factures',
    avoirs:   'Avoirs',
    acomptes: 'Acomptes',
  }

  return (
    <UpgradeGate requiredPlan="complet" feature="Comptabilité (devis & factures)">
    <div className="page-enter" style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

      {/* ── Left sidebar: chantiers ── */}
      <div style={{ width: 260, minWidth: 260, flexShrink: 0, display: 'flex', flexDirection: 'column', height: '100%', position: 'sticky', top: 0, padding: '12px 0 12px 12px' }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: 'rgba(13,13,11,0.85)', border: '1px solid #1E1E1C', borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ flex: 1, overflowY: 'auto', minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '20px 16px 12px' }}>
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#7A7870', fontFamily: 'var(--font-dm-sans), sans-serif', margin: 0 }}>
            Chantiers
          </p>
        </div>

        {/* "Tous les documents" */}
        <button
          onClick={() => setSelectedChantier(null)}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '10px 16px', background: 'none', border: 'none', cursor: 'pointer',
            backgroundColor: selectedChantier === null ? 'rgba(249,115,22,0.08)' : 'transparent',
            borderLeft: selectedChantier === null ? '2px solid #ea580c' : '2px solid transparent',
          }}
          onMouseEnter={e => { if (selectedChantier !== null) e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.03)' }}
          onMouseLeave={e => { if (selectedChantier !== null) e.currentTarget.style.backgroundColor = 'transparent' }}
        >
          <span style={{ fontSize: 13, color: selectedChantier === null ? '#F0EDE6' : '#8A8880', fontFamily: 'var(--font-dm-sans), sans-serif', textAlign: 'left' }}>
            Tous les documents
          </span>
          {!loading && (
            <span style={{ fontSize: 10, fontWeight: 600, backgroundColor: selectedChantier === null ? 'rgba(249,115,22,0.15)' : 'rgba(138,136,128,0.15)', color: selectedChantier === null ? '#ea580c' : '#8A8880', padding: '2px 7px', borderRadius: 20, fontFamily: 'var(--font-dm-sans), sans-serif', flexShrink: 0 }}>
              {totalCount}
            </span>
          )}
        </button>

        {/* Divider */}
        <div style={{ borderTop: '1px solid #1E1E1C', margin: '6px 16px' }} />

        {/* Chantier list */}
        {loading ? (
          <div style={{ padding: '12px 16px' }}>
            {[1, 2, 3].map(i => (
              <div key={i} style={{ height: 14, backgroundColor: '#1E1E1C', borderRadius: 4, marginBottom: 10 }} />
            ))}
          </div>
        ) : chantiers.length === 0 ? (
          <p style={{ padding: '12px 16px', fontSize: 12, color: '#7A7870', fontFamily: 'var(--font-dm-sans), sans-serif', fontStyle: 'italic' }}>
            Aucun chantier
          </p>
        ) : chantiers.map(c => {
          const count = chantierCount(c.id)
          const active = selectedChantier === c.id
          return (
            <button
              key={c.id}
              onClick={() => setSelectedChantier(active ? null : c.id)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '9px 16px', background: 'none', border: 'none', cursor: 'pointer',
                backgroundColor: active ? 'rgba(249,115,22,0.08)' : 'transparent',
                borderLeft: active ? '2px solid #ea580c' : '2px solid transparent',
              }}
              onMouseEnter={e => { if (!active) e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.03)' }}
              onMouseLeave={e => { if (!active) e.currentTarget.style.backgroundColor = 'transparent' }}
            >
              <span style={{ fontSize: 13, color: active ? '#F0EDE6' : '#8A8880', fontFamily: 'var(--font-dm-sans), sans-serif', textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0, flex: 1 }}>
                {c.nom}
              </span>
              {count > 0 && (
                <span style={{ fontSize: 10, fontWeight: 600, backgroundColor: active ? 'rgba(249,115,22,0.15)' : 'rgba(138,136,128,0.12)', color: active ? '#ea580c' : '#7A7870', padding: '2px 7px', borderRadius: 20, fontFamily: 'var(--font-dm-sans), sans-serif', flexShrink: 0, marginLeft: 6 }}>
                  {count}
                </span>
              )}
            </button>
          )
        })}

        </div>{/* end scrollable inner */}

        {/* Bottom: settings link pinned */}
        <Link
          href="/dashboard/comptabilite/parametres"
          style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', fontSize: 14, color: '#F0EDE6', textDecoration: 'none', fontFamily: 'var(--font-dm-sans), sans-serif', backgroundColor: 'transparent', borderTop: '1px solid #1E1E1C', flexShrink: 0, borderBottomLeftRadius: 12, borderBottomRightRadius: 12 }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(255,255,255,0.04)' }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent' }}
        >
          <Settings size={16} color="#ea580c" />
          Paramètres documents
        </Link>
      </div>{/* end inner rounded card */}
      </div>{/* end outer padding wrapper */}

      {/* ── Main content ── */}
      <div style={{ flex: 1, padding: '40px', overflowY: 'auto', minWidth: 0 }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 32, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontFamily: 'var(--font-syne), sans-serif', fontSize: 24, fontWeight: 700, color: '#F0EDE6', margin: 0 }}>
              {selectedChantier ? chantiers.find(c => c.id === selectedChantier)?.nom ?? 'Comptabilité' : 'Comptabilité'}
            </h1>
            <p style={{ color: '#8A8880', fontSize: 14, marginTop: 6, fontFamily: 'var(--font-dm-sans), sans-serif', margin: '6px 0 0' }}>
              {selectedChantier ? 'Documents liés à ce chantier' : 'Devis, factures, avoirs et acomptes'}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Link
              href="/dashboard/comptabilite/devis/nouveau"
              style={{ padding: '9px 16px', backgroundColor: 'transparent', color: '#ea580c', border: '1px solid #ea580c', borderRadius: 8, fontSize: 12, fontWeight: 600, textDecoration: 'none', fontFamily: 'var(--font-dm-sans), sans-serif' }}
            >
              + Devis
            </Link>
            <Link
              href="/dashboard/comptabilite/factures/nouveau"
              style={{ padding: '9px 16px', backgroundColor: '#ea580c', color: '#0D0D0B', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 600, textDecoration: 'none', fontFamily: 'var(--font-dm-sans), sans-serif' }}
            >
              + Facture
            </Link>
          </div>
        </div>

        {/* Alert banner */}
        {!loading && !hasSiret && (
          <div style={{ backgroundColor: 'rgba(249,115,22,0.08)', border: '1px solid rgba(249,115,22,0.25)', borderRadius: 10, padding: '14px 20px', marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <p style={{ fontSize: 13, color: '#ea580c', fontFamily: 'var(--font-dm-sans), sans-serif', margin: 0 }}>
              ⚠️ Vos informations légales sont incomplètes — elles apparaîtront sur vos documents.
            </p>
            <Link href="/dashboard/comptabilite/parametres" style={{ fontSize: 12, color: '#ea580c', fontWeight: 600, textDecoration: 'underline', fontFamily: 'var(--font-dm-sans), sans-serif' }}>
              Compléter
            </Link>
          </div>
        )}

        {/* KPI cards */}
        {!loading && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 28 }}>
            {kpis.map(k => (
              <div key={k.label} style={{ backgroundColor: '#111110', border: '1px solid #1E1E1C', borderTop: `2px solid ${k.color}`, borderRadius: 10, padding: 18 }}>
                <p style={{ fontFamily: 'var(--font-syne), sans-serif', fontWeight: 600, fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#7A7870', margin: 0 }}>{k.label}</p>
                <p style={{ fontFamily: 'var(--font-syne), sans-serif', fontWeight: 800, fontSize: 18, color: k.color, letterSpacing: '-0.02em', lineHeight: 1, marginTop: 10, marginBottom: 0 }}>{k.value}</p>
              </div>
            ))}
          </div>
        )}

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 0, marginBottom: 20, borderBottom: '1px solid #1E1E1C', alignItems: 'center' }}>
          {(['devis', 'factures', 'avoirs', 'acomptes'] as Tab[]).map(t => {
            const active = tab === t
            return (
              <button
                key={t}
                onClick={() => setTab(t)}
                style={{ padding: '10px 18px', fontSize: 13, fontWeight: 500, fontFamily: 'var(--font-dm-sans), sans-serif', background: 'transparent', border: 'none', borderBottom: active ? '2px solid #ea580c' : '2px solid transparent', color: active ? '#ea580c' : '#8A8880', cursor: 'pointer', marginBottom: -1, transition: 'color 0.15s' }}
              >
                {tabLabels[t]} {!loading && <span style={{ fontSize: 11, opacity: 0.7 }}>({tabCounts[t]})</span>}
              </button>
            )
          })}
          <div style={{ flex: 1 }} />
          <div style={{ marginBottom: 4 }}>
            <SortPills
              value={sort}
              onChange={v => setSort(v as typeof sort)}
              options={[
                { key: 'date',    label: 'Date',    hasDirection: true, defaultDir: 'desc' },
                { key: 'montant', label: 'Montant', hasDirection: true, defaultDir: 'desc' },
                { key: 'statut',  label: 'Statut' },
              ]}
            />
          </div>
        </div>

        {loading ? (
          <p style={{ color: '#8A8880', fontSize: 14, fontFamily: 'var(--font-dm-sans), sans-serif' }}>Chargement…</p>
        ) : (
          <div style={{ backgroundColor: '#111110', border: '1px solid #1E1E1C', borderRadius: 12 }}>

            {/* DEVIS */}
            {tab === 'devis' && (
              filteredDevis.length === 0 ? (
                <EmptyState message="Aucun devis." cta="Créer le premier" href="/dashboard/comptabilite/devis/nouveau" />
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead><tr>
                    {['Numéro', 'Client', 'Objet', 'Montant TTC', 'Statut', 'Date', 'Actions'].map(h => (
                      <th key={h} style={thStyle}>{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {filteredDevis.map(d => (
                      <tr key={d.id}
                        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(249,115,22,0.04)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                      >
                        <td style={{ ...tdStyle, fontFamily: 'var(--font-syne), sans-serif', fontWeight: 600, fontSize: 12 }}>{d.numero}</td>
                        <td style={tdStyle}>{d.client_nom || '—'}</td>
                        <td style={{ ...tdStyle, color: '#8A8880', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.objet || '—'}</td>
                        <td style={{ ...tdStyle, fontWeight: 600, color: '#ea580c' }}>{formatEurDoc(d.total_ttc ?? 0)}</td>
                        <td style={tdStyle}><Badge map={DEVIS_STATUT} statut={d.statut} /></td>
                        <td style={{ ...tdStyle, color: '#8A8880' }}>{fmtDate(d.date_emission)}</td>
                        <td style={tdStyle}>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <Link href={`/dashboard/comptabilite/devis/${d.id}`} style={actionLink('#ea580c')}>Consulter</Link>
                            <a href={`/api/documents-pdf?type=devis&id=${d.id}`} target="_blank" rel="noreferrer" style={actionLink('#8A8880')}>PDF</a>
                            <StatutSelect options={Object.entries(DEVIS_STATUT).map(([v, s]) => ({ value: v, label: s.label }))} value={d.statut} onChange={v => handleStatutDevis(d.id, v)} />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )
            )}

            {/* FACTURES */}
            {tab === 'factures' && (
              filteredFactures.length === 0 ? (
                <EmptyState message="Aucune facture." cta="Créer la première" href="/dashboard/comptabilite/factures/nouveau" />
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead><tr>
                    {['Numéro', 'Client', 'Objet', 'Montant TTC', 'Statut', 'Échéance', 'Actions'].map(h => (
                      <th key={h} style={thStyle}>{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {filteredFactures.map(f => (
                      <tr key={f.id}
                        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(249,115,22,0.04)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                      >
                        <td style={{ ...tdStyle, fontFamily: 'var(--font-syne), sans-serif', fontWeight: 600, fontSize: 12 }}>{f.numero}</td>
                        <td style={tdStyle}>{f.client_nom || '—'}</td>
                        <td style={{ ...tdStyle, color: '#8A8880', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.objet || '—'}</td>
                        <td style={{ ...tdStyle, fontWeight: 600, color: '#ea580c' }}>{formatEurDoc(f.total_ttc ?? 0)}</td>
                        <td style={tdStyle}><Badge map={FACTURE_STATUT} statut={f.statut} /></td>
                        <td style={{ ...tdStyle, color: '#8A8880' }}>{fmtDate(f.date_echeance)}</td>
                        <td style={tdStyle}>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <Link href={`/dashboard/comptabilite/factures/${f.id}`} style={actionLink('#ea580c')}>Consulter</Link>
                            <a href={`/api/documents-pdf?type=facture&id=${f.id}`} target="_blank" rel="noreferrer" style={actionLink('#8A8880')}>PDF</a>
                            <StatutSelect options={Object.entries(FACTURE_STATUT).map(([v, s]) => ({ value: v, label: s.label }))} value={f.statut} onChange={v => handleStatutFacture(f.id, v)} />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )
            )}

            {/* AVOIRS */}
            {tab === 'avoirs' && (
              filteredAvoirs.length === 0 ? (
                <EmptyState message="Aucun avoir. Les avoirs s'émettent depuis une facture." />
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead><tr>
                    {['Numéro', 'Motif', 'Montant TTC', 'Statut', 'Date', 'Actions'].map(h => (
                      <th key={h} style={thStyle}>{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {filteredAvoirs.map(a => (
                      <tr key={a.id}
                        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(249,115,22,0.04)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                      >
                        <td style={{ ...tdStyle, fontFamily: 'var(--font-syne), sans-serif', fontWeight: 600, fontSize: 12 }}>{a.numero}</td>
                        <td style={{ ...tdStyle, color: '#8A8880', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.motif || '—'}</td>
                        <td style={{ ...tdStyle, fontWeight: 600, color: '#60a5fa' }}>{formatEurDoc(a.total_ttc ?? 0)}</td>
                        <td style={tdStyle}><Badge map={AVOIR_STATUT} statut={a.statut} /></td>
                        <td style={{ ...tdStyle, color: '#8A8880' }}>{fmtDate(a.date_emission)}</td>
                        <td style={tdStyle}>
                          <Link href={`/dashboard/comptabilite/factures/${a.facture_id}`} style={actionLink('#60a5fa')}>Facture liée</Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )
            )}

            {/* ACOMPTES */}
            {tab === 'acomptes' && (
              filteredAcomptes.length === 0 ? (
                <EmptyState message="Aucun acompte." cta="Créer le premier" href="/dashboard/comptabilite/acomptes/nouveau" />
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead><tr>
                    {['Numéro', 'Client', 'Objet', 'Montant TTC', 'Statut', 'Date', 'Actions'].map(h => (
                      <th key={h} style={thStyle}>{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {filteredAcomptes.map(a => (
                      <tr key={a.id}
                        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(249,115,22,0.04)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                      >
                        <td style={{ ...tdStyle, fontFamily: 'var(--font-syne), sans-serif', fontWeight: 600, fontSize: 12 }}>{a.numero}</td>
                        <td style={tdStyle}>{a.client_nom || '—'}</td>
                        <td style={{ ...tdStyle, color: '#8A8880', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.objet || '—'}</td>
                        <td style={{ ...tdStyle, fontWeight: 600, color: '#60a5fa' }}>{formatEurDoc(a.montant_ttc ?? 0)}</td>
                        <td style={tdStyle}><Badge map={ACOMPTE_STATUT} statut={a.statut} /></td>
                        <td style={{ ...tdStyle, color: '#8A8880' }}>{fmtDate(a.date_emission)}</td>
                        <td style={tdStyle}>
                          <Link href={`/dashboard/comptabilite/acomptes/${a.id}`} style={actionLink('#60a5fa')}>Consulter</Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )
            )}

          </div>
        )}
      </div>
    </div>
    </UpgradeGate>
  )
}

function actionLink(color: string): React.CSSProperties {
  return {
    padding: '5px 12px', fontSize: 12,
    backgroundColor: `rgba(${color === '#ea580c' ? '249,115,22' : color === '#60a5fa' ? '96,165,250' : '138,136,128'},0.1)`,
    color, border: `1px solid ${color === '#ea580c' ? 'rgba(249,115,22,0.2)' : color === '#60a5fa' ? 'rgba(96,165,250,0.2)' : '#1E1E1C'}`,
    borderRadius: 6, textDecoration: 'none', fontFamily: 'var(--font-dm-sans), sans-serif', display: 'inline-block',
  }
}

function EmptyState({ message, cta, href }: { message: string; cta?: string; href?: string }) {
  return (
    <div style={{ padding: '60px 40px', textAlign: 'center' }}>
      <p style={{ color: '#8A8880', fontFamily: 'var(--font-dm-sans), sans-serif', fontSize: 14, margin: 0 }}>
        {message}{' '}
        {cta && href && <Link href={href} style={{ color: '#ea580c' }}>{cta}</Link>}
      </p>
    </div>
  )
}

function StatutSelect({ options, value, onChange }: {
  options: { value: string; label: string }[]
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div style={{ width: 130 }}>
      <CustomSelect value={value} onChange={onChange} options={options} compact />
    </div>
  )
}
