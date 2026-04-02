'use client'

import React, { useEffect, useState, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { createCompteRendu } from '@/lib/supabase/comptes-rendus'
import { toast } from '@/components/Toast'
import type { Chantier } from '@/lib/supabase/chantiers'
import PhotoAnnotator from '@/components/PhotoAnnotator'
import { DateTimePicker } from '@/components/DateTimePicker'
import { DatePickerOverlay, formatDateDisplay, dateToStr } from '@/components/DatePicker'
import ArtisanAutocomplete from '@/components/ArtisanAutocomplete'

function Portal({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = React.useState(false)
  React.useEffect(() => { setMounted(true) }, [])
  if (!mounted) return null
  return createPortal(children, document.body)
}

// ─── Types ────────────────────────────────────────────────────────────────────

type Tab = 'general' | 'presences' | 'reserves' | 'decisions' | 'lots' | 'photos'
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
  dateLimite: string
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
  commentaire: string
  photos: string[]
}

interface Decision {
  id: string
  description: string
  responsable: string
  echeance: string
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

// ─── Chantier dropdown helpers ────────────────────────────────────────────────

function ChantierOption({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  const [hovered, setHovered] = React.useState(false)
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onClick}
      style={{
        padding: '10px 14px', fontSize: '14px', cursor: 'pointer',
        color: selected ? '#fff' : '#F0EDE6',
        backgroundColor: selected ? '#ea580c' : hovered ? '#1E1E1C' : 'transparent',
        fontFamily: 'var(--font-dm-sans), sans-serif',
        transition: 'background-color 0.1s',
      }}
    >
      {label}
    </div>
  )
}

function ChantierAddOption({ onClick }: { onClick: () => void }) {
  const [hovered, setHovered] = React.useState(false)
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onClick}
      style={{
        padding: '10px 14px', fontSize: '14px', cursor: 'pointer',
        color: '#ea580c',
        backgroundColor: hovered ? '#1E1E1C' : 'transparent',
        fontFamily: 'var(--font-dm-sans), sans-serif',
        transition: 'background-color 0.1s',
      }}
    >
      ＋ Ajouter un chantier
    </div>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function NouveauCompteRenduPage() {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('general')
  const [chantiers, setChantiers] = useState<Chantier[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [photoFiles, setPhotoFiles] = useState<File[]>([])
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([])
  const [annotatorState, setAnnotatorState] = useState<{ reserveId: string; imageSrc: string } | null>(null)
  const [profile, setProfile] = useState<Profile>(emptyProfile())
  const [presences, setPresences] = useState<PresenceRow[]>([])
  const [reserves, setReserves] = useState<Reserve[]>([])
  const [decisions, setDecisions] = useState<Decision[]>([])
  const [lots, setLots] = useState<Lot[]>([])
  const [chantierArtisans, setChantierArtisans] = useState<{ id: string; nom: string; metier: string | null }[]>([])
  const [allArtisans, setAllArtisans] = useState<{ id: string; nom: string; metier: string | null }[]>([])
  const [draftSaved, setDraftSaved] = useState(false)

  const [chantierDropdownOpen, setChantierDropdownOpen] = useState(false)
  const chantierDropdownRef = useRef<HTMLDivElement>(null)

  // External intervenant form (Présences tab)
  const [showExternalForm, setShowExternalForm] = useState(false)
  const [externalName, setExternalName] = useState('')
  const [externalSociete, setExternalSociete] = useState('')

  // Date pickers
  const [showDatePickerCR, setShowDatePickerCR] = useState(false)
  const [showDatePickerProchaine, setShowDatePickerProchaine] = useState(false)
  const [heureVisite, setHeureVisite] = useState(9)
  const [heureProchaineVisite, setHeureProchaineVisite] = useState(9)
  const [decisionDatePicker, setDecisionDatePicker] = useState<number | null>(null)
  const [lotDatePicker, setLotDatePicker] = useState<{ lotId: string; field: 'debut' | 'fin' } | null>(null)
  const [reserveDatePicker, setReserveDatePicker] = useState<string | null>(null)

  const searchParams = useSearchParams()
  const initialChantierId = searchParams.get('chantier_id') ?? ''

  const [form, setForm] = useState({
    chantier_id: initialChantierId,
    date_visite: new Date().toISOString().split('T')[0],
    date_prochaine_visite: '',
    progression: 50,
    artisans_presents: [] as string[],
    photos: [] as string[],
  })

  // Close chantier dropdown on outside click
  useEffect(() => {
    if (!chantierDropdownOpen) return
    const handler = (e: MouseEvent) => {
      if (chantierDropdownRef.current && !chantierDropdownRef.current.contains(e.target as Node)) {
        setChantierDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [chantierDropdownOpen])

  // Load chantiers + all artisans
  useEffect(() => {
    const supabase = createClient()
    supabase.from('chantiers').select('*').order('nom')
      .then(({ data }) => setChantiers((data ?? []) as Chantier[]))
    supabase.from('artisans').select('id, nom, metier').order('nom')
      .then(({ data }) => setAllArtisans((data ?? []) as { id: string; nom: string; metier: string | null }[]))
  }, [])

  // Reload presences + chantierArtisans whenever the selected chantier changes
  useEffect(() => {
    if (!form.chantier_id) {
      setPresences([])
      setChantierArtisans([])
      return
    }
    createClient()
      .from('chantiers_artisans')
      .select('artisan_id, artisans(id, nom, metier)')
      .eq('chantier_id', form.chantier_id)
      .then(({ data }) => {
        const rows = (data ?? []) as unknown as { artisan_id: string; artisans: { id: string; nom: string; metier: string | null } | null }[]
        const artisanList = rows
          .filter((r) => r.artisans)
          .map((r) => ({ id: r.artisans!.id, nom: r.artisans!.nom, metier: r.artisans!.metier }))
        setChantierArtisans(artisanList)
        setPresences((prev) => {
          if (prev.length > 0) return prev
          return artisanList.map((a) => ({
            artisanId: a.id,
            nom: a.nom,
            societe: a.metier ?? '',
            statut: 'P' as StatutPresence,
            convoque: true,
          }))
        })
      })
  }, [form.chantier_id])

  // Load profile from localStorage + entreprise_infos (for PDF preview)
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

  // Autosave draft every 30 seconds
  useEffect(() => {
    if (!form.chantier_id) return
    const interval = setInterval(() => {
      const draft = { form, presences, reserves, decisions, lots }
      try {
        localStorage.setItem(`cr_draft_${form.chantier_id}`, JSON.stringify(draft))
        setDraftSaved(true)
        setTimeout(() => setDraftSaved(false), 3000)
      } catch {}
    }, 30000)
    return () => clearInterval(interval)
  }, [form, presences, reserves, decisions, lots])

  const selectedChantier = chantiers.find((c) => c.id === form.chantier_id)

  function setField(field: string, value: unknown) {
    setForm((prev) => ({ ...prev, [field]: value }))
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
  function addExternalArtisan() {
    if (!externalName.trim()) return
    setPresences((prev) => [
      ...prev,
      { artisanId: `ext_${uid()}`, nom: externalName.trim(), societe: externalSociete.trim(), statut: 'P', convoque: true },
    ])
    setExternalName('')
    setExternalSociete('')
    setShowExternalForm(false)
  }

  // ── Reserves ──
  function addReserve() {
    setReserves((prev) => [...prev, {
      id: uid(), description: '', lot: '', responsable: '',
      dateLimite: '', statut: 'Ouvert',
      dateCreation: new Date().toISOString().split('T')[0], photos: [],
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
  async function reporterReservesPrecedentes() {
    if (!form.chantier_id) return
    const supabase = createClient()
    const { data } = await supabase
      .from('comptes_rendus')
      .select('observations')
      .eq('chantier_id', form.chantier_id)
      .order('date_visite', { ascending: false })
      .limit(1)
      .maybeSingle()
    if (!data?.observations) { toast.success('Aucun CR précédent trouvé.'); return }
    try {
      const parsed = JSON.parse(data.observations)
      const ouvertes = ((parsed.reserves ?? []) as Reserve[]).filter((r) => r.statut === 'Ouvert')
      if (ouvertes.length === 0) { toast.success('Aucune réserve ouverte à reporter.'); return }
      setReserves((prev) => [
        ...prev,
        ...ouvertes.map((r) => ({ ...r, id: uid(), dateCreation: new Date().toISOString().split('T')[0], photos: [] })),
      ])
      toast.success(`${ouvertes.length} réserve(s) reportée(s)`)
    } catch {}
  }

  // ── Decisions ──
  function addDecision() { setDecisions((prev) => [...prev, { id: uid(), description: '', responsable: '', echeance: '' }]) }
  function updateDecision(id: string, field: keyof Decision, value: string) {
    setDecisions((prev) => prev.map((d) => d.id === id ? { ...d, [field]: value } : d))
  }
  function deleteDecision(id: string) { setDecisions((prev) => prev.filter((d) => d.id !== id)) }

  // ── Lots ──
  function addLot() {
    setLots((prev) => [...prev, {
      id: uid(), nom: '', intervenant: '', dateDemarrage: '', dateFin: '',
      avancement: 0, commentaire: '', photos: [],
    }])
  }
  function updateLot(id: string, field: keyof Lot, value: unknown) {
    setLots((prev) => prev.map((l) => l.id === id ? { ...l, [field]: value } : l))
  }
  function deleteLot(id: string) { setLots((prev) => prev.filter((l) => l.id !== id)) }
  function addLotPhoto(lotId: string, dataUrl: string) {
    setLots((prev) => prev.map((l) => l.id === lotId ? { ...l, photos: [...l.photos, dataUrl] } : l))
  }
  function removeLotPhoto(lotId: string, idx: number) {
    setLots((prev) => prev.map((l) => l.id === lotId ? { ...l, photos: l.photos.filter((_, i) => i !== idx) } : l))
  }

  // ── Photos (onglet Photos) ──
  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    setPhotoFiles((prev) => [...prev, ...files])
    setPhotoPreviews((prev) => [...prev, ...files.map((f) => URL.createObjectURL(f))])
  }
  function removePhoto(i: number) {
    setPhotoFiles((prev) => prev.filter((_, j) => j !== i))
    setPhotoPreviews((prev) => { URL.revokeObjectURL(prev[i]); return prev.filter((_, j) => j !== i) })
  }

  async function uploadPhotos(): Promise<string[]> {
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
      const photoUrls = await uploadPhotos()
      const artisansPresentsList = presences.filter((p) => p.statut === 'P').map((p) => p.nom)

      const observationsData = {
        presences,
        reserves,
        decisions,
        lots,
      }

      const insertPayload = {
        chantier_id: form.chantier_id,
        date_visite: form.date_visite,
        date_prochaine_visite: form.date_prochaine_visite || null,
        progression: form.progression,
        observations: JSON.stringify(observationsData),
        travaux_a_faire: null,
        artisans_presents: artisansPresentsList,
        photos: photoUrls,
      }
      const cr = await createCompteRendu(insertPayload)

      // Auto-create planning events
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const nomChantier = selectedChantier?.nom ?? 'Chantier'
        const visitDate = new Date(form.date_visite)
        visitDate.setHours(heureVisite, 0, 0, 0)
        void Promise.resolve(supabase.from('evenements').insert({
          user_id: user.id, chantier_id: form.chantier_id,
          titre: `Visite — ${nomChantier}`, type: 'visite_architecte',
          date_debut: visitDate.toISOString(), date_fin: null, artisan_id: null, notes: null,
        })).catch(() => {})
        if (form.date_prochaine_visite) {
          const nextDate = new Date(form.date_prochaine_visite)
          nextDate.setHours(heureProchaineVisite, 0, 0, 0)
          void Promise.resolve(supabase.from('evenements').insert({
            user_id: user.id, chantier_id: form.chantier_id,
            titre: `Prochaine visite — ${nomChantier}`, type: 'prochaine_visite',
            date_debut: nextDate.toISOString(), date_fin: null, artisan_id: null, notes: null,
          })).catch(() => {})
        }
      }

      try { localStorage.removeItem(`cr_draft_${form.chantier_id}`) } catch {}

      toast.success('Compte rendu créé')
      router.push(`/dashboard/comptes-rendus/${cr.id}`)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue.')
      setLoading(false)
    }
  }

  // ── Tab definitions ──
  const TABS: { id: Tab; label: string }[] = [
    { id: 'general',   label: 'Général' },
    { id: 'presences', label: 'Présences' },
    { id: 'lots',      label: 'Lots' },
    { id: 'reserves',  label: reserves.length  ? `Réserves (${reserves.length})`   : 'Réserves'  },
    { id: 'decisions', label: decisions.length ? `Décisions (${decisions.length})` : 'Décisions' },
    { id: 'photos',    label: photoPreviews.length ? `Photos (${photoPreviews.length})` : 'Photos' },
  ]

  // ── Artisans pour les selects (tous les artisans DB + externes ajoutés manuellement) ──
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
        <Link href="/dashboard/comptes-rendus" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, backgroundColor: '#111110', border: '1px solid #1E1E1C', borderRadius: 8, padding: '8px 14px', color: '#F0EDE6', fontSize: 13, fontWeight: 500, cursor: 'pointer', textDecoration: 'none', transition: 'all 0.15s ease', fontFamily: 'var(--font-dm-sans), sans-serif', marginBottom: 12 }}
          onMouseEnter={e => { e.currentTarget.style.background = '#1E1E1C'; e.currentTarget.style.borderColor = '#ea580c'; e.currentTarget.style.color = '#ea580c' }}
          onMouseLeave={e => { e.currentTarget.style.background = '#111110'; e.currentTarget.style.borderColor = '#1E1E1C'; e.currentTarget.style.color = '#F0EDE6' }}
        >
          <span style={{ color: '#ea580c' }}>←</span>
          Retour aux comptes rendus
        </Link>
        <h1 style={{ fontFamily: 'var(--font-syne), sans-serif', fontSize: '24px', fontWeight: 700, color: '#F0EDE6', margin: 0 }}>
          Nouveau compte rendu
        </h1>
      </div>

      {/* 2-column layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: '28px', alignItems: 'start' }}>

        {/* ── Left : tabbed form ── */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ backgroundColor: '#111110', border: '1px solid #1E1E1C', borderRadius: '12px', overflow: 'visible' }}>

            {/* Tab bar */}
            <div style={{ display: 'flex', borderBottom: '1px solid #1E1E1C', overflowX: 'auto', padding: '0 4px' }}>
              {TABS.map((t) => (
                <button key={t.id} type="button" onClick={() => setTab(t.id)} style={{
                  padding: '12px 16px', fontSize: '13px', background: 'none', border: 'none',
                  borderBottom: tab === t.id ? '2px solid #ea580c' : '2px solid transparent',
                  color: tab === t.id ? '#ea580c' : '#7A7870',
                  fontFamily: 'var(--font-dm-sans), sans-serif', fontWeight: tab === t.id ? 600 : 400,
                  cursor: 'pointer', whiteSpace: 'nowrap', marginBottom: '-1px', transition: 'color 0.15s',
                }}>
                  {t.label}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div style={{ padding: '28px' }}>

              {/* ── GÉNÉRAL ── */}
              {tab === 'general' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div>
                    <label style={labelStyle}>Chantier associé *</label>
                    <div ref={chantierDropdownRef} style={{ position: 'relative', width: '100%' }}>
                      {/* Trigger button */}
                      <button
                        type="button"
                        onClick={() => setChantierDropdownOpen(o => !o)}
                        style={{
                          width: '100%', padding: '10px 36px 10px 14px',
                          backgroundColor: '#111110', border: `1px solid ${chantierDropdownOpen ? '#ea580c' : '#1E1E1C'}`,
                          borderRadius: '8px',
                          color: form.chantier_id ? '#F0EDE6' : '#8A8880',
                          fontSize: '14px', fontFamily: 'var(--font-dm-sans), sans-serif',
                          cursor: 'pointer', textAlign: 'left', outline: 'none',
                          boxShadow: chantierDropdownOpen ? '0 0 0 2px rgba(249,115,22,0.15)' : 'none',
                          boxSizing: 'border-box', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        } as React.CSSProperties}
                      >
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {form.chantier_id
                            ? (() => { const c = chantiers.find(x => x.id === form.chantier_id); return c ? `${c.nom} — ${c.client}` : 'Sélectionner un chantier…' })()
                            : 'Sélectionner un chantier…'}
                        </span>
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ flexShrink: 0, color: '#8A8880', transform: chantierDropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }}>
                          <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>

                      {/* Dropdown list */}
                      {chantierDropdownOpen && (
                        <div style={{
                          position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0,
                          backgroundColor: '#111110', border: '1px solid #1E1E1C', borderRadius: '8px',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
                          zIndex: 50, overflow: 'hidden', maxHeight: '260px', overflowY: 'auto',
                        }}>
                          {chantiers.length === 0 && (
                            <div style={{ padding: '10px 14px', color: '#8A8880', fontSize: '14px' }}>Aucun chantier</div>
                          )}
                          {chantiers.map((c) => (
                            <ChantierOption
                              key={c.id}
                              label={`${c.nom} — ${c.client}`}
                              selected={form.chantier_id === c.id}
                              onClick={() => { setField('chantier_id', c.id); setChantierDropdownOpen(false) }}
                            />
                          ))}
                          {/* Séparateur */}
                          <div style={{ borderTop: '1px solid #1E1E1C', margin: '0' }} />
                          {/* Ajouter un chantier */}
                          <ChantierAddOption onClick={() => { setChantierDropdownOpen(false); router.push('/dashboard/chantiers/nouveau') }} />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Dates */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    {/* Date de visite */}
                    <div>
                      <label style={labelStyle}>Date de visite *</label>
                      <button
                        type="button"
                        onClick={() => setShowDatePickerCR(true)}
                        style={{ ...inputStyle, textAlign: 'left', cursor: 'pointer', background: '#0D0D0B', display: 'flex', alignItems: 'center', justifyContent: 'space-between' } as React.CSSProperties}
                        onFocus={focus} onBlur={blur}
                      >
                        <span style={{ color: form.date_visite ? '#F0EDE6' : '#8A8880' }}>
                          {form.date_visite
                            ? `${new Date(form.date_visite + 'T12:00:00').toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })} — ${heureVisite}h00`
                            : 'Choisir date & heure…'}
                        </span>
                        <span style={{ color: '#ea580c', fontSize: '12px' }}>📅</span>
                      </button>
                    </div>

                    {/* Prochaine visite */}
                    <div>
                      <label style={labelStyle}>Prochaine visite</label>
                      <button
                        type="button"
                        onClick={() => setShowDatePickerProchaine(true)}
                        style={{ ...inputStyle, textAlign: 'left', cursor: 'pointer', background: '#0D0D0B', display: 'flex', alignItems: 'center', justifyContent: 'space-between' } as React.CSSProperties}
                        onFocus={focus} onBlur={blur}
                      >
                        <span style={{ color: form.date_prochaine_visite ? '#F0EDE6' : '#8A8880' }}>
                          {form.date_prochaine_visite
                            ? `${new Date(form.date_prochaine_visite + 'T12:00:00').toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })} — ${heureProchaineVisite}h00`
                            : 'Date…'}
                        </span>
                        <span style={{ color: '#ea580c', fontSize: '12px' }}>📅</span>
                      </button>
                    </div>
                  </div>

                  {/* Avancement global */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <label style={{ ...labelStyle, marginBottom: 0 }}>Avancement global</label>
                      <span style={{ fontSize: '15px', fontWeight: 700, color: '#ea580c', fontFamily: 'var(--font-syne), sans-serif' }}>
                        {form.progression}%
                      </span>
                    </div>
                    <input
                      type="range" min={0} max={100} step={5}
                      value={form.progression}
                      onChange={(e) => setField('progression', parseInt(e.target.value))}
                      style={{ width: '100%', accentColor: '#ea580c', cursor: 'pointer', height: '4px' }}
                    />
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#3A3A38', marginTop: '4px', fontFamily: 'var(--font-dm-sans), sans-serif' }}>
                      <span>0%</span><span>50%</span><span>100%</span>
                    </div>
                  </div>
                </div>
              )}

              {/* ── PRÉSENCES ── */}
              {tab === 'presences' && (
                <div>
                  {!form.chantier_id ? (
                    <p style={{ color: '#8A8880', fontSize: '14px', fontFamily: 'var(--font-dm-sans), sans-serif', fontStyle: 'italic' }}>
                      Sélectionnez d&apos;abord un chantier dans l&apos;onglet Général.
                    </p>
                  ) : presences.length > 0 ? (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr>
                          {['Nom', 'Société / Métier', 'Statut', 'Convoqué prochaine réunion', ''].map((h) => (
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

                  {/* + Ajouter un intervenant externe */}
                  {form.chantier_id && (
                    <div style={{ marginTop: presences.length > 0 ? '16px' : '0' }}>
                      {!showExternalForm ? (
                        <button type="button"
                          onClick={() => setShowExternalForm(true)}
                          style={{
                            padding: '8px 14px', backgroundColor: 'transparent', border: '1px dashed #1E1E1C',
                            borderRadius: '8px', color: '#8A8880', fontSize: '13px', cursor: 'pointer',
                            fontFamily: 'var(--font-dm-sans), sans-serif', transition: 'all 0.15s',
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(249,115,22,0.4)'; e.currentTarget.style.color = '#ea580c' }}
                          onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#1E1E1C'; e.currentTarget.style.color = '#8A8880' }}>
                          + Ajouter un intervenant externe
                        </button>
                      ) : (
                        <div style={{ backgroundColor: '#0D0D0B', border: '1px solid #1E1E1C', borderRadius: '10px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                          <p style={{ margin: 0, fontSize: '12px', color: '#8A8880', fontFamily: 'var(--font-dm-sans), sans-serif' }}>
                            Intervenant non lié à la base artisans
                          </p>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                            <div>
                              <label style={labelStyle}>Nom *</label>
                              <input value={externalName} onChange={(e) => setExternalName(e.target.value)}
                                placeholder="Jean Dupont" style={inputStyle} onFocus={focus} onBlur={blur} />
                            </div>
                            <div>
                              <label style={labelStyle}>Société / Métier</label>
                              <input value={externalSociete} onChange={(e) => setExternalSociete(e.target.value)}
                                placeholder="Plomberie Martin" style={inputStyle} onFocus={focus} onBlur={blur} />
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button type="button" onClick={addExternalArtisan}
                              style={{ padding: '8px 16px', backgroundColor: '#ea580c', color: '#0D0D0B', border: 'none', borderRadius: '7px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-dm-sans), sans-serif' }}>
                              Ajouter
                            </button>
                            <button type="button" onClick={() => { setShowExternalForm(false); setExternalName(''); setExternalSociete('') }}
                              style={{ padding: '8px 12px', backgroundColor: 'transparent', color: '#8A8880', border: '1px solid #1E1E1C', borderRadius: '7px', fontSize: '13px', cursor: 'pointer', fontFamily: 'var(--font-dm-sans), sans-serif' }}>
                              Annuler
                            </button>
                          </div>
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
              )}

              {/* ── LOTS ── */}
              {tab === 'lots' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {lots.map((l, idx) => (
                    <div key={l.id} style={{ backgroundColor: '#0D0D0B', border: '1px solid #1E1E1C', borderRadius: '10px', padding: '20px' }}>
                      {/* Lot header */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                        <span style={{ fontFamily: 'var(--font-syne), sans-serif', fontWeight: 700, fontSize: '14px', color: '#ea580c' }}>
                          Lot {idx + 1}
                        </span>
                        <button type="button" onClick={() => deleteLot(l.id)}
                          style={{ background: 'none', border: '1px solid #1E1E1C', borderRadius: '6px', color: '#8A8880', cursor: 'pointer', fontSize: '14px', padding: '4px 8px', lineHeight: 1, transition: 'all 0.15s' }}
                          onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#EF4444'; e.currentTarget.style.color = '#EF4444' }}
                          onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#1E1E1C'; e.currentTarget.style.color = '#8A8880' }}>
                          🗑
                        </button>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                        {/* Nom */}
                        <div>
                          <label style={labelStyle}>Nom du lot</label>
                          <input value={l.nom} onChange={(e) => updateLot(l.id, 'nom', e.target.value)}
                            placeholder="Ex : Gros œuvre, Electricité…"
                            style={{ ...inputStyle, fontSize: '13px' }} onFocus={focus} onBlur={blur} />
                        </div>

                        {/* Intervenant */}
                        <div>
                          <label style={labelStyle}>Intervenant</label>
                          <ArtisanAutocomplete
                            value={l.intervenant}
                            onChange={(v) => updateLot(l.id, 'intervenant', v)}
                            options={allIntervenants}
                            placeholder="— Artisan —"
                          />
                        </div>

                        {/* Démarrage */}
                        <div>
                          <label style={labelStyle}>Date démarrage</label>
                          <button type="button" onClick={() => setLotDatePicker({ lotId: l.id, field: 'debut' })}
                            style={{ ...inputStyle, textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '13px' } as React.CSSProperties}
                            onMouseEnter={e => e.currentTarget.style.borderColor = '#ea580c'}
                            onMouseLeave={e => e.currentTarget.style.borderColor = '#1E1E1C'}>
                            <span style={{ color: l.dateDemarrage ? '#F0EDE6' : '#8A8880' }}>{l.dateDemarrage ? formatDateDisplay(l.dateDemarrage) : 'jj/mm/aaaa'}</span>
                            <span style={{ color: '#ea580c', fontSize: '11px' }}>▼</span>
                          </button>
                        </div>

                        {/* Fin */}
                        <div>
                          <label style={labelStyle}>Date fin</label>
                          <button type="button" onClick={() => setLotDatePicker({ lotId: l.id, field: 'fin' })}
                            style={{ ...inputStyle, textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '13px' } as React.CSSProperties}
                            onMouseEnter={e => e.currentTarget.style.borderColor = '#ea580c'}
                            onMouseLeave={e => e.currentTarget.style.borderColor = '#1E1E1C'}>
                            <span style={{ color: l.dateFin ? '#F0EDE6' : '#8A8880' }}>{l.dateFin ? formatDateDisplay(l.dateFin) : 'jj/mm/aaaa'}</span>
                            <span style={{ color: '#ea580c', fontSize: '11px' }}>▼</span>
                          </button>
                        </div>

                        {/* Avancement */}
                        <div style={{ gridColumn: '1 / -1' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                            <label style={{ ...labelStyle, marginBottom: 0 }}>Avancement</label>
                            <span style={{ fontSize: '14px', fontWeight: 700, color: '#ea580c', fontFamily: 'var(--font-syne), sans-serif' }}>{l.avancement}%</span>
                          </div>
                          <input type="range" min={0} max={100} step={5} value={l.avancement}
                            onChange={(e) => updateLot(l.id, 'avancement', parseInt(e.target.value))}
                            style={{ width: '100%', accentColor: '#ea580c', cursor: 'pointer' }} />
                        </div>

                        {/* Commentaire */}
                        <div style={{ gridColumn: '1 / -1' }}>
                          <label style={labelStyle}>Commentaire</label>
                          <textarea value={l.commentaire} onChange={(e) => updateLot(l.id, 'commentaire', e.target.value)}
                            rows={2} placeholder="Observations sur ce lot..."
                            style={{ ...inputStyle, resize: 'vertical', lineHeight: '1.5', fontSize: '13px' }}
                            onFocus={focus} onBlur={blur} />
                        </div>
                      </div>

                      {/* Photos du lot */}
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                          <span style={{ ...labelStyle, marginBottom: 0 }}>Photos</span>
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
                                const reader = new FileReader()
                                reader.onload = (ev) => {
                                  if (ev.target?.result) addLotPhoto(l.id, ev.target.result as string)
                                }
                                reader.readAsDataURL(file)
                                e.target.value = ''
                              }} />
                          </label>
                        </div>
                        {l.photos.length > 0 && (
                          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                            {l.photos.map((src, pi) => (
                              <div key={pi} style={{ position: 'relative', display: 'inline-block' }}>
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={src} alt="" style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #1E1E1C', display: 'block' }} />
                                <button type="button" onClick={() => removeLotPhoto(l.id, pi)}
                                  style={{ position: 'absolute', top: '-6px', right: '-6px', width: '18px', height: '18px', borderRadius: '50%', backgroundColor: '#EF4444', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '11px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10, lineHeight: 1 }}>
                                  ×
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  <button type="button" onClick={addLot}
                    style={{ padding: '14px', border: '1px dashed #1E1E1C', borderRadius: '10px', backgroundColor: 'transparent', color: '#8A8880', fontSize: '13px', fontFamily: 'var(--font-dm-sans), sans-serif', cursor: 'pointer', width: '100%', transition: 'all 0.15s' }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(249,115,22,0.4)'; e.currentTarget.style.color = '#ea580c' }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#1E1E1C'; e.currentTarget.style.color = '#8A8880' }}>
                    + Ajouter un lot
                  </button>
                </div>
              )}

              {/* ── RÉSERVES ── */}
              {tab === 'reserves' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {form.chantier_id && (
                    <button type="button" onClick={reporterReservesPrecedentes}
                      style={{
                        padding: '10px 16px', backgroundColor: 'rgba(249,115,22,0.08)', border: '1px solid rgba(249,115,22,0.25)',
                        borderRadius: '8px', color: '#ea580c', fontSize: '13px', cursor: 'pointer',
                        fontFamily: 'var(--font-dm-sans), sans-serif', textAlign: 'left', transition: 'all 0.15s',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(249,115,22,0.15)' }}
                      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'rgba(249,115,22,0.08)' }}>
                      📋 Reporter les réserves ouvertes du CR précédent
                    </button>
                  )}

                  {reserves.map((r, idx) => (
                    <div key={r.id} style={{ backgroundColor: '#0D0D0B', border: '1px solid #1E1E1C', borderRadius: '10px', padding: '20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                        <span style={{ fontFamily: 'var(--font-syne), sans-serif', fontWeight: 700, fontSize: '14px', color: '#ea580c' }}>
                          Réserve 1.{idx + 1}
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
                            style={{ background: 'none', border: '1px solid #1E1E1C', borderRadius: '6px', color: '#8A8880', cursor: 'pointer', fontSize: '14px', padding: '4px 8px', lineHeight: 1, transition: 'all 0.15s' }}
                            onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#EF4444'; e.currentTarget.style.color = '#EF4444' }}
                            onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#1E1E1C'; e.currentTarget.style.color = '#8A8880' }}>
                            🗑
                          </button>
                        </div>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                        <div style={{ gridColumn: '1 / -1' }}>
                          <label style={labelStyle}>Description</label>
                          <textarea value={r.description} onChange={(e) => updateReserve(r.id, 'description', e.target.value)}
                            rows={2} placeholder="Décrire la réserve..."
                            style={{ ...inputStyle, resize: 'vertical', lineHeight: '1.5', fontSize: '13px' }}
                            onFocus={focus} onBlur={blur} />
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
                        <div>
                          <label style={labelStyle}>Date limite de levée</label>
                          <button type="button" onClick={() => setReserveDatePicker(r.id)}
                            style={{ background: '#111110', border: '1px solid #1E1E1C', borderRadius: '8px', padding: '8px 12px', color: r.dateLimite ? '#F0EDE6' : '#8A8880', fontSize: '13px', cursor: 'pointer', textAlign: 'left', width: '100%', fontFamily: 'var(--font-dm-sans), sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxSizing: 'border-box' } as React.CSSProperties}
                            onMouseEnter={e => e.currentTarget.style.borderColor = '#ea580c'}
                            onMouseLeave={e => e.currentTarget.style.borderColor = '#1E1E1C'}>
                            <span>{r.dateLimite ? formatDateDisplay(r.dateLimite) : 'jj/mm/aaaa'}</span>
                            <span style={{ color: '#ea580c', fontSize: '11px' }}>▼</span>
                          </button>
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
                              <div key={pi} style={{ position: 'relative', display: 'inline-block' }}>
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={src} alt="" style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #1E1E1C', display: 'block' }} />
                                <button type="button" onClick={() => removeReservePhoto(r.id, pi)}
                                  style={{ position: 'absolute', top: '-6px', right: '-6px', width: '18px', height: '18px', borderRadius: '50%', backgroundColor: '#EF4444', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '11px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10, lineHeight: 1 }}>
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
                    + Ajouter une réserve
                  </button>
                </div>
              )}

              {/* ── DÉCISIONS ── */}
              {tab === 'decisions' && (
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
                        <button type="button" onClick={() => setDecisionDatePicker(idx)}
                          style={{ background: '#111110', border: '1px solid #1E1E1C', borderRadius: '8px', padding: '8px 12px', color: d.echeance ? '#F0EDE6' : '#8A8880', fontSize: '13px', cursor: 'pointer', textAlign: 'left', width: '100%', fontFamily: 'var(--font-dm-sans), sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'space-between' } as React.CSSProperties}
                          onMouseEnter={e => e.currentTarget.style.borderColor = '#ea580c'} onMouseLeave={e => e.currentTarget.style.borderColor = '#1E1E1C'}>
                          <span>{d.echeance ? formatDateDisplay(d.echeance) : 'jj/mm/aaaa'}</span>
                          <span style={{ color: '#ea580c', fontSize: '11px' }}>▼</span>
                        </button>
                      </div>
                      <button type="button" onClick={() => deleteDecision(d.id)}
                        style={{ background: 'none', border: '1px solid #1E1E1C', borderRadius: '6px', color: '#8A8880', cursor: 'pointer', fontSize: '14px', paddingBottom: '10px', transition: 'all 0.15s' }}
                        onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#EF4444'; e.currentTarget.style.color = '#EF4444' }}
                        onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#1E1E1C'; e.currentTarget.style.color = '#8A8880' }}>
                        🗑
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
              )}

              {/* ── PHOTOS ── */}
              {tab === 'photos' && (
                <div>
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
                          <button type="button" onClick={() => removePhoto(i)}
                            style={{ position: 'absolute', top: '4px', right: '4px', width: '20px', height: '20px', borderRadius: '50%', border: 'none', backgroundColor: 'rgba(0,0,0,0.75)', color: '#fff', cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

            </div>
          </div>

          {/* Error + Submit */}
          {error && (
            <p style={{ fontSize: '13px', color: '#E85447', fontFamily: 'var(--font-dm-sans), sans-serif', margin: 0 }}>{error}</p>
          )}
          <div style={{ display: 'flex', gap: '12px' }}>
            <button type="submit" disabled={loading}
              style={{ flex: 1, padding: '12px', backgroundColor: loading ? '#9E8630' : '#ea580c', color: '#0D0D0B', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'var(--font-dm-sans), sans-serif' }}>
              {loading ? 'Enregistrement…' : 'Enregistrer le compte rendu'}
            </button>
            <Link href="/dashboard/comptes-rendus"
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
                <div style={{ fontSize: '10px', color: '#222', marginTop: '4px', fontWeight: 600 }}>{selectedChantier?.nom ?? '—'}</div>
                {selectedChantier?.client && <div style={{ fontSize: '9px', color: '#555' }}>{selectedChantier.client}</div>}
                <div style={{ fontSize: '9px', color: '#777', marginTop: '2px' }}>
                  Visite du {form.date_visite ? new Date(form.date_visite + 'T12:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'} à {heureVisite}h00
                </div>
                {form.date_prochaine_visite && (
                  <div style={{ fontSize: '9px', color: '#999' }}>
                    Prochaine : {new Date(form.date_prochaine_visite + 'T12:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })} à {heureProchaineVisite}h00
                  </div>
                )}
                {form.progression > 0 && <div style={{ fontSize: '9px', color: '#b45309', fontWeight: 600 }}>Avancement global : {form.progression}%</div>}
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
                {/* Légende statuts */}
                <div style={{ display: 'flex', gap: '10px', marginTop: '4px', flexWrap: 'wrap' }}>
                  {STATUT_ORDER.map((s) => {
                    const m = STATUT_META[s]
                    return (
                      <span key={s} style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', fontSize: '7px', color: '#555' }}>
                        <span style={{ backgroundColor: m.bg, color: m.color, padding: '1px 4px', borderRadius: '2px', fontWeight: 700, fontFamily: 'monospace' }}>{s}</span>
                        <span>= {m.label}</span>
                      </span>
                    )
                  })}
                </div>
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
                {/* Commentaires lots */}
                {lots.filter(l => l.commentaire).map((l) => (
                  <div key={l.id} style={{ marginTop: '4px', fontSize: '7px', color: '#555' }}>
                    <strong>{l.nom || `Lot`} :</strong> {l.commentaire}
                  </div>
                ))}
              </div>
            )}

            {/* PDF reserves */}
            {reserves.length > 0 && (
              <div style={{ marginBottom: '12px' }}>
                <div style={pdfSectionTitle}>
                  Réserves — {reserves.filter((r) => r.statut === 'Ouvert').length} ouverte{reserves.filter((r) => r.statut === 'Ouvert').length !== 1 ? 's' : ''}
                </div>
                {reserves.map((r, i) => (
                  <div key={r.id} style={{ marginBottom: '6px', padding: '6px', border: '1px solid #e0e0e0', borderRadius: '3px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                      <span style={{ fontWeight: 700, fontSize: '8px' }}>Réserve 1.{i + 1}{r.lot ? ` — ${r.lot}` : ''}</span>
                      <span style={{
                        fontSize: '7px', padding: '1px 5px', borderRadius: '3px', fontWeight: 600,
                        backgroundColor: r.statut === 'Ouvert' ? '#fee2e2' : '#dcfce7',
                        color: r.statut === 'Ouvert' ? '#dc2626' : '#16a34a',
                      }}>{r.statut}</span>
                    </div>
                    <div style={{ fontSize: '8px', color: '#333' }}>{r.description || '—'}</div>
                    {r.responsable && <div style={{ fontSize: '7px', color: '#777', marginTop: '2px' }}>Resp. : {r.responsable}</div>}
                    {r.dateLimite && <div style={{ fontSize: '7px', color: '#777' }}>Limite : {formatDateDisplay(r.dateLimite)}</div>}
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

            {/* PDF photos */}
            {photoPreviews.length > 0 && (
              <div>
                <div style={pdfSectionTitle}>Photos</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px' }}>
                  {photoPreviews.map((src, i) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img key={i} src={src} alt="" style={{ width: '100%', aspectRatio: '4/3', objectFit: 'cover', borderRadius: '2px', border: '1px solid #e0e0e0' }} />
                  ))}
                </div>
              </div>
            )}

            {/* Empty state */}
            {!form.chantier_id && presences.length === 0 && reserves.length === 0 && lots.length === 0 && (
              <p style={{ textAlign: 'center', color: '#bbb', fontSize: '9px', padding: '20px 0', margin: 0 }}>
                Remplissez le formulaire pour voir l'aperçu
              </p>
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

      {decisionDatePicker !== null && (
        <Portal>
          <DatePickerOverlay
            label="Échéance de la décision"
            initialDate={decisions[decisionDatePicker]?.echeance ? new Date(decisions[decisionDatePicker].echeance + 'T12:00:00') : undefined}
            onCancel={() => setDecisionDatePicker(null)}
            onConfirm={(date) => {
              updateDecision(decisions[decisionDatePicker!].id, 'echeance', dateToStr(date))
              setDecisionDatePicker(null)
            }}
          />
        </Portal>
      )}

      {lotDatePicker !== null && (
        <Portal>
          <DatePickerOverlay
            label={lotDatePicker.field === 'debut' ? 'Date de démarrage' : 'Date de fin'}
            initialDate={(() => {
              const lot = lots.find((l) => l.id === lotDatePicker.lotId)
              const val = lotDatePicker.field === 'debut' ? lot?.dateDemarrage : lot?.dateFin
              return val ? new Date(val + 'T12:00:00') : undefined
            })()}
            onCancel={() => setLotDatePicker(null)}
            onConfirm={(date) => {
              updateLot(lotDatePicker!.lotId, lotDatePicker!.field === 'debut' ? 'dateDemarrage' : 'dateFin', dateToStr(date))
              setLotDatePicker(null)
            }}
          />
        </Portal>
      )}

      {reserveDatePicker !== null && (
        <Portal>
          <DatePickerOverlay
            label="Date limite de levée"
            initialDate={(() => {
              const r = reserves.find((r) => r.id === reserveDatePicker)
              return r?.dateLimite ? new Date(r.dateLimite + 'T12:00:00') : undefined
            })()}
            onCancel={() => setReserveDatePicker(null)}
            onConfirm={(date) => {
              updateReserve(reserveDatePicker!, 'dateLimite', dateToStr(date))
              setReserveDatePicker(null)
            }}
          />
        </Portal>
      )}

      {showDatePickerProchaine && (
        <Portal>
          <div
            style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 99998 }}
            onClick={() => setShowDatePickerProchaine(false)}
          />
          <div
            style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 99999 }}
            onClick={e => e.stopPropagation()}
          >
            <DateTimePicker
              label="Prochaine visite"
              initialDate={form.date_prochaine_visite ? new Date(form.date_prochaine_visite + 'T12:00:00') : undefined}
              onCancel={() => setShowDatePickerProchaine(false)}
              onConfirm={(date, heureDebut) => {
                setField('date_prochaine_visite', dateToStr(date))
                setHeureProchaineVisite(parseInt(heureDebut.split(':')[0]))
                setShowDatePickerProchaine(false)
              }}
            />
          </div>
        </Portal>
      )}

      {/* DateTimePicker modal (date de visite) */}
      {showDatePickerCR && (
        <Portal>
          <div
            style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 99998 }}
            onClick={() => setShowDatePickerCR(false)}
          />
          <div
            style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 99999 }}
            onClick={e => e.stopPropagation()}
          >
            <DateTimePicker
              label="Date de visite"
              initialDate={form.date_visite ? new Date(form.date_visite + 'T12:00:00') : undefined}
              onCancel={() => setShowDatePickerCR(false)}
              onConfirm={(date, heureDebut) => {
                const y = date.getFullYear()
                const m = String(date.getMonth() + 1).padStart(2, '0')
                const d = String(date.getDate()).padStart(2, '0')
                setField('date_visite', `${y}-${m}-${d}`)
                setHeureVisite(parseInt(heureDebut.split(':')[0]))
                setShowDatePickerCR(false)
              }}
            />
          </div>
        </Portal>
      )}

      {/* Draft saved badge */}
      {draftSaved && (
        <Portal>
          <div style={{
            position: 'fixed', bottom: '24px', right: '24px',
            backgroundColor: '#111110', border: '1px solid #1E1E1C', borderRadius: '8px',
            padding: '10px 16px', fontSize: '12px', color: '#4ade80',
            fontFamily: 'var(--font-dm-sans), sans-serif', zIndex: 99999,
            display: 'flex', alignItems: 'center', gap: '6px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
          }}>
            <span style={{ fontSize: '8px' }}>●</span> Brouillon sauvegardé
          </div>
        </Portal>
      )}
    </div>
  )
}
