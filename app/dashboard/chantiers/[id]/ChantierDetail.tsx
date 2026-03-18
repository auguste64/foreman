'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { updateChantier, deleteChantier } from '@/lib/supabase/chantiers'
import { getArtisansChantier, getArtisans, assignerArtisan, retirerArtisan } from '@/lib/supabase/artisans'
import { useToast } from '@/components/ToastProvider'
import MiniCalendrier from './MiniCalendrier'
import type { Chantier } from '@/lib/supabase/chantiers'
import type { Artisan } from '@/lib/supabase/artisans'

const STATUTS = ['En cours', 'En pause', 'Terminé'] as const

const STATUT_COLORS: Record<Chantier['statut'], { bg: string; text: string }> = {
  'En cours': { bg: '#1a2e1a', text: '#4ade80' },
  'Terminé':  { bg: '#1a1a2e', text: '#818cf8' },
  'En pause': { bg: '#2e2a1a', text: '#fbbf24' },
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

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '12px',
  color: '#8A8880',
  marginBottom: '6px',
  fontFamily: 'var(--font-dm-sans), sans-serif',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
}

export default function ChantierDetail({ chantier }: { chantier: Chantier }) {
  const router = useRouter()
  const { showToast } = useToast()
  const [editing, setEditing] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState({
    nom: chantier.nom,
    adresse: chantier.adresse,
    client: chantier.client,
    date_debut: chantier.date_debut,
    statut: chantier.statut,
  })

  // Artisans
  const [artisans, setArtisans] = useState<Artisan[]>([])
  const [loadingArtisans, setLoadingArtisans] = useState(true)
  const [showAjouterArtisan, setShowAjouterArtisan] = useState(false)
  const [tousArtisans, setTousArtisans] = useState<Artisan[]>([])
  const [selectedArtisan, setSelectedArtisan] = useState('')
  const [assigning, setAssigning] = useState(false)
  const [assignError, setAssignError] = useState<string | null>(null)

  function set(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }))
  }

  useEffect(() => {
    loadArtisans()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function loadArtisans() {
    setLoadingArtisans(true)
    try {
      const data = await getArtisansChantier(chantier.id)
      setArtisans(data)
    } catch {
      // ignore
    } finally {
      setLoadingArtisans(false)
    }
  }

  async function openAjouterArtisan() {
    setShowAjouterArtisan(true)
    setAssignError(null)
    setSelectedArtisan('')
    try {
      const all = await getArtisans()
      const assignedIds = new Set(artisans.map((a) => a.id))
      setTousArtisans(all.filter((a) => !assignedIds.has(a.id)))
    } catch {
      setAssignError('Impossible de charger les artisans.')
    }
  }

  async function handleAssignerArtisan() {
    if (!selectedArtisan) return
    setAssigning(true)
    setAssignError(null)
    try {
      await assignerArtisan(chantier.id, selectedArtisan)
      await loadArtisans()
      setShowAjouterArtisan(false)
      showToast('Artisan ajouté')
    } catch (err: unknown) {
      setAssignError(err instanceof Error ? err.message : "Erreur lors de l'assignation.")
    } finally {
      setAssigning(false)
    }
  }

  async function handleRetirerArtisan(artisanId: string) {
    try {
      await retirerArtisan(chantier.id, artisanId)
      setArtisans((prev) => prev.filter((a) => a.id !== artisanId))
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erreur lors du retrait.')
    }
  }

  async function handleSave() {
    setError(null)
    setSaving(true)
    try {
      await updateChantier(chantier.id, form)
      showToast('Chantier sauvegardé')
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
      await deleteChantier(chantier.id)
      router.push('/dashboard/chantiers')
      router.refresh()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la suppression.')
      setDeleting(false)
      setConfirmDelete(false)
    }
  }

  const pathname = usePathname()
  const colors = STATUT_COLORS[chantier.statut] ?? STATUT_COLORS['En cours']
  const progression = chantier.statut === 'Terminé' ? 100 : chantier.statut === 'En pause' ? 30 : 65

  const tabItems = [
    { label: 'Infos', href: `/dashboard/chantiers/${chantier.id}` },
    { label: 'Devis', href: `/dashboard/chantiers/${chantier.id}/devis` },
    { label: 'Factures', href: `/dashboard/chantiers/${chantier.id}/factures` },
  ]

  return (
    <div style={{ flex: 1, padding: '40px', overflowY: 'auto', maxWidth: '720px' }}>
      {/* Back */}
      <Link
        href="/dashboard/chantiers"
        style={{ display: 'inline-flex', alignItems: 'center', gap: 8, backgroundColor: '#111110', border: '1px solid #1E1E1C', borderRadius: 8, padding: '8px 14px', color: '#F0EDE6', fontSize: 13, fontWeight: 500, cursor: 'pointer', textDecoration: 'none', transition: 'all 0.15s ease', fontFamily: 'var(--font-dm-sans), sans-serif', marginBottom: 28 }}
        onMouseEnter={e => { e.currentTarget.style.background = '#1E1E1C'; e.currentTarget.style.borderColor = '#ea580c'; e.currentTarget.style.color = '#ea580c' }}
        onMouseLeave={e => { e.currentTarget.style.background = '#111110'; e.currentTarget.style.borderColor = '#1E1E1C'; e.currentTarget.style.color = '#F0EDE6' }}
      >
        <span style={{ color: '#ea580c' }}>←</span>
        Retour aux chantiers
      </Link>

      {/* Visual header */}
      <div style={{ marginBottom: '32px', paddingBottom: '24px', borderBottom: '1px solid #1E1E1C' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
          <h1 style={{ fontFamily: 'var(--font-syne), sans-serif', fontSize: '28px', fontWeight: 700, color: '#F0EDE6', margin: 0 }}>
            {chantier.nom}
          </h1>
          <span style={{ padding: '3px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 500, fontFamily: 'var(--font-dm-sans), sans-serif', backgroundColor: colors.bg, color: colors.text, flexShrink: 0 }}>
            {chantier.statut}
          </span>
        </div>
        <p style={{ color: '#8A8880', fontSize: '13px', fontFamily: 'var(--font-dm-sans), sans-serif', margin: '0 0 16px' }}>
          {chantier.adresse}
        </p>
        {/* Progress bar */}
        <div style={{ width: '100%', height: '4px', backgroundColor: '#1E1E1C', borderRadius: '999px', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${progression}%`, backgroundColor: '#ea580c', borderRadius: '999px', transition: 'width 0.8s cubic-bezier(0.4,0,0.2,1)' }} />
        </div>
        <p style={{ fontSize: '11px', color: '#7A7870', fontFamily: 'var(--font-dm-sans), sans-serif', margin: '6px 0 0', textAlign: 'right' }}>
          {progression}%
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '32px', borderBottom: '1px solid #1E1E1C' }}>
        {tabItems.map(tab => {
          const active = pathname === tab.href
          return (
            <Link
              key={tab.href}
              href={tab.href}
              style={{
                padding: '10px 20px',
                fontSize: '13px',
                fontWeight: 500,
                fontFamily: 'var(--font-dm-sans), sans-serif',
                textDecoration: 'none',
                color: active ? '#ea580c' : '#8A8880',
                borderBottom: active ? '2px solid #ea580c' : '2px solid transparent',
                marginBottom: '-1px',
                transition: 'color 0.15s',
              }}
              onMouseEnter={e => { if (!active) e.currentTarget.style.color = '#F0EDE6' }}
              onMouseLeave={e => { if (!active) e.currentTarget.style.color = '#8A8880' }}
            >
              {tab.label}
            </Link>
          )
        })}
      </div>

      {/* Header actions */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', marginBottom: '32px' }}>
        <div>
          <p style={{ color: '#8A8880', fontSize: '14px', fontFamily: 'var(--font-dm-sans), sans-serif', margin: 0 }}>
            {chantier.client} · {chantier.adresse}
          </p>
        </div>

        {!editing && (
          <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
            <button
              onClick={() => setEditing(true)}
              className="transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_0_20px_rgba(249,115,22,0.4)] active:translate-y-0 active:shadow-none"
              style={{
                padding: '8px 16px',
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
              className="transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_0_20px_rgba(249,115,22,0.4)] active:translate-y-0 active:shadow-none"
              style={{
                padding: '8px 16px',
                backgroundColor: 'transparent',
                color: '#8A8880',
                border: '1px solid #1E1E1C',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 500,
                cursor: 'pointer',
                fontFamily: 'var(--font-dm-sans), sans-serif',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#E85447'
                e.currentTarget.style.borderColor = '#E85447'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = '#8A8880'
                e.currentTarget.style.borderColor = '#1E1E1C'
              }}
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
          }}
        >
          {[
            { label: 'Nom du chantier', value: chantier.nom },
            { label: 'Client', value: chantier.client },
            { label: 'Adresse', value: chantier.adresse },
            { label: 'Date de début', value: new Date(chantier.date_debut).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) },
          ].map(({ label, value }) => (
            <div key={label}>
              <p style={{ ...labelStyle, marginBottom: '4px' }}>{label}</p>
              <p style={{ color: '#F0EDE6', fontSize: '15px', fontFamily: 'var(--font-dm-sans), sans-serif', margin: 0 }}>{value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Edit form (inline) */}
      {editing && (
        <div
          style={{
            backgroundColor: '#111110',
            border: '1px solid #ea580c',
            borderRadius: '12px',
            padding: '28px',
          }}
        >
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>Nom du chantier</label>
              <input
                type="text"
                value={form.nom}
                onChange={set('nom')}
                style={inputStyle}
                onFocus={(e) => (e.target.style.borderColor = '#ea580c')}
                onBlur={(e) => (e.target.style.borderColor = '#1E1E1C')}
              />
            </div>
            <div>
              <label style={labelStyle}>Client</label>
              <input
                type="text"
                value={form.client}
                onChange={set('client')}
                style={inputStyle}
                onFocus={(e) => (e.target.style.borderColor = '#ea580c')}
                onBlur={(e) => (e.target.style.borderColor = '#1E1E1C')}
              />
            </div>
            <div>
              <label style={labelStyle}>Date de début</label>
              <input
                type="date"
                value={form.date_debut}
                onChange={set('date_debut')}
                style={{ ...inputStyle, colorScheme: 'dark' }}
                onFocus={(e) => (e.target.style.borderColor = '#ea580c')}
                onBlur={(e) => (e.target.style.borderColor = '#1E1E1C')}
              />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>Adresse</label>
              <input
                type="text"
                value={form.adresse}
                onChange={set('adresse')}
                style={inputStyle}
                onFocus={(e) => (e.target.style.borderColor = '#ea580c')}
                onBlur={(e) => (e.target.style.borderColor = '#1E1E1C')}
              />
            </div>
            <div>
              <label style={labelStyle}>Statut</label>
              <select
                value={form.statut}
                onChange={set('statut')}
                style={{
                  width: '100%',
                  padding: '12px 40px 12px 16px',
                  backgroundColor: '#111110',
                  border: '1px solid #1E1E1C',
                  borderRadius: '6px',
                  color: '#F0EDE6',
                  fontSize: '14px',
                  outline: 'none',
                  fontFamily: 'var(--font-dm-sans), sans-serif',
                  cursor: 'pointer',
                  appearance: 'none',
                  WebkitAppearance: 'none',
                  backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 16 16' fill='none'%3E%3Cpath d='M4 6L8 10L12 6' stroke='%23ea580c' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E\")",
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 12px center',
                }}
                onFocus={(e) => { e.target.style.borderColor = '#ea580c'; e.target.style.boxShadow = '0 0 0 2px rgba(249,115,22,0.15)' }}
                onBlur={(e) => { e.target.style.borderColor = '#1E1E1C'; e.target.style.boxShadow = 'none' }}
              >
                {STATUTS.map((s) => (
                  <option key={s} value={s} style={{ backgroundColor: '#111110' }}>{s}</option>
                ))}
              </select>
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
              className="transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_0_20px_rgba(249,115,22,0.4)] active:translate-y-0 active:shadow-none"
              style={{
                padding: '10px 20px',
                backgroundColor: saving ? '#9E8630' : '#ea580c',
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
              onClick={() => { setEditing(false); setError(null); setForm({ nom: chantier.nom, adresse: chantier.adresse, client: chantier.client, date_debut: chantier.date_debut, statut: chantier.statut }) }}
              className="transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_0_20px_rgba(249,115,22,0.4)] active:translate-y-0 active:shadow-none"
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

      {/* Artisans assignés */}
      <div
        style={{
          backgroundColor: '#111110',
          border: '1px solid #1E1E1C',
          borderRadius: '12px',
          padding: '28px',
          marginTop: '24px',
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
            Artisans assignés
          </h2>
          <button
            onClick={openAjouterArtisan}
            className="transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_0_20px_rgba(249,115,22,0.4)] active:translate-y-0 active:shadow-none"
            style={{
              padding: '8px 14px',
              backgroundColor: '#ea580c',
              color: '#0D0D0B',
              border: 'none',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'var(--font-dm-sans), sans-serif',
            }}
          >
            + Ajouter
          </button>
        </div>

        {loadingArtisans && (
          <p style={{ color: '#8A8880', fontSize: '13px', fontFamily: 'var(--font-dm-sans), sans-serif' }}>
            Chargement...
          </p>
        )}

        {!loadingArtisans && artisans.length === 0 && (
          <p style={{ color: '#8A8880', fontSize: '13px', fontFamily: 'var(--font-dm-sans), sans-serif', fontStyle: 'italic' }}>
            Aucun artisan assigné.
          </p>
        )}

        {!loadingArtisans && artisans.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {artisans.map((a) => (
              <div
                key={a.id}
                className="transition-all duration-150 hover:translate-x-1 hover:bg-[rgba(249,115,22,0.04)]"
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
                    href={`/dashboard/artisans/${a.id}`}
                    style={{
                      fontSize: '14px',
                      fontWeight: 500,
                      color: '#F0EDE6',
                      fontFamily: 'var(--font-dm-sans), sans-serif',
                      textDecoration: 'none',
                    }}
                  >
                    {a.nom}
                  </Link>
                  <p style={{ fontSize: '12px', color: '#8A8880', fontFamily: 'var(--font-dm-sans), sans-serif', margin: '2px 0 0' }}>
                    {a.metier} · {a.email}
                  </p>
                </div>
                <button
                  onClick={() => handleRetirerArtisan(a.id)}
                  className="transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_0_20px_rgba(249,115,22,0.4)] active:translate-y-0 active:shadow-none"
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

      {/* Modal: Ajouter un artisan */}
      {showAjouterArtisan && (
        <div
          style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}
          onClick={() => setShowAjouterArtisan(false)}
        >
          <div
            style={{ backgroundColor: '#111110', border: '1px solid #1E1E1C', borderRadius: '12px', padding: '32px', maxWidth: '440px', width: '100%', margin: '0 24px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ fontFamily: 'var(--font-syne), sans-serif', fontSize: '18px', fontWeight: 600, color: '#F0EDE6', marginBottom: '20px' }}>
              Ajouter un artisan
            </h2>

            {tousArtisans.length > 0 ? (
              <select
                value={selectedArtisan}
                onChange={(e) => setSelectedArtisan(e.target.value)}
                style={{ ...inputStyle, cursor: 'pointer', marginBottom: '20px' }}
                onFocus={(e) => (e.target.style.borderColor = '#ea580c')}
                onBlur={(e) => (e.target.style.borderColor = '#1E1E1C')}
              >
                <option value="">— Sélectionner un artisan —</option>
                {tousArtisans.map((a) => (
                  <option key={a.id} value={a.id} style={{ backgroundColor: '#111110' }}>
                    {a.nom} · {a.metier}
                  </option>
                ))}
              </select>
            ) : (
              <p style={{ fontSize: '13px', color: '#8A8880', fontFamily: 'var(--font-dm-sans), sans-serif', marginBottom: '20px' }}>
                Tous les artisans sont déjà assignés.
              </p>
            )}

            {assignError && (
              <p style={{ fontSize: '13px', color: '#E85447', marginBottom: '16px', fontFamily: 'var(--font-dm-sans), sans-serif' }}>
                {assignError}
              </p>
            )}

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={handleAssignerArtisan}
                disabled={assigning || !selectedArtisan}
                className="transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_0_20px_rgba(249,115,22,0.4)] active:translate-y-0 active:shadow-none"
                style={{
                  flex: 1,
                  padding: '10px',
                  backgroundColor: !selectedArtisan ? '#5a5030' : assigning ? '#9E8630' : '#ea580c',
                  color: '#0D0D0B',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: assigning || !selectedArtisan ? 'not-allowed' : 'pointer',
                  fontFamily: 'var(--font-dm-sans), sans-serif',
                }}
              >
                {assigning ? 'Ajout...' : 'Ajouter'}
              </button>
              <button
                onClick={() => setShowAjouterArtisan(false)}
                className="transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_0_20px_rgba(249,115,22,0.4)] active:translate-y-0 active:shadow-none"
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

      {/* Planning */}
      <div
        style={{
          backgroundColor: '#111110',
          border: '1px solid #1E1E1C',
          borderRadius: '12px',
          padding: '28px',
          marginTop: '24px',
        }}
      >
        <h2
          style={{
            fontFamily: 'var(--font-syne), sans-serif',
            fontSize: '16px',
            fontWeight: 600,
            color: '#F0EDE6',
            margin: '0 0 20px',
          }}
        >
          Planning
        </h2>
        <MiniCalendrier chantierId={chantier.id} />
      </div>

      {/* Delete confirmation modal */}
      {confirmDelete && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 50,
          }}
          onClick={() => setConfirmDelete(false)}
        >
          <div
            style={{
              backgroundColor: '#111110',
              border: '1px solid #1E1E1C',
              borderRadius: '12px',
              padding: '32px',
              maxWidth: '400px',
              width: '100%',
              margin: '0 24px',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2
              style={{
                fontFamily: 'var(--font-syne), sans-serif',
                fontSize: '18px',
                fontWeight: 600,
                color: '#F0EDE6',
                marginBottom: '12px',
              }}
            >
              Supprimer ce chantier ?
            </h2>
            <p
              style={{
                color: '#8A8880',
                fontSize: '14px',
                fontFamily: 'var(--font-dm-sans), sans-serif',
                marginBottom: '28px',
                lineHeight: '1.5',
              }}
            >
              Cette action est irréversible. Le chantier <strong style={{ color: '#F0EDE6' }}>{chantier.nom}</strong> sera définitivement supprimé.
            </p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="transition-all duration-200 hover:-translate-y-1 active:translate-y-0"
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
                className="transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_0_20px_rgba(249,115,22,0.4)] active:translate-y-0 active:shadow-none"
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
