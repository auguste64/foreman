'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { createCompteRendu } from '@/lib/supabase/comptes-rendus'
import type { Chantier } from '@/lib/supabase/chantiers'
import MetierSelect from '@/components/MetierSelect'

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
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '13px',
  color: '#8A8880',
  marginBottom: '6px',
  fontFamily: 'var(--font-dm-sans), sans-serif',
}

const focus = (e: React.FocusEvent<HTMLElement>) => ((e.target as HTMLElement).style.borderColor = '#E8C547')
const blur = (e: React.FocusEvent<HTMLElement>) => ((e.target as HTMLElement).style.borderColor = '#1E1E1C')

export default function NouveauCompteRenduPage() {
  const router = useRouter()
  const [chantiers, setChantiers] = useState<Chantier[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [artisansList, setArtisansList] = useState<{ id: string; nom: string }[]>([])
  const [artisansOpen, setArtisansOpen] = useState(false)
  const artisansRef = useRef<HTMLDivElement>(null)
  const [showNewArtisan, setShowNewArtisan] = useState(false)
  const [newArtisan, setNewArtisan] = useState({ nom: '', email: '', telephone: '', metier: '' })
  const [creatingArtisan, setCreatingArtisan] = useState(false)
  const [photoFiles, setPhotoFiles] = useState<File[]>([])
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([])

  const [form, setForm] = useState({
    chantier_id: '',
    date_visite: new Date().toISOString().split('T')[0],
    date_prochaine_visite: '',
    progression: 50,
    observations: '',
    travaux_a_faire: '',
    artisans_presents: [] as string[],
    photos: [] as string[],
  })

  useEffect(() => {
    const supabase = createClient()
    supabase.from('chantiers').select('*').order('nom')
      .then(({ data }) => setChantiers((data ?? []) as Chantier[]))
    supabase.from('artisans').select('id, nom').order('nom')
      .then(({ data }) => setArtisansList((data ?? []) as { id: string; nom: string }[]))
  }, [])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (artisansRef.current && !artisansRef.current.contains(e.target as Node)) {
        setArtisansOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function set(field: string, value: unknown) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function toggleArtisan(nom: string) {
    set('artisans_presents', form.artisans_presents.includes(nom)
      ? form.artisans_presents.filter((a) => a !== nom)
      : [...form.artisans_presents, nom]
    )
  }

  async function handleCreateArtisan(e: React.FormEvent) {
    e.preventDefault()
    if (!newArtisan.nom.trim()) return
    setCreatingArtisan(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Non authentifié')
      const { data, error: insertError } = await supabase
        .from('artisans')
        .insert({ ...newArtisan, nom: newArtisan.nom.trim(), user_id: user.id })
        .select('id, nom')
        .single()
      if (insertError) throw insertError
      const created = data as { id: string; nom: string }
      setArtisansList((prev) => [...prev, created].sort((a, b) => a.nom.localeCompare(b.nom)))
      set('artisans_presents', [...form.artisans_presents, created.nom])
      setNewArtisan({ nom: '', email: '', telephone: '', metier: '' })
      setShowNewArtisan(false)
    } finally {
      setCreatingArtisan(false)
    }
  }

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    setPhotoFiles((prev) => [...prev, ...files])
    const previews = files.map((f) => URL.createObjectURL(f))
    setPhotoPreviews((prev) => [...prev, ...previews])
  }

  function removePhoto(index: number) {
    setPhotoFiles((prev) => prev.filter((_, i) => i !== index))
    setPhotoPreviews((prev) => {
      URL.revokeObjectURL(prev[index])
      return prev.filter((_, i) => i !== index)
    })
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.chantier_id) { setError('Veuillez sélectionner un chantier.'); return }
    setError(null)
    setLoading(true)
    try {
      const photoUrls = await uploadPhotos()
      const cr = await createCompteRendu({ ...form, photos: photoUrls })

      // Auto-create planning events
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const chantier = chantiers.find((c) => c.id === form.chantier_id)
        const nomChantier = chantier?.nom ?? 'Chantier'

        const visitDate = new Date(form.date_visite)
        visitDate.setHours(9, 0, 0, 0)
        supabase.from('evenements').insert({
          user_id: user.id,
          chantier_id: form.chantier_id,
          titre: `Visite — ${nomChantier}`,
          type: 'visite_architecte',
          date_debut: visitDate.toISOString(),
          date_fin: null,
          artisan_id: null,
          notes: form.observations || null,
        }).then(() => {}).catch(() => {})

        if (form.date_prochaine_visite) {
          const nextDate = new Date(form.date_prochaine_visite)
          nextDate.setHours(9, 0, 0, 0)
          supabase.from('evenements').insert({
            user_id: user.id,
            chantier_id: form.chantier_id,
            titre: `Prochaine visite — ${nomChantier}`,
            type: 'prochaine_visite',
            date_debut: nextDate.toISOString(),
            date_fin: null,
            artisan_id: null,
            notes: null,
          }).then(() => {}).catch(() => {})
        }
      }

      router.push(`/dashboard/comptes-rendus/${cr.id}`)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue.')
      setLoading(false)
    }
  }

  return (
    <div style={{ flex: 1, padding: '40px', overflowY: 'auto' }}>
      <div style={{ marginBottom: '40px' }}>
        <Link href="/dashboard/comptes-rendus" style={{ fontSize: '13px', color: '#8A8880', textDecoration: 'none', fontFamily: 'var(--font-dm-sans), sans-serif', display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '16px' }}>
          ← Retour aux comptes rendus
        </Link>
        <h1 style={{ fontFamily: 'var(--font-syne), sans-serif', fontSize: '24px', fontWeight: 700, color: '#F0EDE6', margin: 0 }}>
          Nouveau compte rendu
        </h1>
      </div>

      <form onSubmit={handleSubmit} style={{ maxWidth: '680px', display: 'flex', flexDirection: 'column', gap: '28px' }}>

        {/* Chantier + dates */}
        <div style={{ backgroundColor: '#111110', border: '1px solid #1E1E1C', borderRadius: '12px', padding: '28px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <h2 style={{ fontFamily: 'var(--font-syne), sans-serif', fontSize: '15px', fontWeight: 600, color: '#F0EDE6', margin: 0 }}>Informations générales</h2>

          <div>
            <label style={labelStyle}>Chantier associé *</label>
            <div style={{ position: 'relative' }}>
              <select
                value={form.chantier_id}
                onChange={(e) => set('chantier_id', e.target.value)}
                required
                style={{
                  ...inputStyle,
                  cursor: 'pointer',
                  appearance: 'none',
                  WebkitAppearance: 'none',
                  MozAppearance: 'none',
                  paddingRight: '40px',
                }}
                onFocus={(e) => { focus(e); (e.target.nextSibling as HTMLElement).style.opacity = '1' }}
                onBlur={(e) => { blur(e); (e.target.nextSibling as HTMLElement).style.opacity = '0.5' }}
              >
                <option value="" style={{ backgroundColor: '#111110' }}>Sélectionner un chantier…</option>
                {chantiers.map((c) => (
                  <option key={c.id} value={c.id} style={{ backgroundColor: '#111110' }}>{c.nom} — {c.client}</option>
                ))}
              </select>
              <svg
                width="16" height="16" viewBox="0 0 16 16" fill="none"
                style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', opacity: 0.5, transition: 'opacity 0.15s' }}
              >
                <path d="M4 6L8 10L12 6" stroke="#E8C547" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={labelStyle}>Date de visite *</label>
              <input type="date" value={form.date_visite} onChange={(e) => set('date_visite', e.target.value)} required style={{ ...inputStyle, colorScheme: 'dark' }} onFocus={focus} onBlur={blur} />
            </div>
            <div>
              <label style={labelStyle}>Prochaine visite</label>
              <input type="date" value={form.date_prochaine_visite} onChange={(e) => set('date_prochaine_visite', e.target.value)} style={{ ...inputStyle, colorScheme: 'dark' }} onFocus={focus} onBlur={blur} />
            </div>
          </div>
        </div>

        {/* Progression */}
        <div style={{ backgroundColor: '#111110', border: '1px solid #1E1E1C', borderRadius: '12px', padding: '28px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ fontFamily: 'var(--font-syne), sans-serif', fontSize: '15px', fontWeight: 600, color: '#F0EDE6', margin: 0 }}>Avancement du chantier</h2>
            <span style={{ fontFamily: 'var(--font-syne), sans-serif', fontSize: '24px', fontWeight: 700, color: '#E8C547' }}>{form.progression}%</span>
          </div>
          <input
            type="range" min={0} max={100} step={5}
            value={form.progression}
            onChange={(e) => set('progression', parseInt(e.target.value))}
            style={{ width: '100%', accentColor: '#E8C547', cursor: 'pointer' }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#8A8880', fontFamily: 'var(--font-dm-sans), sans-serif', marginTop: '6px' }}>
            <span>0%</span><span>25%</span><span>50%</span><span>75%</span><span>100%</span>
          </div>
        </div>

        {/* Observations + travaux */}
        <div style={{ backgroundColor: '#111110', border: '1px solid #1E1E1C', borderRadius: '12px', padding: '28px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <h2 style={{ fontFamily: 'var(--font-syne), sans-serif', fontSize: '15px', fontWeight: 600, color: '#F0EDE6', margin: 0 }}>Rapport de visite</h2>

          <div>
            <label style={labelStyle}>Observations / remarques</label>
            <textarea
              value={form.observations}
              onChange={(e) => set('observations', e.target.value)}
              rows={5}
              placeholder="Décrivez l'état du chantier, les points importants observés…"
              style={{ ...inputStyle, resize: 'vertical', lineHeight: '1.6' }}
              onFocus={focus} onBlur={blur}
            />
          </div>

          <div>
            <label style={labelStyle}>Travaux à réaliser</label>
            <textarea
              value={form.travaux_a_faire}
              onChange={(e) => set('travaux_a_faire', e.target.value)}
              rows={4}
              placeholder="Listez les tâches à effectuer avant la prochaine visite…"
              style={{ ...inputStyle, resize: 'vertical', lineHeight: '1.6' }}
              onFocus={focus} onBlur={blur}
            />
          </div>
        </div>

        {/* Artisans */}
        <div style={{ backgroundColor: '#111110', border: '1px solid #1E1E1C', borderRadius: '12px', padding: '28px' }}>
          <h2 style={{ fontFamily: 'var(--font-syne), sans-serif', fontSize: '15px', fontWeight: 600, color: '#F0EDE6', margin: '0 0 16px' }}>Artisans présents</h2>

          <div ref={artisansRef} style={{ position: 'relative' }}>
            {/* Trigger button */}
            <button
              type="button"
              onClick={() => setArtisansOpen((o) => !o)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 14px',
                backgroundColor: '#0D0D0B',
                border: `1px solid ${artisansOpen ? '#E8C547' : '#2A2A28'}`,
                borderRadius: '8px',
                color: form.artisans_presents.length > 0 ? '#F0EDE6' : '#8A8880',
                fontSize: '14px',
                fontFamily: 'var(--font-dm-sans), sans-serif',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <span>
                {form.artisans_presents.length > 0
                  ? `${form.artisans_presents.length} artisan${form.artisans_presents.length > 1 ? 's' : ''} sélectionné${form.artisans_presents.length > 1 ? 's' : ''}`
                  : 'Sélectionner des artisans…'}
              </span>
              <span style={{ fontSize: '10px', color: '#8A8880', transition: 'transform 0.15s', display: 'inline-block', transform: artisansOpen ? 'rotate(180deg)' : 'none' }}>▼</span>
            </button>

            {/* Dropdown list */}
            {artisansOpen && (
              <div style={{
                position: 'absolute',
                top: 'calc(100% + 4px)',
                left: 0,
                right: 0,
                backgroundColor: '#1A1A18',
                border: '1px solid #2A2A28',
                borderRadius: '8px',
                zIndex: 50,
                overflow: 'hidden',
                boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
              }}>
                {artisansList.length === 0 && (
                  <div style={{ padding: '12px 14px', fontSize: '13px', color: '#8A8880', fontFamily: 'var(--font-dm-sans), sans-serif' }}>
                    Aucun artisan enregistré.
                  </div>
                )}
                {artisansList.map((artisan, i) => {
                  const checked = form.artisans_presents.includes(artisan.nom)
                  return (
                    <button
                      key={artisan.id}
                      type="button"
                      onClick={() => toggleArtisan(artisan.nom)}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '10px 14px',
                        backgroundColor: checked ? '#232320' : 'transparent',
                        borderTop: i > 0 ? '1px solid #2A2A28' : 'none',
                        border: 'none',
                        borderRadius: 0,
                        cursor: 'pointer',
                        textAlign: 'left',
                      }}
                      onMouseEnter={(e) => { if (!checked) e.currentTarget.style.backgroundColor = '#2A2A28' }}
                      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = checked ? '#232320' : 'transparent' }}
                    >
                      <span style={{
                        width: '16px', height: '16px', borderRadius: '4px', flexShrink: 0,
                        border: `2px solid ${checked ? '#E8C547' : '#3A3A38'}`,
                        backgroundColor: checked ? '#E8C547' : 'transparent',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'all 0.1s',
                      }}>
                        {checked && <span style={{ color: '#0D0D0B', fontSize: '10px', fontWeight: 700, lineHeight: 1 }}>✓</span>}
                      </span>
                      <span style={{ fontSize: '14px', color: '#F0EDE6', fontFamily: 'var(--font-dm-sans), sans-serif' }}>
                        {artisan.nom}
                      </span>
                    </button>
                  )
                })}

                {/* Nouvel artisan */}
                {!showNewArtisan ? (
                  <button
                    type="button"
                    onClick={() => setShowNewArtisan(true)}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', gap: '8px',
                      padding: '10px 14px', backgroundColor: 'transparent',
                      borderTop: '1px solid #2A2A28', border: 'none', borderRadius: 0,
                      cursor: 'pointer', textAlign: 'left', color: '#E8C547',
                      fontSize: '13px', fontFamily: 'var(--font-dm-sans), sans-serif',
                      fontWeight: 500,
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#2A2A28' }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
                  >
                    + Nouvel artisan
                  </button>
                ) : (
                  <form
                    onSubmit={handleCreateArtisan}
                    style={{ borderTop: '1px solid #2A2A28', padding: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}
                  >
                    <input
                      autoFocus
                      required
                      placeholder="Nom *"
                      value={newArtisan.nom}
                      onChange={(e) => setNewArtisan((p) => ({ ...p, nom: e.target.value }))}
                      style={{ width: '100%', padding: '8px 10px', backgroundColor: '#0D0D0B', border: '1px solid #2A2A28', borderRadius: '6px', color: '#F0EDE6', fontSize: '13px', outline: 'none', fontFamily: 'var(--font-dm-sans), sans-serif', boxSizing: 'border-box' }}
                    />
                    <MetierSelect
                      value={newArtisan.metier}
                      onChange={(v) => setNewArtisan((p) => ({ ...p, metier: v }))}
                      compact
                    />
                    <input
                      type="email"
                      placeholder="Email"
                      value={newArtisan.email}
                      onChange={(e) => setNewArtisan((p) => ({ ...p, email: e.target.value }))}
                      style={{ width: '100%', padding: '8px 10px', backgroundColor: '#0D0D0B', border: '1px solid #2A2A28', borderRadius: '6px', color: '#F0EDE6', fontSize: '13px', outline: 'none', fontFamily: 'var(--font-dm-sans), sans-serif', boxSizing: 'border-box' }}
                    />
                    <input
                      placeholder="Téléphone"
                      value={newArtisan.telephone}
                      onChange={(e) => setNewArtisan((p) => ({ ...p, telephone: e.target.value }))}
                      style={{ width: '100%', padding: '8px 10px', backgroundColor: '#0D0D0B', border: '1px solid #2A2A28', borderRadius: '6px', color: '#F0EDE6', fontSize: '13px', outline: 'none', fontFamily: 'var(--font-dm-sans), sans-serif', boxSizing: 'border-box' }}
                    />
                    <div style={{ display: 'flex', gap: '6px', marginTop: '2px' }}>
                      <button
                        type="submit"
                        disabled={creatingArtisan || !newArtisan.nom.trim()}
                        style={{ flex: 1, padding: '8px', backgroundColor: creatingArtisan ? '#9E8630' : '#E8C547', color: '#0D0D0B', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: 600, cursor: creatingArtisan ? 'not-allowed' : 'pointer', fontFamily: 'var(--font-dm-sans), sans-serif' }}
                      >
                        {creatingArtisan ? 'Création…' : 'Créer et ajouter'}
                      </button>
                      <button
                        type="button"
                        onClick={() => { setShowNewArtisan(false); setNewArtisan({ nom: '', email: '', telephone: '', metier: '' }) }}
                        style={{ padding: '8px 12px', backgroundColor: 'transparent', color: '#8A8880', border: '1px solid #2A2A28', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', fontFamily: 'var(--font-dm-sans), sans-serif' }}
                      >
                        Annuler
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}
          </div>

          {/* Selected tags */}
          {form.artisans_presents.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '10px' }}>
              {form.artisans_presents.map((nom) => (
                <span key={nom} style={{
                  display: 'inline-flex', alignItems: 'center', gap: '6px',
                  padding: '4px 10px', backgroundColor: '#1E1E1C', borderRadius: '20px',
                  fontSize: '13px', color: '#E8C547', fontFamily: 'var(--font-dm-sans), sans-serif',
                }}>
                  {nom}
                  <button
                    type="button"
                    onClick={() => toggleArtisan(nom)}
                    style={{ background: 'none', border: 'none', color: '#8A8880', cursor: 'pointer', fontSize: '14px', lineHeight: 1, padding: 0, display: 'flex' }}
                  >×</button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Photos */}
        <div style={{ backgroundColor: '#111110', border: '1px solid #1E1E1C', borderRadius: '12px', padding: '28px' }}>
          <h2 style={{ fontFamily: 'var(--font-syne), sans-serif', fontSize: '15px', fontWeight: 600, color: '#F0EDE6', margin: '0 0 16px' }}>Photos du chantier</h2>

          <label
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px',
              padding: '24px', border: '1px dashed #1E1E1C', borderRadius: '8px', cursor: 'pointer',
              color: '#8A8880', fontSize: '13px', fontFamily: 'var(--font-dm-sans), sans-serif',
              marginBottom: photoPreviews.length ? '16px' : 0,
            }}
          >
            <span style={{ fontSize: '24px' }}>↑</span>
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
                  <button
                    type="button"
                    onClick={() => removePhoto(i)}
                    style={{ position: 'absolute', top: '4px', right: '4px', width: '20px', height: '20px', borderRadius: '50%', border: 'none', backgroundColor: 'rgba(0,0,0,0.7)', color: '#fff', cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {error && (
          <p style={{ fontSize: '13px', color: '#E85447', fontFamily: 'var(--font-dm-sans), sans-serif', margin: 0 }}>{error}</p>
        )}

        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            type="submit"
            disabled={loading}
            style={{ flex: 1, padding: '12px', backgroundColor: loading ? '#9E8630' : '#E8C547', color: '#0D0D0B', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'var(--font-dm-sans), sans-serif' }}
          >
            {loading ? 'Enregistrement…' : 'Enregistrer et générer PDF'}
          </button>
          <Link href="/dashboard/comptes-rendus" style={{ padding: '12px 20px', backgroundColor: 'transparent', color: '#8A8880', border: '1px solid #1E1E1C', borderRadius: '8px', fontSize: '14px', fontWeight: 500, textDecoration: 'none', fontFamily: 'var(--font-dm-sans), sans-serif', display: 'flex', alignItems: 'center' }}>
            Annuler
          </Link>
        </div>
      </form>
    </div>
  )
}
