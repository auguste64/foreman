'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  updateArtisan,
  deleteArtisan,
  getChantiersArtisan,
  assignerArtisan,
  retirerArtisan,
} from '@/lib/supabase/artisans'
import { getChantiers } from '@/lib/supabase/chantiers'
import type { Artisan } from '@/lib/supabase/artisans'
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
  fontSize: '12px',
  color: '#8A8880',
  marginBottom: '6px',
  fontFamily: 'var(--font-dm-sans), sans-serif',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
}

export default function ArtisanDetail({ artisan }: { artisan: Artisan }) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState({
    nom: artisan.nom,
    email: artisan.email,
    telephone: artisan.telephone,
    metier: artisan.metier,
  })

  // Chantiers assignés
  const [chantiers, setChantiers] = useState<Chantier[]>([])
  const [loadingChantiers, setLoadingChantiers] = useState(true)

  // Modal: assigner
  const [showAssigner, setShowAssigner] = useState(false)
  const [tousChantiers, setTousChantiers] = useState<Chantier[]>([])
  const [selectedChantier, setSelectedChantier] = useState('')
  const [assigning, setAssigning] = useState(false)
  const [assignError, setAssignError] = useState<string | null>(null)

  // Modal: convocation
  const [showConvocation, setShowConvocation] = useState(false)
  const [convocation, setConvocation] = useState({
    objet: '',
    message: '',
    date: '',
    heure: '',
    chantier_id: '',
  })
  const [sending, setSending] = useState(false)
  const [sendSuccess, setSendSuccess] = useState(false)
  const [sendError, setSendError] = useState<string | null>(null)

  function set(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }))
  }

  useEffect(() => {
    loadChantiersArtisan()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function loadChantiersArtisan() {
    setLoadingChantiers(true)
    try {
      const data = await getChantiersArtisan(artisan.id)
      setChantiers(data)
    } catch {
      // ignore
    } finally {
      setLoadingChantiers(false)
    }
  }

  async function handleSave() {
    setError(null)
    setSaving(true)
    try {
      await updateArtisan(artisan.id, form)
      router.refresh()
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
      await deleteArtisan(artisan.id)
      router.push('/dashboard/artisans')
      router.refresh()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la suppression.')
      setDeleting(false)
      setConfirmDelete(false)
    }
  }

  async function openAssigner() {
    setShowAssigner(true)
    setAssignError(null)
    setSelectedChantier('')
    try {
      const all = await getChantiers()
      const assignedIds = new Set(chantiers.map((c) => c.id))
      setTousChantiers(all.filter((c) => !assignedIds.has(c.id)))
    } catch {
      setAssignError('Impossible de charger les chantiers.')
    }
  }

  async function handleAssigner() {
    if (!selectedChantier) return
    setAssigning(true)
    setAssignError(null)
    try {
      await assignerArtisan(selectedChantier, artisan.id)
      await loadChantiersArtisan()
      setShowAssigner(false)
    } catch (err: unknown) {
      setAssignError(err instanceof Error ? err.message : "Erreur lors de l'assignation.")
    } finally {
      setAssigning(false)
    }
  }

  async function handleRetirer(chantierId: string) {
    try {
      await retirerArtisan(chantierId, artisan.id)
      setChantiers((prev) => prev.filter((c) => c.id !== chantierId))
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erreur lors du retrait.')
    }
  }

  async function handleSendConvocation() {
    setSendError(null)
    setSending(true)
    try {
      const res = await fetch('/api/send-convocation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ artisanId: artisan.id, ...convocation }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Erreur')
      setSendSuccess(true)
      setTimeout(() => {
        setShowConvocation(false)
        setSendSuccess(false)
        setConvocation({ objet: '', message: '', date: '', heure: '', chantier_id: '' })
      }, 2000)
    } catch (err: unknown) {
      setSendError(err instanceof Error ? err.message : "Erreur lors de l'envoi.")
    } finally {
      setSending(false)
    }
  }

  return (
    <div style={{ flex: 1, padding: '40px', overflowY: 'auto', maxWidth: '720px' }}>
      <Link
        href="/dashboard/artisans"
        style={{
          fontSize: '13px',
          color: '#8A8880',
          textDecoration: 'none',
          fontFamily: 'var(--font-dm-sans), sans-serif',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          marginBottom: '28px',
        }}
      >
        ← Retour aux artisans
      </Link>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', marginBottom: '32px' }}>
        <div>
          <h1
            style={{
              fontFamily: 'var(--font-syne), sans-serif',
              fontSize: '26px',
              fontWeight: 700,
              color: '#F0EDE6',
              margin: '0 0 8px',
            }}
          >
            {artisan.nom}
          </h1>
          <span
            style={{
              display: 'inline-block',
              padding: '2px 10px',
              borderRadius: '20px',
              fontSize: '12px',
              fontWeight: 500,
              backgroundColor: '#1a2019',
              color: '#E8C547',
              fontFamily: 'var(--font-dm-sans), sans-serif',
            }}
          >
            {artisan.metier}
          </span>
        </div>

        {!editing && (
          <div style={{ display: 'flex', gap: '8px', flexShrink: 0, flexWrap: 'wrap' }}>
            <button
              onClick={() => { setShowConvocation(true); setSendError(null); setSendSuccess(false) }}
              style={{
                padding: '8px 14px',
                backgroundColor: '#1E1E1C',
                color: '#E8C547',
                border: '1px solid #1E1E1C',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 500,
                cursor: 'pointer',
                fontFamily: 'var(--font-dm-sans), sans-serif',
              }}
            >
              ✉ Convoquer
            </button>
            <button
              onClick={() => setEditing(true)}
              style={{
                padding: '8px 14px',
                backgroundColor: '#1E1E1C',
                color: '#F0EDE6',
                border: '1px solid #1E1E1C',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 500,
                cursor: 'pointer',
                fontFamily: 'var(--font-dm-sans), sans-serif',
              }}
            >
              Modifier
            </button>
            <button
              onClick={() => setConfirmDelete(true)}
              style={{
                padding: '8px 14px',
                backgroundColor: 'transparent',
                color: '#8A8880',
                border: '1px solid #1E1E1C',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 500,
                cursor: 'pointer',
                fontFamily: 'var(--font-dm-sans), sans-serif',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = '#E85447'; e.currentTarget.style.borderColor = '#E85447' }}
              onMouseLeave={(e) => { e.currentTarget.style.color = '#8A8880'; e.currentTarget.style.borderColor = '#1E1E1C' }}
            >
              Supprimer
            </button>
          </div>
        )}
      </div>

      {/* Info cards (view mode) */}
      {!editing && (
        <div
          style={{
            backgroundColor: '#111110',
            border: '1px solid #1E1E1C',
            borderRadius: '12px',
            padding: '28px',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '28px',
            marginBottom: '32px',
          }}
        >
          {[
            { label: 'Nom complet', value: artisan.nom },
            { label: 'Métier', value: artisan.metier },
            { label: 'Email', value: artisan.email },
            { label: 'Téléphone', value: artisan.telephone },
          ].map(({ label, value }) => (
            <div key={label}>
              <p style={{ ...labelStyle, marginBottom: '4px' }}>{label}</p>
              <p style={{ color: '#F0EDE6', fontSize: '15px', fontFamily: 'var(--font-dm-sans), sans-serif', margin: 0 }}>
                {value}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Edit form */}
      {editing && (
        <div
          style={{
            backgroundColor: '#111110',
            border: '1px solid #E8C547',
            borderRadius: '12px',
            padding: '28px',
            marginBottom: '32px',
          }}
        >
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>Nom complet</label>
              <input
                type="text"
                value={form.nom}
                onChange={set('nom')}
                style={inputStyle}
                onFocus={(e) => (e.target.style.borderColor = '#E8C547')}
                onBlur={(e) => (e.target.style.borderColor = '#1E1E1C')}
              />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>Métier</label>
              <MetierSelect
                value={form.metier}
                onChange={(v) => setForm((prev) => ({ ...prev, metier: v }))}
              />
            </div>
            <div>
              <label style={labelStyle}>Email</label>
              <input
                type="email"
                value={form.email}
                onChange={set('email')}
                style={inputStyle}
                onFocus={(e) => (e.target.style.borderColor = '#E8C547')}
                onBlur={(e) => (e.target.style.borderColor = '#1E1E1C')}
              />
            </div>
            <div>
              <label style={labelStyle}>Téléphone</label>
              <input
                type="tel"
                value={form.telephone}
                onChange={set('telephone')}
                style={inputStyle}
                onFocus={(e) => (e.target.style.borderColor = '#E8C547')}
                onBlur={(e) => (e.target.style.borderColor = '#1E1E1C')}
              />
            </div>
          </div>

          {error && (
            <p style={{ fontSize: '13px', color: '#E85447', marginBottom: '16px', fontFamily: 'var(--font-dm-sans), sans-serif' }}>
              {error}
            </p>
          )}

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={handleSave}
              disabled={saving}
              style={{
                padding: '10px 20px',
                backgroundColor: saving ? '#9E8630' : '#E8C547',
                color: '#0D0D0B',
                border: 'none',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: saving ? 'not-allowed' : 'pointer',
                fontFamily: 'var(--font-dm-sans), sans-serif',
              }}
            >
              {saving ? 'Sauvegarde...' : 'Sauvegarder'}
            </button>
            <button
              onClick={() => {
                setEditing(false)
                setError(null)
                setForm({ nom: artisan.nom, email: artisan.email, telephone: artisan.telephone, metier: artisan.metier })
              }}
              style={{
                padding: '10px 20px',
                backgroundColor: 'transparent',
                color: '#8A8880',
                border: '1px solid #1E1E1C',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 500,
                cursor: 'pointer',
                fontFamily: 'var(--font-dm-sans), sans-serif',
              }}
            >
              Annuler
            </button>
          </div>
        </div>
      )}

      {/* Chantiers assignés */}
      <div
        style={{
          backgroundColor: '#111110',
          border: '1px solid #1E1E1C',
          borderRadius: '12px',
          padding: '28px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <h2
            style={{
              fontFamily: 'var(--font-syne), sans-serif',
              fontSize: '16px',
              fontWeight: 600,
              color: '#F0EDE6',
              margin: 0,
            }}
          >
            Chantiers assignés
          </h2>
          <button
            onClick={openAssigner}
            style={{
              padding: '8px 14px',
              backgroundColor: '#E8C547',
              color: '#0D0D0B',
              border: 'none',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'var(--font-dm-sans), sans-serif',
            }}
          >
            + Assigner
          </button>
        </div>

        {loadingChantiers && (
          <p style={{ color: '#8A8880', fontSize: '13px', fontFamily: 'var(--font-dm-sans), sans-serif' }}>
            Chargement...
          </p>
        )}

        {!loadingChantiers && chantiers.length === 0 && (
          <p style={{ color: '#8A8880', fontSize: '13px', fontFamily: 'var(--font-dm-sans), sans-serif', fontStyle: 'italic' }}>
            Aucun chantier assigné.
          </p>
        )}

        {!loadingChantiers && chantiers.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {chantiers.map((c) => (
              <div
                key={c.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 16px',
                  backgroundColor: '#0D0D0B',
                  border: '1px solid #1E1E1C',
                  borderRadius: '8px',
                }}
              >
                <div>
                  <Link
                    href={`/dashboard/chantiers/${c.id}`}
                    style={{
                      fontSize: '14px',
                      fontWeight: 500,
                      color: '#F0EDE6',
                      fontFamily: 'var(--font-dm-sans), sans-serif',
                      textDecoration: 'none',
                    }}
                  >
                    {c.nom}
                  </Link>
                  <p style={{ fontSize: '12px', color: '#8A8880', fontFamily: 'var(--font-dm-sans), sans-serif', margin: '2px 0 0' }}>
                    {c.client} · {c.adresse}
                  </p>
                </div>
                <button
                  onClick={() => handleRetirer(c.id)}
                  style={{
                    padding: '6px 12px',
                    backgroundColor: 'transparent',
                    color: '#8A8880',
                    border: '1px solid #1E1E1C',
                    borderRadius: '6px',
                    fontSize: '12px',
                    cursor: 'pointer',
                    fontFamily: 'var(--font-dm-sans), sans-serif',
                    flexShrink: 0,
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = '#E85447'; e.currentTarget.style.borderColor = '#E85447' }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = '#8A8880'; e.currentTarget.style.borderColor = '#1E1E1C' }}
                >
                  Retirer
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal: Assigner à un chantier */}
      {showAssigner && (
        <div
          style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}
          onClick={() => setShowAssigner(false)}
        >
          <div
            style={{ backgroundColor: '#111110', border: '1px solid #1E1E1C', borderRadius: '12px', padding: '32px', maxWidth: '440px', width: '100%', margin: '0 24px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ fontFamily: 'var(--font-syne), sans-serif', fontSize: '18px', fontWeight: 600, color: '#F0EDE6', marginBottom: '20px' }}>
              Assigner à un chantier
            </h2>

            {tousChantiers.length > 0 ? (
              <select
                value={selectedChantier}
                onChange={(e) => setSelectedChantier(e.target.value)}
                style={{ ...inputStyle, cursor: 'pointer', marginBottom: '20px' }}
                onFocus={(e) => (e.target.style.borderColor = '#E8C547')}
                onBlur={(e) => (e.target.style.borderColor = '#1E1E1C')}
              >
                <option value="">— Sélectionner un chantier —</option>
                {tousChantiers.map((c) => (
                  <option key={c.id} value={c.id} style={{ backgroundColor: '#111110' }}>
                    {c.nom} · {c.client}
                  </option>
                ))}
              </select>
            ) : (
              <p style={{ fontSize: '13px', color: '#8A8880', fontFamily: 'var(--font-dm-sans), sans-serif', marginBottom: '20px' }}>
                Tous les chantiers sont déjà assignés.
              </p>
            )}

            {assignError && (
              <p style={{ fontSize: '13px', color: '#E85447', marginBottom: '16px', fontFamily: 'var(--font-dm-sans), sans-serif' }}>
                {assignError}
              </p>
            )}

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={handleAssigner}
                disabled={assigning || !selectedChantier}
                style={{
                  flex: 1,
                  padding: '10px',
                  backgroundColor: !selectedChantier ? '#5a5030' : assigning ? '#9E8630' : '#E8C547',
                  color: '#0D0D0B',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: assigning || !selectedChantier ? 'not-allowed' : 'pointer',
                  fontFamily: 'var(--font-dm-sans), sans-serif',
                }}
              >
                {assigning ? 'Assignation...' : 'Assigner'}
              </button>
              <button
                onClick={() => setShowAssigner(false)}
                style={{
                  flex: 1,
                  padding: '10px',
                  backgroundColor: 'transparent',
                  color: '#8A8880',
                  border: '1px solid #1E1E1C',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  fontFamily: 'var(--font-dm-sans), sans-serif',
                }}
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Envoyer une convocation */}
      {showConvocation && (
        <div
          style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}
          onClick={() => setShowConvocation(false)}
        >
          <div
            style={{ backgroundColor: '#111110', border: '1px solid #1E1E1C', borderRadius: '12px', padding: '32px', maxWidth: '480px', width: '100%', margin: '0 24px', maxHeight: '90vh', overflowY: 'auto' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ fontFamily: 'var(--font-syne), sans-serif', fontSize: '18px', fontWeight: 600, color: '#F0EDE6', marginBottom: '20px' }}>
              Envoyer une convocation
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={labelStyle}>Chantier</label>
                <select
                  value={convocation.chantier_id}
                  onChange={(e) => setConvocation((prev) => ({ ...prev, chantier_id: e.target.value }))}
                  style={{ ...inputStyle, cursor: 'pointer' }}
                  onFocus={(e) => (e.target.style.borderColor = '#E8C547')}
                  onBlur={(e) => (e.target.style.borderColor = '#1E1E1C')}
                >
                  <option value="">— Sélectionner un chantier —</option>
                  {chantiers.map((c) => (
                    <option key={c.id} value={c.id} style={{ backgroundColor: '#111110' }}>
                      {c.nom}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={labelStyle}>Objet *</label>
                <input
                  type="text"
                  value={convocation.objet}
                  onChange={(e) => setConvocation((prev) => ({ ...prev, objet: e.target.value }))}
                  placeholder="Ex : Réunion de chantier"
                  style={inputStyle}
                  onFocus={(e) => (e.target.style.borderColor = '#E8C547')}
                  onBlur={(e) => (e.target.style.borderColor = '#1E1E1C')}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={labelStyle}>Date *</label>
                  <input
                    type="date"
                    value={convocation.date}
                    onChange={(e) => setConvocation((prev) => ({ ...prev, date: e.target.value }))}
                    style={{ ...inputStyle, colorScheme: 'dark' }}
                    onFocus={(e) => (e.target.style.borderColor = '#E8C547')}
                    onBlur={(e) => (e.target.style.borderColor = '#1E1E1C')}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Heure *</label>
                  <input
                    type="time"
                    value={convocation.heure}
                    onChange={(e) => setConvocation((prev) => ({ ...prev, heure: e.target.value }))}
                    style={{ ...inputStyle, colorScheme: 'dark' }}
                    onFocus={(e) => (e.target.style.borderColor = '#E8C547')}
                    onBlur={(e) => (e.target.style.borderColor = '#1E1E1C')}
                  />
                </div>
              </div>

              <div>
                <label style={labelStyle}>Message</label>
                <textarea
                  value={convocation.message}
                  onChange={(e) => setConvocation((prev) => ({ ...prev, message: e.target.value }))}
                  placeholder="Instructions particulières, matériaux à apporter…"
                  rows={4}
                  style={{ ...inputStyle, resize: 'vertical' } as React.CSSProperties}
                  onFocus={(e) => (e.target.style.borderColor = '#E8C547')}
                  onBlur={(e) => (e.target.style.borderColor = '#1E1E1C')}
                />
              </div>
            </div>

            {sendError && (
              <p style={{ fontSize: '13px', color: '#E85447', marginTop: '12px', fontFamily: 'var(--font-dm-sans), sans-serif' }}>
                {sendError}
              </p>
            )}
            {sendSuccess && (
              <p style={{ fontSize: '13px', color: '#47E8A0', marginTop: '12px', fontFamily: 'var(--font-dm-sans), sans-serif' }}>
                Convocation envoyée !
              </p>
            )}

            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button
                onClick={handleSendConvocation}
                disabled={sending || sendSuccess}
                style={{
                  flex: 1,
                  padding: '10px',
                  backgroundColor: sending || sendSuccess ? '#9E8630' : '#E8C547',
                  color: '#0D0D0B',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: sending ? 'not-allowed' : 'pointer',
                  fontFamily: 'var(--font-dm-sans), sans-serif',
                }}
              >
                {sending ? 'Envoi...' : sendSuccess ? 'Envoyée ✓' : 'Envoyer'}
              </button>
              <button
                onClick={() => {
                  setShowConvocation(false)
                  setSendError(null)
                  setSendSuccess(false)
                  setConvocation({ objet: '', message: '', date: '', heure: '', chantier_id: '' })
                }}
                style={{
                  flex: 1,
                  padding: '10px',
                  backgroundColor: 'transparent',
                  color: '#8A8880',
                  border: '1px solid #1E1E1C',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  fontFamily: 'var(--font-dm-sans), sans-serif',
                }}
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Confirm delete */}
      {confirmDelete && (
        <div
          style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}
          onClick={() => setConfirmDelete(false)}
        >
          <div
            style={{ backgroundColor: '#111110', border: '1px solid #1E1E1C', borderRadius: '12px', padding: '32px', maxWidth: '400px', width: '100%', margin: '0 24px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ fontFamily: 'var(--font-syne), sans-serif', fontSize: '18px', fontWeight: 600, color: '#F0EDE6', marginBottom: '12px' }}>
              Supprimer cet artisan ?
            </h2>
            <p style={{ color: '#8A8880', fontSize: '14px', fontFamily: 'var(--font-dm-sans), sans-serif', marginBottom: '28px', lineHeight: '1.5' }}>
              Cette action est irréversible. L&apos;artisan <strong style={{ color: '#F0EDE6' }}>{artisan.nom}</strong> sera définitivement supprimé.
            </p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={handleDelete}
                disabled={deleting}
                style={{
                  flex: 1,
                  padding: '10px',
                  backgroundColor: '#E85447',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: deleting ? 'not-allowed' : 'pointer',
                  fontFamily: 'var(--font-dm-sans), sans-serif',
                  opacity: deleting ? 0.6 : 1,
                }}
              >
                {deleting ? 'Suppression...' : 'Oui, supprimer'}
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                style={{
                  flex: 1,
                  padding: '10px',
                  backgroundColor: 'transparent',
                  color: '#8A8880',
                  border: '1px solid #1E1E1C',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  fontFamily: 'var(--font-dm-sans), sans-serif',
                }}
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
