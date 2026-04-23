'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { updateCompteRendu } from '@/lib/supabase/comptes-rendus'
import { toast } from '@/components/Toast'
import type { CompteRenduWithChantier } from '@/lib/supabase/comptes-rendus'
import type { Chantier } from '@/lib/supabase/chantiers'
import PhotoAnnotator from '@/components/PhotoAnnotator'
import ArtisanAutocomplete from '@/components/ArtisanAutocomplete'

// ─── Types ────────────────────────────────────────────────────────────────────

type StatutPresence = 'P' | 'A' | 'E' | 'C'

interface PresenceRow {
  artisanId: string
  nom: string
  societe: string
  statut: StatutPresence
  convoque: boolean
}

interface Reserve {
  id: string
  description: string
  lot: string
  responsable: string
  statut: 'Ouvert' | 'Levé'
  dateCreation: string
  photos: string[]
}

interface Lot {
  id: string
  nom: string
  intervenant: string
  dateDemarrage: string
  dateFin: string
  avancement: number
}

interface Decision {
  id: string
  description: string
  responsable: string
  echeance: string
}

interface LotSuiviEntry {
  observations: string
  photos: string[]
}

interface Profile {
  nom: string
  societe: string
  adresse: string
  telephone: string
  email: string
  siret: string
  logo: string
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUT_ORDER: StatutPresence[] = ['P', 'A', 'E', 'C']
const STATUT_META: Record<StatutPresence, { bg: string; color: string; label: string }> = {
  P: { bg: 'rgba(74,222,128,0.15)',  color: '#4ade80', label: 'Présent'  },
  A: { bg: 'rgba(248,113,113,0.15)', color: '#f87171', label: 'Absent'   },
  E: { bg: 'rgba(251,191,36,0.15)',  color: '#fbbf24', label: 'Excusé'   },
  C: { bg: 'rgba(96,165,250,0.15)',  color: '#60a5fa', label: 'Convoqué' },
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 14px', backgroundColor: '#0D0D0B',
  border: '1px solid #1E1E1C', borderRadius: '8px', color: '#F0EDE6',
  fontSize: '14px', outline: 'none', fontFamily: 'var(--font-dm-sans), sans-serif',
  boxSizing: 'border-box', transition: 'border-color 0.15s, box-shadow 0.15s',
}

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: '13px', color: '#8A8880',
  marginBottom: '6px', fontFamily: 'var(--font-dm-sans), sans-serif',
}

const pdfSectionTitle: React.CSSProperties = {
  fontWeight: 700, fontSize: '9px', textTransform: 'uppercase',
  letterSpacing: '0.06em', marginBottom: '6px',
  borderBottom: '1px solid #ccc', paddingBottom: '3px', color: '#1a1a1a',
}

const sectionTitleStyle: React.CSSProperties = {
  fontFamily: 'var(--font-syne), sans-serif',
  fontSize: '16px', fontWeight: 700, color: '#F0EDE6',
  borderLeft: '3px solid #ea580c', paddingLeft: '12px',
  margin: '0 0 16px',
}

const cardStyle: React.CSSProperties = {
  backgroundColor: '#111110', border: '1px solid #1E1E1C',
  borderRadius: '12px', padding: '28px',
}

const focus = (e: React.FocusEvent<HTMLElement>) => {
  const t = e.target as HTMLElement
  t.style.borderColor = '#ea580c'
  t.style.boxShadow = '0 0 0 2px rgba(249,115,22,0.15)'
  t.style.outline = 'none'
}
const blur = (e: React.FocusEvent<HTMLElement>) => {
  const t = e.target as HTMLElement
  t.style.borderColor = '#1E1E1C'
  t.style.boxShadow = 'none'
}

function uid() { return Math.random().toString(36).slice(2) }
const emptyProfile = (): Profile => ({ nom: '', societe: '', adresse: '', telephone: '', email: '', siret: '', logo: '' })

// ─── Normalization helpers (handle both old and new saved formats) ─────────────

function normalizeReserve(r: unknown): Reserve {
  const raw = r as Record<string, unknown>
  const s = raw.statut as string
  const statut: 'Ouvert' | 'Levé' = (s === 'Levé' || s === 'levee') ? 'Levé' : 'Ouvert'
  return {
    id: String(raw.id ?? uid()),
    description: String(raw.description ?? ''),
    lot: String(raw.lot ?? ''),
    responsable: String(raw.responsable ?? ''),
    statut,
    dateCreation: String(raw.dateCreation ?? new Date().toISOString().split('T')[0]),
    photos: Array.isArray(raw.photos) ? raw.photos as string[] : [],
  }
}

function normalizeDecision(d: unknown): Decision {
  const raw = d as Record<string, unknown>
  return {
    id: String(raw.id ?? uid()),
    description: String(raw.description ?? raw.texte ?? ''),
    responsable: String(raw.responsable ?? ''),
    echeance: String(raw.echeance ?? ''),
  }
}

function normalizeLot(l: unknown): Lot {
  const raw = l as Record<string, unknown>
  return {
    id: String(raw.id ?? uid()),
    nom: String(raw.nom ?? ''),
    intervenant: String(raw.intervenant ?? ''),
    dateDemarrage: String(raw.dateDemarrage ?? ''),
    dateFin: String(raw.dateFin ?? ''),
    avancement: Number(raw.avancement ?? 0),
  }
}

function parseObservations(raw: string | null) {
  const empty = { texte: '', presences: [] as PresenceRow[], reserves: [] as Reserve[], decisions: [] as Decision[], lots: [] as Lot[], lotSuivi: {} as Record<string, LotSuiviEntry> }
  if (!raw) return empty
  try {
    const p = JSON.parse(raw)
    return {
      texte: String(p.texte ?? p.observations ?? ''),
      presences: (Array.isArray(p.presences) ? p.presences : []) as PresenceRow[],
      reserves: (Array.isArray(p.reserves) ? p.reserves : []).map(normalizeReserve),
      decisions: (Array.isArray(p.decisions) ? p.decisions : []).map(normalizeDecision),
      lots: (Array.isArray(p.lots) ? p.lots : []).map(normalizeLot),
      lotSuivi: (p.lotSuivi && typeof p.lotSuivi === 'object' ? p.lotSuivi : {}) as Record<string, LotSuiviEntry>,
    }
  } catch {
    return { ...empty, texte: raw }
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ModifierCompteRendu({ compteRendu: cr }: { compteRendu: CompteRenduWithChantier }) {
  const router = useRouter()

  const initialData = parseObservations(cr.observations)

  const [chantiers, setChantiers] = useState<Chantier[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [existingPhotos, setExistingPhotos] = useState<string[]>(cr.photos ?? [])
  const [photoFiles, setPhotoFiles] = useState<File[]>([])
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([])
  const [annotatorState, setAnnotatorState] = useState<{ reserveId: string; imageSrc: string } | null>(null)
  const [profile, setProfile] = useState<Profile>(emptyProfile())
  const [presences, setPresences] = useState<PresenceRow[]>(initialData.presences)
  const [reserves, setReserves] = useState<Reserve[]>(initialData.reserves)
  const [decisions, setDecisions] = useState<Decision[]>(initialData.decisions)
  const [lots, setLots] = useState<Lot[]>(initialData.lots)
  const [lotSuivi, setLotSuivi] = useState<Record<string, LotSuiviEntry>>(initialData.lotSuivi)
  const [lotSuiviNewFiles, setLotSuiviNewFiles] = useState<Record<string, File[]>>({})
  const [lotSuiviNewPreviews, setLotSuiviNewPreviews] = useState<Record<string, string[]>>({})
  const [allArtisans, setAllArtisans] = useState<{ id: string; nom: string; metier: string | null }[]>([])
  const [addArtisanOpen, setAddArtisanOpen] = useState(false)
  const addArtisanBtnRef = useRef<HTMLButtonElement>(null)
  const addArtisanDropdownRef = useRef<HTMLDivElement>(null)
  const initialPresencesRef = useRef(initialData.presences)

  const [form, setForm] = useState({
    chantier_id: cr.chantier_id,
    date_visite: cr.date_visite,
    date_prochaine_visite: cr.date_prochaine_visite ?? '',
    progression: cr.progression,
    observations: initialData.texte,
    travaux_a_faire: cr.travaux_a_faire ?? '',
  })

  // Load chantiers + all artisans for the manual-add dropdown
  useEffect(() => {
    const supabase = createClient()
    supabase.from('chantiers').select('*').order('nom')
      .then(({ data }) => setChantiers((data ?? []) as Chantier[]))
    supabase.from('artisans').select('id, nom, metier').order('nom')
      .then(({ data }) => setAllArtisans((data ?? []) as { id: string; nom: string; metier: string | null }[]))
  }, [])

  // Reload presences when chantier changes; on initial mount, merge with saved data
  useEffect(() => {
    if (!form.chantier_id) {
      setPresences([])
      return
    }
    const saved = initialPresencesRef.current
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const isInitialChantier = form.chantier_id === cr.chantier_id
    createClient()
      .from('chantiers_artisans')
      .select('artisan_id, artisans(id, nom, metier)')
      .eq('chantier_id', form.chantier_id)
      .then(({ data }) => {
        const rows = (data ?? []) as unknown as { artisan_id: string; artisans: { id: string; nom: string; metier: string | null } | null }[]
        const artisanRows = rows.filter((r) => r.artisans)
        if (isInitialChantier && saved.length > 0) {
          const existingById = new Map(saved.map((p) => [p.artisanId, p]))
          const chantierIds = new Set(artisanRows.map((r) => r.artisans!.id))
          const merged: PresenceRow[] = [
            ...artisanRows.map((r) => existingById.get(r.artisans!.id) ?? {
              artisanId: r.artisans!.id, nom: r.artisans!.nom, societe: r.artisans!.metier ?? '', statut: 'A' as StatutPresence, convoque: false,
            }),
            ...saved.filter((p) => !chantierIds.has(p.artisanId)),
          ]
          setPresences(merged)
        } else {
          setPresences(artisanRows.map((r) => ({
            artisanId: r.artisans!.id, nom: r.artisans!.nom, societe: r.artisans!.metier ?? '', statut: 'A' as StatutPresence, convoque: false,
          })))
        }
      })
  }, [form.chantier_id]) // eslint-disable-line react-hooks/exhaustive-deps

  // Close the add-artisan dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node
      const inBtn = addArtisanBtnRef.current?.contains(target)
      const inDropdown = addArtisanDropdownRef.current?.contains(target)
      if (!inBtn && !inDropdown) {
        setAddArtisanOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Load profile: localStorage as base, then fill empty fields from entreprise_infos
  useEffect(() => {
    let base = emptyProfile()
    try {
      const saved = localStorage.getItem('foreman_profile')
      if (saved) base = { ...emptyProfile(), ...JSON.parse(saved) }
    } catch {}
    setProfile(base)

    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return

      const { data: ei } = await supabase
        .from('entreprise_infos')
        .select('raison_sociale, adresse, code_postal, ville, telephone, email, siret, logo_url')
        .eq('user_id', user.id)
        .maybeSingle()

      if (ei) {
        const adresse = [ei.adresse, ei.code_postal, ei.ville].filter(Boolean).join(', ')
        setProfile((prev) => ({
          ...prev,
          societe:   prev.societe   || ei.raison_sociale || '',
          adresse:   prev.adresse   || adresse,
          telephone: prev.telephone || ei.telephone || '',
          email:     prev.email     || ei.email || '',
          siret:     prev.siret     || ei.siret || '',
          logo:      prev.logo      || ei.logo_url || '',
        }))
        return
      }

      const { data: prof } = await supabase
        .from('profiles')
        .select('entreprise, prenom, nom, adresse')
        .eq('id', user.id)
        .maybeSingle()

      if (prof) {
        setProfile((prev) => ({
          ...prev,
          societe: prev.societe || prof.entreprise || '',
          nom:     prev.nom     || [prof.prenom, prof.nom].filter(Boolean).join(' '),
          adresse: prev.adresse || prof.adresse || '',
        }))
      }
    })
  }, [])

  const selectedChantier = chantiers.find((c) => c.id === form.chantier_id)
  const pdfChantier = selectedChantier ?? cr.chantiers

  function setField(field: string, value: unknown) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function saveProfile(p: Profile) {
    setProfile(p)
    localStorage.setItem('foreman_profile', JSON.stringify(p))
  }

  // ── Presences ──
  function cycleStatut(id: string) {
    setPresences((prev) => prev.map((p) =>
      p.artisanId === id
        ? { ...p, statut: STATUT_ORDER[(STATUT_ORDER.indexOf(p.statut) + 1) % STATUT_ORDER.length] }
        : p
    ))
  }
  function toggleConvoque(id: string) {
    setPresences((prev) => prev.map((p) => p.artisanId === id ? { ...p, convoque: !p.convoque } : p))
  }
  function removePresence(id: string) {
    setPresences((prev) => prev.filter((p) => p.artisanId !== id))
  }
  function addArtisanToPresences(artisan: { id: string; nom: string; metier: string | null }) {
    setPresences((prev) => [...prev, { artisanId: artisan.id, nom: artisan.nom, societe: artisan.metier ?? '', statut: 'A', convoque: false }])
    setAddArtisanOpen(false)
  }

  // ── Reserves ──
  function addReserve() {
    setReserves((prev) => [...prev, {
      id: uid(), description: '', lot: '', responsable: '',
      statut: 'Ouvert', dateCreation: new Date().toISOString().split('T')[0], photos: [],
    }])
  }
  function updateReserve(id: string, field: keyof Reserve, value: unknown) {
    setReserves((prev) => prev.map((r) => r.id === id ? { ...r, [field]: value } : r))
  }
  function deleteReserve(id: string) { setReserves((prev) => prev.filter((r) => r.id !== id)) }
  function handleAnnotated(dataUrl: string) {
    if (!annotatorState) return
    setReserves((prev) => prev.map((r) =>
      r.id === annotatorState.reserveId ? { ...r, photos: [...r.photos, dataUrl] } : r
    ))
    setAnnotatorState(null)
  }
  function removeReservePhoto(reserveId: string, idx: number) {
    setReserves((prev) => prev.map((r) =>
      r.id === reserveId ? { ...r, photos: r.photos.filter((_, i) => i !== idx) } : r
    ))
  }

  // ── Decisions ──
  function addDecision() { setDecisions((prev) => [...prev, { id: uid(), description: '', responsable: '', echeance: '' }]) }
  function updateDecision(id: string, field: keyof Decision, value: string) {
    setDecisions((prev) => prev.map((d) => d.id === id ? { ...d, [field]: value } : d))
  }
  function deleteDecision(id: string) { setDecisions((prev) => prev.filter((d) => d.id !== id)) }

  // ── Lots ──
  function addLot() { setLots((prev) => [...prev, { id: uid(), nom: '', intervenant: '', dateDemarrage: '', dateFin: '', avancement: 0 }]) }
  function updateLot(id: string, field: keyof Lot, value: unknown) {
    setLots((prev) => prev.map((l) => l.id === id ? { ...l, [field]: value } : l))
  }
  function deleteLot(id: string) { setLots((prev) => prev.filter((l) => l.id !== id)) }

  // ── Lot suivi photos ──
  function addLotSuiviPhoto(lotId: string, file: File) {
    const preview = URL.createObjectURL(file)
    setLotSuiviNewFiles((prev) => ({ ...prev, [lotId]: [...(prev[lotId] ?? []), file] }))
    setLotSuiviNewPreviews((prev) => ({ ...prev, [lotId]: [...(prev[lotId] ?? []), preview] }))
  }
  function updateLotSuiviObs(lotId: string, value: string) {
    setLotSuivi((prev) => {
      const cur = prev[lotId] ?? { observations: '', photos: [] }
      return { ...prev, [lotId]: { ...cur, observations: value } }
    })
  }
  function removeLotSuiviExistingPhoto(lotId: string, idx: number) {
    setLotSuivi((prev) => {
      const entry = prev[lotId] ?? { observations: '', photos: [] }
      return { ...prev, [lotId]: { ...entry, photos: entry.photos.filter((_, i) => i !== idx) } }
    })
  }
  function removeLotSuiviNewPhoto(lotId: string, idx: number) {
    setLotSuiviNewFiles((prev) => ({ ...prev, [lotId]: (prev[lotId] ?? []).filter((_, i) => i !== idx) }))
    setLotSuiviNewPreviews((prev) => {
      const urls = prev[lotId] ?? []
      URL.revokeObjectURL(urls[idx])
      return { ...prev, [lotId]: urls.filter((_, i) => i !== idx) }
    })
  }
  async function uploadLotSuiviPhotos(): Promise<Record<string, LotSuiviEntry>> {
    const supabase = createClient()
    const result: Record<string, LotSuiviEntry> = { ...lotSuivi }
    for (const lotId of Object.keys(lotSuiviNewFiles)) {
      const files = lotSuiviNewFiles[lotId] ?? []
      if (!files.length) continue
      const uploaded: string[] = []
      for (const file of files) {
        const ext = file.name.split('.').pop()
        const path = `${form.chantier_id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
        const { error } = await supabase.storage.from('photos-chantier').upload(path, file)
        if (error) throw new Error(`Upload photo lot : ${error.message}`)
        const { data: urlData } = supabase.storage.from('photos-chantier').getPublicUrl(path)
        uploaded.push(urlData.publicUrl)
      }
      const existing = result[lotId] ?? { observations: '', photos: [] }
      result[lotId] = { ...existing, photos: [...existing.photos, ...uploaded] }
    }
    return result
  }

  // ── Photos ──
  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    setPhotoFiles((prev) => [...prev, ...files])
    setPhotoPreviews((prev) => [...prev, ...files.map((f) => URL.createObjectURL(f))])
  }
  function removeExistingPhoto(i: number) {
    setExistingPhotos((prev) => prev.filter((_, j) => j !== i))
  }
  function removeNewPhoto(i: number) {
    setPhotoFiles((prev) => prev.filter((_, j) => j !== i))
    setPhotoPreviews((prev) => { URL.revokeObjectURL(prev[i]); return prev.filter((_, j) => j !== i) })
  }

  async function uploadNewPhotos(): Promise<string[]> {
    if (!photoFiles.length) return []
    const supabase = createClient()
    const urls: string[] = []
    for (const file of photoFiles) {
      const ext = file.name.split('.').pop()
      const path = `${form.chantier_id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const { error } = await supabase.storage.from('photos-chantier').upload(path, file)
      if (error) throw new Error(`Upload photo : ${error.message}`)
      const { data: urlData } = supabase.storage.from('photos-chantier').getPublicUrl(path)
      urls.push(urlData.publicUrl)
    }
    return urls
  }

  // ── Submit ──
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.chantier_id) { setError('Veuillez sélectionner un chantier.'); return }
    setError(null)
    setLoading(true)
    try {
      const newPhotoUrls = await uploadNewPhotos()
      const allPhotos = [...existingPhotos, ...newPhotoUrls]
      const artisansPresentsList = presences.filter((p) => p.statut === 'P').map((p) => p.nom)
      const lotSuiviData = await uploadLotSuiviPhotos()

      const observationsData = {
        texte: form.observations,
        presences,
        reserves,
        decisions,
        lots,
        lotSuivi: lotSuiviData,
      }

      await updateCompteRendu(cr.id, {
        chantier_id: form.chantier_id,
        date_visite: form.date_visite,
        date_prochaine_visite: form.date_prochaine_visite || null,
        progression: form.progression,
        observations: JSON.stringify(observationsData),
        travaux_a_faire: form.travaux_a_faire || null,
        artisans_presents: artisansPresentsList,
        photos: allPhotos,
      })

      toast.success('Compte rendu mis à jour')
      router.push(`/dashboard/comptes-rendus/${cr.id}`)
      router.refresh()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue.')
      setLoading(false)
    }
  }

  // Inline cell style for Lots table
  const cellInput: React.CSSProperties = {
    ...inputStyle, padding: '6px 10px', fontSize: '13px',
    backgroundColor: 'transparent', border: '1px solid transparent',
  }

  // Options pour l'autocomplete artisan
  const allIntervenants = [
    ...allArtisans.map(a => ({ value: a.nom, label: `${a.nom}${a.metier ? ` — ${a.metier}` : ''}` })),
    ...presences
      .filter(p => p.artisanId.startsWith('ext_') && !allArtisans.some(a => a.nom === p.nom))
      .map(p => ({ value: p.nom, label: `${p.nom}${p.societe ? ` — ${p.societe}` : ''}` })),
  ]

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div style={{ flex: 1, padding: '32px 40px', overflowY: 'auto' }}>

      {/* Page header */}
      <div style={{ marginBottom: '28px' }}>
        <Link href={`/dashboard/comptes-rendus/${cr.id}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, backgroundColor: '#111110', border: '1px solid #1E1E1C', borderRadius: 8, padding: '8px 14px', color: '#F0EDE6', fontSize: 13, fontWeight: 500, cursor: 'pointer', textDecoration: 'none', transition: 'all 0.15s ease', fontFamily: 'var(--font-dm-sans), sans-serif', marginBottom: 12 }}
          onMouseEnter={e => { e.currentTarget.style.background = '#1E1E1C'; e.currentTarget.style.borderColor = '#ea580c'; e.currentTarget.style.color = '#ea580c' }}
          onMouseLeave={e => { e.currentTarget.style.background = '#111110'; e.currentTarget.style.borderColor = '#1E1E1C'; e.currentTarget.style.color = '#F0EDE6' }}
        >
          <span style={{ color: '#ea580c' }}>←</span>
          Retour au compte rendu
        </Link>
        <h1 style={{ fontFamily: 'var(--font-syne), sans-serif', fontSize: '24px', fontWeight: 700, color: '#F0EDE6', margin: 0 }}>
          Modifier le compte rendu
        </h1>
      </div>

      {/* 2-column layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: '28px', alignItems: 'start' }}>

        {/* ── Left : scrollable form ── */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>

          {/* ── GÉNÉRAL ── */}
          <div>
            <h2 style={sectionTitleStyle}>Général</h2>
            <div style={cardStyle}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                  <label style={labelStyle}>Chantier associé *</label>
                  <div style={{ position: 'relative' }}>
                    <select value={form.chantier_id} onChange={(e) => setField('chantier_id', e.target.value)} required
                      style={{ ...inputStyle, cursor: 'pointer', appearance: 'none', WebkitAppearance: 'none', paddingRight: '40px' } as React.CSSProperties}
                      onFocus={(e) => { focus(e); (e.target.nextSibling as HTMLElement).style.opacity = '1' }}
                      onBlur={(e) => { blur(e); (e.target.nextSibling as HTMLElement).style.opacity = '0.5' }}>
                      <option value="" style={{ backgroundColor: '#111110' }}>Sélectionner un chantier…</option>
                      {chantiers.map((c) => (
                        <option key={c.id} value={c.id} style={{ backgroundColor: '#111110' }}>{c.nom} — {c.client}</option>
                      ))}
                    </select>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none"
                      style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', opacity: 0.5, transition: 'opacity 0.15s' }}>
                      <path d="M4 6L8 10L12 6" stroke="#ea580c" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={labelStyle}>Date de visite *</label>
                    <input type="date" value={form.date_visite} onChange={(e) => setField('date_visite', e.target.value)} required
                      style={{ ...inputStyle, colorScheme: 'dark' } as React.CSSProperties} onFocus={focus} onBlur={blur} />
                  </div>
                  <div>
                    <label style={labelStyle}>Prochaine visite</label>
                    <input type="date" value={form.date_prochaine_visite} onChange={(e) => setField('date_prochaine_visite', e.target.value)}
                      style={{ ...inputStyle, colorScheme: 'dark' } as React.CSSProperties} onFocus={focus} onBlur={blur} />
                  </div>
                </div>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <label style={{ ...labelStyle, marginBottom: 0 }}>Avancement</label>
                    <span style={{ fontFamily: 'var(--font-syne), sans-serif', fontSize: '14px', fontWeight: 700, color: '#ea580c' }}>{form.progression}%</span>
                  </div>
                  <input type="range" min={0} max={100} step={5} value={form.progression}
                    onChange={(e) => setField('progression', parseInt(e.target.value))}
                    style={{ width: '100%', accentColor: '#ea580c', cursor: 'pointer' }} />
                </div>
              </div>
            </div>
          </div>

          {/* ── PRÉSENCES ── */}
          <div>
            <h2 style={sectionTitleStyle}>Présences</h2>
            <div style={cardStyle}>
              {!form.chantier_id ? (
                <p style={{ color: '#8A8880', fontSize: '14px', fontFamily: 'var(--font-dm-sans), sans-serif', fontStyle: 'italic', margin: 0 }}>
                  Sélectionnez d&apos;abord un chantier dans la section Général.
                </p>
              ) : presences.length > 0 ? (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      {['Nom', 'Société / Métier', 'Statut', 'Convoqué prochaine réunion'].map((h) => (
                        <th key={h} style={{
                          fontFamily: 'var(--font-syne), sans-serif', fontWeight: 700,
                          fontSize: '11px', letterSpacing: '0.08em', textTransform: 'uppercase',
                          color: '#7A7870', textAlign: 'left', padding: '8px 12px', borderBottom: '1px solid #1E1E1C',
                        }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {presences.map((p, i) => {
                      const meta = STATUT_META[p.statut]
                      return (
                        <tr key={p.artisanId} style={{ backgroundColor: i % 2 === 0 ? '#0D0D0B' : '#111110' }}>
                          <td style={{ padding: '10px 12px', fontSize: '14px', color: '#F0EDE6', fontFamily: 'var(--font-dm-sans), sans-serif' }}>
                            {p.nom}
                          </td>
                          <td style={{ padding: '10px 12px', fontSize: '13px', color: '#8A8880', fontFamily: 'var(--font-dm-sans), sans-serif' }}>
                            {p.societe || '—'}
                          </td>
                          <td style={{ padding: '10px 12px' }}>
                            <button type="button" onClick={() => cycleStatut(p.artisanId)} title={meta.label}
                              style={{
                                width: '34px', height: '34px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                                backgroundColor: meta.bg, color: meta.color,
                                fontFamily: 'var(--font-syne), sans-serif', fontWeight: 700, fontSize: '13px', transition: 'all 0.15s',
                              }}>
                              {p.statut}
                            </button>
                          </td>
                          <td style={{ padding: '10px 12px' }}>
                            <button type="button" onClick={() => toggleConvoque(p.artisanId)}
                              style={{
                                width: '20px', height: '20px', borderRadius: '4px', cursor: 'pointer',
                                border: `2px solid ${p.convoque ? '#ea580c' : '#3A3A38'}`,
                                backgroundColor: p.convoque ? '#ea580c' : 'transparent',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                              }}>
                              {p.convoque && <span style={{ color: '#0D0D0B', fontSize: '10px', fontWeight: 700, lineHeight: 1 }}>✓</span>}
                            </button>
                          </td>
                          <td style={{ padding: '10px 8px' }}>
                            <button type="button" onClick={() => removePresence(p.artisanId)}
                              style={{ width: '28px', height: '28px', borderRadius: '6px', backgroundColor: 'transparent', border: '1px solid #1E1E1C', color: '#8A8880', cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#1E1E1C'; e.currentTarget.style.color = '#EF4444'; e.currentTarget.style.borderColor = '#EF4444' }}
                              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#8A8880'; e.currentTarget.style.borderColor = '#1E1E1C' }}>
                              ×
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              ) : null}

              {/* + Ajouter un artisan */}
              {form.chantier_id && (
                <div style={{ position: 'relative', display: 'inline-block', marginTop: presences.length > 0 ? '12px' : '0' }}>
                  <button ref={addArtisanBtnRef} type="button"
                    onClick={() => setAddArtisanOpen((o) => !o)}
                    style={{
                      padding: '8px 14px', backgroundColor: 'transparent', border: '1px dashed #1E1E1C',
                      borderRadius: '8px', color: '#8A8880', fontSize: '13px', cursor: 'pointer',
                      fontFamily: 'var(--font-dm-sans), sans-serif', transition: 'all 0.15s',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(249,115,22,0.4)'; e.currentTarget.style.color = '#ea580c' }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#1E1E1C'; e.currentTarget.style.color = '#8A8880' }}>
                    + Ajouter un artisan
                  </button>
                  {addArtisanOpen && (
                    <div ref={addArtisanDropdownRef} style={{
                      position: 'absolute', top: 'calc(100% + 4px)', left: 0,
                      minWidth: '240px',
                      backgroundColor: '#111110', border: '1px solid #1E1E1C', borderRadius: '10px',
                      zIndex: 9999, maxHeight: '200px', overflowY: 'auto',
                      boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                    }}>
                      {(() => {
                        const filtered = allArtisans.filter((a) => !presences.some((p) => p.artisanId === a.id))
                        if (filtered.length === 0) return (
                          <div style={{ padding: '12px 16px', fontSize: '13px', color: '#8A8880', fontFamily: 'var(--font-dm-sans), sans-serif' }}>
                            Tous les artisans sont déjà ajoutés.
                          </div>
                        )
                        return filtered.map((a, i) => (
                          <button key={a.id} type="button"
                            onClick={(e) => { e.stopPropagation(); addArtisanToPresences(a) }}
                            style={{
                              width: '100%', display: 'flex', flexDirection: 'column', gap: '2px',
                              padding: '12px 16px', backgroundColor: 'transparent',
                              border: 'none', borderBottom: i < filtered.length - 1 ? '1px solid #1E1E1C' : 'none',
                              cursor: 'pointer', textAlign: 'left', boxSizing: 'border-box',
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#1E1E1C' }}
                            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}>
                            <span style={{ fontSize: '14px', fontWeight: 600, color: '#F0EDE6', fontFamily: 'var(--font-dm-sans), sans-serif' }}>{a.nom}</span>
                            {a.metier && <span style={{ fontSize: '12px', color: '#8A8880', fontFamily: 'var(--font-dm-sans), sans-serif' }}>{a.metier}</span>}
                          </button>
                        ))
                      })()}
                    </div>
                  )}
                </div>
              )}

              {form.chantier_id && (
                <div style={{ display: 'flex', gap: '16px', marginTop: '14px', fontSize: '12px', fontFamily: 'var(--font-dm-sans), sans-serif' }}>
                  {STATUT_ORDER.map((s) => (
                    <span key={s} style={{ color: STATUT_META[s].color }}>● {s} = {STATUT_META[s].label}</span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ── AVANCEMENT DES LOTS ── */}
          <div>
            <h2 style={sectionTitleStyle}>Avancement des lots</h2>
            <div style={cardStyle}>
              {lots.length > 0 && (
                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '16px' }}>
                  <thead>
                    <tr>
                      {['Lot', 'Intervenant', 'Démarrage', 'Fin', 'Avancement', ''].map((h) => (
                        <th key={h} style={{
                          fontFamily: 'var(--font-syne), sans-serif', fontWeight: 700, fontSize: '11px',
                          letterSpacing: '0.08em', textTransform: 'uppercase', color: '#7A7870',
                          textAlign: 'left', padding: '8px 10px', borderBottom: '1px solid #1E1E1C',
                        }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {lots.map((l, i) => (
                      <tr key={l.id} style={{ backgroundColor: i % 2 === 0 ? '#0D0D0B' : '#111110' }}>
                        <td style={{ padding: '6px 8px' }}>
                          <input value={l.nom} onChange={(e) => updateLot(l.id, 'nom', e.target.value)} placeholder="Nom du lot"
                            style={cellInput}
                            onFocus={(e) => { e.target.style.borderColor = '#ea580c'; e.target.style.backgroundColor = '#0D0D0B' }}
                            onBlur={(e) => { e.target.style.borderColor = 'transparent'; e.target.style.backgroundColor = 'transparent' }} />
                        </td>
                        <td style={{ padding: '6px 8px' }}>
                          <ArtisanAutocomplete
                            value={l.intervenant}
                            onChange={(v) => updateLot(l.id, 'intervenant', v)}
                            options={allIntervenants}
                            placeholder="— Artisan —"
                          />
                        </td>
                        <td style={{ padding: '6px 8px' }}>
                          <input type="date" value={l.dateDemarrage} onChange={(e) => updateLot(l.id, 'dateDemarrage', e.target.value)}
                            style={{ ...cellInput, colorScheme: 'dark' } as React.CSSProperties}
                            onFocus={(e) => { e.target.style.borderColor = '#ea580c'; e.target.style.backgroundColor = '#0D0D0B' }}
                            onBlur={(e) => { e.target.style.borderColor = 'transparent'; e.target.style.backgroundColor = 'transparent' }} />
                        </td>
                        <td style={{ padding: '6px 8px' }}>
                          <input type="date" value={l.dateFin} onChange={(e) => updateLot(l.id, 'dateFin', e.target.value)}
                            style={{ ...cellInput, colorScheme: 'dark' } as React.CSSProperties}
                            onFocus={(e) => { e.target.style.borderColor = '#ea580c'; e.target.style.backgroundColor = '#0D0D0B' }}
                            onBlur={(e) => { e.target.style.borderColor = 'transparent'; e.target.style.backgroundColor = 'transparent' }} />
                        </td>
                        <td style={{ padding: '6px 8px', minWidth: '130px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <input type="range" min={0} max={100} step={5} value={l.avancement}
                              onChange={(e) => updateLot(l.id, 'avancement', parseInt(e.target.value))}
                              style={{ flex: 1, accentColor: '#ea580c', cursor: 'pointer' }} />
                            <span style={{ fontSize: '12px', color: '#ea580c', fontWeight: 600, fontFamily: 'var(--font-syne), sans-serif', width: '32px', textAlign: 'right', flexShrink: 0 }}>
                              {l.avancement}%
                            </span>
                          </div>
                        </td>
                        <td style={{ padding: '6px 4px' }}>
                          <button type="button" onClick={() => deleteLot(l.id)}
                            style={{ background: 'none', border: 'none', color: '#8A8880', cursor: 'pointer', fontSize: '16px' }}>×</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              <button type="button" onClick={addLot}
                style={{ padding: '14px', border: '1px dashed #1E1E1C', borderRadius: '10px', backgroundColor: 'transparent', color: '#8A8880', fontSize: '13px', fontFamily: 'var(--font-dm-sans), sans-serif', cursor: 'pointer', width: '100%', transition: 'all 0.15s' }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(249,115,22,0.4)'; e.currentTarget.style.color = '#ea580c' }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#1E1E1C'; e.currentTarget.style.color = '#8A8880' }}>
                + Ajouter un lot
              </button>
            </div>
          </div>

          {/* ── SUIVI PAR LOT ── */}
          <div>
            <h2 style={sectionTitleStyle}>Suivi par lot</h2>
            <div style={cardStyle}>
              {lots.length === 0 ? (
                <p style={{ color: '#8A8880', fontSize: '14px', fontFamily: 'var(--font-dm-sans), sans-serif', fontStyle: 'italic', margin: 0 }}>
                  Ajoutez des lots dans la section Avancement des lots pour activer le suivi par lot.
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {lots.map((l) => {
                    const entry = lotSuivi[l.id] ?? { observations: '', photos: [] }
                    return (
                      <div key={l.id} style={{ backgroundColor: '#0D0D0B', border: '1px solid #1E1E1C', borderRadius: '10px', padding: '16px' }}>
                        <div style={{ marginBottom: '10px' }}>
                          <span style={{ fontFamily: 'var(--font-syne), sans-serif', fontWeight: 700, fontSize: '13px', color: '#ea580c' }}>
                            {l.nom || 'Lot sans nom'}{l.intervenant ? ` — ${l.intervenant}` : ''}
                          </span>
                        </div>
                        <div style={{ marginBottom: '10px' }}>
                          <label style={labelStyle}>Observations</label>
                          <textarea
                            value={entry.observations}
                            onChange={(e) => updateLotSuiviObs(l.id, e.target.value)}
                            rows={3}
                            placeholder="Notes, points en cours, éléments à surveiller..."
                            style={{ ...inputStyle, resize: 'vertical', lineHeight: '1.5', fontSize: '13px' }}
                            onFocus={focus} onBlur={blur}
                          />
                        </div>
                        {/* Photos existantes + nouvelles */}
                        {(entry.photos.length > 0 || (lotSuiviNewPreviews[l.id] ?? []).length > 0) && (
                          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '10px' }}>
                            {entry.photos.map((url, pi) => (
                              <div key={`ex-${pi}`} style={{ position: 'relative', display: 'inline-block' }}>
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={url} alt="" style={{ width: '72px', height: '72px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #1E1E1C', display: 'block' }} />
                                <button type="button" onClick={() => removeLotSuiviExistingPhoto(l.id, pi)}
                                  style={{ position: 'absolute', top: '-6px', right: '-6px', width: '18px', height: '18px', borderRadius: '50%', backgroundColor: '#EF4444', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '11px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10, lineHeight: 1 }}>
                                  ×
                                </button>
                              </div>
                            ))}
                            {(lotSuiviNewPreviews[l.id] ?? []).map((src, pi) => (
                              <div key={`new-${pi}`} style={{ position: 'relative', display: 'inline-block' }}>
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={src} alt="" style={{ width: '72px', height: '72px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #ea580c', display: 'block' }} />
                                <button type="button" onClick={() => removeLotSuiviNewPhoto(l.id, pi)}
                                  style={{ position: 'absolute', top: '-6px', right: '-6px', width: '18px', height: '18px', borderRadius: '50%', backgroundColor: '#EF4444', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '11px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10, lineHeight: 1 }}>
                                  ×
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                        <label style={{ cursor: 'pointer', display: 'inline-block' }}>
                          <span style={{ padding: '4px 12px', backgroundColor: 'rgba(249,115,22,0.1)', color: '#ea580c', borderRadius: '6px', fontSize: '12px', fontWeight: 500, fontFamily: 'var(--font-dm-sans), sans-serif' }}>
                            📷 Ajouter photo
                          </span>
                          <input type="file" accept="image/*" style={{ display: 'none' }}
                            onChange={(e) => {
                              const file = e.target.files?.[0]
                              if (!file) return
                              addLotSuiviPhoto(l.id, file)
                              e.target.value = ''
                            }} />
                        </label>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* ── REMARQUES GÉNÉRALES ── */}
          <div>
            <h2 style={sectionTitleStyle}>Remarques générales</h2>
            <div style={cardStyle}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                  <label style={labelStyle}>Remarques générales</label>
                  <textarea value={form.observations} onChange={(e) => setField('observations', e.target.value)} rows={4}
                    placeholder="Décrivez l'état du chantier, les points importants observés…"
                    style={{ ...inputStyle, resize: 'vertical', lineHeight: '1.6' }} onFocus={focus} onBlur={blur} />
                </div>
                <div>
                  <label style={labelStyle}>Travaux à réaliser</label>
                  <textarea value={form.travaux_a_faire} onChange={(e) => setField('travaux_a_faire', e.target.value)} rows={3}
                    placeholder="Listez les tâches à effectuer avant la prochaine visite…"
                    style={{ ...inputStyle, resize: 'vertical', lineHeight: '1.6' }} onFocus={focus} onBlur={blur} />
                </div>
              </div>
            </div>
          </div>

          {/* ── OBSERVATIONS / POINTS DE SUIVI ── */}
          <div>
            <h2 style={sectionTitleStyle}>Observations / Points de suivi</h2>
            <div style={cardStyle}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {reserves.map((r, idx) => (
                  <div key={r.id} style={{ backgroundColor: '#0D0D0B', border: '1px solid #1E1E1C', borderRadius: '10px', padding: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                      <span style={{ fontFamily: 'var(--font-syne), sans-serif', fontWeight: 700, fontSize: '14px', color: '#ea580c' }}>
                        Observation 1.{idx + 1}
                      </span>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <button type="button"
                          onClick={() => updateReserve(r.id, 'statut', r.statut === 'Ouvert' ? 'Levé' : 'Ouvert')}
                          style={{
                            padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 500,
                            border: 'none', cursor: 'pointer', fontFamily: 'var(--font-dm-sans), sans-serif',
                            backgroundColor: r.statut === 'Ouvert' ? 'rgba(248,113,113,0.15)' : 'rgba(74,222,128,0.15)',
                            color: r.statut === 'Ouvert' ? '#f87171' : '#4ade80',
                          }}>
                          {r.statut}
                        </button>
                        <button type="button" onClick={() => deleteReserve(r.id)}
                          style={{ background: 'none', border: 'none', color: '#8A8880', cursor: 'pointer', fontSize: '18px', padding: '0 4px', lineHeight: 1 }}>
                          ×
                        </button>
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                      <div style={{ gridColumn: '1 / -1' }}>
                        <label style={labelStyle}>Description</label>
                        <textarea value={r.description} onChange={(e) => updateReserve(r.id, 'description', e.target.value)}
                          rows={2} placeholder="Décrire l'observation…"
                          style={{ ...inputStyle, resize: 'vertical', lineHeight: '1.5', fontSize: '13px' }}
                          onFocus={focus} onBlur={blur} />
                      </div>
                      <div>
                        <label style={labelStyle}>Lot concerné</label>
                        <select value={r.lot} onChange={(e) => updateReserve(r.id, 'lot', e.target.value)}
                          style={{ ...inputStyle, appearance: 'none', fontSize: '13px' } as React.CSSProperties}
                          onFocus={focus} onBlur={blur}>
                          <option value="">— Sélectionner —</option>
                          {lots.map((l) => <option key={l.id} value={l.nom} style={{ backgroundColor: '#111110' }}>{l.nom || '(sans nom)'}</option>)}
                        </select>
                      </div>
                      <div>
                        <label style={labelStyle}>Responsable</label>
                        <ArtisanAutocomplete
                          value={r.responsable}
                          onChange={(v) => updateReserve(r.id, 'responsable', v)}
                          options={allIntervenants}
                          placeholder="— Sélectionner —"
                        />
                      </div>
                    </div>
                    {/* Reserve photos */}
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                        <span style={{ ...labelStyle, marginBottom: 0 }}>Photos annotées</span>
                        <label style={{ cursor: 'pointer' }}>
                          <span style={{
                            padding: '3px 10px', backgroundColor: 'rgba(249,115,22,0.1)', color: '#ea580c',
                            borderRadius: '6px', fontSize: '12px', fontWeight: 500,
                            fontFamily: 'var(--font-dm-sans), sans-serif',
                          }}>
                            📷 Ajouter photo
                          </span>
                          <input type="file" accept="image/*" style={{ display: 'none' }}
                            onChange={(e) => {
                              const file = e.target.files?.[0]
                              if (!file) return
                              const src = URL.createObjectURL(file)
                              setAnnotatorState({ reserveId: r.id, imageSrc: src })
                              e.target.value = ''
                            }} />
                        </label>
                      </div>
                      {r.photos.length > 0 && (
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                          {r.photos.map((src, pi) => (
                            <div key={pi} style={{ position: 'relative', width: '80px', height: '80px' }}>
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={src} alt="" style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #1E1E1C' }} />
                              <button type="button" onClick={() => removeReservePhoto(r.id, pi)}
                                style={{ position: 'absolute', top: '3px', right: '3px', width: '18px', height: '18px', borderRadius: '50%', border: 'none', backgroundColor: 'rgba(0,0,0,0.75)', color: '#fff', cursor: 'pointer', fontSize: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}>
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                <button type="button" onClick={addReserve}
                  style={{ padding: '14px', border: '1px dashed #1E1E1C', borderRadius: '10px', backgroundColor: 'transparent', color: '#8A8880', fontSize: '13px', fontFamily: 'var(--font-dm-sans), sans-serif', cursor: 'pointer', transition: 'all 0.15s' }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(249,115,22,0.4)'; e.currentTarget.style.color = '#ea580c' }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#1E1E1C'; e.currentTarget.style.color = '#8A8880' }}>
                  + Ajouter une observation
                </button>
              </div>
            </div>
          </div>

          {/* ── DÉCISIONS ── */}
          <div>
            <h2 style={sectionTitleStyle}>Décisions</h2>
            <div style={cardStyle}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {decisions.map((d, idx) => (
                  <div key={d.id} style={{ display: 'grid', gridTemplateColumns: '1fr 160px 140px 28px', gap: '10px', alignItems: 'end', backgroundColor: '#0D0D0B', border: '1px solid #1E1E1C', borderRadius: '8px', padding: '16px' }}>
                    <div>
                      <label style={labelStyle}>Décision {idx + 1}</label>
                      <textarea value={d.description} onChange={(e) => updateDecision(d.id, 'description', e.target.value)}
                        rows={2} placeholder="Décrire la décision prise…"
                        style={{ ...inputStyle, resize: 'vertical', lineHeight: '1.5', fontSize: '13px' }} onFocus={focus} onBlur={blur} />
                    </div>
                    <div>
                      <label style={labelStyle}>Responsable</label>
                      <ArtisanAutocomplete
                        value={d.responsable}
                        onChange={(v) => updateDecision(d.id, 'responsable', v)}
                        options={allIntervenants}
                        placeholder="— Sélectionner —"
                      />
                    </div>
                    <div>
                      <label style={labelStyle}>Échéance</label>
                      <input type="date" value={d.echeance} onChange={(e) => updateDecision(d.id, 'echeance', e.target.value)}
                        style={{ ...inputStyle, colorScheme: 'dark', fontSize: '13px' } as React.CSSProperties} onFocus={focus} onBlur={blur} />
                    </div>
                    <button type="button" onClick={() => deleteDecision(d.id)}
                      style={{ background: 'none', border: 'none', color: '#8A8880', cursor: 'pointer', fontSize: '18px', paddingBottom: '10px' }}>
                      ×
                    </button>
                  </div>
                ))}
                <button type="button" onClick={addDecision}
                  style={{ padding: '14px', border: '1px dashed #1E1E1C', borderRadius: '10px', backgroundColor: 'transparent', color: '#8A8880', fontSize: '13px', fontFamily: 'var(--font-dm-sans), sans-serif', cursor: 'pointer', transition: 'all 0.15s' }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(249,115,22,0.4)'; e.currentTarget.style.color = '#ea580c' }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#1E1E1C'; e.currentTarget.style.color = '#8A8880' }}>
                  + Ajouter une décision
                </button>
              </div>
            </div>
          </div>

          {/* ── PHOTOS ── */}
          <div>
            <h2 style={sectionTitleStyle}>Photos</h2>
            <div style={cardStyle}>
              {/* Existing photos */}
              {existingPhotos.length > 0 && (
                <div style={{ marginBottom: '20px' }}>
                  <p style={{ ...labelStyle, marginBottom: '10px' }}>Photos existantes ({existingPhotos.length})</p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
                    {existingPhotos.map((url, i) => (
                      <div key={i} style={{ position: 'relative', borderRadius: '6px', overflow: 'hidden', aspectRatio: '1' }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <button type="button" onClick={() => removeExistingPhoto(i)}
                          style={{ position: 'absolute', top: '4px', right: '4px', width: '20px', height: '20px', borderRadius: '50%', border: 'none', backgroundColor: 'rgba(0,0,0,0.75)', color: '#fff', cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {/* Upload new photos */}
              <label style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px',
                padding: '28px', border: '1px dashed #1E1E1C', borderRadius: '8px', cursor: 'pointer',
                color: '#8A8880', fontSize: '13px', fontFamily: 'var(--font-dm-sans), sans-serif',
                marginBottom: photoPreviews.length ? '16px' : 0, transition: 'border-color 0.15s',
              }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'rgba(249,115,22,0.3)')}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#1E1E1C')}>
                <span style={{ fontSize: '28px' }}>↑</span>
                <span>Cliquer pour ajouter des photos</span>
                <span style={{ fontSize: '12px' }}>JPG, PNG, WEBP — plusieurs fichiers acceptés</span>
                <input type="file" accept="image/*" multiple onChange={handlePhotoChange} style={{ display: 'none' }} />
              </label>
              {photoPreviews.length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
                  {photoPreviews.map((src, i) => (
                    <div key={i} style={{ position: 'relative', borderRadius: '6px', overflow: 'hidden', aspectRatio: '1' }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <button type="button" onClick={() => removeNewPhoto(i)}
                        style={{ position: 'absolute', top: '4px', right: '4px', width: '20px', height: '20px', borderRadius: '50%', border: 'none', backgroundColor: 'rgba(0,0,0,0.75)', color: '#fff', cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ── PROFIL ── */}
          <div>
            <h2 style={sectionTitleStyle}>Profil</h2>
            <div style={cardStyle}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <p style={{ color: '#8A8880', fontSize: '13px', fontFamily: 'var(--font-dm-sans), sans-serif', margin: 0 }}>
                  Ces informations apparaissent dans l'en-tête du compte rendu. Sauvegardées automatiquement dans votre navigateur.
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={labelStyle}>Nom / Prénom</label>
                    <input value={profile.nom} onChange={(e) => saveProfile({ ...profile, nom: e.target.value })}
                      placeholder="Jean Dupont" style={inputStyle} onFocus={focus} onBlur={blur} />
                  </div>
                  <div>
                    <label style={labelStyle}>Société</label>
                    <input value={profile.societe} onChange={(e) => saveProfile({ ...profile, societe: e.target.value })}
                      placeholder="Cabinet d'architecture" style={inputStyle} onFocus={focus} onBlur={blur} />
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={labelStyle}>Adresse</label>
                    <input value={profile.adresse} onChange={(e) => saveProfile({ ...profile, adresse: e.target.value })}
                      placeholder="12 rue de la Paix, 75001 Paris" style={inputStyle} onFocus={focus} onBlur={blur} />
                  </div>
                  <div>
                    <label style={labelStyle}>Téléphone</label>
                    <input value={profile.telephone} onChange={(e) => saveProfile({ ...profile, telephone: e.target.value })}
                      placeholder="+33 6 00 00 00 00" style={inputStyle} onFocus={focus} onBlur={blur} />
                  </div>
                  <div>
                    <label style={labelStyle}>Email</label>
                    <input type="email" value={profile.email} onChange={(e) => saveProfile({ ...profile, email: e.target.value })}
                      placeholder="contact@cabinet.fr" style={inputStyle} onFocus={focus} onBlur={blur} />
                  </div>
                  <div>
                    <label style={labelStyle}>SIRET</label>
                    <input value={profile.siret} onChange={(e) => saveProfile({ ...profile, siret: e.target.value })}
                      placeholder="123 456 789 00012" style={inputStyle} onFocus={focus} onBlur={blur} />
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={labelStyle}>Logo</label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '14px', cursor: 'pointer' }}>
                      {profile.logo ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={profile.logo} alt="Logo" style={{ height: '52px', width: 'auto', borderRadius: '6px', border: '1px solid #1E1E1C' }} />
                      ) : (
                        <div style={{ width: '52px', height: '52px', borderRadius: '6px', border: '1px dashed #1E1E1C', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8A8880', fontSize: '22px' }}>↑</div>
                      )}
                      <span style={{ fontSize: '13px', color: '#8A8880', fontFamily: 'var(--font-dm-sans), sans-serif' }}>
                        {profile.logo ? 'Changer le logo' : 'Importer un logo (PNG, SVG)'}
                      </span>
                      <input type="file" accept="image/*" style={{ display: 'none' }}
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (!file) return
                          const reader = new FileReader()
                          reader.onload = (ev) => saveProfile({ ...profile, logo: ev.target?.result as string })
                          reader.readAsDataURL(file)
                        }} />
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Error + Submit */}
          {error && (
            <p style={{ fontSize: '13px', color: '#E85447', fontFamily: 'var(--font-dm-sans), sans-serif', margin: 0 }}>{error}</p>
          )}
          <div style={{ display: 'flex', gap: '12px' }}>
            <button type="submit" disabled={loading}
              style={{ flex: 1, padding: '12px', backgroundColor: loading ? '#9E8630' : '#ea580c', color: '#0D0D0B', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'var(--font-dm-sans), sans-serif' }}>
              {loading ? 'Enregistrement…' : 'Enregistrer les modifications'}
            </button>
            <Link href={`/dashboard/comptes-rendus/${cr.id}`}
              style={{ padding: '12px 20px', backgroundColor: 'transparent', color: '#8A8880', border: '1px solid #1E1E1C', borderRadius: '8px', fontSize: '14px', fontWeight: 500, textDecoration: 'none', fontFamily: 'var(--font-dm-sans), sans-serif', display: 'flex', alignItems: 'center' }}>
              Annuler
            </Link>
          </div>
        </form>

        {/* ── Right : PDF preview ── */}
        <div style={{ position: 'sticky', top: '0' }}>
          <p style={{ fontFamily: 'var(--font-syne), sans-serif', fontWeight: 700, fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#7A7870', margin: '0 0 12px' }}>
            Aperçu PDF
          </p>
          <div style={{
            backgroundColor: '#fff', borderRadius: '8px', padding: '24px',
            fontSize: '10px', color: '#1a1a1a', fontFamily: 'Georgia, serif', lineHeight: 1.4,
            boxShadow: '0 4px 32px rgba(0,0,0,0.5)',
            maxHeight: 'calc(100vh - 140px)', overflowY: 'auto',
          }}>

            {/* PDF header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px', paddingBottom: '10px', borderBottom: '2px solid #111' }}>
              <div>
                {profile.logo && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={profile.logo} alt="" style={{ height: '32px', width: 'auto', display: 'block', marginBottom: '6px' }} />
                )}
                <div style={{ fontWeight: 700, fontSize: '10px' }}>{profile.societe || "Cabinet d'architecture"}</div>
                {profile.nom      && <div style={{ color: '#555', fontSize: '9px' }}>{profile.nom}</div>}
                {profile.adresse  && <div style={{ color: '#555', fontSize: '9px' }}>{profile.adresse}</div>}
                {profile.telephone && <div style={{ color: '#555', fontSize: '9px' }}>{profile.telephone}</div>}
                {profile.email    && <div style={{ color: '#555', fontSize: '9px' }}>{profile.email}</div>}
                {profile.siret    && <div style={{ color: '#555', fontSize: '9px' }}>SIRET : {profile.siret}</div>}
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: 700, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Compte Rendu de Visite</div>
                <div style={{ fontSize: '10px', color: '#222', marginTop: '4px', fontWeight: 600 }}>{pdfChantier?.nom ?? '—'}</div>
                {pdfChantier?.client && <div style={{ fontSize: '9px', color: '#555' }}>{pdfChantier.client}</div>}
                <div style={{ fontSize: '9px', color: '#777', marginTop: '2px' }}>
                  Visite du {form.date_visite ? new Date(form.date_visite + 'T12:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'}
                </div>
                {form.date_prochaine_visite && (
                  <div style={{ fontSize: '9px', color: '#999' }}>
                    Prochaine : {new Date(form.date_prochaine_visite + 'T12:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}
                  </div>
                )}
              </div>
            </div>

            {/* PDF presences */}
            {presences.length > 0 && (
              <div style={{ marginBottom: '12px' }}>
                <div style={pdfSectionTitle}>Présences</div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '8px' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f5f5f5' }}>
                      {['Nom', 'Société', 'Statut', 'Convoqué prochaine réunion'].map((h) => (
                        <th key={h} style={{ padding: '3px 6px', textAlign: 'left', border: '1px solid #e0e0e0', fontWeight: 600 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {presences.map((p) => {
                      const meta = STATUT_META[p.statut]
                      return (
                        <tr key={p.artisanId}>
                          <td style={{ padding: '2px 6px', border: '1px solid #e0e0e0' }}>{p.nom}</td>
                          <td style={{ padding: '2px 6px', border: '1px solid #e0e0e0', color: '#555' }}>{p.societe || '—'}</td>
                          <td style={{ padding: '2px 6px', border: '1px solid #e0e0e0', textAlign: 'center' }}>
                            <span style={{ backgroundColor: meta.bg, color: meta.color, padding: '1px 5px', borderRadius: '3px', fontWeight: 700 }}>{p.statut}</span>
                          </td>
                          <td style={{ padding: '2px 6px', border: '1px solid #e0e0e0', textAlign: 'center' }}>{p.convoque ? '✓' : ''}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* PDF reserves */}
            {reserves.length > 0 && (
              <div style={{ marginBottom: '12px' }}>
                <div style={pdfSectionTitle}>
                  Obs. / Suivi — {reserves.filter((r) => r.statut === 'Ouvert').length} ouverte{reserves.filter((r) => r.statut === 'Ouvert').length !== 1 ? 's' : ''}
                </div>
                {reserves.map((r, i) => (
                  <div key={r.id} style={{ marginBottom: '6px', padding: '6px', border: '1px solid #e0e0e0', borderRadius: '3px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                      <span style={{ fontWeight: 700, fontSize: '8px' }}>Observation 1.{i + 1}{r.lot ? ` — ${r.lot}` : ''}</span>
                      <span style={{
                        fontSize: '7px', padding: '1px 5px', borderRadius: '3px', fontWeight: 600,
                        backgroundColor: r.statut === 'Ouvert' ? '#fee2e2' : '#dcfce7',
                        color: r.statut === 'Ouvert' ? '#dc2626' : '#16a34a',
                      }}>{r.statut}</span>
                    </div>
                    <div style={{ fontSize: '8px', color: '#333' }}>{r.description || '—'}</div>
                    {r.responsable && <div style={{ fontSize: '7px', color: '#777', marginTop: '2px' }}>Resp. : {r.responsable}</div>}
                    {r.photos.length > 0 && (
                      <div style={{ display: 'flex', gap: '4px', marginTop: '5px' }}>
                        {r.photos.slice(0, 4).map((src, pi) => (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img key={pi} src={src} alt="" style={{ width: '38px', height: '38px', objectFit: 'cover', borderRadius: '2px', border: '1px solid #ddd' }} />
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* PDF lots */}
            {lots.length > 0 && (
              <div style={{ marginBottom: '12px' }}>
                <div style={pdfSectionTitle}>Avancement des lots</div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '8px' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f5f5f5' }}>
                      {['Lot', 'Intervenant', 'Démarrage', 'Fin', 'Avancement'].map((h) => (
                        <th key={h} style={{ padding: '3px 6px', textAlign: 'left', border: '1px solid #e0e0e0', fontWeight: 600 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {lots.map((l) => (
                      <tr key={l.id}>
                        <td style={{ padding: '2px 6px', border: '1px solid #e0e0e0', fontWeight: 500 }}>{l.nom || '—'}</td>
                        <td style={{ padding: '2px 6px', border: '1px solid #e0e0e0', color: '#555' }}>{l.intervenant || '—'}</td>
                        <td style={{ padding: '2px 6px', border: '1px solid #e0e0e0', color: '#555' }}>
                          {l.dateDemarrage ? new Date(l.dateDemarrage + 'T12:00:00').toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit' }) : '—'}
                        </td>
                        <td style={{ padding: '2px 6px', border: '1px solid #e0e0e0', color: '#555' }}>
                          {l.dateFin ? new Date(l.dateFin + 'T12:00:00').toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit' }) : '—'}
                        </td>
                        <td style={{ padding: '2px 6px', border: '1px solid #e0e0e0', minWidth: '60px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <div style={{ flex: 1, height: '4px', backgroundColor: '#e5e7eb', borderRadius: '2px' }}>
                              <div style={{ height: '4px', backgroundColor: '#b45309', borderRadius: '2px', width: `${l.avancement}%` }} />
                            </div>
                            <span style={{ fontSize: '7px', fontWeight: 700, color: '#b45309', flexShrink: 0 }}>{l.avancement}%</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* PDF decisions */}
            {decisions.length > 0 && (
              <div style={{ marginBottom: '12px' }}>
                <div style={pdfSectionTitle}>Décisions</div>
                {decisions.map((d, i) => (
                  <div key={d.id} style={{ display: 'flex', gap: '6px', marginBottom: '4px', fontSize: '8px' }}>
                    <span style={{ color: '#b45309', fontWeight: 700, flexShrink: 0 }}>{i + 1}.</span>
                    <div style={{ flex: 1 }}>
                      {d.description || '—'}
                      {d.responsable && <span style={{ color: '#666' }}> — {d.responsable}</span>}
                    </div>
                    {d.echeance && (
                      <span style={{ color: '#888', flexShrink: 0 }}>
                        {new Date(d.echeance + 'T12:00:00').toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* PDF observations */}
            {form.observations && (
              <div style={{ marginBottom: '12px' }}>
                <div style={pdfSectionTitle}>Remarques générales</div>
                <p style={{ fontSize: '8px', color: '#333', lineHeight: 1.6, margin: 0, whiteSpace: 'pre-wrap' }}>{form.observations}</p>
              </div>
            )}

            {/* PDF travaux */}
            {form.travaux_a_faire && (
              <div style={{ marginBottom: '12px' }}>
                <div style={pdfSectionTitle}>Travaux à réaliser</div>
                <p style={{ fontSize: '8px', color: '#333', lineHeight: 1.6, margin: 0, whiteSpace: 'pre-wrap' }}>{form.travaux_a_faire}</p>
              </div>
            )}

            {/* PDF photos */}
            {(existingPhotos.length > 0 || photoPreviews.length > 0) && (
              <div>
                <div style={pdfSectionTitle}>Photos</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px' }}>
                  {[...existingPhotos, ...photoPreviews].map((src, i) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img key={i} src={src} alt="" style={{ width: '100%', aspectRatio: '4/3', objectFit: 'cover', borderRadius: '2px', border: '1px solid #e0e0e0' }} />
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* PhotoAnnotator modal */}
      {annotatorState && (
        <PhotoAnnotator
          imageSrc={annotatorState.imageSrc}
          onSave={handleAnnotated}
          onClose={() => setAnnotatorState(null)}
        />
      )}
    </div>
  )
}
