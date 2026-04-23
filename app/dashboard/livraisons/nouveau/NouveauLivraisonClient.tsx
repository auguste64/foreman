'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { createLivraison } from '@/lib/supabase/livraisons'
import { LIVRAISON_STATUT } from '@/lib/supabase/livraisons'
import { toast } from '@/components/Toast'
import type { LivraisonStatut, PresenceLivraison } from '@/lib/supabase/livraisons'

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

// ─── Types ────────────────────────────────────────────────────────────────────

interface ArtisanOption {
  id: string
  nom: string
  metier: string
}

interface ReserveInput {
  id: string
  description: string
  lot_nom: string
  statut: 'a_lever' | 'levee'
  ordre: number
  artisan_id: string
  artisan_nom: string
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function NouveauLivraisonClient({
  chantiers,
  defaultChantierId,
}: {
  chantiers: { id: string; nom: string; client: string | null; adresse: string | null }[]
  defaultChantierId?: string
}) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)

  // Form state
  const [chantierId, setChantierId] = useState(defaultChantierId ?? '')
  const [dateReception, setDateReception] = useState(new Date().toISOString().slice(0, 10))
  const [statut, setStatut] = useState<LivraisonStatut>('accepte')
  const [delaiLevee, setDelaiLevee] = useState('')
  const [observations, setObservations] = useState('')

  // Presences
  const [presences, setPresences] = useState<PresenceLivraison[]>([])
  const [loadingPresences, setLoadingPresences] = useState(false)
  const autoFilledForChantier = useRef<string | null>(null)

  // Artisans du chantier (pour le select des réserves)
  const [chantierArtisans, setChantierArtisans] = useState<ArtisanOption[]>([])

  // Auto-fill presences when chantier changes
  useEffect(() => {
    if (!chantierId) {
      setPresences([{ nom: '', societe: '', statut: 'P' }])
      setChantierArtisans([])
      autoFilledForChantier.current = null
      return
    }
    setLoadingPresences(true)
    const supabase = createClient()

    Promise.all([
      // Artisans assignés au chantier
      supabase
        .from('chantiers_artisans')
        .select('artisans(id, nom, metier)')
        .eq('chantier_id', chantierId),
      // Infos MOE (raison_sociale)
      supabase.auth.getUser().then(({ data: { user } }) =>
        user
          ? supabase
              .from('entreprise_infos')
              .select('raison_sociale, prenom, nom')
              .eq('user_id', user.id)
              .maybeSingle()
              .then(r => r.data)
          : null
      ),
    ]).then(([artisansRes, eiData]) => {
      const rows: PresenceLivraison[] = []

      // 1. Ligne MOE en premier
      const moeNom = (eiData as { raison_sociale?: string; prenom?: string; nom?: string } | null)?.raison_sociale
        || [(eiData as { prenom?: string } | null)?.prenom, (eiData as { nom?: string } | null)?.nom].filter(Boolean).join(' ')
        || 'Maître d\'œuvre'
      rows.push({ nom: moeNom, societe: 'Maîtrise d\'œuvre', statut: 'P' })

      // 2. Maître d'ouvrage (client du chantier)
      const chantier = chantiers.find(c => c.id === chantierId)
      const clientNom = chantier?.client || ''
      rows.push({ nom: clientNom, societe: 'Maître d\'ouvrage', statut: 'P' })

      // 3. Artisans du chantier
      const artisanOptions: ArtisanOption[] = []
      const artisanRows = (artisansRes.data ?? []).flatMap((ca) => {
        const a = ca.artisans as unknown as { id: string; nom: string; metier: string } | null
        if (!a || !a.id) return []
        artisanOptions.push({ id: a.id, nom: a.nom, metier: a.metier || '' })
        return [{ nom: a.nom, societe: a.metier || '', statut: 'P' as const }]
      })
      rows.push(...artisanRows)

      setChantierArtisans(artisanOptions)
      setPresences(rows)
      autoFilledForChantier.current = chantierId
    }).catch(() => {
      setPresences([{ nom: '', societe: '', statut: 'P' }])
    }).finally(() => {
      setLoadingPresences(false)
    })
  }, [chantierId]) // eslint-disable-line react-hooks/exhaustive-deps

  // Reserves
  const [reserves, setReserves] = useState<ReserveInput[]>([])

  function addPresence() {
    setPresences(p => [...p, { nom: '', societe: '', statut: 'P' }])
  }

  function removePresence(i: number) {
    setPresences(p => p.filter((_, idx) => idx !== i))
  }

  function updatePresence(i: number, field: keyof PresenceLivraison, value: string) {
    setPresences(p => p.map((row, idx) => idx === i ? { ...row, [field]: value } : row))
  }

  function addReserve() {
    setReserves(r => [...r, {
      id: crypto.randomUUID(),
      description: '',
      lot_nom: '',
      statut: 'a_lever',
      ordre: r.length,
      artisan_id: '',
      artisan_nom: '',
    }])
  }

  function removeReserve(id: string) {
    setReserves(r => r.filter(x => x.id !== id))
  }

  function updateReserve(id: string, field: keyof ReserveInput, value: string) {
    setReserves(r => r.map(x => x.id === id ? { ...x, [field]: value } : x))
  }

  function updateReserveArtisan(id: string, artisanId: string) {
    const artisan = chantierArtisans.find(a => a.id === artisanId)
    setReserves(r => r.map(x => x.id === id
      ? { ...x, artisan_id: artisanId, artisan_nom: artisan?.nom ?? '' }
      : x
    ))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!chantierId) { toast.error('Sélectionne un chantier'); return }
    if (!dateReception) { toast.error('Date de réception obligatoire'); return }
    setSaving(true)
    try {
      const presencesFiltered = presences.filter(p => p.nom.trim())
      const lv = await createLivraison(
        {
          chantier_id: chantierId,
          date_reception: dateReception,
          statut,
          delai_levee_reserves: (statut !== 'accepte' && delaiLevee) ? delaiLevee : null,
          observations: observations.trim() || null,
          presences: presencesFiltered,
        },
        reserves
          .filter(r => r.description.trim())
          .map((r, i) => ({
            lot_id: null,
            lot_nom: r.lot_nom.trim() || null,
            description: r.description.trim(),
            statut: r.statut,
            date_levee: null,
            ordre: i,
            artisan_id: r.artisan_id || null,
            artisan_nom: r.artisan_nom.trim() || null,
          }))
      )
      toast.success('Livraison créée')
      router.push(`/dashboard/livraisons/${lv.id}`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erreur lors de la création')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ flex: 1, padding: '40px', overflowY: 'auto', maxWidth: '800px' }}>
      {/* Back */}
      <Link
        href="/dashboard/chantiers"
        style={{ display: 'inline-flex', alignItems: 'center', gap: 8, backgroundColor: '#111110', border: '1px solid #1E1E1C', borderRadius: 8, padding: '8px 14px', color: '#F0EDE6', fontSize: 13, fontWeight: 500, cursor: 'pointer', textDecoration: 'none', transition: 'all 0.15s ease', fontFamily: 'var(--font-dm-sans), sans-serif', marginBottom: 28 }}
        onMouseEnter={e => { e.currentTarget.style.background = '#1E1E1C'; e.currentTarget.style.borderColor = '#ea580c'; e.currentTarget.style.color = '#ea580c' }}
        onMouseLeave={e => { e.currentTarget.style.background = '#111110'; e.currentTarget.style.borderColor = '#1E1E1C'; e.currentTarget.style.color = '#F0EDE6' }}
      >
        <span style={{ color: '#ea580c' }}>←</span>
        Retour
      </Link>

      <h1 style={{ fontFamily: 'var(--font-syne), sans-serif', fontSize: 28, fontWeight: 700, color: '#F0EDE6', margin: '0 0 8px' }}>
        Nouvelle livraison
      </h1>
      <p style={{ color: '#8A8880', fontSize: 14, fontFamily: 'var(--font-dm-sans), sans-serif', marginBottom: 32 }}>
        Procès-verbal de réception de chantier
      </p>

      <form onSubmit={handleSubmit}>

        {/* ── Général ── */}
        <div style={cardStyle}>
          <p style={sectionTitleStyle}>Informations générales</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>Chantier *</label>
              <select
                value={chantierId}
                onChange={e => setChantierId(e.target.value)}
                required
                style={{ ...inputStyle, cursor: 'pointer' }}
              >
                <option value="">Sélectionner un chantier</option>
                {chantiers.map(c => (
                  <option key={c.id} value={c.id}>{c.nom}</option>
                ))}
              </select>
            </div>
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
              placeholder="Notes générales sur la réception…"
              style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }}
            />
          </div>
        </div>

        {/* ── Présences ── */}
        <div style={cardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <p style={{ ...sectionTitleStyle, marginBottom: 0 }}>Présences</p>
            {loadingPresences && (
              <span style={{ fontSize: 12, color: '#8A8880', fontFamily: 'var(--font-dm-sans), sans-serif' }}>
                Chargement…
              </span>
            )}
            {!loadingPresences && chantierId && autoFilledForChantier.current === chantierId && (
              <span style={{ fontSize: 11, color: '#4ade80', fontFamily: 'var(--font-dm-sans), sans-serif', backgroundColor: 'rgba(74,222,128,0.1)', padding: '2px 8px', borderRadius: 20 }}>
                Pré-rempli
              </span>
            )}
          </div>
          {presences.map((p, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto auto', gap: 10, marginBottom: 12, alignItems: 'end' }}>
              <div>
                {i === 0 && <label style={labelStyle}>Nom</label>}
                <input
                  type="text"
                  value={p.nom}
                  onChange={e => updatePresence(i, 'nom', e.target.value)}
                  placeholder="Nom"
                  style={inputStyle}
                />
              </div>
              <div>
                {i === 0 && <label style={labelStyle}>Société</label>}
                <input
                  type="text"
                  value={p.societe}
                  onChange={e => updatePresence(i, 'societe', e.target.value)}
                  placeholder="Société"
                  style={inputStyle}
                />
              </div>
              <div>
                {i === 0 && <label style={labelStyle}>Statut</label>}
                <select
                  value={p.statut}
                  onChange={e => updatePresence(i, 'statut', e.target.value)}
                  style={{ ...inputStyle, width: 'auto' }}
                >
                  <option value="P">P — Présent</option>
                  <option value="A">A — Absent</option>
                  <option value="E">E — Excusé</option>
                </select>
              </div>
              <div>
                {i === 0 && <label style={labelStyle}>&nbsp;</label>}
                <button
                  type="button"
                  onClick={() => removePresence(i)}
                  style={{ padding: '10px 12px', backgroundColor: 'transparent', border: '1px solid #1E1E1C', borderRadius: 8, color: '#8A8880', fontSize: 14, cursor: 'pointer' }}
                >
                  ×
                </button>
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={addPresence}
            style={{ padding: '8px 14px', backgroundColor: 'transparent', border: '1px dashed #1E1E1C', borderRadius: 8, color: '#8A8880', fontSize: 13, cursor: 'pointer', fontFamily: 'var(--font-dm-sans), sans-serif' }}
          >
            + Ajouter une personne
          </button>
        </div>

        {/* ── Réserves ── */}
        <div style={cardStyle}>
          <p style={sectionTitleStyle}>Réserves</p>
          {reserves.length === 0 && (
            <p style={{ color: '#8A8880', fontSize: 13, fontFamily: 'var(--font-dm-sans), sans-serif', marginBottom: 16 }}>
              Aucune réserve. Cliquez sur + pour en ajouter.
            </p>
          )}
          {reserves.map((r, i) => (
            <div key={r.id} style={{ backgroundColor: '#0D0D0B', border: '1px solid #1E1E1C', borderRadius: 8, padding: '14px 16px', marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <span style={{ fontSize: 12, color: '#8A8880', fontFamily: 'var(--font-dm-sans), sans-serif', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Réserve {i + 1}
                </span>
                <button
                  type="button"
                  onClick={() => removeReserve(r.id)}
                  style={{ background: 'none', border: 'none', color: '#8A8880', fontSize: 16, cursor: 'pointer', padding: '2px 6px' }}
                >
                  ×
                </button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12, marginBottom: 10 }}>
                <div>
                  <label style={labelStyle}>Description *</label>
                  <input
                    type="text"
                    value={r.description}
                    onChange={e => updateReserve(r.id, 'description', e.target.value)}
                    placeholder="Description de la réserve"
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Lot (optionnel)</label>
                  <input
                    type="text"
                    value={r.lot_nom}
                    onChange={e => updateReserve(r.id, 'lot_nom', e.target.value)}
                    placeholder="Ex : Plomberie"
                    style={inputStyle}
                  />
                </div>
              </div>
              <div style={{ marginBottom: 10 }}>
                <label style={labelStyle}>Artisan responsable</label>
                <select
                  value={r.artisan_id}
                  onChange={e => updateReserveArtisan(r.id, e.target.value)}
                  style={{ ...inputStyle, cursor: 'pointer' }}
                >
                  <option value="">— Aucun artisan —</option>
                  {chantierArtisans.map(a => (
                    <option key={a.id} value={a.id}>
                      {a.nom}{a.metier ? ` — ${a.metier}` : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Statut</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {(['a_lever', 'levee'] as const).map(s => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => updateReserve(r.id, 'statut', s)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: 6,
                        border: r.statut === s ? `1px solid ${s === 'a_lever' ? '#ea580c' : '#4ade80'}` : '1px solid #1E1E1C',
                        backgroundColor: r.statut === s ? (s === 'a_lever' ? 'rgba(249,115,22,0.12)' : 'rgba(74,222,128,0.12)') : 'transparent',
                        color: r.statut === s ? (s === 'a_lever' ? '#ea580c' : '#4ade80') : '#8A8880',
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: 'pointer',
                        fontFamily: 'var(--font-dm-sans), sans-serif',
                      }}
                    >
                      {s === 'a_lever' ? 'À lever' : 'Levée'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={addReserve}
            style={{ padding: '8px 14px', backgroundColor: 'transparent', border: '1px dashed #1E1E1C', borderRadius: 8, color: '#8A8880', fontSize: 13, cursor: 'pointer', fontFamily: 'var(--font-dm-sans), sans-serif' }}
          >
            + Ajouter une réserve
          </button>
        </div>

        {/* ── Submit ── */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, paddingBottom: 60 }}>
          <Link
            href="/dashboard/chantiers"
            style={{ padding: '12px 24px', backgroundColor: 'transparent', border: '1px solid #1E1E1C', borderRadius: 8, color: '#F0EDE6', fontSize: 14, fontWeight: 500, textDecoration: 'none', fontFamily: 'var(--font-dm-sans), sans-serif' }}
          >
            Annuler
          </Link>
          <button
            type="submit"
            disabled={saving}
            style={{ padding: '12px 28px', backgroundColor: saving ? '#2A2A27' : '#ea580c', color: saving ? '#8A8880' : '#0D0D0B', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'var(--font-dm-sans), sans-serif', transition: 'all 0.15s' }}
          >
            {saving ? 'Enregistrement…' : 'Créer la livraison'}
          </button>
        </div>

      </form>
    </div>
  )
}
