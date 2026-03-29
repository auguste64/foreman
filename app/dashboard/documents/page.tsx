'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Download, Mail, FileText, AlertCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from '@/components/Toast'
import { useIsMobile } from '@/lib/useIsMobile'
import { ComptabiliteContent } from '../comptabilite/page'
import type { Contrat } from '@/lib/supabase/contrats'
import type { CgvProfile } from '@/lib/pdf/cgv'
import { formatEurDoc } from '@/lib/supabase/documents'

// ─── Types ───────────────────────────────────────────────────────────────────

type DocSection = 'devis' | 'factures' | 'acomptes' | 'honoraires' | 'avoirs' | 'contrats' | 'cgv' | 'suivi'
type ComptabTab = 'devis' | 'factures' | 'acomptes' | 'honoraires' | 'avoirs'

const COMPTAB_SECTIONS: DocSection[] = ['devis', 'factures', 'acomptes', 'honoraires', 'avoirs']

const TAB_CONFIG: { id: DocSection; label: string }[] = [
  { id: 'devis',    label: 'Devis' },
  { id: 'factures', label: 'Factures' },
  { id: 'honoraires', label: 'Honoraires' },
  { id: 'acomptes', label: 'Acomptes' },
  { id: 'avoirs',   label: 'Avoirs' },
  { id: 'contrats', label: 'Contrats MOE' },
  { id: 'cgv',      label: 'CGV' },
  { id: 'suivi',    label: 'Suivi dossiers' },
]

// ─── Main page ───────────────────────────────────────────────────────────────

export default function DocumentsPage() {
  const [section, setSection] = useState<DocSection>('devis')
  const isMobile = useIsMobile()

  return (
    <div
      className="page-enter"
      style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}
    >
      {/* ── Tab bar ── */}
      <div style={{
        display: 'flex', borderBottom: '1px solid #1E1E1C',
        padding: '0 16px', background: '#0D0D0B', flexShrink: 0,
        overflowX: 'auto', msOverflowStyle: 'none',
      }}>
        {TAB_CONFIG.map(t => {
          const active = section === t.id
          return (
            <button
              key={t.id}
              onClick={() => setSection(t.id)}
              style={{
                padding: isMobile ? '12px 12px' : '14px 16px',
                fontSize: active ? 14 : 13,
                fontWeight: active ? 600 : 400,
                fontFamily: 'var(--font-dm-sans), sans-serif',
                background: 'transparent', border: 'none',
                borderBottom: active ? '2px solid #ea580c' : '2px solid transparent',
                color: active ? '#ea580c' : '#7A7870',
                cursor: 'pointer', marginBottom: -1,
                transition: 'all 0.15s', whiteSpace: 'nowrap', flexShrink: 0,
              }}
              onMouseEnter={e => { if (!active) e.currentTarget.style.color = '#F0EDE6' }}
              onMouseLeave={e => { if (!active) e.currentTarget.style.color = '#7A7870' }}
            >
              {t.label}
            </button>
          )
        })}
      </div>

      {/* ── Content ── */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex' }}>

        {/* Comptabilité tabs (shared instance, no remount) */}
        {COMPTAB_SECTIONS.includes(section) && (
          <ComptabiliteContent key="comptabilite" defaultTab={section as ComptabTab} />
        )}

        {/* Contrats MOE */}
        {section === 'contrats' && <ContratsSection />}

        {/* CGV */}
        {section === 'cgv' && <CgvSection />}

        {/* Suivi dossiers */}
        {section === 'suivi' && <SuiviSection />}
      </div>
    </div>
  )
}

// ─── Contrats MOE ─────────────────────────────────────────────────────────────

function fmtDate(d: string | null) {
  if (!d) return '—'
  const s = d.includes('T') ? d : d + 'T12:00:00'
  return new Date(s).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}

function fmtEur(n: number) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n)
}

function ContratsSection() {
  const isMobile = useIsMobile()
  const [contrats, setContrats] = useState<Contrat[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    const supabase = createClient()
    supabase.from('contrats').select('*').order('created_at', { ascending: false })
      .then(({ data }) => { setContrats(data ?? []); setLoading(false) })
  }, [])

  const filtered = search.trim()
    ? contrats.filter(c =>
        c.nom_client.toLowerCase().includes(search.toLowerCase()) ||
        c.nom_moe.toLowerCase().includes(search.toLowerCase()) ||
        c.adresse_chantier.toLowerCase().includes(search.toLowerCase())
      )
    : contrats

  return (
    <div style={{ flex: 1, padding: isMobile ? '16px' : '40px', overflowY: 'auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '8px' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-syne), sans-serif', fontSize: '24px', fontWeight: 700, color: '#F0EDE6', margin: 0 }}>
            Contrats MOE
          </h1>
          <p style={{ color: '#8A8880', fontSize: '14px', marginTop: '6px', fontFamily: 'var(--font-dm-sans), sans-serif' }}>
            {loading ? '…' : `${contrats.length} contrat${contrats.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        <Link
          href="/dashboard/contrats/nouveau"
          style={{ padding: '10px 20px', backgroundColor: '#ea580c', color: '#0D0D0B', borderRadius: '8px', fontSize: '14px', fontWeight: 600, textDecoration: 'none', fontFamily: 'var(--font-dm-sans), sans-serif', transition: 'all 0.2s ease' }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 0 24px rgba(249,115,22,0.5)' }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}
        >
          + Nouveau contrat
        </Link>
      </div>

      <div style={{ position: 'relative', marginBottom: '32px' }}>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
          <circle cx="7" cy="7" r="4.5" stroke="#8A8880" strokeWidth="1.5"/>
          <path d="M11 11l3 3" stroke="#8A8880" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
        <input
          type="text" value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Rechercher un contrat…"
          style={{ width: '100%', padding: '10px 14px 10px 38px', backgroundColor: '#111110', border: '1px solid #1E1E1C', borderRadius: '8px', color: '#F0EDE6', fontSize: '14px', outline: 'none', fontFamily: 'var(--font-dm-sans), sans-serif', boxSizing: 'border-box' }}
          onFocus={e => { e.target.style.borderColor = '#ea580c'; e.target.style.boxShadow = '0 0 0 2px rgba(234,88,12,0.12)' }}
          onBlur={e => { e.target.style.borderColor = '#1E1E1C'; e.target.style.boxShadow = 'none' }}
        />
      </div>

      {loading && <p style={{ color: '#8A8880', fontSize: '14px', fontFamily: 'var(--font-dm-sans), sans-serif' }}>Chargement…</p>}

      {!loading && contrats.length === 0 && (
        <div style={{ backgroundColor: '#111110', border: '1px dashed #1E1E1C', borderRadius: '12px', padding: '80px 24px', textAlign: 'center' }}>
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none" style={{ margin: '0 auto 20px', display: 'block' }}>
            <rect x="10" y="4" width="28" height="40" rx="2" stroke="#1E1E1C" strokeWidth="2"/>
            <path d="M18 16h12" stroke="#ea580c" strokeWidth="2" strokeLinecap="round"/>
            <path d="M18 24h12" stroke="#1E1E1C" strokeWidth="2" strokeLinecap="round"/>
            <path d="M18 32h8" stroke="#1E1E1C" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <h2 style={{ fontFamily: 'var(--font-syne), sans-serif', fontSize: '16px', fontWeight: 600, color: '#8A8880', marginBottom: '8px' }}>Aucun contrat</h2>
          <Link href="/dashboard/contrats/nouveau" style={{ display: 'inline-block', padding: '10px 20px', backgroundColor: '#ea580c', color: '#0D0D0B', borderRadius: '8px', fontSize: '14px', fontWeight: 600, textDecoration: 'none', fontFamily: 'var(--font-dm-sans), sans-serif' }}>
            + Créer mon premier contrat
          </Link>
        </div>
      )}

      {!loading && search.trim() && filtered.length === 0 && contrats.length > 0 && (
        <div style={{ backgroundColor: '#111110', border: '1px dashed #1E1E1C', borderRadius: '12px', padding: '60px 24px', textAlign: 'center' }}>
          <p style={{ color: '#8A8880', fontSize: '14px', fontFamily: 'var(--font-dm-sans), sans-serif', margin: 0 }}>
            Aucun contrat ne correspond à &quot;{search}&quot;.
          </p>
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)', gap: isMobile ? '12px' : '24px' }}>
          {filtered.map(c => (
            <Link
              key={c.id}
              href={`/dashboard/contrats/${c.id}`}
              style={{ textDecoration: 'none', display: 'block', transition: 'all 0.25s ease' }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)' }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)' }}
            >
              <div style={{ backgroundColor: '#111110', border: '1px solid #1E1E1C', borderRadius: '12px', padding: '28px', transition: 'border-color 0.25s ease' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = '#ea580c' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = '#1E1E1C' }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', marginBottom: '12px' }}>
                  <h3 style={{ fontFamily: 'var(--font-syne), sans-serif', fontSize: '16px', fontWeight: 700, color: '#F0EDE6', margin: 0, lineHeight: 1.3 }}>{c.nom_client}</h3>
                  <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 500, fontFamily: 'var(--font-dm-sans), sans-serif', backgroundColor: 'rgba(249,115,22,0.1)', color: '#ea580c', flexShrink: 0 }}>MOE</span>
                </div>
                <p style={{ fontSize: '13px', color: '#7A7870', fontFamily: 'var(--font-dm-sans), sans-serif', margin: '0 0 12px' }}>{c.adresse_chantier}</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <p style={{ fontSize: '13px', color: '#8A8880', fontFamily: 'var(--font-dm-sans), sans-serif', margin: 0 }}>{fmtDate(c.date_contrat)}</p>
                  <p style={{ fontSize: '14px', color: '#ea580c', fontFamily: 'var(--font-syne), sans-serif', fontWeight: 700, margin: 0 }}>{fmtEur(c.budget_estimatif)}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── CGV ──────────────────────────────────────────────────────────────────────

type CgvDocCard = { id: 'cgv'; title: string; description: string }

const CGV_DOCS: CgvDocCard[] = [
  { id: 'cgv', title: 'Conditions Générales de Prestation', description: "CGP pré-remplies avec les informations de votre société — Maîtrise d'œuvre" },
]

function CgvSection() {
  const [profile, setProfile] = useState<CgvProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState<string | null>(null)
  const [sending, setSending] = useState<string | null>(null)
  const [emailTo, setEmailTo] = useState('')
  const [showEmailInput, setShowEmailInput] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      if (data) {
        setProfile({
          societe: data.societe || data.entreprise || '',
          prenom: data.prenom, nom: data.nom,
          adresse: data.adresse, ville: data.ville, code_postal: data.code_postal,
          telephone: data.telephone, email: data.email || user.email,
          siret: data.siret, code_ape: data.code_ape,
          tva_intracom: data.tva_intracom,
          assurance_nom: data.assurance_nom, assurance_contrat: data.assurance_contrat,
        })
        setEmailTo(data.email || user.email || '')
      }
      setLoading(false)
    }
    load()
  }, [])

  async function handleDownload(docId: string) {
    if (!profile) return
    setDownloading(docId)
    try {
      const { pdf } = await import('@react-pdf/renderer')
      const { CgvDocument } = await import('@/lib/pdf/cgv')
      const element = <CgvDocument profile={profile} />
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const blob = await pdf(element as any).toBlob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `CGV_${(profile.societe || 'Document').replace(/\s+/g, '_')}.pdf`
      a.click()
      URL.revokeObjectURL(url)
      toast.success('PDF téléchargé')
    } catch (err) {
      console.error(err)
      toast.error('Erreur lors de la génération du PDF')
    } finally {
      setDownloading(null)
    }
  }

  async function handleSendEmail(docId: string) {
    if (!emailTo.trim()) return
    setSending(docId)
    try {
      const route = '/api/send-cgv'
      const res = await fetch(route, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: emailTo.trim() }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Erreur')
      toast.success(`Document envoyé à ${emailTo}`)
      setShowEmailInput(null)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erreur envoi email')
    } finally {
      setSending(null)
    }
  }

  const missingProfile = profile && !profile.societe

  return (
    <div style={{ flex: 1, padding: '40px', overflowY: 'auto', maxWidth: '720px' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontFamily: 'var(--font-syne), sans-serif', fontSize: '24px', fontWeight: 700, color: '#F0EDE6', margin: 0 }}>
          Documents contractuels
        </h1>
        <p style={{ color: '#8A8880', fontSize: '14px', marginTop: '6px', fontFamily: 'var(--font-dm-sans), sans-serif' }}>
          Générez et envoyez vos documents pré-remplis avec les infos de votre profil
        </p>
      </div>

      {loading ? (
        <p style={{ color: '#8A8880', fontSize: '14px', fontFamily: 'var(--font-dm-sans), sans-serif' }}>Chargement…</p>
      ) : (
        <>
          {missingProfile && (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', backgroundColor: 'rgba(234,88,12,0.08)', border: '1px solid rgba(234,88,12,0.2)', borderRadius: '10px', padding: '16px', marginBottom: '24px' }}>
              <AlertCircle size={16} color="#ea580c" style={{ flexShrink: 0, marginTop: '1px' }} />
              <p style={{ fontSize: '13px', color: '#F0EDE6', fontFamily: 'var(--font-dm-sans), sans-serif', margin: 0, lineHeight: 1.5 }}>
                Complétez le nom de votre société dans{' '}
                <a href="/dashboard/parametres" style={{ color: '#ea580c', textDecoration: 'underline' }}>Paramètres</a>{' '}
                pour générer des documents personnalisés.
              </p>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {CGV_DOCS.map(doc => (
              <div key={doc.id} style={{ backgroundColor: '#111110', border: '1px solid #1E1E1C', borderRadius: '12px', padding: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', marginBottom: '20px' }}>
                  <div style={{ width: '40px', height: '40px', backgroundColor: 'rgba(234,88,12,0.1)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <FileText size={18} color="#ea580c" />
                  </div>
                  <div>
                    <h3 style={{ fontFamily: 'var(--font-syne), sans-serif', fontSize: '15px', fontWeight: 600, color: '#F0EDE6', margin: '0 0 4px' }}>{doc.title}</h3>
                    <p style={{ fontFamily: 'var(--font-dm-sans), sans-serif', fontSize: '13px', color: '#8A8880', margin: 0, lineHeight: 1.5 }}>{doc.description}</p>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' as const }}>
                  <button
                    onClick={() => handleDownload(doc.id)}
                    disabled={downloading === doc.id || !profile}
                    style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '9px 18px', backgroundColor: '#ea580c', color: '#0D0D0B', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: downloading === doc.id || !profile ? 'not-allowed' : 'pointer', opacity: !profile ? 0.5 : 1, fontFamily: 'var(--font-dm-sans), sans-serif', transition: 'all 0.2s ease' }}
                    onMouseEnter={e => { if (!downloading && profile) { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 0 16px rgba(234,88,12,0.35)' } }}
                    onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}
                  >
                    <Download size={14} />
                    {downloading === doc.id ? 'Génération…' : 'Télécharger PDF'}
                  </button>

                  <button
                    onClick={() => setShowEmailInput(showEmailInput === doc.id ? null : doc.id)}
                    disabled={!profile}
                    style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '9px 18px', backgroundColor: 'transparent', color: '#F0EDE6', border: '1px solid #1E1E1C', borderRadius: '8px', fontSize: '13px', fontWeight: 500, cursor: !profile ? 'not-allowed' : 'pointer', opacity: !profile ? 0.5 : 1, fontFamily: 'var(--font-dm-sans), sans-serif', transition: 'all 0.2s ease' }}
                    onMouseEnter={e => { if (profile) { e.currentTarget.style.borderColor = '#ea580c'; e.currentTarget.style.color = '#ea580c' } }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = '#1E1E1C'; e.currentTarget.style.color = '#F0EDE6' }}
                  >
                    <Mail size={14} />
                    Envoyer par mail
                  </button>
                </div>

                {showEmailInput === doc.id && (
                  <div style={{ marginTop: '16px', display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' as const }}>
                    <input
                      type="email" value={emailTo} onChange={e => setEmailTo(e.target.value)}
                      placeholder="destinataire@exemple.fr"
                      style={{ flex: 1, minWidth: '200px', padding: '9px 14px', backgroundColor: '#0D0D0B', border: '1px solid #1E1E1C', borderRadius: '8px', color: '#F0EDE6', fontSize: '13px', outline: 'none', fontFamily: 'var(--font-dm-sans), sans-serif', boxSizing: 'border-box' as const }}
                      onFocus={e => { e.target.style.borderColor = '#ea580c'; e.target.style.boxShadow = '0 0 0 2px rgba(249,115,22,0.12)' }}
                      onBlur={e => { e.target.style.borderColor = '#1E1E1C'; e.target.style.boxShadow = 'none' }}
                    />
                    <button
                      onClick={() => handleSendEmail(doc.id)}
                      disabled={sending === doc.id || !emailTo.trim()}
                      style={{ padding: '9px 18px', backgroundColor: '#ea580c', color: '#0D0D0B', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: sending === doc.id || !emailTo.trim() ? 'not-allowed' : 'pointer', fontFamily: 'var(--font-dm-sans), sans-serif' }}
                    >
                      {sending === doc.id ? 'Envoi…' : 'Envoyer'}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

// ─── Suivi dossiers ───────────────────────────────────────────────────────────

type SuiviRow = {
  id: string
  nom: string
  adresse?: string
  devisCount: number
  devisTotal: number
  facturesCount: number
  facturesTotal: number
  honorairesCount: number
  honorairesTotal: number
  status: 'payé' | 'en_cours' | 'devis_envoyé' | 'vierge'
}

function suiviStatus(row: Omit<SuiviRow, 'status'>): SuiviRow['status'] {
  if (row.facturesCount > 0) return 'en_cours'
  if (row.devisCount > 0) return 'devis_envoyé'
  if (row.honorairesCount > 0) return 'devis_envoyé'
  return 'vierge'
}

const SUIVI_STATUS_MAP: Record<SuiviRow['status'], { label: string; bg: string; color: string }> = {
  'payé':         { label: 'Payé',          bg: 'rgba(74,222,128,0.15)',  color: '#4ade80' },
  'en_cours':     { label: 'En cours',      bg: 'rgba(249,115,22,0.15)',  color: '#ea580c' },
  'devis_envoyé': { label: 'Devis / Hono.', bg: 'rgba(96,165,250,0.15)',  color: '#60a5fa' },
  'vierge':       { label: 'Vierge',        bg: 'rgba(138,136,128,0.15)', color: '#8A8880' },
}

function SuiviSection() {
  const [rows, setRows] = useState<SuiviRow[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const [chantiersRes, devisRes, facturesRes, honorairesRes] = await Promise.all([
        supabase.from('chantiers').select('id, nom, adresse').eq('user_id', user.id).order('nom'),
        supabase.from('devis').select('id, chantier_id, total_ttc').eq('user_id', user.id),
        supabase.from('factures').select('id, chantier_id, total_ttc, statut').eq('user_id', user.id).neq('type', 'acompte'),
        supabase.from('devis_honoraires').select('id, total_ht').eq('user_id', user.id),
      ])

      const chantiers = (chantiersRes.data ?? []) as { id: string; nom: string; adresse?: string }[]
      const devisAll = devisRes.data ?? []
      const facturesAll = facturesRes.data ?? []
      const honorairesAll = honorairesRes.data ?? []

      const built: SuiviRow[] = chantiers.map(c => {
        const devisChantier = devisAll.filter((d: { chantier_id: string | null }) => d.chantier_id === c.id)
        const facturesChantier = facturesAll.filter((f: { chantier_id: string | null }) => f.chantier_id === c.id)
        const devisCount = devisChantier.length
        const devisTotal = devisChantier.reduce((s: number, d: { total_ttc: number | null }) => s + (d.total_ttc ?? 0), 0)
        const facturesCount = facturesChantier.length
        const facturesTotal = facturesChantier.reduce((s: number, f: { total_ttc: number | null }) => s + (f.total_ttc ?? 0), 0)
        // Honoraires have no chantier_id — show global count per row in the last row only
        const partial = { id: c.id, nom: c.nom, adresse: c.adresse, devisCount, devisTotal, facturesCount, facturesTotal, honorairesCount: 0, honorairesTotal: 0 }
        return { ...partial, status: suiviStatus(partial) }
      })

      // Add a "Sans chantier" row for docs not linked to any chantier
      const devisSans = devisAll.filter((d: { chantier_id: string | null }) => !d.chantier_id)
      const facturesSans = facturesAll.filter((f: { chantier_id: string | null }) => !f.chantier_id)
      if (devisSans.length > 0 || facturesSans.length > 0 || honorairesAll.length > 0) {
        const partial = {
          id: '__sans__', nom: 'Sans chantier', adresse: undefined,
          devisCount: devisSans.length,
          devisTotal: devisSans.reduce((s: number, d: { total_ttc: number | null }) => s + (d.total_ttc ?? 0), 0),
          facturesCount: facturesSans.length,
          facturesTotal: facturesSans.reduce((s: number, f: { total_ttc: number | null }) => s + (f.total_ttc ?? 0), 0),
          honorairesCount: honorairesAll.length,
          honorairesTotal: honorairesAll.reduce((s: number, h: { total_ht: number | null }) => s + (h.total_ht ?? 0), 0),
        }
        built.push({ ...partial, status: suiviStatus(partial) })
      }

      setRows(built)
      setLoading(false)
    }
    load()
  }, [])

  const filtered = search.trim()
    ? rows.filter(r => r.nom.toLowerCase().includes(search.toLowerCase()))
    : rows

  const thStyle: React.CSSProperties = {
    padding: '10px 16px', fontSize: 11, fontWeight: 600, letterSpacing: '0.06em',
    textTransform: 'uppercase', color: '#7A7870', fontFamily: 'var(--font-dm-sans), sans-serif',
    textAlign: 'left', borderBottom: '1px solid #1E1E1C',
  }
  const tdStyle: React.CSSProperties = {
    padding: '12px 16px', fontSize: 13, color: '#F0EDE6',
    fontFamily: 'var(--font-dm-sans), sans-serif', borderBottom: '1px solid #1E1E1C', verticalAlign: 'middle',
  }

  return (
    <div style={{ flex: 1, padding: '40px', overflowY: 'auto' }}>
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontFamily: 'var(--font-syne), sans-serif', fontSize: '24px', fontWeight: 700, color: '#F0EDE6', margin: 0 }}>
          Suivi dossiers
        </h1>
        <p style={{ color: '#8A8880', fontSize: '14px', marginTop: '6px', fontFamily: 'var(--font-dm-sans), sans-serif' }}>
          Vue récapitulative par chantier — devis, factures, honoraires
        </p>
      </div>

      <div style={{ position: 'relative', marginBottom: '24px' }}>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
          <circle cx="7" cy="7" r="4.5" stroke="#8A8880" strokeWidth="1.5"/>
          <path d="M11 11l3 3" stroke="#8A8880" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
        <input
          type="text" value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Filtrer par chantier…"
          style={{ width: '100%', maxWidth: '360px', padding: '10px 14px 10px 38px', backgroundColor: '#111110', border: '1px solid #1E1E1C', borderRadius: '8px', color: '#F0EDE6', fontSize: '14px', outline: 'none', fontFamily: 'var(--font-dm-sans), sans-serif', boxSizing: 'border-box' }}
          onFocus={e => { e.target.style.borderColor = '#ea580c'; e.target.style.boxShadow = '0 0 0 2px rgba(234,88,12,0.12)' }}
          onBlur={e => { e.target.style.borderColor = '#1E1E1C'; e.target.style.boxShadow = 'none' }}
        />
      </div>

      {loading ? (
        <p style={{ color: '#8A8880', fontSize: '14px', fontFamily: 'var(--font-dm-sans), sans-serif' }}>Chargement…</p>
      ) : rows.length === 0 ? (
        <div style={{ backgroundColor: '#111110', border: '1px dashed #1E1E1C', borderRadius: '12px', padding: '60px 24px', textAlign: 'center' }}>
          <p style={{ color: '#8A8880', fontSize: '14px', fontFamily: 'var(--font-dm-sans), sans-serif', margin: 0 }}>
            Aucun chantier trouvé. <Link href="/dashboard/chantiers" style={{ color: '#ea580c' }}>Créer un chantier</Link>
          </p>
        </div>
      ) : (
        <div style={{ backgroundColor: '#111110', border: '1px solid #1E1E1C', borderRadius: '12px', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '700px' }}>
            <thead>
              <tr>
                <th style={thStyle}>Chantier</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>Devis</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>Factures</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>Honoraires</th>
                <th style={thStyle}>Statut global</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(row => {
                const s = SUIVI_STATUS_MAP[row.status]
                return (
                  <tr key={row.id}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(249,115,22,0.03)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <td style={tdStyle}>
                      <div>
                        <span style={{ fontFamily: 'var(--font-syne), sans-serif', fontWeight: 600, fontSize: 13 }}>
                          {row.id !== '__sans__' ? (
                            <Link href={`/dashboard/chantiers/${row.id}`} style={{ color: '#F0EDE6', textDecoration: 'none' }}
                              onMouseEnter={e => { e.currentTarget.style.color = '#ea580c' }}
                              onMouseLeave={e => { e.currentTarget.style.color = '#F0EDE6' }}
                            >{row.nom}</Link>
                          ) : (
                            <span style={{ color: '#8A8880' }}>{row.nom}</span>
                          )}
                        </span>
                        {row.adresse && <p style={{ fontSize: 11, color: '#7A7870', margin: '2px 0 0', fontFamily: 'var(--font-dm-sans), sans-serif' }}>{row.adresse}</p>}
                      </div>
                    </td>
                    <td style={{ ...tdStyle, textAlign: 'right' }}>
                      {row.devisCount > 0 ? (
                        <div>
                          <span style={{ fontWeight: 600, color: '#ea580c' }}>{formatEurDoc(row.devisTotal)}</span>
                          <span style={{ display: 'block', fontSize: 11, color: '#7A7870' }}>{row.devisCount} devis</span>
                        </div>
                      ) : <span style={{ color: '#3A3A38' }}>—</span>}
                    </td>
                    <td style={{ ...tdStyle, textAlign: 'right' }}>
                      {row.facturesCount > 0 ? (
                        <div>
                          <span style={{ fontWeight: 600, color: '#4ade80' }}>{formatEurDoc(row.facturesTotal)}</span>
                          <span style={{ display: 'block', fontSize: 11, color: '#7A7870' }}>{row.facturesCount} facture{row.facturesCount > 1 ? 's' : ''}</span>
                        </div>
                      ) : <span style={{ color: '#3A3A38' }}>—</span>}
                    </td>
                    <td style={{ ...tdStyle, textAlign: 'right' }}>
                      {row.honorairesCount > 0 ? (
                        <div>
                          <span style={{ fontWeight: 600, color: '#60a5fa' }}>{formatEurDoc(row.honorairesTotal)}</span>
                          <span style={{ display: 'block', fontSize: 11, color: '#7A7870' }}>{row.honorairesCount} hono.</span>
                        </div>
                      ) : <span style={{ color: '#3A3A38' }}>—</span>}
                    </td>
                    <td style={tdStyle}>
                      <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, backgroundColor: s.bg, color: s.color, fontFamily: 'var(--font-dm-sans), sans-serif', whiteSpace: 'nowrap' }}>
                        {s.label}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
