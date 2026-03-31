'use client'

import { Suspense, useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { getProfile, upsertProfile } from '@/lib/supabase/profiles'
import { toast } from '@/components/Toast'
import { useDocumentTemplate } from '@/lib/useDocumentTemplate'
import type { Clause } from '@/lib/default-clauses'

// ─── Styles partagés ──────────────────────────────────────────────────────────

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
  fontSize: '11px',
  fontWeight: 600,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: '#8A8880',
  marginBottom: '6px',
  fontFamily: 'var(--font-dm-sans), sans-serif',
}

const focus = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
  e.target.style.borderColor = '#ea580c'
  e.target.style.boxShadow = '0 0 0 2px rgba(249,115,22,0.12)'
}
const blur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
  e.target.style.borderColor = '#1E1E1C'
  e.target.style.boxShadow = 'none'
}

// ─── ClauseEditor ─────────────────────────────────────────────────────────────

function ClauseEditor({ type }: { type: 'cgv' | 'contrat_moe' }) {
  const { clauses, loading, saving, savedAt, updateClause, addClause, deleteClause, reorderClauses, reset, save } = useDocumentTemplate(type)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const clausesRef = useRef<Clause[]>([])
  useEffect(() => { clausesRef.current = clauses }, [clauses])

  function scheduleBlurSave() {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => save(clausesRef.current), 800)
  }

  if (loading) {
    return <p style={{ color: '#8A8880', fontSize: '14px', fontFamily: 'var(--font-dm-sans), sans-serif' }}>Chargement…</p>
  }

  const sorted = [...clauses].sort((a, b) => a.ordre - b.ordre)

  return (
    <div style={{ position: 'relative', zIndex: 2 }}>
      {/* Barre état + reset */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <span style={{
          fontSize: '13px',
          fontFamily: 'var(--font-dm-sans), sans-serif',
          color: saving ? '#ea580c' : savedAt ? '#4ade80' : 'transparent',
          transition: 'color 0.2s',
        }}>
          {saving ? 'Sauvegarde…' : savedAt ? 'Sauvegardé ✓' : '.'}
        </span>
        <button
          onClick={() => {
            if (window.confirm('Réinitialiser aux clauses par défaut ? Toutes vos modifications seront perdues.')) {
              reset()
            }
          }}
          style={{
            padding: '7px 14px',
            backgroundColor: 'transparent',
            color: '#7A7870',
            border: '1px solid #1E1E1C',
            borderRadius: '8px',
            fontSize: '12px',
            fontWeight: 500,
            cursor: 'pointer',
            fontFamily: 'var(--font-dm-sans), sans-serif',
            transition: 'all 0.2s',
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = '#ea580c'; e.currentTarget.style.color = '#ea580c' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = '#1E1E1C'; e.currentTarget.style.color = '#7A7870' }}
        >
          Réinitialiser aux clauses par défaut
        </button>
      </div>

      {/* Liste des clauses */}
      {sorted.map((clause, idx) => (
        <div
          key={clause.id}
          style={{
            backgroundColor: '#111110',
            border: '1px solid #1E1E1C',
            borderRadius: '12px',
            padding: '20px',
            marginBottom: '12px',
            position: 'relative',
            zIndex: 2,
          }}
        >
          {/* Ligne titre + boutons */}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end', marginBottom: '12px' }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Titre de la clause</label>
              <input
                type="text"
                value={clause.titre}
                onChange={e => updateClause(clause.id, { titre: e.target.value })}
                onFocus={focus}
                onBlur={e => { blur(e); scheduleBlurSave() }}
                style={{ ...inputStyle, opacity: clause.modifiable ? 1 : 0.6, cursor: clause.modifiable ? 'text' : 'not-allowed' }}
                readOnly={!clause.modifiable}
              />
            </div>

            {/* Contrôles ordre + suppression */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', paddingBottom: '1px' }}>
              <button
                onClick={() => reorderClauses(clause.id, 'up')}
                disabled={idx === 0}
                title="Monter"
                style={{
                  width: '28px', height: '28px',
                  backgroundColor: 'transparent',
                  border: '1px solid #1E1E1C',
                  borderRadius: '6px',
                  color: idx === 0 ? '#3A3A38' : '#8A8880',
                  fontSize: '12px',
                  cursor: idx === 0 ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.15s',
                }}
                onMouseEnter={e => { if (idx !== 0) { e.currentTarget.style.borderColor = '#ea580c'; e.currentTarget.style.color = '#ea580c' } }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#1E1E1C'; e.currentTarget.style.color = idx === 0 ? '#3A3A38' : '#8A8880' }}
              >↑</button>
              <button
                onClick={() => reorderClauses(clause.id, 'down')}
                disabled={idx === sorted.length - 1}
                title="Descendre"
                style={{
                  width: '28px', height: '28px',
                  backgroundColor: 'transparent',
                  border: '1px solid #1E1E1C',
                  borderRadius: '6px',
                  color: idx === sorted.length - 1 ? '#3A3A38' : '#8A8880',
                  fontSize: '12px',
                  cursor: idx === sorted.length - 1 ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.15s',
                }}
                onMouseEnter={e => { if (idx !== sorted.length - 1) { e.currentTarget.style.borderColor = '#ea580c'; e.currentTarget.style.color = '#ea580c' } }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#1E1E1C'; e.currentTarget.style.color = idx === sorted.length - 1 ? '#3A3A38' : '#8A8880' }}
              >↓</button>
            </div>

            {clause.modifiable && (
              <button
                onClick={() => {
                  if (window.confirm(`Supprimer la clause « ${clause.titre} » ?`)) deleteClause(clause.id)
                }}
                title="Supprimer"
                style={{
                  width: '28px', height: '28px',
                  backgroundColor: 'transparent',
                  border: '1px solid #1E1E1C',
                  borderRadius: '6px',
                  color: '#7A7870',
                  fontSize: '14px',
                  cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.15s',
                  marginBottom: '1px',
                  alignSelf: 'flex-end',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#E85447'; e.currentTarget.style.color = '#E85447' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#1E1E1C'; e.currentTarget.style.color = '#7A7870' }}
              >✕</button>
            )}
          </div>

          {/* Contenu */}
          <div>
            <label style={labelStyle}>Contenu</label>
            <textarea
              value={clause.contenu}
              onChange={e => updateClause(clause.id, { contenu: e.target.value })}
              onFocus={focus}
              onBlur={e => { blur(e); scheduleBlurSave() }}
              rows={4}
              readOnly={!clause.modifiable}
              style={{
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
                resize: 'vertical',
                lineHeight: '1.6',
                opacity: clause.modifiable ? 1 : 0.6,
                cursor: clause.modifiable ? 'text' : 'not-allowed',
              }}
            />
          </div>
        </div>
      ))}

      {/* Ajouter une clause */}
      <button
        onClick={addClause}
        style={{
          width: '100%',
          padding: '12px',
          backgroundColor: 'transparent',
          border: '1px dashed #1E1E1C',
          borderRadius: '12px',
          color: '#7A7870',
          fontSize: '14px',
          fontWeight: 500,
          cursor: 'pointer',
          fontFamily: 'var(--font-dm-sans), sans-serif',
          transition: 'all 0.2s',
          marginTop: '4px',
        }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = '#ea580c'; e.currentTarget.style.color = '#ea580c' }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = '#1E1E1C'; e.currentTarget.style.color = '#7A7870' }}
      >
        + Ajouter une clause
      </button>
    </div>
  )
}

// ─── Page principale ──────────────────────────────────────────────────────────

type Tab = 'profil' | 'securite' | 'cgv' | 'moe'

const TABS: { id: Tab; label: string }[] = [
  { id: 'profil', label: 'Profil' },
  { id: 'securite', label: 'Sécurité' },
  { id: 'cgv', label: 'CGV' },
  { id: 'moe', label: 'Contrat MOE' },
]

function tabFromParam(param: string | null): Tab {
  if (param === 'cgv') return 'cgv'
  if (param === 'contrat-moe') return 'moe'
  return 'profil'
}

function ParametresContent() {
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState<Tab>(() => tabFromParam(searchParams.get('tab')))
  const [userId, setUserId] = useState<string | null>(null)
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const [form, setForm] = useState({
    prenom: '',
    nom: '',
    telephone: '',
    adresse: '',
    entreprise: '',
    societe: '',
    siret: '',
    tva_intracom: '',
    code_ape: '',
    assurance_nom: '',
    assurance_contrat: '',
    ville: '',
    code_postal: '',
  })

  const [suggestions, setSuggestions] = useState<{ label: string; city: string; postcode: string }[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const adresseRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [pwForm, setPwForm] = useState({ password: '', confirm: '' })
  const [savingPw, setSavingPw] = useState(false)
  const [pwError, setPwError] = useState<string | null>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (adresseRef.current && !adresseRef.current.contains(e.target as Node)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function handleAdresseChange(value: string) {
    setForm(prev => ({ ...prev, adresse: value }))
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (value.length <= 3) { setShowSuggestions(false); return }
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(value)}&limit=5`)
        const json = await res.json()
        const items = (json.features ?? []).map((f: { properties: { label: string; city: string; postcode: string } }) => ({
          label: f.properties.label,
          city: f.properties.city,
          postcode: f.properties.postcode,
        }))
        setSuggestions(items)
        setShowSuggestions(items.length > 0)
      } catch {
        setShowSuggestions(false)
      }
    }, 300)
  }

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUserId(user.id)
      setEmail(user.email ?? '')
      const profile = await getProfile(user.id)
      if (profile) {
        setForm({
          prenom: profile.prenom ?? '',
          nom: profile.nom ?? '',
          telephone: profile.telephone ?? '',
          adresse: profile.adresse ?? '',
          entreprise: profile.entreprise ?? '',
          societe: profile.societe ?? '',
          siret: profile.siret ?? '',
          tva_intracom: profile.tva_intracom ?? '',
          code_ape: profile.code_ape ?? '',
          assurance_nom: profile.assurance_nom ?? '',
          assurance_contrat: profile.assurance_contrat ?? '',
          ville: profile.ville ?? '',
          code_postal: profile.code_postal ?? '',
        })
      }
      setLoading(false)
    }
    load()
  }, [])

  async function handleSave() {
    if (!userId) return
    setSaving(true)
    setSaveError(null)
    try {
      const supabase = createClient()
      const ops: Promise<unknown>[] = [upsertProfile(userId, { ...form, email })]
      if (form.entreprise.trim()) {
        ops.push(
          Promise.resolve(
            supabase.from('entreprise_infos')
              .upsert({ user_id: userId, raison_sociale: form.entreprise.trim() }, { onConflict: 'user_id' })
          )
        )
      }
      await Promise.all(ops)
      toast.success('Profil sauvegardé')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      setSaveError(msg)
    } finally {
      setSaving(false)
    }
  }

  async function handleChangePassword() {
    setPwError(null)
    if (!pwForm.password || pwForm.password.length < 6) {
      setPwError('Le mot de passe doit contenir au moins 6 caractères.')
      return
    }
    if (pwForm.password !== pwForm.confirm) {
      setPwError('Les mots de passe ne correspondent pas.')
      return
    }
    setSavingPw(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.updateUser({ password: pwForm.password })
      if (error) throw error
      toast.success('Mot de passe modifié')
      setPwForm({ password: '', confirm: '' })
    } catch (err: unknown) {
      setPwError(err instanceof Error ? err.message : 'Erreur')
    } finally {
      setSavingPw(false)
    }
  }

  const field = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(prev => ({ ...prev, [key]: e.target.value }))

  return (
    <div className="page-enter" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
      {/* En-tête */}
      <div style={{ padding: '40px 40px 0', position: 'relative', zIndex: 2 }}>
        <h1 style={{ fontFamily: 'var(--font-syne), sans-serif', fontSize: '24px', fontWeight: 700, color: '#F0EDE6', margin: 0 }}>
          Paramètres
        </h1>
        <p style={{ color: '#8A8880', fontSize: '14px', marginTop: '6px', fontFamily: 'var(--font-dm-sans), sans-serif' }}>
          Gérez votre profil et vos préférences
        </p>
      </div>

      {/* Onglets */}
      <div style={{
        display: 'flex',
        borderBottom: '1px solid #1E1E1C',
        padding: '0 40px',
        background: '#0D0D0B',
        flexShrink: 0,
        position: 'relative',
        zIndex: 2,
        marginTop: '20px',
      }}>
        {TABS.map(tab => {
          const active = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '12px 16px',
                fontSize: active ? 14 : 13,
                fontWeight: active ? 600 : 400,
                fontFamily: 'var(--font-dm-sans), sans-serif',
                background: 'transparent',
                border: 'none',
                borderBottom: active ? '2px solid #ea580c' : '2px solid transparent',
                color: active ? '#ea580c' : '#7A7870',
                cursor: 'pointer',
                marginBottom: -1,
                transition: 'all 0.15s',
                whiteSpace: 'nowrap',
              }}
              onMouseEnter={e => { if (!active) e.currentTarget.style.color = '#F0EDE6' }}
              onMouseLeave={e => { if (!active) e.currentTarget.style.color = '#7A7870' }}
            >
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Contenu */}
      <div style={{ padding: '32px 40px 40px', maxWidth: '720px', position: 'relative', zIndex: 2 }}>

        {/* ── Profil ── */}
        {activeTab === 'profil' && (
          loading ? (
            <p style={{ color: '#8A8880', fontSize: '14px', fontFamily: 'var(--font-dm-sans), sans-serif' }}>Chargement…</p>
          ) : (
            <div style={{ backgroundColor: '#111110', border: '1px solid #1E1E1C', borderRadius: '12px', padding: '28px' }}>
              <h2 style={{ fontFamily: 'var(--font-syne), sans-serif', fontSize: '16px', fontWeight: 600, color: '#F0EDE6', margin: '0 0 24px' }}>
                Profil
              </h2>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={labelStyle}>Prénom</label>
                  <input type="text" value={form.prenom} onChange={field('prenom')} style={inputStyle} onFocus={focus} onBlur={blur} placeholder="Jean" />
                </div>
                <div>
                  <label style={labelStyle}>Nom</label>
                  <input type="text" value={form.nom} onChange={field('nom')} style={inputStyle} onFocus={focus} onBlur={blur} placeholder="Dupont" />
                </div>
                <div>
                  <label style={labelStyle}>Société / Cabinet</label>
                  <input type="text" value={form.societe} onChange={field('societe')} style={inputStyle} onFocus={focus} onBlur={blur} placeholder="Atelier Dupont Architecture" />
                </div>
                <div>
                  <label style={labelStyle}>Téléphone</label>
                  <input type="text" value={form.telephone} onChange={field('telephone')} style={inputStyle} onFocus={focus} onBlur={blur} placeholder="+33 6 00 00 00 00" />
                </div>
              </div>

              <div style={{ borderTop: '1px solid #1E1E1C', margin: '20px 0' }} />
              <p style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' as const, color: '#8A8880', fontFamily: 'var(--font-dm-sans), sans-serif', margin: '0 0 16px' }}>
                Identité juridique
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={labelStyle}>SIRET</label>
                  <input type="text" value={form.siret} onChange={field('siret')} style={inputStyle} onFocus={focus} onBlur={blur} placeholder="123 456 789 00012" />
                </div>
                <div>
                  <label style={labelStyle}>Code APE</label>
                  <input type="text" value={form.code_ape} onChange={field('code_ape')} style={inputStyle} onFocus={focus} onBlur={blur} placeholder="7111Z" />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={labelStyle}>TVA intracommunautaire</label>
                  <input type="text" value={form.tva_intracom} onChange={field('tva_intracom')} style={inputStyle} onFocus={focus} onBlur={blur} placeholder="FR 12 345678900" />
                </div>
              </div>

              <div style={{ borderTop: '1px solid #1E1E1C', margin: '20px 0' }} />
              <p style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' as const, color: '#8A8880', fontFamily: 'var(--font-dm-sans), sans-serif', margin: '0 0 16px' }}>
                Coordonnées
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div style={{ gridColumn: '1 / -1', position: 'relative' }} ref={adresseRef}>
                  <label style={labelStyle}>Adresse</label>
                  <input
                    type="text"
                    value={form.adresse}
                    onChange={e => handleAdresseChange(e.target.value)}
                    style={inputStyle}
                    onFocus={focus}
                    onBlur={blur}
                    placeholder="12 rue des Bâtisseurs"
                    autoComplete="off"
                  />
                  {showSuggestions && suggestions.length > 0 && (
                    <div style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, backgroundColor: '#111110', border: '1px solid #1E1E1C', borderRadius: '8px', zIndex: 50, overflow: 'hidden', boxShadow: '0 8px 24px rgba(0,0,0,0.4)' }}>
                      {suggestions.map((s, i) => (
                        <div
                          key={i}
                          onMouseDown={() => {
                            setForm(prev => ({ ...prev, adresse: s.label, ville: s.city, code_postal: s.postcode }))
                            setShowSuggestions(false)
                          }}
                          style={{ padding: '10px 16px', fontSize: '14px', color: '#F0EDE6', fontFamily: 'var(--font-dm-sans), sans-serif', cursor: 'pointer', borderBottom: i < suggestions.length - 1 ? '1px solid #1E1E1C' : 'none' }}
                          onMouseEnter={e => { e.currentTarget.style.background = '#1E1E1C' }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
                        >
                          {s.label}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div>
                  <label style={labelStyle}>Ville</label>
                  <input type="text" value={form.ville} onChange={field('ville')} style={inputStyle} onFocus={focus} onBlur={blur} placeholder="Paris" />
                </div>
                <div>
                  <label style={labelStyle}>Code postal</label>
                  <input type="text" value={form.code_postal} onChange={field('code_postal')} style={inputStyle} onFocus={focus} onBlur={blur} placeholder="75001" />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={labelStyle}>Email</label>
                  <input
                    type="text"
                    value={email}
                    disabled
                    style={{ ...inputStyle, color: '#7A7870', cursor: 'not-allowed', opacity: 0.7 }}
                  />
                </div>
              </div>

              <div style={{ borderTop: '1px solid #1E1E1C', margin: '20px 0' }} />
              <p style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' as const, color: '#8A8880', fontFamily: 'var(--font-dm-sans), sans-serif', margin: '0 0 16px' }}>
                Assurance professionnelle
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={labelStyle}>Nom de l'assureur</label>
                  <input type="text" value={form.assurance_nom} onChange={field('assurance_nom')} style={inputStyle} onFocus={focus} onBlur={blur} placeholder="AXA, Allianz…" />
                </div>
                <div>
                  <label style={labelStyle}>N° de contrat</label>
                  <input type="text" value={form.assurance_contrat} onChange={field('assurance_contrat')} style={inputStyle} onFocus={focus} onBlur={blur} placeholder="RC-2024-XXXXX" />
                </div>
              </div>

              <div style={{ marginTop: '24px' }}>
                {saveError && (
                  <p style={{ fontSize: '13px', color: '#E85447', marginBottom: '12px', fontFamily: 'var(--font-dm-sans), sans-serif', background: 'rgba(232,84,71,0.08)', border: '1px solid rgba(232,84,71,0.2)', borderRadius: '6px', padding: '10px 14px', wordBreak: 'break-all' }}>
                    {saveError}
                  </p>
                )}
                <button
                  onClick={handleSave}
                  disabled={saving}
                  style={{ padding: '10px 24px', backgroundColor: saving ? '#c45a10' : '#ea580c', color: '#0D0D0B', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'var(--font-dm-sans), sans-serif', transition: 'all 0.2s ease' }}
                  onMouseEnter={e => { if (!saving) { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 0 20px rgba(249,115,22,0.4)' } }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}
                >
                  {saving ? 'Sauvegarde...' : 'Enregistrer'}
                </button>
              </div>
            </div>
          )
        )}

        {/* ── Sécurité ── */}
        {activeTab === 'securite' && (
          <div style={{ backgroundColor: '#111110', border: '1px solid #1E1E1C', borderRadius: '12px', padding: '28px' }}>
            <h2 style={{ fontFamily: 'var(--font-syne), sans-serif', fontSize: '16px', fontWeight: 600, color: '#F0EDE6', margin: '0 0 24px' }}>
              Sécurité
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={labelStyle}>Nouveau mot de passe</label>
                <input
                  type="password"
                  value={pwForm.password}
                  onChange={e => setPwForm(p => ({ ...p, password: e.target.value }))}
                  style={inputStyle}
                  onFocus={focus}
                  onBlur={blur}
                  placeholder="••••••••"
                />
              </div>
              <div>
                <label style={labelStyle}>Confirmation</label>
                <input
                  type="password"
                  value={pwForm.confirm}
                  onChange={e => setPwForm(p => ({ ...p, confirm: e.target.value }))}
                  style={inputStyle}
                  onFocus={focus}
                  onBlur={blur}
                  placeholder="••••••••"
                />
              </div>

              {pwError && (
                <p style={{ fontSize: '13px', color: '#E85447', margin: 0, fontFamily: 'var(--font-dm-sans), sans-serif' }}>
                  {pwError}
                </p>
              )}

              <div>
                <button
                  onClick={handleChangePassword}
                  disabled={savingPw}
                  style={{ padding: '10px 24px', backgroundColor: 'transparent', color: '#F0EDE6', border: '1px solid #1E1E1C', borderRadius: '8px', fontSize: '14px', fontWeight: 500, cursor: savingPw ? 'not-allowed' : 'pointer', fontFamily: 'var(--font-dm-sans), sans-serif', transition: 'all 0.2s ease' }}
                  onMouseEnter={e => { if (!savingPw) { e.currentTarget.style.borderColor = '#ea580c'; e.currentTarget.style.color = '#ea580c' } }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = '#1E1E1C'; e.currentTarget.style.color = '#F0EDE6' }}
                >
                  {savingPw ? 'Modification...' : 'Changer le mot de passe'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── CGV ── */}
        {activeTab === 'cgv' && (
          <div>
            <div style={{ marginBottom: '24px' }}>
              <h2 style={{ fontFamily: 'var(--font-syne), sans-serif', fontSize: '18px', fontWeight: 700, color: '#F0EDE6', margin: '0 0 6px' }}>
                Conditions Générales de Vente
              </h2>
              <p style={{ color: '#8A8880', fontSize: '13px', margin: 0, fontFamily: 'var(--font-dm-sans), sans-serif' }}>
                Ces clauses apparaîtront dans vos CGV générées en PDF.
              </p>
            </div>
            <ClauseEditor type="cgv" />
          </div>
        )}

        {/* ── Contrat MOE ── */}
        {activeTab === 'moe' && (
          <div>
            <div style={{ marginBottom: '24px' }}>
              <h2 style={{ fontFamily: 'var(--font-syne), sans-serif', fontSize: '18px', fontWeight: 700, color: '#F0EDE6', margin: '0 0 6px' }}>
                Clauses Contrat MOE
              </h2>
              <p style={{ color: '#8A8880', fontSize: '13px', margin: 0, fontFamily: 'var(--font-dm-sans), sans-serif' }}>
                Ces clauses apparaîtront dans vos contrats de maîtrise d'œuvre générés en PDF.
              </p>
            </div>
            <ClauseEditor type="contrat_moe" />
          </div>
        )}

      </div>
    </div>
  )
}

export default function ParametresPage() {
  return (
    <Suspense>
      <ParametresContent />
    </Suspense>
  )
}
