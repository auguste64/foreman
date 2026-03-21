'use client'

import { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import UpgradeGate from '@/components/UpgradeGate'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'

// ─── Constants ───────────────────────────────────────────────────────────────

const MOIS_FR = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc']
const COLORS = { orange: '#ea580c', green: '#4ade80', blue: '#60a5fa', red: '#E85447', purple: '#a78bfa', muted: '#8A8880' }

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtEur(n: number): string {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n)
}

function fmtDate(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function monthKey(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function getLast12Months(): { key: string; label: string }[] {
  const result = []
  const now = new Date()
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    result.push({
      key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
      label: MOIS_FR[d.getMonth()],
    })
  }
  return result
}

function quarterOfDate(iso: string | null): number {
  if (!iso) return 0
  const m = new Date(iso).getMonth() + 1
  return Math.ceil(m / 4)
}

// ─── Types ────────────────────────────────────────────────────────────────────

type FactureRow = {
  id: string
  statut: string
  total_ttc: number
  total_ht: number
  total_tva: number
  tva_taux: number
  montant_paye: number
  date_emission: string
  date_paiement: string | null
  date_echeance: string | null
  client_nom: string
  devis_id: string | null
}

type DevisRow = {
  id: string
  numero: string
  statut: string
  client_nom: string
  objet: string | null
  total_ttc: number
  total_ht: number
  date_emission: string | null
  accepte_at: string | null
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function FinancesPage() {
  const [factures, setFactures] = useState<FactureRow[]>([])
  const [devis, setDevis] = useState<DevisRow[]>([])
  const [loading, setLoading] = useState(true)
  const [objectif, setObjectif] = useState(50000)
  const [editingObjectif, setEditingObjectif] = useState(false)
  const [objectifInput, setObjectifInput] = useState('50000')
  const [quarterFilter, setQuarterFilter] = useState<number>(0) // 0 = all

  // Load objectif from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('foreman_objectif_2026')
    if (saved) {
      const n = parseInt(saved, 10)
      if (!isNaN(n)) { setObjectif(n); setObjectifInput(String(n)) }
    }
  }, [])

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const [factRes, devRes] = await Promise.all([
        supabase.from('factures').select('id, statut, total_ttc, total_ht, total_tva, tva_taux, montant_paye, date_emission, date_paiement, date_echeance, client_nom, devis_id'),
        supabase.from('devis').select('id, numero, statut, client_nom, objet, total_ttc, total_ht, date_emission, accepte_at'),
      ])
      setFactures((factRes.data ?? []) as FactureRow[])
      setDevis((devRes.data ?? []) as DevisRow[])
      setLoading(false)
    }
    load()
  }, [])

  // ─── Derived data ──────────────────────────────────────────────────────────

  const now = new Date()
  const curMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const prevMonthKey = (() => {
    const d = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
  })()

  const facturesActives = useMemo(() => factures.filter(f => f.statut !== 'annulee'), [factures])

  // KPI 1: CA Facturé
  const caFacture = useMemo(() => facturesActives.reduce((s, f) => s + (f.total_ttc ?? 0), 0), [facturesActives])
  const caFacturePrev = useMemo(() =>
    facturesActives.filter(f => monthKey(f.date_emission) === prevMonthKey).reduce((s, f) => s + (f.total_ttc ?? 0), 0),
    [facturesActives, prevMonthKey])
  const caFactureCur = useMemo(() =>
    facturesActives.filter(f => monthKey(f.date_emission) === curMonthKey).reduce((s, f) => s + (f.total_ttc ?? 0), 0),
    [facturesActives, curMonthKey])

  // KPI 2: CA Encaissé
  const caEncaisse = useMemo(() => factures.reduce((s, f) => s + (f.montant_paye ?? 0), 0), [factures])
  const caEncaissePrev = useMemo(() =>
    factures.filter(f => monthKey(f.date_paiement || f.date_emission) === prevMonthKey).reduce((s, f) => s + (f.montant_paye ?? 0), 0),
    [factures, prevMonthKey])
  const caEncaisseCur = useMemo(() =>
    factures.filter(f => monthKey(f.date_paiement || f.date_emission) === curMonthKey).reduce((s, f) => s + (f.montant_paye ?? 0), 0),
    [factures, curMonthKey])

  // KPI 3: Devis acceptés (count + montant)
  const devisAcceptes = useMemo(() => devis.filter(d => d.statut === 'accepte'), [devis])
  const devisAcceptesTotal = useMemo(() => devisAcceptes.reduce((s, d) => s + (d.total_ttc ?? 0), 0), [devisAcceptes])

  // KPI 4: Impayés
  const impayes = useMemo(() =>
    factures.filter(f => f.statut !== 'payee' && f.statut !== 'annulee')
      .reduce((s, f) => s + Math.max(0, (f.total_ttc ?? 0) - (f.montant_paye ?? 0)), 0),
    [factures])

  // KPI 5: Taux de conversion devis→facture
  const devisTotaux = devis.length
  const devisConvertis = devis.filter(d => d.statut === 'accepte').length
  const tauxConversion = devisTotaux > 0 ? Math.round((devisConvertis / devisTotaux) * 100) : 0

  // KPI 6: Délai moyen paiement
  const delaiMoyen = useMemo(() => {
    const paid = factures.filter(f => f.statut === 'payee' && f.date_paiement && f.date_emission)
    if (!paid.length) return 0
    const total = paid.reduce((s, f) => {
      const diff = new Date(f.date_paiement!).getTime() - new Date(f.date_emission).getTime()
      return s + Math.max(0, Math.round(diff / 86400000))
    }, 0)
    return Math.round(total / paid.length)
  }, [factures])

  // ─── Chart data ────────────────────────────────────────────────────────────

  const months12 = getLast12Months()

  const areaChartData = useMemo(() => months12.map(m => ({
    label: m.label,
    facture: facturesActives.filter(f => monthKey(f.date_emission) === m.key).reduce((s, f) => s + (f.total_ttc ?? 0), 0),
    encaisse: factures.filter(f => monthKey(f.date_paiement || f.date_emission) === m.key).reduce((s, f) => s + (f.montant_paye ?? 0), 0),
  })), [factures, facturesActives, months12])

  const pieData = useMemo(() => {
    const brouillon = devis.filter(d => d.statut === 'brouillon').length
    const envoye = devis.filter(d => d.statut === 'envoye').length
    const accepte = devis.filter(d => d.statut === 'accepte').length
    const refuse = devis.filter(d => d.statut === 'refuse' || d.statut === 'expire').length
    return [
      { name: 'Brouillon', value: brouillon, color: '#4a4a48' },
      { name: 'Envoyé', value: envoye, color: COLORS.blue },
      { name: 'Accepté', value: accepte, color: COLORS.green },
      { name: 'Refusé/Expiré', value: refuse, color: COLORS.red },
    ].filter(d => d.value > 0)
  }, [devis])

  // ─── Projections 2026 ──────────────────────────────────────────────────────

  const projectionData = useMemo(() => {
    const currentYear = now.getFullYear()
    return MOIS_FR.map((label, i) => {
      const key = `${currentYear}-${String(i + 1).padStart(2, '0')}`
      const isPast = i < now.getMonth()
      const isCurrent = i === now.getMonth()
      const actual = facturesActives.filter(f => monthKey(f.date_emission) === key).reduce((s, f) => s + (f.total_ttc ?? 0), 0)
      const monthlyTarget = Math.round(objectif / 12)
      return {
        label,
        caReel: isPast || isCurrent ? actual : undefined,
        caProjecte: !isPast ? monthlyTarget : undefined,
      }
    })
  }, [factures, facturesActives, objectif, now])

  const caAnnuelReel = useMemo(() =>
    facturesActives.filter(f => f.date_emission?.startsWith(String(now.getFullYear()))).reduce((s, f) => s + (f.total_ttc ?? 0), 0),
    [facturesActives])
  const progressPct = Math.min(100, Math.round((caAnnuelReel / objectif) * 100))
  const moisRestants = 12 - (now.getMonth() + 1)
  const resteAFaire = Math.max(0, objectif - caAnnuelReel)
  const cadenceMensuelle = moisRestants > 0 ? Math.round(resteAFaire / moisRestants) : 0

  // ─── Top clients ───────────────────────────────────────────────────────────

  const topClients = useMemo(() => {
    const map: Record<string, { nom: string; total: number; count: number }> = {}
    facturesActives.forEach(f => {
      const nom = f.client_nom || 'Inconnu'
      if (!map[nom]) map[nom] = { nom, total: 0, count: 0 }
      map[nom].total += f.total_ttc ?? 0
      map[nom].count += 1
    })
    return Object.values(map).sort((a, b) => b.total - a.total).slice(0, 5)
  }, [facturesActives])

  // ─── Factures en retard ────────────────────────────────────────────────────

  const facturesEnRetard = useMemo(() => {
    const today = new Date()
    return factures
      .filter(f => {
        if (f.statut === 'payee' || f.statut === 'annulee') return false
        if (!f.date_echeance) return false
        return new Date(f.date_echeance) < today
      })
      .sort((a, b) => new Date(a.date_echeance!).getTime() - new Date(b.date_echeance!).getTime())
      .slice(0, 8)
  }, [factures])

  // ─── Pipeline commercial ───────────────────────────────────────────────────

  const pipeline = useMemo(() => {
    const brouillon = devis.filter(d => d.statut === 'brouillon')
    const envoye = devis.filter(d => d.statut === 'envoye')
    const accepte = devis.filter(d => d.statut === 'accepte')
    const facture = factures.filter(f => f.statut !== 'annulee' && f.statut !== 'brouillon')
    const encaisse = factures.filter(f => f.statut === 'payee')
    const maxCount = Math.max(brouillon.length, envoye.length, accepte.length, facture.length, encaisse.length, 1)
    return [
      { label: 'Brouillon', count: brouillon.length, montant: brouillon.reduce((s, d) => s + (d.total_ttc ?? 0), 0), color: '#4a4a48', pct: brouillon.length / maxCount },
      { label: 'Envoyé', count: envoye.length, montant: envoye.reduce((s, d) => s + (d.total_ttc ?? 0), 0), color: COLORS.blue, pct: envoye.length / maxCount },
      { label: 'Accepté', count: accepte.length, montant: accepte.reduce((s, d) => s + (d.total_ttc ?? 0), 0), color: COLORS.green, pct: accepte.length / maxCount },
      { label: 'Facturé', count: facture.length, montant: facture.reduce((s, f) => s + (f.total_ttc ?? 0), 0), color: COLORS.orange, pct: facture.length / maxCount },
      { label: 'Encaissé', count: encaisse.length, montant: encaisse.reduce((s, f) => s + (f.montant_paye ?? 0), 0), color: COLORS.purple, pct: encaisse.length / maxCount },
    ]
  }, [factures, devis])

  // ─── Devis acceptés en attente ─────────────────────────────────────────────

  const factureeDevisIds = useMemo(() => new Set(factures.map(f => f.devis_id).filter(Boolean)), [factures])
  const devisAcceptesEnAttente = useMemo(
    () => devis.filter(d => d.statut === 'accepte' && !factureeDevisIds.has(d.id)),
    [devis, factureeDevisIds]
  )

  // ─── TVA recap ─────────────────────────────────────────────────────────────

  const tvaData = useMemo(() => {
    const filtered = quarterFilter === 0
      ? facturesActives
      : facturesActives.filter(f => quarterOfDate(f.date_emission) === quarterFilter)

    const map: Record<number, { taux: number; base_ht: number; tva: number; ttc: number }> = {}
    filtered.forEach(f => {
      const taux = f.tva_taux ?? 20
      if (!map[taux]) map[taux] = { taux, base_ht: 0, tva: 0, ttc: 0 }
      map[taux].base_ht += f.total_ht ?? 0
      map[taux].tva += f.total_tva ?? 0
      map[taux].ttc += f.total_ttc ?? 0
    })
    return Object.values(map).sort((a, b) => a.taux - b.taux)
  }, [facturesActives, quarterFilter])

  function exportTvaCSV() {
    const rows = [['Taux TVA', 'Base HT', 'TVA', 'Total TTC']]
    tvaData.forEach(r => rows.push([`${r.taux}%`, String(r.base_ht.toFixed(2)), String(r.tva.toFixed(2)), String(r.ttc.toFixed(2))]))
    const csv = rows.map(r => r.join(';')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'tva_recap.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  // ─── Styles ────────────────────────────────────────────────────────────────

  const thStyle: React.CSSProperties = {
    padding: '10px 16px', fontSize: 11, fontWeight: 600, letterSpacing: '0.06em',
    textTransform: 'uppercase', color: '#7A7870', fontFamily: 'var(--font-dm-sans), sans-serif',
    textAlign: 'left', borderBottom: '1px solid #1E1E1C',
  }
  const tdStyle: React.CSSProperties = {
    padding: '12px 16px', fontSize: 13, color: '#F0EDE6',
    fontFamily: 'var(--font-dm-sans), sans-serif', borderBottom: '1px solid #1E1E1C', verticalAlign: 'middle',
  }
  const cardStyle: React.CSSProperties = {
    backgroundColor: '#111110', border: '1px solid #1E1E1C', borderRadius: 12,
  }
  const sectionTitleStyle: React.CSSProperties = {
    fontFamily: 'var(--font-syne), sans-serif', fontSize: 16, fontWeight: 600, color: '#F0EDE6', margin: 0,
  }

  function Trend({ cur, prev }: { cur: number; prev: number }) {
    if (prev === 0) return null
    const pct = Math.round(((cur - prev) / prev) * 100)
    const up = pct >= 0
    return (
      <span style={{ fontSize: 11, fontWeight: 600, color: up ? COLORS.green : COLORS.red, marginLeft: 8 }}>
        {up ? '↑' : '↓'} {Math.abs(pct)}%
      </span>
    )
  }

  if (loading) {
    return (
      <div style={{ flex: 1, padding: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#8A8880', fontSize: 14, fontFamily: 'var(--font-dm-sans), sans-serif' }}>Chargement…</p>
      </div>
    )
  }

  return (
    <UpgradeGate requiredPlan="complet" feature="Analyse & statistiques">
    <div className="page-enter" style={{ flex: 1, padding: '40px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 32 }}>

      {/* Header */}
      <div>
        <h1 style={{ fontFamily: 'var(--font-syne), sans-serif', fontSize: 24, fontWeight: 700, color: '#F0EDE6', margin: 0 }}>
          Analyse
        </h1>
        <p style={{ color: '#8A8880', fontSize: 14, fontFamily: 'var(--font-dm-sans), sans-serif', margin: '6px 0 0' }}>
          Tableau de bord financier — analyse et projections
        </p>
      </div>

      {/* ── SECTION 1 — KPI CARDS ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 14 }}>
        {[
          {
            label: 'CA Facturé', value: fmtEur(caFacture), color: COLORS.orange,
            sub: 'total factures actives',
            trend: <Trend cur={caFactureCur} prev={caFacturePrev} />,
          },
          {
            label: 'CA Encaissé', value: fmtEur(caEncaisse), color: COLORS.green,
            sub: 'paiements reçus',
            trend: <Trend cur={caEncaisseCur} prev={caEncaissePrev} />,
          },
          {
            label: 'Devis acceptés', value: fmtEur(devisAcceptesTotal), color: COLORS.blue,
            sub: `${devisAcceptes.length} devis à facturer`,
            trend: null,
          },
          {
            label: 'Impayés', value: fmtEur(impayes), color: COLORS.red,
            sub: 'factures non soldées',
            trend: null,
          },
          {
            label: 'Taux conversion', value: `${tauxConversion}%`, color: COLORS.purple,
            sub: `${devisConvertis} / ${devisTotaux} devis`,
            trend: null,
          },
          {
            label: 'Délai paiement', value: `${delaiMoyen}j`, color: '#f59e0b',
            sub: 'délai moyen constaté',
            trend: null,
          },
        ].map(k => (
          <div key={k.label} style={{ ...cardStyle, borderTop: `2px solid ${k.color}`, padding: 20 }}>
            <p style={{ fontFamily: 'var(--font-syne), sans-serif', fontWeight: 600, fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#7A7870', margin: 0 }}>
              {k.label}
            </p>
            <div style={{ display: 'flex', alignItems: 'baseline', marginTop: 10, marginBottom: 4 }}>
              <p style={{ fontFamily: 'var(--font-syne), sans-serif', fontWeight: 800, fontSize: 20, color: k.color, letterSpacing: '-0.02em', lineHeight: 1, margin: 0 }}>
                {k.value}
              </p>
              {k.trend}
            </div>
            <p style={{ fontSize: 11, color: '#7A7870', fontFamily: 'var(--font-dm-sans), sans-serif', margin: 0 }}>
              {k.sub}
            </p>
          </div>
        ))}
      </div>

      {/* ── SECTION 2 — CHARTS ROW ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 16 }}>

        {/* Area chart */}
        <div style={{ ...cardStyle, padding: 28 }}>
          <h2 style={{ ...sectionTitleStyle, marginBottom: 24 }}>Évolution CA — 12 derniers mois</h2>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={areaChartData} margin={{ top: 4, right: 0, bottom: 0, left: -20 }}>
              <defs>
                <linearGradient id="gradFacture" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={COLORS.orange} stopOpacity={0.25} />
                  <stop offset="95%" stopColor={COLORS.orange} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradEncaisse" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={COLORS.green} stopOpacity={0.25} />
                  <stop offset="95%" stopColor={COLORS.green} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E1E1C" vertical={false} />
              <XAxis dataKey="label" tick={{ fill: '#8A8880', fontSize: 12, fontFamily: 'var(--font-dm-sans), sans-serif' }} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fill: '#8A8880', fontSize: 12, fontFamily: 'var(--font-dm-sans), sans-serif' }} axisLine={false} tickLine={false} tickFormatter={(v: number) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)} />
              <Tooltip
                contentStyle={{ backgroundColor: '#111110', border: '1px solid #1E1E1C', borderRadius: 6, fontFamily: 'var(--font-dm-sans), sans-serif', fontSize: 13, color: '#F0EDE6' }}
                cursor={{ stroke: '#1E1E1C' }}
                formatter={(v, name) => [fmtEur(typeof v === 'number' ? v : 0), name === 'facture' ? 'CA Facturé' : 'CA Encaissé'] as [string, string]}
              />
              <Legend formatter={(v) => v === 'facture' ? 'CA Facturé' : 'CA Encaissé'} wrapperStyle={{ fontSize: 12, fontFamily: 'var(--font-dm-sans), sans-serif', color: '#8A8880' }} />
              <Area type="monotone" dataKey="facture" stroke={COLORS.orange} strokeWidth={2} fill="url(#gradFacture)" dot={false} />
              <Area type="monotone" dataKey="encaisse" stroke={COLORS.green} strokeWidth={2} fill="url(#gradEncaisse)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Donut chart */}
        <div style={{ ...cardStyle, padding: 28 }}>
          <h2 style={{ ...sectionTitleStyle, marginBottom: 8 }}>Pipeline devis</h2>
          <p style={{ fontSize: 12, color: '#8A8880', fontFamily: 'var(--font-dm-sans), sans-serif', margin: '0 0 16px' }}>{devis.length} devis au total</p>
          {pieData.length === 0 ? (
            <div style={{ height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <p style={{ color: '#8A8880', fontSize: 13, fontFamily: 'var(--font-dm-sans), sans-serif' }}>Aucun devis</p>
            </div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={48} outerRadius={72} dataKey="value" paddingAngle={2}>
                    {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#111110', border: '1px solid #1E1E1C', borderRadius: 6, fontFamily: 'var(--font-dm-sans), sans-serif', fontSize: 13, color: '#F0EDE6' }}
                    formatter={(v) => [`${v} devis`, ''] as [string, string]}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
                {pieData.map((d) => (
                  <div key={d.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: d.color, flexShrink: 0 }} />
                      <span style={{ fontSize: 12, color: '#8A8880', fontFamily: 'var(--font-dm-sans), sans-serif' }}>{d.name}</span>
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#F0EDE6', fontFamily: 'var(--font-dm-sans), sans-serif' }}>{d.value}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── SECTION 3 — PROJECTIONS 2026 ── */}
      <div style={{ ...cardStyle, padding: 28 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <h2 style={sectionTitleStyle}>Projections {now.getFullYear()}</h2>
            <p style={{ fontSize: 12, color: '#8A8880', fontFamily: 'var(--font-dm-sans), sans-serif', margin: '4px 0 0' }}>
              {fmtEur(caAnnuelReel)} réalisé · {fmtEur(resteAFaire)} restant · {cadenceMensuelle > 0 ? `${fmtEur(cadenceMensuelle)}/mois nécessaire` : 'objectif atteint'}
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {editingObjectif ? (
              <>
                <span style={{ fontSize: 12, color: '#8A8880', fontFamily: 'var(--font-dm-sans), sans-serif' }}>Objectif €</span>
                <input
                  type="number"
                  value={objectifInput}
                  onChange={e => setObjectifInput(e.target.value)}
                  style={{ width: 100, padding: '6px 10px', backgroundColor: '#1A1A18', border: '1px solid #2E2E2C', borderRadius: 6, color: '#F0EDE6', fontSize: 13, fontFamily: 'var(--font-dm-sans), sans-serif', outline: 'none' }}
                />
                <button
                  onClick={() => {
                    const n = parseInt(objectifInput, 10)
                    if (!isNaN(n) && n > 0) { setObjectif(n); localStorage.setItem('foreman_objectif_2026', String(n)) }
                    setEditingObjectif(false)
                  }}
                  style={{ padding: '6px 14px', backgroundColor: COLORS.orange, color: '#fff', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-dm-sans), sans-serif' }}
                >
                  OK
                </button>
                <button
                  onClick={() => setEditingObjectif(false)}
                  style={{ padding: '6px 10px', backgroundColor: 'transparent', color: '#8A8880', border: '1px solid #2E2E2C', borderRadius: 6, fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font-dm-sans), sans-serif' }}
                >
                  ✕
                </button>
              </>
            ) : (
              <button
                onClick={() => setEditingObjectif(true)}
                style={{ padding: '6px 14px', backgroundColor: 'transparent', color: '#8A8880', border: '1px solid #2E2E2C', borderRadius: 6, fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font-dm-sans), sans-serif' }}
              >
                Objectif : {fmtEur(objectif)} ✏
              </button>
            )}
          </div>
        </div>

        {/* Progress bar */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 12, color: '#8A8880', fontFamily: 'var(--font-dm-sans), sans-serif' }}>Progression vers l'objectif</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: progressPct >= 100 ? COLORS.green : COLORS.orange, fontFamily: 'var(--font-syne), sans-serif' }}>{progressPct}%</span>
          </div>
          <div style={{ height: 8, backgroundColor: '#1E1E1C', borderRadius: 4, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${progressPct}%`, backgroundColor: progressPct >= 100 ? COLORS.green : COLORS.orange, borderRadius: 4, transition: 'width 0.6s ease' }} />
          </div>
        </div>

        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={projectionData} margin={{ top: 0, right: 0, bottom: 0, left: -20 }} barCategoryGap="30%">
            <CartesianGrid strokeDasharray="3 3" stroke="#1E1E1C" vertical={false} />
            <XAxis dataKey="label" tick={{ fill: '#8A8880', fontSize: 12, fontFamily: 'var(--font-dm-sans), sans-serif' }} axisLine={false} tickLine={false} />
            <YAxis allowDecimals={false} tick={{ fill: '#8A8880', fontSize: 12, fontFamily: 'var(--font-dm-sans), sans-serif' }} axisLine={false} tickLine={false} tickFormatter={(v: number) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)} />
            <Tooltip
              contentStyle={{ backgroundColor: '#111110', border: '1px solid #1E1E1C', borderRadius: 6, fontFamily: 'var(--font-dm-sans), sans-serif', fontSize: 13, color: '#F0EDE6' }}
              cursor={{ fill: 'rgba(249,115,22,0.04)' }}
              formatter={(v, name) => [fmtEur(typeof v === 'number' ? v : 0), name === 'caReel' ? 'CA réel' : 'Projection'] as [string, string]}
            />
            <Bar dataKey="caReel" fill={COLORS.orange} radius={[4, 4, 0, 0]} name="caReel" />
            <Bar dataKey="caProjecte" fill={COLORS.orange} fillOpacity={0.2} radius={[4, 4, 0, 0]} name="caProjecte" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* ── SECTION 4 — TOP CLIENTS + FACTURES EN RETARD ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

        {/* Top clients */}
        <div style={cardStyle}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid #1E1E1C' }}>
            <h2 style={sectionTitleStyle}>Top clients</h2>
            <p style={{ fontSize: 12, color: '#8A8880', fontFamily: 'var(--font-dm-sans), sans-serif', margin: '4px 0 0' }}>par CA facturé</p>
          </div>
          {topClients.length === 0 ? (
            <div style={{ padding: '32px 24px', textAlign: 'center' }}>
              <p style={{ color: '#8A8880', fontSize: 13, fontFamily: 'var(--font-dm-sans), sans-serif', margin: 0 }}>Aucune donnée</p>
            </div>
          ) : (
            <div style={{ padding: '8px 0' }}>
              {topClients.map((c, i) => {
                const pct = caFacture > 0 ? (c.total / caFacture) * 100 : 0
                return (
                  <div key={c.nom} style={{ padding: '12px 24px' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(249,115,22,0.04)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: '#4a4a48', fontFamily: 'var(--font-syne), sans-serif', width: 16 }}>#{i + 1}</span>
                        <span style={{ fontSize: 13, color: '#F0EDE6', fontFamily: 'var(--font-dm-sans), sans-serif' }}>{c.nom}</span>
                        <span style={{ fontSize: 11, color: '#7A7870', fontFamily: 'var(--font-dm-sans), sans-serif' }}>{c.count} facture{c.count !== 1 ? 's' : ''}</span>
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 700, color: COLORS.orange, fontFamily: 'var(--font-syne), sans-serif' }}>{fmtEur(c.total)}</span>
                    </div>
                    <div style={{ height: 3, backgroundColor: '#1E1E1C', borderRadius: 2, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, backgroundColor: COLORS.orange, borderRadius: 2 }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Factures en retard */}
        <div style={cardStyle}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid #1E1E1C', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h2 style={sectionTitleStyle}>Factures en retard</h2>
              <p style={{ fontSize: 12, color: '#8A8880', fontFamily: 'var(--font-dm-sans), sans-serif', margin: '4px 0 0' }}>
                {facturesEnRetard.length === 0 ? 'Aucune facture en retard' : `${facturesEnRetard.length} facture${facturesEnRetard.length !== 1 ? 's' : ''} échues`}
              </p>
            </div>
          </div>
          {facturesEnRetard.length === 0 ? (
            <div style={{ padding: '32px 24px', textAlign: 'center' }}>
              <p style={{ color: '#8A8880', fontSize: 13, fontFamily: 'var(--font-dm-sans), sans-serif', margin: 0 }}>Toutes les factures sont à jour ✓</p>
            </div>
          ) : (
            <div style={{ padding: '8px 0' }}>
              {facturesEnRetard.map(f => {
                const joursRetard = Math.round((now.getTime() - new Date(f.date_echeance!).getTime()) / 86400000)
                const restant = Math.max(0, (f.total_ttc ?? 0) - (f.montant_paye ?? 0))
                return (
                  <div key={f.id} style={{ padding: '10px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(232,84,71,0.04)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                        <span style={{ fontSize: 13, color: '#F0EDE6', fontFamily: 'var(--font-dm-sans), sans-serif' }}>{f.client_nom || 'Client'}</span>
                        <span style={{ fontSize: 10, padding: '2px 6px', backgroundColor: 'rgba(232,84,71,0.15)', color: COLORS.red, borderRadius: 4, fontWeight: 600, fontFamily: 'var(--font-dm-sans), sans-serif' }}>
                          +{joursRetard}j
                        </span>
                      </div>
                      <span style={{ fontSize: 11, color: '#7A7870', fontFamily: 'var(--font-dm-sans), sans-serif' }}>Échéance {fmtDate(f.date_echeance)}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: COLORS.red, fontFamily: 'var(--font-syne), sans-serif' }}>{fmtEur(restant)}</span>
                      <Link
                        href={`/dashboard/comptabilite/factures/${f.id}`}
                        style={{ fontSize: 11, color: '#8A8880', textDecoration: 'none', padding: '4px 8px', border: '1px solid #2E2E2C', borderRadius: 4, fontFamily: 'var(--font-dm-sans), sans-serif', whiteSpace: 'nowrap' }}
                      >
                        Relancer →
                      </Link>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── SECTION 5 — PIPELINE FUNNEL + DEVIS ACCEPTÉS ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: 16 }}>

        {/* Funnel */}
        <div style={{ ...cardStyle, padding: 28 }}>
          <h2 style={{ ...sectionTitleStyle, marginBottom: 4 }}>Pipeline commercial</h2>
          <p style={{ fontSize: 12, color: '#8A8880', fontFamily: 'var(--font-dm-sans), sans-serif', margin: '0 0 24px' }}>Progression des documents</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {pipeline.map((step) => (
              <div key={step.label}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: step.color, flexShrink: 0 }} />
                    <span style={{ fontSize: 12, color: '#F0EDE6', fontFamily: 'var(--font-dm-sans), sans-serif' }}>{step.label}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 11, color: '#7A7870', fontFamily: 'var(--font-dm-sans), sans-serif' }}>{step.count}</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: step.color, fontFamily: 'var(--font-syne), sans-serif' }}>{fmtEur(step.montant)}</span>
                  </div>
                </div>
                <div style={{ height: 6, backgroundColor: '#1A1A18', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${step.pct * 100}%`, backgroundColor: step.color, borderRadius: 3, opacity: 0.85 }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Devis acceptés en attente de facturation */}
        <div style={cardStyle}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid #1E1E1C' }}>
            <h2 style={sectionTitleStyle}>Devis acceptés — à facturer</h2>
            <p style={{ fontSize: 12, color: '#8A8880', fontFamily: 'var(--font-dm-sans), sans-serif', margin: '4px 0 0' }}>
              {devisAcceptesEnAttente.length === 0
                ? 'Aucun devis en attente de facturation'
                : `${devisAcceptesEnAttente.length} devis — ${fmtEur(devisAcceptesEnAttente.reduce((s, d) => s + (d.total_ttc ?? 0), 0))} à facturer`}
            </p>
          </div>
          {devisAcceptesEnAttente.length === 0 ? (
            <div style={{ padding: '48px 24px', textAlign: 'center' }}>
              <p style={{ color: '#8A8880', fontSize: 14, fontFamily: 'var(--font-dm-sans), sans-serif', margin: 0 }}>Tous les devis acceptés ont été convertis en factures.</p>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['Numéro', 'Client', 'Objet', 'Montant TTC', 'Accepté le', ''].map(h => (
                    <th key={h} style={thStyle}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {devisAcceptesEnAttente.map(d => (
                  <tr key={d.id}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(249,115,22,0.04)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={{ ...tdStyle, fontFamily: 'var(--font-syne), sans-serif', fontWeight: 600, fontSize: 12 }}>{d.numero}</td>
                    <td style={tdStyle}>{d.client_nom || '—'}</td>
                    <td style={{ ...tdStyle, color: '#8A8880', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.objet || '—'}</td>
                    <td style={{ ...tdStyle, fontWeight: 600, color: COLORS.green }}>{fmtEur(d.total_ttc ?? 0)}</td>
                    <td style={{ ...tdStyle, color: '#8A8880' }}>{fmtDate(d.accepte_at)}</td>
                    <td style={tdStyle}>
                      <Link
                        href={`/dashboard/comptabilite/factures/nouveau?from_devis=${d.id}`}
                        style={{ padding: '6px 14px', backgroundColor: 'rgba(249,115,22,0.1)', color: COLORS.orange, border: '1px solid rgba(249,115,22,0.25)', borderRadius: 6, fontSize: 12, fontWeight: 600, textDecoration: 'none', fontFamily: 'var(--font-dm-sans), sans-serif', whiteSpace: 'nowrap' }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(249,115,22,0.2)' }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(249,115,22,0.1)' }}
                      >
                        Convertir en facture →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ── SECTION 6 — RÉCAPITULATIF TVA ── */}
      <div style={cardStyle}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #1E1E1C', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h2 style={sectionTitleStyle}>Récapitulatif TVA</h2>
            <p style={{ fontSize: 12, color: '#8A8880', fontFamily: 'var(--font-dm-sans), sans-serif', margin: '4px 0 0' }}>Par taux appliqué sur les factures actives</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {/* Quarter filter */}
            <div style={{ display: 'flex', gap: 4 }}>
              {[{ label: 'Tout', value: 0 }, { label: 'T1', value: 1 }, { label: 'T2', value: 2 }, { label: 'T3', value: 3 }, { label: 'T4', value: 4 }].map(q => (
                <button
                  key={q.value}
                  onClick={() => setQuarterFilter(q.value)}
                  style={{
                    padding: '5px 12px', fontSize: 12, fontFamily: 'var(--font-dm-sans), sans-serif', cursor: 'pointer', borderRadius: 6,
                    backgroundColor: quarterFilter === q.value ? 'rgba(249,115,22,0.15)' : 'transparent',
                    color: quarterFilter === q.value ? COLORS.orange : '#8A8880',
                    border: `1px solid ${quarterFilter === q.value ? 'rgba(249,115,22,0.3)' : '#2E2E2C'}`,
                    fontWeight: quarterFilter === q.value ? 600 : 400,
                  }}
                >
                  {q.label}
                </button>
              ))}
            </div>
            <button
              onClick={exportTvaCSV}
              style={{ padding: '6px 14px', backgroundColor: 'transparent', color: '#8A8880', border: '1px solid #2E2E2C', borderRadius: 6, fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font-dm-sans), sans-serif', display: 'flex', alignItems: 'center', gap: 6 }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#F0EDE6'; (e.currentTarget as HTMLElement).style.borderColor = '#4a4a48' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#8A8880'; (e.currentTarget as HTMLElement).style.borderColor = '#2E2E2C' }}
            >
              ↓ Exporter CSV
            </button>
          </div>
        </div>

        {tvaData.length === 0 ? (
          <div style={{ padding: '48px 24px', textAlign: 'center' }}>
            <p style={{ color: '#8A8880', fontSize: 14, fontFamily: 'var(--font-dm-sans), sans-serif', margin: 0 }}>Aucune facture pour cette période.</p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Taux TVA', 'Base HT', 'TVA collectée', 'Total TTC', '% du CA'].map(h => (
                  <th key={h} style={thStyle}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tvaData.map(row => {
                const totalTTC = tvaData.reduce((s, r) => s + r.ttc, 0)
                const pct = totalTTC > 0 ? Math.round((row.ttc / totalTTC) * 100) : 0
                return (
                  <tr key={row.taux}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(249,115,22,0.04)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={{ ...tdStyle, fontFamily: 'var(--font-syne), sans-serif', fontWeight: 700 }}>
                      <span style={{ padding: '3px 8px', backgroundColor: 'rgba(249,115,22,0.12)', color: COLORS.orange, borderRadius: 4, fontSize: 12 }}>
                        {row.taux}%
                      </span>
                    </td>
                    <td style={tdStyle}>{fmtEur(row.base_ht)}</td>
                    <td style={{ ...tdStyle, color: COLORS.blue, fontWeight: 600 }}>{fmtEur(row.tva)}</td>
                    <td style={{ ...tdStyle, fontWeight: 600 }}>{fmtEur(row.ttc)}</td>
                    <td style={{ ...tdStyle, color: '#8A8880' }}>{pct}%</td>
                  </tr>
                )
              })}
              {/* Totals row */}
              <tr style={{ backgroundColor: '#161614' }}>
                <td style={{ ...tdStyle, fontWeight: 700, color: '#F0EDE6' }}>Total</td>
                <td style={{ ...tdStyle, fontWeight: 700 }}>{fmtEur(tvaData.reduce((s, r) => s + r.base_ht, 0))}</td>
                <td style={{ ...tdStyle, fontWeight: 700, color: COLORS.blue }}>{fmtEur(tvaData.reduce((s, r) => s + r.tva, 0))}</td>
                <td style={{ ...tdStyle, fontWeight: 700, color: COLORS.orange }}>{fmtEur(tvaData.reduce((s, r) => s + r.ttc, 0))}</td>
                <td style={{ ...tdStyle, color: '#8A8880' }}>100%</td>
              </tr>
            </tbody>
          </table>
        )}
      </div>

    </div>
    </UpgradeGate>
  )
}
