'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getProfile, upsertProfile } from '@/lib/supabase/profiles'
import { useToast } from '@/components/ToastProvider'

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

const focus = (e: React.FocusEvent<HTMLInputElement>) => {
  e.target.style.borderColor = '#F97316'
  e.target.style.boxShadow = '0 0 0 2px rgba(249,115,22,0.12)'
}
const blur = (e: React.FocusEvent<HTMLInputElement>) => {
  e.target.style.borderColor = '#1E1E1C'
  e.target.style.boxShadow = 'none'
}

export default function ParametresPage() {
  const { showToast } = useToast()
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
  })

  const [suggestions, setSuggestions] = useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const adresseRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [pwForm, setPwForm] = useState({ password: '', confirm: '' })
  const [savingPw, setSavingPw] = useState(false)
  const [pwError, setPwError] = useState<string | null>(null)

  // Ferme la dropdown au clic extérieur
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
        const labels: string[] = (json.features ?? []).map((f: { properties: { label: string } }) => f.properties.label)
        setSuggestions(labels)
        setShowSuggestions(labels.length > 0)
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
      const ops: Promise<unknown>[] = [upsertProfile(userId, form)]
      if (form.entreprise.trim()) {
        ops.push(
          supabase.from('entreprise_infos')
            .upsert({ user_id: userId, raison_sociale: form.entreprise.trim() }, { onConflict: 'user_id' })
        )
      }
      await Promise.all(ops)
      showToast('Profil sauvegardé')
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
      showToast('Mot de passe modifié')
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
    <div className="page-enter" style={{ flex: 1, padding: '40px', overflowY: 'auto', maxWidth: '640px' }}>
      <div style={{ marginBottom: '40px' }}>
        <h1 style={{ fontFamily: 'var(--font-syne), sans-serif', fontSize: '24px', fontWeight: 700, color: '#F0EDE6', margin: 0 }}>
          Paramètres
        </h1>
        <p style={{ color: '#8A8880', fontSize: '14px', marginTop: '6px', fontFamily: 'var(--font-dm-sans), sans-serif' }}>
          Gérez votre profil et vos préférences
        </p>
      </div>

      {loading ? (
        <p style={{ color: '#8A8880', fontSize: '14px', fontFamily: 'var(--font-dm-sans), sans-serif' }}>Chargement…</p>
      ) : (
        <>
          {/* Profil */}
          <div style={{ backgroundColor: '#111110', border: '1px solid #1E1E1C', borderRadius: '12px', padding: '28px', marginBottom: '24px' }}>
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
                <label style={labelStyle}>Téléphone</label>
                <input type="text" value={form.telephone} onChange={field('telephone')} style={inputStyle} onFocus={focus} onBlur={blur} placeholder="+33 6 00 00 00 00" />
              </div>
              <div>
                <label style={labelStyle}>Entreprise / Cabinet</label>
                <input type="text" value={form.entreprise} onChange={field('entreprise')} style={inputStyle} onFocus={focus} onBlur={blur} placeholder="Architectes & Associés" />
              </div>
              <div style={{ gridColumn: '1 / -1', position: 'relative' }} ref={adresseRef}>
                <label style={labelStyle}>Adresse</label>
                <input
                  type="text"
                  value={form.adresse}
                  onChange={e => handleAdresseChange(e.target.value)}
                  style={inputStyle}
                  onFocus={focus}
                  onBlur={blur}
                  placeholder="12 rue des Bâtisseurs, 75001 Paris"
                  autoComplete="off"
                />
                {showSuggestions && suggestions.length > 0 && (
                  <div style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, backgroundColor: '#111110', border: '1px solid #1E1E1C', borderRadius: '8px', zIndex: 50, overflow: 'hidden', boxShadow: '0 8px 24px rgba(0,0,0,0.4)' }}>
                    {suggestions.map((s, i) => (
                      <div
                        key={i}
                        onMouseDown={() => { setForm(prev => ({ ...prev, adresse: s })); setShowSuggestions(false) }}
                        style={{ padding: '10px 16px', fontSize: '14px', color: '#F0EDE6', fontFamily: 'var(--font-dm-sans), sans-serif', cursor: 'pointer', borderBottom: i < suggestions.length - 1 ? '1px solid #1E1E1C' : 'none' }}
                        onMouseEnter={e => { e.currentTarget.style.background = '#1E1E1C' }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
                      >
                        {s}
                      </div>
                    ))}
                  </div>
                )}
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

            <div style={{ marginTop: '24px' }}>
              {saveError && (
                <p style={{ fontSize: '13px', color: '#E85447', marginBottom: '12px', fontFamily: 'var(--font-dm-sans), sans-serif', background: 'rgba(232,84,71,0.08)', border: '1px solid rgba(232,84,71,0.2)', borderRadius: '6px', padding: '10px 14px', wordBreak: 'break-all' }}>
                  {saveError}
                </p>
              )}
              <button
                onClick={handleSave}
                disabled={saving}
                style={{ padding: '10px 24px', backgroundColor: saving ? '#c45a10' : '#F97316', color: '#0D0D0B', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'var(--font-dm-sans), sans-serif', transition: 'all 0.2s ease' }}
                onMouseEnter={e => { if (!saving) { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 0 20px rgba(249,115,22,0.4)' } }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}
              >
                {saving ? 'Sauvegarde...' : 'Sauvegarder'}
              </button>
            </div>
          </div>

          {/* Sécurité */}
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
                  onMouseEnter={e => { if (!savingPw) { e.currentTarget.style.borderColor = '#F97316'; e.currentTarget.style.color = '#F97316' } }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = '#1E1E1C'; e.currentTarget.style.color = '#F0EDE6' }}
                >
                  {savingPw ? 'Modification...' : 'Changer le mot de passe'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
