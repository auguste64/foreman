'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { updateLivraison, updateReserve, createReserve, deleteReserve, LIVRAISON_STATUT } from '@/lib/supabase/livraisons'
import { toast } from '@/components/Toast'
import type { LivraisonWithReserves, LivraisonStatut, PresenceLivraison, LivraisonReserve } from '@/lib/supabase/livraisons'

// ─── Styles ───────────────────────────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 14px',
  backgroundColor: '#0D0D0B',
  border: '1px solid #1E1E1C',
  borderRadius: '8px',
  color: '#F0EDE6',
  fontSize: '14px',
  outline: 'none',
  fontFamily: 'var(--font-dm-sans), sans-serif',
  boxSizing: 'border-box',
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '12px',
  color: '#8A8880',
  marginBottom: '6px',
  fontFamily: 'var(--font-dm-sans), sans-serif',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
}

const cardStyle: React.CSSProperties = {
  backgroundColor: '#111110',
  border: '1px solid #1E1E1C',
  borderRadius: '12px',
  padding: '28px',
  marginBottom: '24px',
}

const sectionTitleStyle: React.CSSProperties = {
  fontSize: '15px',
  fontWeight: 700,
  color: '#F0EDE6',
  fontFamily: 'var(--font-syne), sans-serif',
  marginBottom: '20px',
  paddingLeft: '12px',
  borderLeft: '3px solid #ea580c',
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ModifierLivraisonClient({
  livraison: initial,
  chantiers,
}: {
  livraison: LivraisonWithReserves
  chantiers: { id: string; nom: string; client: string | null; adresse: string | null }[]
}) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)

  const [dateReception, setDateReception] = useState(initial.date_reception)
  const [statut, setStatut] = useState<LivraisonStatut>(initial.statut)
  const [delaiLevee, setDelaiLevee] = useState(initial.delai_levee_reserves ?? '')
  const [observations, setObservations] = useState(initial.observations ?? '')
  const [presences, setPresences] = useState<PresenceLivraison[]>(
    initial.presences.length > 0 ? initial.presences : [{ nom: '', societe: '', statut: 'P' }]
  )
  const [reserves, setReserves] = useState<LivraisonReserve[]>(initial.livraisons_reserves ?? [])
  const [newReserves, setNewReserves] = useState<{ id: string; description: string; lot_nom: string; statut: 'a_lever' | 'levee' }[]>([])
  const [deletedReserveIds, setDeletedReserveIds] = useState<string[]>([])

  function addPresence() {
    setPresences(p => [...p, { nom: '', societe: '', statut: 'P' }])
  }

  function removePresence(i: number) {
    setPresences(p => p.filter((_, idx) => idx !== i))
  }

  function updatePresenceField(i: number, field: keyof PresenceLivraison, value: string) {
    setPresences(p => p.map((row, idx) => idx === i ? { ...row, [field]: value } : row))
  }

  function updateReserveField(id: string, field: 'description' | 'lot_nom' | 'statut', value: string) {
    setReserves(r => r.map(x => x.id === id ? { ...x, [field]: value } : x))
  }

  function removeExistingReserve(id: string) {
    setDeletedReserveIds(d => [...d, id])
    setReserves(r => r.filter(x => x.id !== id))
  }

  function addNewReserve() {
    setNewReserves(r => [...r, { id: crypto.randomUUID(), description: '', lot_nom: '', statut: 'a_lever' }])
  }

  function updateNewReserve(id: string, field: 'description' | 'lot_nom' | 'statut', value: string) {
    setNewReserves(r => r.map(x => x.id === id ? { ...x, [field]: value } : x))
  }

  function removeNewReserve(id: string) {
    setNewReserves(r => r.filter(x => x.id !== id))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      // Update livraison fields
      await updateLivraison(initial.id, {
        date_reception: dateReception,
        statut,
        delai_levee_reserves: (statut !== 'accepte' && delaiLevee) ? delaiLevee : null,
        observations: observations.trim() || null,
        presences: presences.filter(p => p.nom.trim()),
      })

      // Delete removed reserves
      await Promise.all(deletedReserveIds.map(id => deleteReserve(id)))

      // Update existing reserves
      await Promise.all(
        reserves.map(r => updateReserve(r.id, {
          description: r.description,
          lot_nom: r.lot_nom,
          statut: r.statut,
        }))
      )

      // Create new reserves
      const existingCount = reserves.length
      await Promise.all(
        newReserves
          .filter(r => r.description.trim())
          .map((r, i) => createReserve({
            livraison_id: initial.id,
            lot_id: null,
            lot_nom: r.lot_nom.trim() || null,
            description: r.description.trim(),
            statut: r.statut,
            date_levee: null,
            ordre: existingCount + i,
            artisan_id: null,
            artisan_nom: null,
          }))
      )

      toast.success('Livraison mise à jour')
      router.push(`/dashboard/livraisons/${initial.id}`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erreur lors de la mise à jour')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ flex: 1, padding: '40px', overflowY: 'auto', maxWidth: '800px' }}>
      {/* Back */}
      <Link
        href={`/dashboard/livraisons/${initial.id}`}
        style={{ display: 'inline-flex', alignItems: 'center', gap: 8, backgroundColor: '#111110', border: '1px solid #1E1E1C', borderRadius: 8, padding: '8px 14px', color: '#F0EDE6', fontSize: 13, fontWeight: 500, cursor: 'pointer', textDecoration: 'none', transition: 'all 0.15s ease', fontFamily: 'var(--font-dm-sans), sans-serif', marginBottom: 28 }}
        onMouseEnter={e => { e.currentTarget.style.background = '#1E1E1C'; e.currentTarget.style.borderColor = '#ea580c'; e.currentTarget.style.color = '#ea580c' }}
        onMouseLeave={e => { e.currentTarget.style.background = '#111110'; e.currentTarget.style.borderColor = '#1E1E1C'; e.currentTarget.style.color = '#F0EDE6' }}
      >
        <span style={{ color: '#ea580c' }}>←</span>
        Retour
      </Link>

      <h1 style={{ fontFamily: 'var(--font-syne), sans-serif', fontSize: 28, fontWeight: 700, color: '#F0EDE6', margin: '0 0 8px' }}>
        Modifier la livraison
      </h1>
      <p style={{ color: '#8A8880', fontSize: 14, fontFamily: 'var(--font-dm-sans), sans-serif', marginBottom: 32 }}>
        {initial.numero} · {initial.chantiers.nom}
      </p>

      <form onSubmit={handleSubmit}>

        {/* ── Général ── */}
        <div style={cardStyle}>
          <p style={sectionTitleStyle}>Informations générales</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
            <div>
              <label style={labelStyle}>Date de réception *</label>
              <input
                type="date"
                value={dateReception}
                onChange={e => setDateReception(e.target.value)}
                required
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Statut de réception *</label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {(Object.entries(LIVRAISON_STATUT) as [LivraisonStatut, { label: string; bg: string; color: string }][]).map(([key, s]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setStatut(key)}
                    style={{
                      padding: '8px 14px',
                      borderRadius: 8,
                      border: statut === key ? `2px solid ${s.color}` : '2px solid #1E1E1C',
                      backgroundColor: statut === key ? s.bg : 'transparent',
                      color: statut === key ? s.color : '#8A8880',
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: 'pointer',
                      fontFamily: 'var(--font-dm-sans), sans-serif',
                      transition: 'all 0.15s',
                    }}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {statut !== 'accepte' && (
            <div style={{ marginBottom: 20 }}>
              <label style={labelStyle}>Délai de levée des réserves</label>
              <input
                type="date"
                value={delaiLevee}
                onChange={e => setDelaiLevee(e.target.value)}
                style={{ ...inputStyle, maxWidth: 220 }}
              />
            </div>
          )}

          <div>
            <label style={labelStyle}>Observations générales</label>
            <textarea
              value={observations}
              onChange={e => setObservations(e.target.value)}
              rows={3}
              style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }}
            />
          </div>
        </div>

        {/* ── Présences ── */}
        <div style={cardStyle}>
          <p style={sectionTitleStyle}>Présences</p>
          {presences.map((p, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto auto', gap: 10, marginBottom: 12, alignItems: 'end' }}>
              <div>
                {i === 0 && <label style={labelStyle}>Nom</label>}
                <input type="text" value={p.nom} onChange={e => updatePresenceField(i, 'nom', e.target.value)} placeholder="Nom" style={inputStyle} />
              </div>
              <div>
                {i === 0 && <label style={labelStyle}>Société</label>}
                <input type="text" value={p.societe} onChange={e => updatePresenceField(i, 'societe', e.target.value)} placeholder="Société" style={inputStyle} />
              </div>
              <div>
                {i === 0 && <label style={labelStyle}>Statut</label>}
                <select value={p.statut} onChange={e => updatePresenceField(i, 'statut', e.target.value)} style={{ ...inputStyle, width: 'auto' }}>
                  <option value="P">P — Présent</option>
                  <option value="A">A — Absent</option>
                  <option value="E">E — Excusé</option>
                </select>
              </div>
              <div>
                {i === 0 && <label style={labelStyle}>&nbsp;</label>}
                <button type="button" onClick={() => removePresence(i)} style={{ padding: '10px 12px', backgroundColor: 'transparent', border: '1px solid #1E1E1C', borderRadius: 8, color: '#8A8880', fontSize: 14, cursor: 'pointer' }}>×</button>
              </div>
            </div>
          ))}
          <button type="button" onClick={addPresence} style={{ padding: '8px 14px', backgroundColor: 'transparent', border: '1px dashed #1E1E1C', borderRadius: 8, color: '#8A8880', fontSize: 13, cursor: 'pointer', fontFamily: 'var(--font-dm-sans), sans-serif' }}>
            + Ajouter une personne
          </button>
        </div>

        {/* ── Réserves ── */}
        <div style={cardStyle}>
          <p style={sectionTitleStyle}>Réserves</p>

          {/* Existing reserves */}
          {reserves.map((r, i) => (
            <div key={r.id} style={{ backgroundColor: '#0D0D0B', border: '1px solid #1E1E1C', borderRadius: 8, padding: '14px 16px', marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <span style={{ fontSize: 12, color: '#8A8880', fontFamily: 'var(--font-dm-sans), sans-serif', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Réserve {i + 1}
                </span>
                <button type="button" onClick={() => removeExistingReserve(r.id)} style={{ background: 'none', border: 'none', color: '#8A8880', fontSize: 16, cursor: 'pointer', padding: '2px 6px' }}>×</button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12, marginBottom: 10 }}>
                <div>
                  <label style={labelStyle}>Description</label>
                  <input type="text" value={r.description} onChange={e => updateReserveField(r.id, 'description', e.target.value)} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Lot</label>
                  <input type="text" value={r.lot_nom ?? ''} onChange={e => updateReserveField(r.id, 'lot_nom', e.target.value)} placeholder="Ex : Plomberie" style={inputStyle} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                {(['a_lever', 'levee'] as const).map(s => (
                  <button key={s} type="button" onClick={() => updateReserveField(r.id, 'statut', s)}
                    style={{ padding: '6px 12px', borderRadius: 6, border: r.statut === s ? `1px solid ${s === 'a_lever' ? '#ea580c' : '#4ade80'}` : '1px solid #1E1E1C', backgroundColor: r.statut === s ? (s === 'a_lever' ? 'rgba(249,115,22,0.12)' : 'rgba(74,222,128,0.12)') : 'transparent', color: r.statut === s ? (s === 'a_lever' ? '#ea580c' : '#4ade80') : '#8A8880', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-dm-sans), sans-serif' }}>
                    {s === 'a_lever' ? 'À lever' : 'Levée'}
                  </button>
                ))}
              </div>
            </div>
          ))}

          {/* New reserves */}
          {newReserves.map((r, i) => (
            <div key={r.id} style={{ backgroundColor: '#0D0D0B', border: '1px dashed #ea580c40', borderRadius: 8, padding: '14px 16px', marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <span style={{ fontSize: 12, color: '#ea580c', fontFamily: 'var(--font-dm-sans), sans-serif', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Nouvelle réserve {reserves.length + i + 1}
                </span>
                <button type="button" onClick={() => removeNewReserve(r.id)} style={{ background: 'none', border: 'none', color: '#8A8880', fontSize: 16, cursor: 'pointer', padding: '2px 6px' }}>×</button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12, marginBottom: 10 }}>
                <div>
                  <label style={labelStyle}>Description *</label>
                  <input type="text" value={r.description} onChange={e => updateNewReserve(r.id, 'description', e.target.value)} placeholder="Description de la réserve" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Lot (optionnel)</label>
                  <input type="text" value={r.lot_nom} onChange={e => updateNewReserve(r.id, 'lot_nom', e.target.value)} placeholder="Ex : Plomberie" style={inputStyle} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                {(['a_lever', 'levee'] as const).map(s => (
                  <button key={s} type="button" onClick={() => updateNewReserve(r.id, 'statut', s)}
                    style={{ padding: '6px 12px', borderRadius: 6, border: r.statut === s ? `1px solid ${s === 'a_lever' ? '#ea580c' : '#4ade80'}` : '1px solid #1E1E1C', backgroundColor: r.statut === s ? (s === 'a_lever' ? 'rgba(249,115,22,0.12)' : 'rgba(74,222,128,0.12)') : 'transparent', color: r.statut === s ? (s === 'a_lever' ? '#ea580c' : '#4ade80') : '#8A8880', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-dm-sans), sans-serif' }}>
                    {s === 'a_lever' ? 'À lever' : 'Levée'}
                  </button>
                ))}
              </div>
            </div>
          ))}

          <button type="button" onClick={addNewReserve} style={{ padding: '8px 14px', backgroundColor: 'transparent', border: '1px dashed #1E1E1C', borderRadius: 8, color: '#8A8880', fontSize: 13, cursor: 'pointer', fontFamily: 'var(--font-dm-sans), sans-serif' }}>
            + Ajouter une réserve
          </button>
        </div>

        {/* ── Submit ── */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, paddingBottom: 60 }}>
          <Link
            href={`/dashboard/livraisons/${initial.id}`}
            style={{ padding: '12px 24px', backgroundColor: 'transparent', border: '1px solid #1E1E1C', borderRadius: 8, color: '#F0EDE6', fontSize: 14, fontWeight: 500, textDecoration: 'none', fontFamily: 'var(--font-dm-sans), sans-serif' }}
          >
            Annuler
          </Link>
          <button
            type="submit"
            disabled={saving}
            style={{ padding: '12px 28px', backgroundColor: saving ? '#2A2A27' : '#ea580c', color: saving ? '#8A8880' : '#0D0D0B', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'var(--font-dm-sans), sans-serif', transition: 'all 0.15s' }}
          >
            {saving ? 'Enregistrement…' : 'Enregistrer les modifications'}
          </button>
        </div>

      </form>
    </div>
  )
}
