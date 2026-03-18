'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { getFacture, updateFactureStatut, deleteFacture, type Facture, type LigneFacture } from '@/lib/supabase/factures'
import { calcTotaux } from '@/lib/supabase/devis'
import { useToast } from '@/components/ToastProvider'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function formatMontant(val: any) {
  const n = parseFloat(val)
  return isNaN(n) ? '—' : n.toLocaleString('fr-FR', { minimumFractionDigits: 2 }) + ' €'
}

const STATUT_COLORS: Record<string, { bg: string; text: string }> = {
  'En attente': { bg: '#2e2a1a', text: '#fbbf24' },
  'Payée':      { bg: '#1a2e1a', text: '#4ade80' },
  'Annulée':    { bg: '#2e1a1a', text: '#E85447' },
}

const STATUTS = ['En attente', 'Payée', 'Annulée']

export default function FactureDetailPage() {
  const params = useParams()
  const chantierId = params.id as string
  const factureId = params.factureId as string
  const router = useRouter()
  const { showToast } = useToast()

  const [facture, setFacture] = useState<(Facture & { lignes: LigneFacture[] }) | null>(null)
  const [loading, setLoading] = useState(true)
  const [updatingStatut, setUpdatingStatut] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getFacture(factureId)
      .then(f => { setFacture(f); setLoading(false) })
      .catch(err => { setError(err.message); setLoading(false) })
  }, [factureId])

  async function handleStatutChange(statut: string) {
    if (!facture) return
    setUpdatingStatut(true)
    try {
      await updateFactureStatut(factureId, statut)
      setFacture(p => p ? { ...p, statut: statut as Facture['statut'] } : p)
      showToast('Statut mis à jour')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erreur')
    } finally {
      setUpdatingStatut(false)
    }
  }

  async function handleDelete() {
    setDeleting(true)
    try {
      await deleteFacture(factureId)
      showToast('Facture supprimée')
      router.push(`/dashboard/chantiers/${chantierId}/factures`)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erreur')
      setDeleting(false)
      setConfirmDelete(false)
    }
  }

  if (loading) {
    return <div style={{ flex: 1, padding: '40px', color: '#8A8880', fontSize: '14px', fontFamily: 'var(--font-dm-sans), sans-serif' }}>Chargement…</div>
  }

  if (!facture) {
    return <div style={{ flex: 1, padding: '40px', color: '#E85447', fontSize: '14px', fontFamily: 'var(--font-dm-sans), sans-serif' }}>{error ?? 'Facture introuvable.'}</div>
  }

  const sc = STATUT_COLORS[facture.statut] ?? STATUT_COLORS['En attente']
  const totaux = calcTotaux(facture.lignes, facture.tva_pct)

  return (
    <div className="page-enter" style={{ flex: 1, padding: '40px', overflowY: 'auto', maxWidth: '800px' }}>
      <Link
        href={`/dashboard/chantiers/${chantierId}/factures`}
        style={{ display: 'inline-flex', alignItems: 'center', gap: 8, backgroundColor: '#111110', border: '1px solid #1E1E1C', borderRadius: 8, padding: '8px 14px', color: '#F0EDE6', fontSize: 13, fontWeight: 500, cursor: 'pointer', textDecoration: 'none', transition: 'all 0.15s ease', fontFamily: 'var(--font-dm-sans), sans-serif', marginBottom: 28 }}
        onMouseEnter={e => { e.currentTarget.style.background = '#1E1E1C'; e.currentTarget.style.borderColor = '#F97316'; e.currentTarget.style.color = '#F97316' }}
        onMouseLeave={e => { e.currentTarget.style.background = '#111110'; e.currentTarget.style.borderColor = '#1E1E1C'; e.currentTarget.style.color = '#F0EDE6' }}
      >
        <span style={{ color: '#F97316' }}>←</span>
        Retour aux factures
      </Link>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', marginBottom: '32px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
            <span style={{ padding: '2px 8px', backgroundColor: 'rgba(249,115,22,0.08)', color: '#F97316', borderRadius: '4px', fontSize: '11px', fontWeight: 600, fontFamily: 'var(--font-dm-sans), sans-serif' }}>
              {facture.numero}
            </span>
            <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 500, fontFamily: 'var(--font-dm-sans), sans-serif', backgroundColor: sc.bg, color: sc.text }}>
              {facture.statut}
            </span>
          </div>
          <h1 style={{ fontFamily: 'var(--font-syne), sans-serif', fontSize: '24px', fontWeight: 700, color: '#F0EDE6', margin: '0 0 4px' }}>
            {facture.titre || '—'}
          </h1>
          <p style={{ fontSize: '13px', color: '#8A8880', fontFamily: 'var(--font-dm-sans), sans-serif', margin: 0 }}>
            Émise le {new Date(facture.date_emission).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
            {facture.date_echeance && ` · Échéance : ${new Date(facture.date_echeance).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}`}
          </p>
        </div>
        <button
          onClick={() => setConfirmDelete(true)}
          style={{ padding: '8px 14px', backgroundColor: 'transparent', color: '#8A8880', border: '1px solid #1E1E1C', borderRadius: '8px', fontSize: '13px', cursor: 'pointer', fontFamily: 'var(--font-dm-sans), sans-serif', flexShrink: 0 }}
          onMouseEnter={e => { e.currentTarget.style.color = '#E85447'; e.currentTarget.style.borderColor = '#E85447' }}
          onMouseLeave={e => { e.currentTarget.style.color = '#8A8880'; e.currentTarget.style.borderColor = '#1E1E1C' }}
        >
          Supprimer
        </button>
      </div>

      {error && (
        <p style={{ fontSize: '13px', color: '#E85447', marginBottom: '16px', fontFamily: 'var(--font-dm-sans), sans-serif', background: 'rgba(232,84,71,0.08)', border: '1px solid rgba(232,84,71,0.2)', borderRadius: '6px', padding: '10px 14px' }}>
          {error}
        </p>
      )}

      {/* Statut selector */}
      <div style={{ backgroundColor: '#111110', border: '1px solid #1E1E1C', borderRadius: '12px', padding: '20px 24px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
        <span style={{ fontSize: '13px', color: '#8A8880', fontFamily: 'var(--font-dm-sans), sans-serif', flexShrink: 0 }}>Changer le statut :</span>
        <div style={{ display: 'flex', gap: '8px' }}>
          {STATUTS.map(s => {
            const c = STATUT_COLORS[s]
            const active = facture.statut === s
            return (
              <button
                key={s}
                onClick={() => handleStatutChange(s)}
                disabled={updatingStatut || active}
                style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 500, fontFamily: 'var(--font-dm-sans), sans-serif', cursor: active ? 'default' : 'pointer', border: active ? 'none' : '1px solid #1E1E1C', backgroundColor: active ? c.bg : 'transparent', color: active ? c.text : '#8A8880', transition: 'all 0.15s' }}
                onMouseEnter={e => { if (!active) { e.currentTarget.style.backgroundColor = c.bg; e.currentTarget.style.color = c.text; e.currentTarget.style.borderColor = 'transparent' } }}
                onMouseLeave={e => { if (!active) { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#8A8880'; e.currentTarget.style.borderColor = '#1E1E1C' } }}
              >
                {s}
              </button>
            )
          })}
        </div>
      </div>

      {/* Lignes */}
      <div style={{ backgroundColor: '#111110', border: '1px solid #1E1E1C', borderRadius: '12px', padding: '28px', marginBottom: '20px' }}>
        <h2 style={{ fontFamily: 'var(--font-syne), sans-serif', fontSize: '15px', fontWeight: 600, color: '#F0EDE6', margin: '0 0 20px' }}>Prestations</h2>

        {facture.lignes.length === 0 ? (
          <p style={{ color: '#8A8880', fontSize: '13px', fontFamily: 'var(--font-dm-sans), sans-serif', fontStyle: 'italic' }}>Aucune ligne.</p>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 70px 50px 100px 110px', gap: '8px', marginBottom: '8px', paddingBottom: '8px', borderBottom: '1px solid #1E1E1C' }}>
              {['Description', 'Qté', 'Unité', 'Prix unit. HT', 'Total HT'].map((h, i) => (
                <span key={i} style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#7A7870', fontFamily: 'var(--font-dm-sans), sans-serif' }}>{h}</span>
              ))}
            </div>
            {facture.lignes.map(l => (
              <div key={l.id} style={{ display: 'grid', gridTemplateColumns: '1fr 70px 50px 100px 110px', gap: '8px', padding: '10px 0', borderBottom: '1px solid #1E1E1C' }}>
                <span style={{ fontSize: '13px', color: '#F0EDE6', fontFamily: 'var(--font-dm-sans), sans-serif' }}>{l.description || '—'}</span>
                <span style={{ fontSize: '13px', color: '#F0EDE6', fontFamily: 'var(--font-dm-sans), sans-serif', textAlign: 'right' }}>{l.quantite}</span>
                <span style={{ fontSize: '13px', color: '#8A8880', fontFamily: 'var(--font-dm-sans), sans-serif' }}>{l.unite}</span>
                <span style={{ fontSize: '13px', color: '#F0EDE6', fontFamily: 'var(--font-dm-sans), sans-serif', textAlign: 'right' }}>{formatMontant(l.prix_unitaire)}</span>
                <span style={{ fontSize: '13px', color: '#F97316', fontFamily: 'var(--font-dm-sans), sans-serif', textAlign: 'right', fontWeight: 500 }}>{formatMontant(l.quantite * l.prix_unitaire)}</span>
              </div>
            ))}

            <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
              <div style={{ display: 'flex', gap: '24px', fontSize: '13px', color: '#8A8880', fontFamily: 'var(--font-dm-sans), sans-serif' }}>
                <span>Total HT</span>
                <span style={{ color: '#F0EDE6', minWidth: '100px', textAlign: 'right' }}>{formatMontant(totaux.ht)}</span>
              </div>
              <div style={{ display: 'flex', gap: '24px', fontSize: '13px', color: '#8A8880', fontFamily: 'var(--font-dm-sans), sans-serif' }}>
                <span>TVA ({facture.tva_pct}%)</span>
                <span style={{ color: '#F0EDE6', minWidth: '100px', textAlign: 'right' }}>{formatMontant(totaux.tva)}</span>
              </div>
              <div style={{ display: 'flex', gap: '24px', fontSize: '16px', fontWeight: 700, fontFamily: 'var(--font-syne), sans-serif', marginTop: '4px', paddingTop: '8px', borderTop: '1px solid #1E1E1C' }}>
                <span style={{ color: '#F0EDE6' }}>Total TTC</span>
                <span style={{ color: '#F97316', minWidth: '100px', textAlign: 'right' }}>{formatMontant(totaux.ttc)}</span>
              </div>
            </div>
          </>
        )}
      </div>

      {facture.notes && (
        <div style={{ backgroundColor: '#111110', border: '1px solid #1E1E1C', borderRadius: '12px', padding: '20px 24px' }}>
          <h2 style={{ fontFamily: 'var(--font-syne), sans-serif', fontSize: '14px', fontWeight: 600, color: '#8A8880', margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Notes</h2>
          <p style={{ fontSize: '13px', color: '#F0EDE6', fontFamily: 'var(--font-dm-sans), sans-serif', margin: 0, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{facture.notes}</p>
        </div>
      )}

      {/* Delete modal */}
      {confirmDelete && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }} onClick={() => setConfirmDelete(false)}>
          <div style={{ backgroundColor: '#111110', border: '1px solid #1E1E1C', borderRadius: '12px', padding: '32px', maxWidth: '400px', width: '100%', margin: '0 24px' }} onClick={e => e.stopPropagation()}>
            <h2 style={{ fontFamily: 'var(--font-syne), sans-serif', fontSize: '18px', fontWeight: 600, color: '#F0EDE6', marginBottom: '12px' }}>Supprimer cette facture ?</h2>
            <p style={{ color: '#8A8880', fontSize: '14px', fontFamily: 'var(--font-dm-sans), sans-serif', marginBottom: '28px' }}>Cette action est irréversible.</p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={handleDelete}
                disabled={deleting}
                style={{ flex: 1, padding: '10px', backgroundColor: '#E85447', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: deleting ? 'not-allowed' : 'pointer', fontFamily: 'var(--font-dm-sans), sans-serif' }}
              >
                {deleting ? 'Suppression...' : 'Supprimer'}
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                style={{ flex: 1, padding: '10px', backgroundColor: 'transparent', color: '#8A8880', border: '1px solid #1E1E1C', borderRadius: '8px', fontSize: '13px', cursor: 'pointer', fontFamily: 'var(--font-dm-sans), sans-serif' }}
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
