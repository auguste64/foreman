'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { updateCompteRendu, deleteCompteRendu } from '@/lib/supabase/comptes-rendus'
import type { CompteRenduWithChantier } from '@/lib/supabase/comptes-rendus'
import MetierSelect from '@/components/MetierSelect'

const labelStyle: React.CSSProperties = {
  fontSize: '11px',
  color: '#8A8880',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.07em',
  fontFamily: 'var(--font-dm-sans), sans-serif',
  marginBottom: '4px',
  display: 'block',
}

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

const focus = (e: React.FocusEvent<HTMLElement>) => ((e.target as HTMLElement).style.borderColor = '#E8C547')
const blur = (e: React.FocusEvent<HTMLElement>) => ((e.target as HTMLElement).style.borderColor = '#1E1E1C')

function fmt(d: string | null) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}

export default function CompteRenduDetail({ compteRendu: initial }: { compteRendu: CompteRenduWithChantier }) {
  const router = useRouter()
  const [cr, setCr] = useState(initial)
  const [editing, setEditing] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [showEmailModal, setShowEmailModal] = useState(false)
  const [emailInput, setEmailInput] = useState('')
  const [emailEmails, setEmailEmails] = useState<string[]>([])
  const [sendingEmail, setSendingEmail] = useState(false)
  const [emailSuccess, setEmailSuccess] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [artisansList, setArtisansList] = useState<{ id: string; nom: string }[]>([])
  const [artisansOpen, setArtisansOpen] = useState(false)
  const artisansRef = useRef<HTMLDivElement>(null)
  const [showNewArtisan, setShowNewArtisan] = useState(false)
  const [newArtisan, setNewArtisan] = useState({ nom: '', email: '', telephone: '', metier: '' })
  const [creatingArtisan, setCreatingArtisan] = useState(false)

  const [form, setForm] = useState({
    date_visite: cr.date_visite,
    date_prochaine_visite: cr.date_prochaine_visite ?? '',
    progression: cr.progression,
    observations: cr.observations ?? '',
    travaux_a_faire: cr.travaux_a_faire ?? '',
    artisans_presents: [...cr.artisans_presents],
  })

  useEffect(() => {
    createClient().from('artisans').select('id, nom').order('nom')
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

  function setField(field: string, value: unknown) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function toggleArtisan(nom: string) {
    setField('artisans_presents', form.artisans_presents.includes(nom)
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
      setField('artisans_presents', [...form.artisans_presents, created.nom])
      setNewArtisan({ nom: '', email: '', telephone: '', metier: '' })
      setShowNewArtisan(false)
    } finally {
      setCreatingArtisan(false)
    }
  }

  async function handleSave() {
    setError(null)
    setSaving(true)
    try {
      const updated = await updateCompteRendu(cr.id, {
        ...form,
        date_prochaine_visite: form.date_prochaine_visite || null,
        observations: form.observations || null,
        travaux_a_faire: form.travaux_a_faire || null,
      })
      setCr({ ...updated, chantiers: cr.chantiers })
      setEditing(false)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la sauvegarde.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    setDeleting(true)
    try {
      await deleteCompteRendu(cr.id)
      router.push('/dashboard/comptes-rendus')
      router.refresh()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la suppression.')
      setDeleting(false)
      setConfirmDelete(false)
    }
  }

  function addEmail() {
    const e = emailInput.trim()
    if (!e || emailEmails.includes(e)) return
    setEmailEmails((prev) => [...prev, e])
    setEmailInput('')
  }

  async function handleSendEmail() {
    if (!emailEmails.length) return
    setSendingEmail(true)
    setError(null)
    try {
      const res = await fetch('/api/send-compte-rendu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ compteRenduId: cr.id, emails: emailEmails }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Erreur envoi email')
      }
      setEmailSuccess(true)
      setTimeout(() => { setShowEmailModal(false); setEmailSuccess(false); setEmailEmails([]) }, 2000)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erreur lors de l\'envoi.')
    } finally {
      setSendingEmail(false)
    }
  }

  return (
    <div style={{ flex: 1, padding: '40px', overflowY: 'auto' }}>
      {/* Back */}
      <Link href="/dashboard/comptes-rendus" style={{ fontSize: '13px', color: '#8A8880', textDecoration: 'none', fontFamily: 'var(--font-dm-sans), sans-serif', display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '28px' }}>
        ← Retour aux comptes rendus
      </Link>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-syne), sans-serif', fontSize: '24px', fontWeight: 700, color: '#F0EDE6', margin: '0 0 6px' }}>
            {cr.chantiers?.nom}
          </h1>
          <p style={{ color: '#8A8880', fontSize: '14px', fontFamily: 'var(--font-dm-sans), sans-serif', margin: 0 }}>
            Visite du {fmt(cr.date_visite)} · {cr.chantiers?.client}
          </p>
        </div>

        {!editing && (
          <div style={{ display: 'flex', gap: '8px', flexShrink: 0, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            <a
              href={`/api/generate-pdf/${cr.id}`}
              download
              style={{ padding: '8px 14px', backgroundColor: '#E8C547', color: '#0D0D0B', borderRadius: '8px', fontSize: '13px', fontWeight: 600, textDecoration: 'none', fontFamily: 'var(--font-dm-sans), sans-serif' }}
            >
              ↓ Télécharger PDF
            </a>
            <button
              onClick={() => setShowEmailModal(true)}
              style={{ padding: '8px 14px', backgroundColor: '#1E1E1C', color: '#F0EDE6', border: '1px solid #1E1E1C', borderRadius: '8px', fontSize: '13px', fontWeight: 500, cursor: 'pointer', fontFamily: 'var(--font-dm-sans), sans-serif' }}
            >
              ✉ Envoyer par email
            </button>
            <button
              onClick={() => setEditing(true)}
              style={{ padding: '8px 14px', backgroundColor: '#1E1E1C', color: '#F0EDE6', border: '1px solid #1E1E1C', borderRadius: '8px', fontSize: '13px', fontWeight: 500, cursor: 'pointer', fontFamily: 'var(--font-dm-sans), sans-serif' }}
            >
              Modifier
            </button>
            <button
              onClick={() => setConfirmDelete(true)}
              style={{ padding: '8px 14px', backgroundColor: 'transparent', color: '#8A8880', border: '1px solid #1E1E1C', borderRadius: '8px', fontSize: '13px', cursor: 'pointer', fontFamily: 'var(--font-dm-sans), sans-serif' }}
              onMouseEnter={(e) => { e.currentTarget.style.color = '#E85447'; e.currentTarget.style.borderColor = '#E85447' }}
              onMouseLeave={(e) => { e.currentTarget.style.color = '#8A8880'; e.currentTarget.style.borderColor = '#1E1E1C' }}
            >
              Supprimer
            </button>
          </div>
        )}
      </div>

      {/* VIEW MODE */}
      {!editing && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '720px' }}>

          {/* Dates + progression */}
          <div style={{ backgroundColor: '#111110', border: '1px solid #1E1E1C', borderRadius: '12px', padding: '24px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '24px' }}>
            <div>
              <span style={labelStyle}>Date de visite</span>
              <p style={{ color: '#F0EDE6', fontSize: '14px', fontFamily: 'var(--font-dm-sans), sans-serif', margin: 0 }}>{fmt(cr.date_visite)}</p>
            </div>
            <div>
              <span style={labelStyle}>Prochaine visite</span>
              <p style={{ color: cr.date_prochaine_visite ? '#E8C547' : '#8A8880', fontSize: '14px', fontFamily: 'var(--font-dm-sans), sans-serif', margin: 0 }}>{fmt(cr.date_prochaine_visite)}</p>
            </div>
            <div>
              <span style={labelStyle}>Avancement</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '4px' }}>
                <div style={{ flex: 1, height: '6px', backgroundColor: '#1E1E1C', borderRadius: '3px' }}>
                  <div style={{ height: '6px', backgroundColor: '#E8C547', borderRadius: '3px', width: `${cr.progression}%` }} />
                </div>
                <span style={{ fontFamily: 'var(--font-syne), sans-serif', fontSize: '13px', fontWeight: 700, color: '#E8C547', flexShrink: 0 }}>{cr.progression}%</span>
              </div>
            </div>
          </div>

          {/* Artisans */}
          {cr.artisans_presents?.length > 0 && (
            <div style={{ backgroundColor: '#111110', border: '1px solid #1E1E1C', borderRadius: '12px', padding: '24px' }}>
              <span style={labelStyle}>Artisans présents</span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '10px' }}>
                {cr.artisans_presents.map((a) => (
                  <span key={a} style={{ padding: '5px 12px', backgroundColor: '#1E1E1C', borderRadius: '20px', fontSize: '13px', color: '#F0EDE6', fontFamily: 'var(--font-dm-sans), sans-serif' }}>{a}</span>
                ))}
              </div>
            </div>
          )}

          {/* Observations */}
          <div style={{ backgroundColor: '#111110', border: '1px solid #1E1E1C', borderRadius: '12px', padding: '24px' }}>
            <span style={labelStyle}>Observations</span>
            <p style={{ color: cr.observations ? '#F0EDE6' : '#8A8880', fontSize: '14px', fontFamily: 'var(--font-dm-sans), sans-serif', margin: '8px 0 0', lineHeight: '1.7', fontStyle: cr.observations ? 'normal' : 'italic' }}>
              {cr.observations ?? 'Aucune observation.'}
            </p>
          </div>

          {/* Travaux */}
          <div style={{ backgroundColor: '#111110', border: '1px solid #1E1E1C', borderRadius: '12px', padding: '24px' }}>
            <span style={labelStyle}>Travaux à réaliser</span>
            <p style={{ color: cr.travaux_a_faire ? '#F0EDE6' : '#8A8880', fontSize: '14px', fontFamily: 'var(--font-dm-sans), sans-serif', margin: '8px 0 0', lineHeight: '1.7', fontStyle: cr.travaux_a_faire ? 'normal' : 'italic' }}>
              {cr.travaux_a_faire ?? 'Aucun travaux spécifiés.'}
            </p>
          </div>

          {/* Photos */}
          {cr.photos?.length > 0 && (
            <div style={{ backgroundColor: '#111110', border: '1px solid #1E1E1C', borderRadius: '12px', padding: '24px' }}>
              <span style={labelStyle}>Photos ({cr.photos.length})</span>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginTop: '12px' }}>
                {cr.photos.map((url, i) => (
                  <a key={i} href={url} target="_blank" rel="noopener noreferrer" style={{ display: 'block', borderRadius: '6px', overflow: 'hidden', aspectRatio: '1' }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* EDIT MODE */}
      {editing && (
        <div style={{ maxWidth: '680px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ backgroundColor: '#111110', border: '1px solid #E8C547', borderRadius: '12px', padding: '28px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={labelStyle}>Date de visite</label>
                <input type="date" value={form.date_visite} onChange={(e) => setField('date_visite', e.target.value)} style={{ ...inputStyle, colorScheme: 'dark' }} onFocus={focus} onBlur={blur} />
              </div>
              <div>
                <label style={labelStyle}>Prochaine visite</label>
                <input type="date" value={form.date_prochaine_visite} onChange={(e) => setField('date_prochaine_visite', e.target.value)} style={{ ...inputStyle, colorScheme: 'dark' }} onFocus={focus} onBlur={blur} />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                <label style={labelStyle}>Avancement</label>
                <span style={{ fontFamily: 'var(--font-syne), sans-serif', fontSize: '16px', fontWeight: 700, color: '#E8C547' }}>{form.progression}%</span>
              </div>
              <input type="range" min={0} max={100} step={5} value={form.progression} onChange={(e) => setField('progression', parseInt(e.target.value))} style={{ width: '100%', accentColor: '#E8C547' }} />
            </div>

            <div>
              <label style={labelStyle}>Observations</label>
              <textarea value={form.observations} onChange={(e) => setField('observations', e.target.value)} rows={4} style={{ ...inputStyle, resize: 'vertical', lineHeight: '1.6' }} onFocus={focus} onBlur={blur} />
            </div>

            <div>
              <label style={labelStyle}>Travaux à réaliser</label>
              <textarea value={form.travaux_a_faire} onChange={(e) => setField('travaux_a_faire', e.target.value)} rows={4} style={{ ...inputStyle, resize: 'vertical', lineHeight: '1.6' }} onFocus={focus} onBlur={blur} />
            </div>

            <div>
              <label style={{ ...labelStyle, marginBottom: '10px' }}>Artisans présents</label>
              <div ref={artisansRef} style={{ position: 'relative' }}>
                {/* Trigger */}
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
                  <span style={{ fontSize: '10px', color: '#8A8880', display: 'inline-block', transform: artisansOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }}>▼</span>
                </button>

                {/* Dropdown */}
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
                    {artisansList.length === 0 ? (
                      <div style={{ padding: '12px 14px', fontSize: '13px', color: '#8A8880', fontFamily: 'var(--font-dm-sans), sans-serif' }}>
                        Aucun artisan enregistré.
                      </div>
                    ) : artisansList.map((artisan, i) => {
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

              {/* Tags */}
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

            {error && <p style={{ fontSize: '13px', color: '#E85447', margin: 0, fontFamily: 'var(--font-dm-sans), sans-serif' }}>{error}</p>}

            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={handleSave} disabled={saving} style={{ padding: '10px 20px', backgroundColor: saving ? '#9E8630' : '#E8C547', color: '#0D0D0B', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'var(--font-dm-sans), sans-serif' }}>
                {saving ? 'Sauvegarde…' : 'Sauvegarder'}
              </button>
              <button onClick={() => { setEditing(false); setError(null) }} style={{ padding: '10px 20px', backgroundColor: 'transparent', color: '#8A8880', border: '1px solid #1E1E1C', borderRadius: '8px', fontSize: '13px', cursor: 'pointer', fontFamily: 'var(--font-dm-sans), sans-serif' }}>
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE MODAL */}
      {confirmDelete && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }} onClick={() => setConfirmDelete(false)}>
          <div style={{ backgroundColor: '#111110', border: '1px solid #1E1E1C', borderRadius: '12px', padding: '32px', maxWidth: '400px', width: '100%', margin: '0 24px' }} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontFamily: 'var(--font-syne), sans-serif', fontSize: '18px', fontWeight: 600, color: '#F0EDE6', marginBottom: '12px' }}>Supprimer ce compte rendu ?</h2>
            <p style={{ color: '#8A8880', fontSize: '14px', fontFamily: 'var(--font-dm-sans), sans-serif', marginBottom: '28px', lineHeight: '1.5' }}>
              Cette action est irréversible. Le compte rendu du <strong style={{ color: '#F0EDE6' }}>{fmt(cr.date_visite)}</strong> sera définitivement supprimé.
            </p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={handleDelete} disabled={deleting} style={{ flex: 1, padding: '10px', backgroundColor: '#E85447', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: deleting ? 'not-allowed' : 'pointer', fontFamily: 'var(--font-dm-sans), sans-serif', opacity: deleting ? 0.6 : 1 }}>
                {deleting ? 'Suppression…' : 'Oui, supprimer'}
              </button>
              <button onClick={() => setConfirmDelete(false)} style={{ flex: 1, padding: '10px', backgroundColor: 'transparent', color: '#8A8880', border: '1px solid #1E1E1C', borderRadius: '8px', fontSize: '13px', cursor: 'pointer', fontFamily: 'var(--font-dm-sans), sans-serif' }}>Annuler</button>
            </div>
          </div>
        </div>
      )}

      {/* EMAIL MODAL */}
      {showEmailModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }} onClick={() => setShowEmailModal(false)}>
          <div style={{ backgroundColor: '#111110', border: '1px solid #1E1E1C', borderRadius: '12px', padding: '32px', maxWidth: '440px', width: '100%', margin: '0 24px' }} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontFamily: 'var(--font-syne), sans-serif', fontSize: '18px', fontWeight: 600, color: '#F0EDE6', marginBottom: '8px' }}>Envoyer par email</h2>
            <p style={{ color: '#8A8880', fontSize: '13px', fontFamily: 'var(--font-dm-sans), sans-serif', marginBottom: '24px' }}>
              Le PDF sera envoyé aux destinataires ci-dessous.
            </p>

            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
              <input
                type="email"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addEmail() } }}
                placeholder="destinataire@exemple.com"
                style={{ ...inputStyle, flex: 1 }}
                onFocus={focus} onBlur={blur}
              />
              <button type="button" onClick={addEmail} style={{ padding: '10px 14px', backgroundColor: '#1E1E1C', color: '#F0EDE6', border: '1px solid #1E1E1C', borderRadius: '8px', fontSize: '13px', cursor: 'pointer', fontFamily: 'var(--font-dm-sans), sans-serif' }}>+ Ajouter</button>
            </div>

            {emailEmails.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '20px' }}>
                {emailEmails.map((e) => (
                  <span key={e} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '5px 12px', backgroundColor: '#1E1E1C', borderRadius: '20px', fontSize: '13px', color: '#F0EDE6', fontFamily: 'var(--font-dm-sans), sans-serif' }}>
                    {e}
                    <button type="button" onClick={() => setEmailEmails((prev) => prev.filter(x => x !== e))} style={{ background: 'none', border: 'none', color: '#8A8880', cursor: 'pointer', fontSize: '14px', lineHeight: 1, padding: 0 }}>×</button>
                  </span>
                ))}
              </div>
            )}

            {error && <p style={{ fontSize: '13px', color: '#E85447', marginBottom: '12px', fontFamily: 'var(--font-dm-sans), sans-serif' }}>{error}</p>}
            {emailSuccess && <p style={{ fontSize: '13px', color: '#47E8A0', marginBottom: '12px', fontFamily: 'var(--font-dm-sans), sans-serif' }}>Email envoyé avec succès !</p>}

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={handleSendEmail}
                disabled={sendingEmail || !emailEmails.length}
                style={{ flex: 1, padding: '10px', backgroundColor: sendingEmail || !emailEmails.length ? '#9E8630' : '#E8C547', color: '#0D0D0B', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: sendingEmail || !emailEmails.length ? 'not-allowed' : 'pointer', fontFamily: 'var(--font-dm-sans), sans-serif' }}
              >
                {sendingEmail ? 'Envoi…' : 'Envoyer'}
              </button>
              <button onClick={() => { setShowEmailModal(false); setEmailEmails([]); setError(null) }} style={{ flex: 1, padding: '10px', backgroundColor: 'transparent', color: '#8A8880', border: '1px solid #1E1E1C', borderRadius: '8px', fontSize: '13px', cursor: 'pointer', fontFamily: 'var(--font-dm-sans), sans-serif' }}>Annuler</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
