'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { deleteLivraison, updateReserve, LIVRAISON_STATUT, RESERVE_STATUT } from '@/lib/supabase/livraisons'
import { toast } from '@/components/Toast'
import type { LivraisonWithReserves, LivraisonReserve } from '@/lib/supabase/livraisons'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmt(iso: string | null | undefined) {
  if (!iso) return '—'
  const s = iso.includes('T') ? iso : iso + 'T12:00:00'
  return new Date(s).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function LivraisonDetail({ livraison: initial }: { livraison: LivraisonWithReserves }) {
  const router = useRouter()
  const [livraison, setLivraison] = useState(initial)
  const [deleting, setDeleting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const chantier = livraison.chantiers
  const reserves = livraison.livraisons_reserves ?? []
  const statut = LIVRAISON_STATUT[livraison.statut]

  // Group reserves by lot
  const reservesParLot: Record<string, LivraisonReserve[]> = {}
  const reservesLibres: LivraisonReserve[] = []
  for (const r of reserves) {
    if (r.lot_nom) {
      if (!reservesParLot[r.lot_nom]) reservesParLot[r.lot_nom] = []
      reservesParLot[r.lot_nom].push(r)
    } else {
      reservesLibres.push(r)
    }
  }

  async function handleToggleReserve(r: LivraisonReserve) {
    const newStatut = r.statut === 'a_lever' ? 'levee' : 'a_lever'
    const newDateLevee = newStatut === 'levee' ? new Date().toISOString().slice(0, 10) : null
    try {
      const updated = await updateReserve(r.id, { statut: newStatut, date_levee: newDateLevee })
      setLivraison(prev => ({
        ...prev,
        livraisons_reserves: prev.livraisons_reserves.map(x => x.id === r.id ? updated : x),
      }))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erreur')
    }
  }

  async function handleDelete() {
    setDeleting(true)
    try {
      await deleteLivraison(livraison.id)
      toast.success('Livraison supprimée')
      router.push(`/dashboard/chantiers/${chantier ? livraison.chantier_id : ''}`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erreur')
      setDeleting(false)
    }
  }

  const cardStyle: React.CSSProperties = {
    backgroundColor: '#111110',
    border: '1px solid #1E1E1C',
    borderRadius: '12px',
    padding: '24px',
    marginBottom: '20px',
    position: 'relative',
    zIndex: 2,
  }

  const sectionTitleStyle: React.CSSProperties = {
    fontSize: '13px',
    fontWeight: 700,
    color: '#F0EDE6',
    fontFamily: 'var(--font-syne), sans-serif',
    marginBottom: '16px',
    paddingLeft: '10px',
    borderLeft: '3px solid #ea580c',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
  }

  const labelStyle: React.CSSProperties = {
    fontSize: '11px',
    color: '#8A8880',
    fontFamily: 'var(--font-dm-sans), sans-serif',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    marginBottom: '4px',
  }

  const valueStyle: React.CSSProperties = {
    fontSize: '14px',
    color: '#F0EDE6',
    fontFamily: 'var(--font-dm-sans), sans-serif',
    fontWeight: 500,
  }

  return (
    <div style={{ flex: 1, padding: '40px', overflowY: 'auto', maxWidth: '800px', position: 'relative', zIndex: 2 }}>

      {/* Back */}
      <Link
        href={`/dashboard/chantiers/${livraison.chantier_id}/livraisons`}
        style={{ display: 'inline-flex', alignItems: 'center', gap: 8, backgroundColor: '#111110', border: '1px solid #1E1E1C', borderRadius: 8, padding: '8px 14px', color: '#F0EDE6', fontSize: 13, fontWeight: 500, cursor: 'pointer', textDecoration: 'none', transition: 'all 0.15s ease', fontFamily: 'var(--font-dm-sans), sans-serif', marginBottom: 28 }}
        onMouseEnter={e => { e.currentTarget.style.background = '#1E1E1C'; e.currentTarget.style.borderColor = '#ea580c'; e.currentTarget.style.color = '#ea580c' }}
        onMouseLeave={e => { e.currentTarget.style.background = '#111110'; e.currentTarget.style.borderColor = '#1E1E1C'; e.currentTarget.style.color = '#F0EDE6' }}
      >
        <span style={{ color: '#ea580c' }}>←</span>
        Retour aux livraisons
      </Link>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 32, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
            <h1 style={{ fontFamily: 'var(--font-syne), sans-serif', fontSize: 24, fontWeight: 700, color: '#F0EDE6', margin: 0 }}>
              {livraison.numero ?? 'PV de réception'}
            </h1>
            <span style={{ padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600, backgroundColor: statut.bg, color: statut.color, fontFamily: 'var(--font-dm-sans), sans-serif' }}>
              {statut.label}
            </span>
          </div>
          <p style={{ color: '#8A8880', fontSize: 14, fontFamily: 'var(--font-dm-sans), sans-serif', margin: 0 }}>
            {chantier.nom} · {fmt(livraison.date_reception)}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <a
            href={`/api/livraisons-pdf/${livraison.id}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ padding: '9px 16px', backgroundColor: 'transparent', border: '1px solid #1E1E1C', borderRadius: 8, color: '#F0EDE6', fontSize: 13, fontWeight: 500, textDecoration: 'none', fontFamily: 'var(--font-dm-sans), sans-serif', display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            ↓ Télécharger PDF
          </a>
          <Link
            href={`/dashboard/livraisons/${livraison.id}/modifier`}
            style={{ padding: '9px 16px', backgroundColor: '#ea580c', color: '#0D0D0B', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, textDecoration: 'none', fontFamily: 'var(--font-dm-sans), sans-serif' }}
          >
            Modifier
          </Link>
        </div>
      </div>

      {/* Informations générales */}
      <div style={cardStyle}>
        <p style={sectionTitleStyle}>Informations générales</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 20 }}>
          <div>
            <p style={labelStyle}>Chantier</p>
            <p style={valueStyle}>{chantier.nom}</p>
          </div>
          <div>
            <p style={labelStyle}>Client / Maître d'ouvrage</p>
            <p style={valueStyle}>{chantier.client || '—'}</p>
          </div>
          <div>
            <p style={labelStyle}>Adresse</p>
            <p style={valueStyle}>{chantier.adresse || '—'}</p>
          </div>
          <div>
            <p style={labelStyle}>Date de réception</p>
            <p style={valueStyle}>{fmt(livraison.date_reception)}</p>
          </div>
          {livraison.delai_levee_reserves && (
            <div>
              <p style={labelStyle}>Délai de levée des réserves</p>
              <p style={{ ...valueStyle, color: '#ea580c' }}>{fmt(livraison.delai_levee_reserves)}</p>
            </div>
          )}
          {livraison.observations && (
            <div style={{ gridColumn: '1 / -1' }}>
              <p style={labelStyle}>Observations générales</p>
              <p style={{ ...valueStyle, lineHeight: 1.6 }}>{livraison.observations}</p>
            </div>
          )}
        </div>
      </div>

      {/* Présences */}
      {livraison.presences && livraison.presences.length > 0 && (
        <div style={cardStyle}>
          <p style={sectionTitleStyle}>Présences ({livraison.presences.length})</p>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['Nom', 'Société', 'Statut'].map(h => (
                    <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#7A7870', borderBottom: '1px solid #1E1E1C', fontFamily: 'var(--font-dm-sans), sans-serif' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {livraison.presences.map((p, i) => {
                  const c = p.statut === 'P' ? '#4ade80' : p.statut === 'A' ? '#E85447' : '#ea580c'
                  const label = p.statut === 'P' ? 'Présent' : p.statut === 'A' ? 'Absent' : 'Excusé'
                  return (
                    <tr key={i}>
                      <td style={{ padding: '10px 12px', fontSize: 13, color: '#F0EDE6', borderBottom: '1px solid #1E1E1C', fontFamily: 'var(--font-dm-sans), sans-serif', fontWeight: 500 }}>{p.nom || '—'}</td>
                      <td style={{ padding: '10px 12px', fontSize: 13, color: '#8A8880', borderBottom: '1px solid #1E1E1C', fontFamily: 'var(--font-dm-sans), sans-serif' }}>{p.societe || '—'}</td>
                      <td style={{ padding: '10px 12px', borderBottom: '1px solid #1E1E1C' }}>
                        <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, backgroundColor: `${c}20`, color: c, fontFamily: 'var(--font-dm-sans), sans-serif' }}>
                          {label}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Réserves */}
      {reserves.length > 0 && (
        <div style={cardStyle}>
          <p style={sectionTitleStyle}>
            Réserves ({reserves.filter(r => r.statut === 'a_lever').length} à lever · {reserves.filter(r => r.statut === 'levee').length} levée{reserves.filter(r => r.statut === 'levee').length !== 1 ? 's' : ''})
          </p>

          {/* Par lot */}
          {Object.entries(reservesParLot).map(([lotNom, lotReserves]) => (
            <div key={lotNom} style={{ marginBottom: 20 }}>
              <p style={{ fontSize: 12, fontWeight: 600, color: '#ea580c', fontFamily: 'var(--font-dm-sans), sans-serif', marginBottom: 10, paddingLeft: 10, borderLeft: '2px solid #ea580c', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Lot : {lotNom}
              </p>
              {lotReserves.map(r => <ReserveCard key={r.id} r={r} onToggle={handleToggleReserve} />)}
            </div>
          ))}

          {/* Libres */}
          {reservesLibres.length > 0 && (
            <div>
              {Object.keys(reservesParLot).length > 0 && (
                <p style={{ fontSize: 12, fontWeight: 600, color: '#8A8880', fontFamily: 'var(--font-dm-sans), sans-serif', marginBottom: 10, paddingLeft: 10, borderLeft: '2px solid #1E1E1C', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Réserves générales
                </p>
              )}
              {reservesLibres.map(r => <ReserveCard key={r.id} r={r} onToggle={handleToggleReserve} />)}
            </div>
          )}
        </div>
      )}

      {reserves.length === 0 && (
        <div style={{ ...cardStyle, textAlign: 'center', padding: '36px 24px' }}>
          <p style={{ color: '#8A8880', fontSize: 14, fontFamily: 'var(--font-dm-sans), sans-serif', margin: 0 }}>
            Aucune réserve enregistrée pour cette livraison.
          </p>
        </div>
      )}

      {/* Danger zone */}
      <div style={{ marginTop: 40, paddingTop: 24, borderTop: '1px solid #1E1E1C' }}>
        {!confirmDelete ? (
          <button
            onClick={() => setConfirmDelete(true)}
            style={{ padding: '8px 16px', backgroundColor: 'transparent', border: '1px solid #dc2626', borderRadius: 8, color: '#dc2626', fontSize: 13, cursor: 'pointer', fontFamily: 'var(--font-dm-sans), sans-serif' }}
          >
            Supprimer cette livraison
          </button>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 13, color: '#dc2626', fontFamily: 'var(--font-dm-sans), sans-serif' }}>Confirmer la suppression ?</span>
            <button
              onClick={handleDelete}
              disabled={deleting}
              style={{ padding: '8px 16px', backgroundColor: '#dc2626', border: 'none', borderRadius: 8, color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-dm-sans), sans-serif' }}
            >
              {deleting ? 'Suppression…' : 'Oui, supprimer'}
            </button>
            <button
              onClick={() => setConfirmDelete(false)}
              style={{ padding: '8px 16px', backgroundColor: 'transparent', border: '1px solid #1E1E1C', borderRadius: 8, color: '#8A8880', fontSize: 13, cursor: 'pointer', fontFamily: 'var(--font-dm-sans), sans-serif' }}
            >
              Annuler
            </button>
          </div>
        )}
      </div>

    </div>
  )
}

// ─── Reserve Card ─────────────────────────────────────────────────────────────

function ReserveCard({
  r,
  onToggle,
}: {
  r: LivraisonReserve
  onToggle: (r: LivraisonReserve) => void
}) {
  const s = RESERVE_STATUT[r.statut]
  return (
    <div style={{ backgroundColor: '#0D0D0B', border: '1px solid #1E1E1C', borderRadius: 8, padding: '12px 14px', marginBottom: 8, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
      <p style={{ flex: 1, fontSize: 13, color: '#F0EDE6', fontFamily: 'var(--font-dm-sans), sans-serif', margin: 0, lineHeight: 1.5 }}>
        {r.description}
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
        <button
          onClick={() => onToggle(r)}
          style={{ padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 600, backgroundColor: s.bg, color: s.color, border: `1px solid ${s.color}40`, cursor: 'pointer', fontFamily: 'var(--font-dm-sans), sans-serif', transition: 'all 0.15s' }}
        >
          {s.label}
        </button>
        {r.statut === 'levee' && r.date_levee && (
          <span style={{ fontSize: 11, color: '#4ade80', fontFamily: 'var(--font-dm-sans), sans-serif' }}>
            Levée le {new Date(r.date_levee + 'T12:00:00').toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
          </span>
        )}
      </div>
    </div>
  )
}
