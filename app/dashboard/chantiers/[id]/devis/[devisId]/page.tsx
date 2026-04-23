'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { getDevis, updateDevisStatut, deleteDevis, calcTotaux, type Devis, type LigneDevis } from '@/lib/supabase/devis'
import { toast } from '@/components/Toast'
import { usePlan } from '@/lib/usePlan'
import UpgradeGate from '@/components/UpgradeGate'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function formatMontant(val: any) {
  const n = parseFloat(val)
  return isNaN(n) ? '—' : n.toLocaleString('fr-FR', { minimumFractionDigits: 2 }) + ' €'
}

const STATUT_COLORS: Record<string, { bg: string; text: string }> = {
  brouillon: { bg: '#1E1E1C', text: '#8A8880' },
  envoye:    { bg: '#1a2035', text: '#60a5fa' },
  accepte:   { bg: '#1a2e1a', text: '#4ade80' },
  refuse:    { bg: '#2e1a1a', text: '#E85447' },
}

const STATUT_OPTIONS = [
  { value: 'brouillon', label: 'Brouillon' },
  { value: 'envoye',    label: 'Envoyé' },
  { value: 'accepte',   label: 'Accepté' },
  { value: 'refuse',    label: 'Refusé' },
]

export default function DevisDetailPage() {
  const params = useParams()
  const chantierId = params.id as string
  const devisId = params.devisId as string
  const router = useRouter()

  const [devis, setDevis] = useState<(Devis & { lignes: LigneDevis[] }) | null>(null)
  const [loading, setLoading] = useState(true)
  const [updatingStatut, setUpdatingStatut] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { isPro, loading: planLoading } = usePlan()

  useEffect(() => {
    getDevis(devisId)
      .then(d => { setDevis(d); setLoading(false) })
      .catch(err => { setError(err.message); setLoading(false) })
  }, [devisId])

  async function handleStatutChange(statut: string) {
    if (!devis) return
    setUpdatingStatut(true)
    try {
      await updateDevisStatut(devisId, statut)
      setDevis(p => p ? { ...p, statut: statut as Devis['statut'] } : p)
      toast.success('Statut mis à jour')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erreur')
    } finally {
      setUpdatingStatut(false)
    }
  }

  async function handleDelete() {
    setDeleting(true)
    try {
      await deleteDevis(devisId)
      toast.success('Devis supprimé')
      router.push(`/dashboard/chantiers/${chantierId}/devis`)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erreur')
      setDeleting(false)
      setConfirmDelete(false)
    }
  }

  if (loading) {
    return <div style={{ flex: 1, padding: '40px', color: '#8A8880', fontSize: '14px', fontFamily: 'var(--font-dm-sans), sans-serif' }}>Chargement…</div>
  }
  if (!devis) {
    return <div style={{ flex: 1, padding: '40px', color: '#E85447', fontSize: '14px', fontFamily: 'var(--font-dm-sans), sans-serif' }}>{error ?? 'Devis introuvable.'}</div>
  }

  if (planLoading) return null
  if (!isPro) return <UpgradeGate feature="Comptabilité" requiredPlan="pro" />

  const sc = STATUT_COLORS[devis.statut] ?? STATUT_COLORS.brouillon
  const totaux = calcTotaux(devis.lignes, devis.tva_pct)
  const statutLabel = STATUT_OPTIONS.find(o => o.value === devis.statut)?.label ?? devis.statut

  return (
    <div className="page-enter" style={{ flex: 1, padding: '40px', overflowY: 'auto', maxWidth: '800px' }}>
      <Link
        href={`/dashboard/chantiers/${chantierId}/devis`}
        style={{ display: 'inline-flex', alignItems: 'center', gap: 8, backgroundColor: '#111110', border: '1px solid #1E1E1C', borderRadius: 8, padding: '8px 14px', color: '#F0EDE6', fontSize: 13, fontWeight: 500, cursor: 'pointer', textDecoration: 'none', transition: 'all 0.15s ease', fontFamily: 'var(--font-dm-sans), sans-serif', marginBottom: 28 }}
        onMouseEnter={e => { e.currentTarget.style.background = '#1E1E1C'; e.currentTarget.style.borderColor = '#ea580c'; e.currentTarget.style.color = '#ea580c' }}
        onMouseLeave={e => { e.currentTarget.style.background = '#111110'; e.currentTarget.style.borderColor = '#1E1E1C'; e.currentTarget.style.color = '#F0EDE6' }}
      >
        <span style={{ color: '#ea580c' }}>←</span>
        Retour aux devis
      </Link>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', marginBottom: '32px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <span style={{ padding: '2px 8px', backgroundColor: 'rgba(249,115,22,0.08)', color: '#ea580c', borderRadius: '4px', fontSize: '11px', fontWeight: 600, fontFamily: 'var(--font-dm-sans), sans-serif' }}>
              {devis.numero}
            </span>
            <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 500, fontFamily: 'var(--font-dm-sans), sans-serif', backgroundColor: sc.bg, color: sc.text }}>
              {statutLabel}
            </span>
          </div>
          <h1 style={{ fontFamily: 'var(--font-syne), sans-serif', fontSize: '24px', fontWeight: 700, color: '#F0EDE6', margin: '0 0 4px' }}>
            {devis.client_nom || <span style={{ color: '#8A8880', fontStyle: 'italic' }}>Sans client</span>}
          </h1>
          <p style={{ fontSize: '13px', color: '#8A8880', fontFamily: 'var(--font-dm-sans), sans-serif', margin: 0 }}>
            Émis le {new Date(devis.date_emission).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
            {devis.date_validite && ` · Valide jusqu'au ${new Date(devis.date_validite).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}`}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexShrink: 0, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          <Link
            href={`/dashboard/chantiers/${chantierId}/factures/nouveau?devis_id=${devisId}`}
            style={{ padding: '8px 14px', backgroundColor: '#ea580c', color: '#0D0D0B', borderRadius: '8px', fontSize: '13px', fontWeight: 600, textDecoration: 'none', fontFamily: 'var(--font-dm-sans), sans-serif', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 0 20px rgba(249,115,22,0.4)' }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}
          >
            → Générer une facture
          </Link>
          <Link
            href={`/dashboard/chantiers/${chantierId}/devis/${devisId}/modifier`}
            style={{ padding: '8px 14px', backgroundColor: 'transparent', color: '#F0EDE6', border: '1px solid #1E1E1C', borderRadius: '8px', fontSize: '13px', fontWeight: 500, textDecoration: 'none', fontFamily: 'var(--font-dm-sans), sans-serif', display: 'inline-flex', alignItems: 'center' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#ea580c'; e.currentTarget.style.color = '#ea580c' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#1E1E1C'; e.currentTarget.style.color = '#F0EDE6' }}
          >
            Modifier
          </Link>
          <button
            onClick={() => setConfirmDelete(true)}
            style={{ padding: '8px 14px', backgroundColor: 'transparent', color: '#8A8880', border: '1px solid #1E1E1C', borderRadius: '8px', fontSize: '13px', cursor: 'pointer', fontFamily: 'var(--font-dm-sans), sans-serif' }}
            onMouseEnter={e => { e.currentTarget.style.color = '#E85447'; e.currentTarget.style.borderColor = '#E85447' }}
            onMouseLeave={e => { e.currentTarget.style.color = '#8A8880'; e.currentTarget.style.borderColor = '#1E1E1C' }}
          >
            Supprimer
          </button>
        </div>
      </div>

      {error && (
        <p style={{ fontSize: '13px', color: '#E85447', marginBottom: '16px', fontFamily: 'var(--font-dm-sans), sans-serif', background: 'rgba(232,84,71,0.08)', border: '1px solid rgba(232,84,71,0.2)', borderRadius: '6px', padding: '10px 14px' }}>
          {error}
        </p>
      )}

      {/* Statut selector */}
      <div style={{ backgroundColor: '#111110', border: '1px solid #1E1E1C', borderRadius: '12px', padding: '20px 24px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '13px', color: '#8A8880', fontFamily: 'var(--font-dm-sans), sans-serif', flexShrink: 0 }}>Changer le statut :</span>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {STATUT_OPTIONS.map(({ value, label }) => {
            const c = STATUT_COLORS[value]
            const active = devis.statut === value
            return (
              <button
                key={value}
                onClick={() => handleStatutChange(value)}
                disabled={updatingStatut || active}
                style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 500, fontFamily: 'var(--font-dm-sans), sans-serif', cursor: active ? 'default' : 'pointer', border: active ? 'none' : '1px solid #1E1E1C', backgroundColor: active ? c.bg : 'transparent', color: active ? c.text : '#8A8880', transition: 'all 0.15s' }}
                onMouseEnter={e => { if (!active) { e.currentTarget.style.backgroundColor = c.bg; e.currentTarget.style.color = c.text; e.currentTarget.style.borderColor = 'transparent' } }}
                onMouseLeave={e => { if (!active) { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#8A8880'; e.currentTarget.style.borderColor = '#1E1E1C' } }}
              >
                {label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Lignes */}
      <div style={{ backgroundColor: '#111110', border: '1px solid #1E1E1C', borderRadius: '12px', padding: '28px', marginBottom: '20px' }}>
        <h2 style={{ fontFamily: 'var(--font-syne), sans-serif', fontSize: '15px', fontWeight: 600, color: '#F0EDE6', margin: '0 0 20px' }}>Prestations</h2>

        {devis.lignes.length === 0 ? (
          <p style={{ color: '#8A8880', fontSize: '13px', fontFamily: 'var(--font-dm-sans), sans-serif', fontStyle: 'italic' }}>Aucune ligne.</p>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 70px 50px 100px 110px', gap: '8px', marginBottom: '8px', paddingBottom: '8px', borderBottom: '1px solid #1E1E1C' }}>
              {['Description', 'Qté', 'Unité', 'Prix unit. HT', 'Total HT'].map((h, i) => (
                <span key={i} style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#7A7870', fontFamily: 'var(--font-dm-sans), sans-serif' }}>{h}</span>
              ))}
            </div>
            {devis.lignes.map(l => (
              <div key={l.id} style={{ display: 'grid', gridTemplateColumns: '1fr 70px 50px 100px 110px', gap: '8px', padding: '10px 0', borderBottom: '1px solid #1E1E1C' }}>
                <span style={{ fontSize: '13px', color: '#F0EDE6', fontFamily: 'var(--font-dm-sans), sans-serif' }}>{l.description || '—'}</span>
                <span style={{ fontSize: '13px', color: '#F0EDE6', fontFamily: 'var(--font-dm-sans), sans-serif', textAlign: 'right' }}>{l.quantite}</span>
                <span style={{ fontSize: '13px', color: '#8A8880', fontFamily: 'var(--font-dm-sans), sans-serif' }}>{l.unite}</span>
                <span style={{ fontSize: '13px', color: '#F0EDE6', fontFamily: 'var(--font-dm-sans), sans-serif', textAlign: 'right' }}>{formatMontant(l.prix_unitaire)}</span>
                <span style={{ fontSize: '13px', color: '#ea580c', fontFamily: 'var(--font-dm-sans), sans-serif', textAlign: 'right', fontWeight: 500 }}>{formatMontant(l.quantite * l.prix_unitaire)}</span>
              </div>
            ))}

            <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
              <div style={{ display: 'flex', gap: '24px', fontSize: '13px', color: '#8A8880', fontFamily: 'var(--font-dm-sans), sans-serif' }}>
                <span>Total HT</span>
                <span style={{ color: '#F0EDE6', minWidth: '100px', textAlign: 'right' }}>{formatMontant(totaux.ht)}</span>
              </div>
              <div style={{ display: 'flex', gap: '24px', fontSize: '13px', color: '#8A8880', fontFamily: 'var(--font-dm-sans), sans-serif' }}>
                <span>TVA ({devis.tva_pct}%)</span>
                <span style={{ color: '#F0EDE6', minWidth: '100px', textAlign: 'right' }}>{formatMontant(totaux.tva)}</span>
              </div>
              <div style={{ display: 'flex', gap: '24px', fontSize: '16px', fontWeight: 700, fontFamily: 'var(--font-syne), sans-serif', marginTop: '4px', paddingTop: '8px', borderTop: '1px solid #1E1E1C' }}>
                <span style={{ color: '#F0EDE6' }}>Total TTC</span>
                <span style={{ color: '#ea580c', minWidth: '100px', textAlign: 'right' }}>{formatMontant(totaux.ttc)}</span>
              </div>
            </div>
          </>
        )}
      </div>

      {devis.notes && (
        <div style={{ backgroundColor: '#111110', border: '1px solid #1E1E1C', borderRadius: '12px', padding: '20px 24px', marginBottom: '20px' }}>
          <h2 style={{ fontFamily: 'var(--font-syne), sans-serif', fontSize: '14px', fontWeight: 600, color: '#8A8880', margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Notes</h2>
          <p style={{ fontSize: '13px', color: '#F0EDE6', fontFamily: 'var(--font-dm-sans), sans-serif', margin: 0, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{devis.notes}</p>
        </div>
      )}

      {/* Delete modal */}
      {confirmDelete && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }} onClick={() => setConfirmDelete(false)}>
          <div style={{ backgroundColor: '#111110', border: '1px solid #1E1E1C', borderRadius: '12px', padding: '32px', maxWidth: '400px', width: '100%', margin: '0 24px' }} onClick={e => e.stopPropagation()}>
            <h2 style={{ fontFamily: 'var(--font-syne), sans-serif', fontSize: '18px', fontWeight: 600, color: '#F0EDE6', marginBottom: '12px' }}>Supprimer ce devis ?</h2>
            <p style={{ color: '#8A8880', fontSize: '14px', fontFamily: 'var(--font-dm-sans), sans-serif', marginBottom: '28px' }}>Cette action est irréversible.</p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={handleDelete} disabled={deleting} style={{ flex: 1, padding: '10px', backgroundColor: '#E85447', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: deleting ? 'not-allowed' : 'pointer', fontFamily: 'var(--font-dm-sans), sans-serif' }}>
                {deleting ? 'Suppression...' : 'Supprimer'}
              </button>
              <button onClick={() => setConfirmDelete(false)} style={{ flex: 1, padding: '10px', backgroundColor: 'transparent', color: '#8A8880', border: '1px solid #1E1E1C', borderRadius: '8px', fontSize: '13px', cursor: 'pointer', fontFamily: 'var(--font-dm-sans), sans-serif' }}>
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
