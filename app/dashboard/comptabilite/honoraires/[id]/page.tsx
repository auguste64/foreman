'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { formatEurDoc } from '@/lib/supabase/documents'
import { toast } from '@/components/Toast'

// ── Types ──────────────────────────────────────────────────────────────────────
type Phase = {
  nom: string
  description_points: string[]
  condition_reglement: string
  montant_ht: number
}

type DevisHonoraire = {
  id: string
  user_id: string
  numero: string
  statut: string
  client_nom: string
  client_adresse: string
  date_devis: string | null
  description_mission: string
  budget_travaux: number | null
  phases: Phase[]
  tva_taux: number
  total_ht: number
  clauses_speciales: string
  created_at: string
}

type EntrepriseInfo = {
  raison_sociale: string
  adresse: string
  code_postal: string
  ville: string
  telephone: string
  email: string
  logo_url: string
}

const STATUT_OPTIONS = ['Brouillon', 'Envoyé', 'Accepté', 'Refusé']

const STATUT_STYLE: Record<string, { bg: string; color: string }> = {
  Brouillon: { bg: 'rgba(138,136,128,0.15)', color: '#8A8880' },
  'Envoyé':  { bg: 'rgba(96,165,250,0.15)',  color: '#60a5fa' },
  'Accepté': { bg: 'rgba(74,222,128,0.15)',  color: '#4ade80' },
  'Refusé':  { bg: 'rgba(232,84,71,0.15)',   color: '#E85447' },
}

// ── Component ──────────────────────────────────────────────────────────────────
export default function DevisHonorairesDetailPage() {
  const params = useParams()
  const id = params.id as string

  const [doc, setDoc] = useState<DevisHonoraire | null>(null)
  const [entreprise, setEntreprise] = useState<EntrepriseInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [statut, setStatut] = useState('')
  const [updatingStatut, setUpdatingStatut] = useState(false)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const [docRes, eiRes] = await Promise.all([
        supabase.from('devis_honoraires').select('*').eq('id', id).eq('user_id', user.id).single(),
        supabase.from('entreprise_infos').select('raison_sociale, adresse, code_postal, ville, telephone, email, logo_url').eq('user_id', user.id).maybeSingle(),
      ])

      if (docRes.data) {
        const d = docRes.data as DevisHonoraire
        setDoc(d)
        setStatut(d.statut)
      }
      if (eiRes.data) setEntreprise(eiRes.data as EntrepriseInfo)
      setLoading(false)
    }
    load()
  }, [id])

  async function handleStatutChange(newStatut: string) {
    setUpdatingStatut(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.from('devis_honoraires').update({ statut: newStatut }).eq('id', id)
      if (error) throw error
      setStatut(newStatut)
      toast.success('Statut mis à jour')
    } catch {
      toast.error('Erreur lors de la mise à jour')
    } finally {
      setUpdatingStatut(false)
    }
  }

  if (loading) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#8A8880', fontFamily: 'var(--font-dm-sans), sans-serif', fontSize: 14 }}>Chargement…</p>
      </div>
    )
  }

  if (!doc) {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
        <p style={{ color: '#8A8880', fontFamily: 'var(--font-dm-sans), sans-serif', fontSize: 14 }}>Devis introuvable.</p>
        <Link href="/dashboard/documents" style={{ color: '#ea580c', textDecoration: 'none', fontFamily: 'var(--font-dm-sans), sans-serif', fontSize: 13 }}>← Retour</Link>
      </div>
    )
  }

  const totalTVA = doc.total_ht * doc.tva_taux / 100
  const totalTTC = doc.total_ht + totalTVA
  const ss = STATUT_STYLE[statut] ?? STATUT_STYLE['Brouillon']

  const fmtDate = (iso: string | null) => {
    if (!iso) return '—'
    return new Date(iso + 'T12:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
  }

  return (
    <div className="page-enter" style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

      {/* ── Left: controls ── */}
      <div style={{ flex: '0 0 280px', minWidth: 280, overflowY: 'auto', padding: '40px 24px', borderRight: '1px solid #1E1E1C', display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div>
          <Link href="/dashboard/documents" style={{ fontSize: 12, color: '#8A8880', textDecoration: 'none', fontFamily: 'var(--font-dm-sans), sans-serif' }}>
            ← Retour
          </Link>
          <h1 style={{ fontFamily: 'var(--font-syne), sans-serif', fontSize: 18, fontWeight: 700, color: '#F0EDE6', margin: '14px 0 4px' }}>
            {doc.numero}
          </h1>
          <p style={{ color: '#8A8880', fontSize: 13, margin: 0, fontFamily: 'var(--font-dm-sans), sans-serif' }}>
            {doc.client_nom || '—'}
          </p>
        </div>

        {/* Status */}
        <div style={{ backgroundColor: '#111110', border: '1px solid #1E1E1C', borderRadius: 10, padding: 16 }}>
          <p style={{ fontSize: 10, fontWeight: 600, color: '#7A7870', fontFamily: 'var(--font-dm-sans), sans-serif', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 10px' }}>Statut</p>
          <div style={{ padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600, backgroundColor: ss.bg, color: ss.color, fontFamily: 'var(--font-dm-sans), sans-serif', display: 'inline-block', marginBottom: 12 }}>
            {statut}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {STATUT_OPTIONS.map(s => (
              <button
                key={s}
                onClick={() => handleStatutChange(s)}
                disabled={updatingStatut || s === statut}
                style={{
                  padding: '8px 12px', backgroundColor: s === statut ? 'rgba(249,115,22,0.1)' : 'transparent',
                  border: `1px solid ${s === statut ? 'rgba(249,115,22,0.3)' : '#1E1E1C'}`,
                  borderRadius: 7, color: s === statut ? '#ea580c' : '#8A8880', fontSize: 12, fontWeight: 600,
                  cursor: s === statut ? 'default' : 'pointer', fontFamily: 'var(--font-dm-sans), sans-serif',
                  textAlign: 'left' as const,
                }}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Info */}
        <div style={{ backgroundColor: '#111110', border: '1px solid #1E1E1C', borderRadius: 10, padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[
            { label: 'Date', value: fmtDate(doc.date_devis) },
            { label: 'Total HT', value: formatEurDoc(doc.total_ht) },
            { label: `TVA (${doc.tva_taux}%)`, value: formatEurDoc(totalTVA) },
            { label: 'Total TTC', value: formatEurDoc(totalTTC) },
          ].map(({ label, value }) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 11, color: '#7A7870', fontFamily: 'var(--font-dm-sans), sans-serif' }}>{label}</span>
              <span style={{ fontSize: 13, color: '#F0EDE6', fontFamily: 'var(--font-dm-sans), sans-serif', fontWeight: 600 }}>{value}</span>
            </div>
          ))}
        </div>

        {doc.budget_travaux && (
          <div style={{ backgroundColor: '#111110', border: '1px solid #1E1E1C', borderRadius: 10, padding: 16 }}>
            <p style={{ fontSize: 10, fontWeight: 600, color: '#7A7870', fontFamily: 'var(--font-dm-sans), sans-serif', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 6px' }}>Budget travaux</p>
            <p style={{ fontSize: 13, color: '#F0EDE6', fontFamily: 'var(--font-dm-sans), sans-serif', margin: 0, fontWeight: 600 }}>{formatEurDoc(doc.budget_travaux)} HT</p>
          </div>
        )}
      </div>

      {/* ── Right: PDF preview ── */}
      <div style={{ flex: 1, overflowY: 'auto', backgroundColor: '#1A1917', padding: '32px 24px' }}>
        <p style={{ fontSize: 10, fontWeight: 600, color: '#7A7870', fontFamily: 'var(--font-dm-sans), sans-serif', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 16 }}>
          Aperçu document
        </p>

        {/* Paper */}
        <div style={{ backgroundColor: '#fff', borderRadius: 4, boxShadow: '0 8px 32px rgba(0,0,0,0.5)', padding: '28px 28px 36px', color: '#1a1a1a', lineHeight: 1.5, maxWidth: 680 }}>

          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, paddingBottom: 14, borderBottom: '2px solid #ea580c' }}>
            <div>
              {entreprise?.logo_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={entreprise.logo_url} alt="logo" style={{ height: 36, marginBottom: 6, display: 'block' }} />
              )}
              <div style={{ fontFamily: 'var(--font-syne), sans-serif', fontWeight: 700, fontSize: 13, color: '#111' }}>
                {entreprise?.raison_sociale || 'Cabinet d\'Architecture'}
              </div>
              <div style={{ fontSize: 9, color: '#777', fontFamily: 'var(--font-dm-sans), sans-serif' }}>Architecture</div>
            </div>
            <div style={{ textAlign: 'right', fontSize: 8, color: '#666', fontFamily: 'var(--font-dm-sans), sans-serif' }}>
              {entreprise && (
                <>
                  <div>{entreprise.adresse}</div>
                  <div>{entreprise.code_postal} {entreprise.ville}</div>
                  {entreprise.telephone && <div>{entreprise.telephone}</div>}
                  {entreprise.email && <div>{entreprise.email}</div>}
                </>
              )}
            </div>
          </div>

          {/* Date + title | Client */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
            <div style={{ flex: 1, paddingRight: 20 }}>
              <div style={{ fontSize: 8, color: '#888', fontFamily: 'var(--font-dm-sans), sans-serif', marginBottom: 4 }}>
                {fmtDate(doc.date_devis)}
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, fontFamily: 'var(--font-syne), sans-serif', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#111', marginBottom: 2 }}>
                Devis d&apos;honoraires
              </div>
              <div style={{ fontSize: 9, color: '#ea580c', fontWeight: 600, fontFamily: 'var(--font-dm-sans), sans-serif', marginBottom: 8 }}>
                {doc.numero}
              </div>
              {doc.description_mission && (
                <div style={{ fontSize: 8.5, color: '#444', fontFamily: 'var(--font-dm-sans), sans-serif', maxWidth: 200, lineHeight: 1.4 }}>
                  {doc.description_mission}
                </div>
              )}
            </div>
            <div style={{ textAlign: 'right', minWidth: 140 }}>
              <div style={{ fontFamily: 'var(--font-syne), sans-serif', fontWeight: 700, fontSize: 11, color: '#111', marginBottom: 2 }}>
                {doc.client_nom || '—'}
              </div>
              <div style={{ fontSize: 8.5, color: '#555', fontFamily: 'var(--font-dm-sans), sans-serif', whiteSpace: 'pre-wrap', lineHeight: 1.4 }}>
                {doc.client_adresse}
              </div>
            </div>
          </div>

          {/* Phases */}
          {doc.phases.map((phase, idx) => (
            <div key={idx} style={{ marginBottom: 16, paddingBottom: 14, borderBottom: '1px solid #e8e8e8' }}>
              <div style={{ fontFamily: 'var(--font-syne), sans-serif', fontSize: 10, fontWeight: 700, color: '#ea580c', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 7 }}>
                Phase {idx + 1}{phase.nom ? ` — ${phase.nom}` : ''}
              </div>
              {phase.description_points.map((pt, i) => pt && (
                <div key={i} style={{ fontSize: 8.5, color: '#333', marginBottom: 3, paddingLeft: 10, fontFamily: 'var(--font-dm-sans), sans-serif' }}>
                  — {pt}
                </div>
              ))}
              {phase.condition_reglement && (
                <div style={{ fontSize: 8, color: '#555', marginTop: 6, textDecoration: 'underline', fontStyle: 'italic', fontFamily: 'var(--font-dm-sans), sans-serif' }}>
                  {phase.condition_reglement}
                </div>
              )}
              {phase.montant_ht > 0 && (
                <div style={{ textAlign: 'right', fontWeight: 700, fontSize: 10, color: '#111', marginTop: 5, fontFamily: 'var(--font-syne), sans-serif' }}>
                  {formatEurDoc(phase.montant_ht)} HT
                </div>
              )}
            </div>
          ))}

          {/* Summary */}
          <div style={{ marginTop: 18 }}>
            {doc.phases.filter(p => p.montant_ht > 0).map((phase, idx) => (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 8.5, marginBottom: 3, fontFamily: 'var(--font-dm-sans), sans-serif' }}>
                <span style={{ color: '#555' }}>Phase {doc.phases.indexOf(phase) + 1}{phase.nom ? ` — ${phase.nom}` : ''}</span>
                <span>{formatEurDoc(phase.montant_ht)}</span>
              </div>
            ))}
            <div style={{ borderTop: '1px solid #ccc', marginTop: 8, paddingTop: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, marginBottom: 3, fontFamily: 'var(--font-dm-sans), sans-serif' }}>
                <span style={{ color: '#555' }}>Total HT</span>
                <span style={{ fontWeight: 600 }}>{formatEurDoc(doc.total_ht)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, marginBottom: 3, fontFamily: 'var(--font-dm-sans), sans-serif' }}>
                <span style={{ color: '#555' }}>TVA ({doc.tva_taux}%)</span>
                <span>{formatEurDoc(totalTVA)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: 700, borderTop: '1.5px solid #111', paddingTop: 6, marginTop: 5, fontFamily: 'var(--font-syne), sans-serif' }}>
                <span>Total TTC</span>
                <span style={{ color: '#ea580c' }}>{formatEurDoc(totalTTC)}</span>
              </div>
            </div>
          </div>

          {/* Clauses */}
          {doc.clauses_speciales && (
            <div style={{ marginTop: 18, paddingTop: 12, borderTop: '1px solid #e8e8e8' }}>
              <div style={{ fontSize: 8.5, color: '#555', fontFamily: 'var(--font-dm-sans), sans-serif', lineHeight: 1.5 }}>
                {doc.clauses_speciales}
              </div>
            </div>
          )}

          {/* Footer */}
          {entreprise && (
            <div style={{ marginTop: 30, paddingTop: 10, borderTop: '1px solid #ddd', fontSize: 7.5, color: '#999', textAlign: 'center', fontFamily: 'var(--font-dm-sans), sans-serif', lineHeight: 1.6 }}>
              {entreprise.raison_sociale}
              {entreprise.adresse && ` — ${entreprise.adresse} ${entreprise.code_postal} ${entreprise.ville}`}
              {entreprise.telephone && ` — ${entreprise.telephone}`}
              {entreprise.email && ` — ${entreprise.email}`}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
