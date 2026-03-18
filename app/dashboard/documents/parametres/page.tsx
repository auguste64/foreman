'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import Link from 'next/link'
import { getEntrepriseInfo, upsertEntrepriseInfo } from '@/lib/supabase/documents'
import type { EntrepriseInfo } from '@/lib/supabase/documents'
import { useToast } from '@/components/ToastProvider'

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 14px',
  backgroundColor: '#0D0D0B',
  border: '1px solid #1E1E1C',
  borderRadius: 8,
  color: '#F0EDE6',
  fontSize: 14,
  outline: 'none',
  fontFamily: 'var(--font-dm-sans), sans-serif',
  boxSizing: 'border-box',
}
const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: '#8A8880',
  marginBottom: 6,
  fontFamily: 'var(--font-dm-sans), sans-serif',
}
const focus = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
  e.target.style.borderColor = '#F97316'
  e.target.style.boxShadow = '0 0 0 2px rgba(249,115,22,0.12)'
}
const blur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
  e.target.style.borderColor = '#1E1E1C'
  e.target.style.boxShadow = 'none'
}

function validateIban(v: string): { error: string | null; warning: string | null } {
  if (!v) return { error: null, warning: null }
  const stripped = v.replace(/\s/g, '')
  if (stripped.length < 15 || stripped.length > 34 || !/^[A-Za-z]{2}\d/.test(stripped)) {
    return { error: 'IBAN invalide (entre 15 et 34 caractères, commence par 2 lettres)', warning: null }
  }
  if (stripped.length !== 27) {
    return { error: null, warning: 'IBAN français : 27 caractères attendus' }
  }
  return { error: null, warning: null }
}

function validateBic(v: string): string | null {
  if (!v) return null
  if (!/^[A-Z]{4}[A-Z]{2}[A-Z0-9]{2}([A-Z0-9]{3})?$/i.test(v.trim())) {
    return 'BIC invalide (8 ou 11 caractères)'
  }
  return null
}

type FormState = Omit<EntrepriseInfo, 'user_id'>

const emptyForm: FormState = {
  raison_sociale: '', forme_juridique: '', siret: '', tva_intracommunautaire: '',
  capital: '', rcs: '', adresse: '', code_postal: '', ville: '', pays: 'France',
  telephone: '', email: '', site_web: '', iban: '', bic: '', banque: '',
  logo_url: '', mention_legale: '', conditions_paiement: '', penalites_retard: '', escompte: '',
}

export default function ParametresPage() {
  const { showToast } = useToast()
  const [form, setForm] = useState<FormState>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [ibanTouched, setIbanTouched] = useState(false)
  const [bicTouched, setBicTouched] = useState(false)
  const [logoDragging, setLogoDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const processLogoFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) return
    const reader = new FileReader()
    reader.onload = (e) => {
      const src = e.target?.result as string
      const img = new window.Image()
      img.onload = () => {
        const MAX_W = 400, MAX_H = 200
        const ratio = Math.min(MAX_W / img.width, MAX_H / img.height, 1)
        const w = Math.round(img.width * ratio)
        const h = Math.round(img.height * ratio)
        const canvas = document.createElement('canvas')
        canvas.width = w
        canvas.height = h
        const ctx = canvas.getContext('2d')!
        ctx.drawImage(img, 0, 0, w, h)
        const base64 = canvas.toDataURL('image/webp', 0.85)
        setForm(p => ({ ...p, logo_url: base64 }))
      }
      img.src = src
    }
    reader.readAsDataURL(file)
  }, [])

  useEffect(() => {
    getEntrepriseInfo().then(info => {
      if (info) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { user_id, ...rest } = info
        setForm({ ...emptyForm, ...rest })
      }
      setLoaded(true)
    })
  }, [])

  const set = (k: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(p => ({ ...p, [k]: e.target.value }))

  const ibanValidation = validateIban(form.iban)
  const bicError = validateBic(form.bic)
  const hasErrors = !!ibanValidation.error || !!bicError

  async function handleSave() {
    setIbanTouched(true)
    setBicTouched(true)
    if (hasErrors) return
    setSaving(true)
    try {
      await upsertEntrepriseInfo(form)
      showToast('Informations sauvegardées')
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Erreur lors de la sauvegarde')
    } finally {
      setSaving(false)
    }
  }

  if (!loaded) return (
    <div style={{ flex: 1, padding: '40px' }}>
      <p style={{ color: '#8A8880', fontFamily: 'var(--font-dm-sans), sans-serif' }}>Chargement…</p>
    </div>
  )

  return (
    <div className="page-enter" style={{ flex: 1, padding: '40px', overflowY: 'auto', maxWidth: 800 }}>
      <Link href="/dashboard/documents" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, backgroundColor: '#111110', border: '1px solid #1E1E1C', borderRadius: 8, padding: '8px 14px', color: '#F0EDE6', fontSize: 13, fontWeight: 500, cursor: 'pointer', textDecoration: 'none', transition: 'all 0.15s ease', fontFamily: 'var(--font-dm-sans), sans-serif', marginBottom: 28 }}
        onMouseEnter={e => { e.currentTarget.style.background = '#1E1E1C'; e.currentTarget.style.borderColor = '#F97316'; e.currentTarget.style.color = '#F97316' }}
        onMouseLeave={e => { e.currentTarget.style.background = '#111110'; e.currentTarget.style.borderColor = '#1E1E1C'; e.currentTarget.style.color = '#F0EDE6' }}
      >
        <span style={{ color: '#F97316' }}>←</span>
        Retour aux documents
      </Link>

      <h1 style={{ fontFamily: 'var(--font-syne), sans-serif', fontSize: 24, fontWeight: 700, color: '#F0EDE6', margin: '0 0 8px' }}>
        Paramètres documents
      </h1>
      <p style={{ color: '#8A8880', fontSize: 13, fontFamily: 'var(--font-dm-sans), sans-serif', marginBottom: 32 }}>
        Ces informations apparaissent sur vos devis et factures.
      </p>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={e => { const f = e.target.files?.[0]; if (f) processLogoFile(f); e.target.value = '' }}
      />

      {/* Logo */}
      <Section title="Logo de l'entreprise">
        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={e => { e.preventDefault(); setLogoDragging(true) }}
          onDragLeave={() => setLogoDragging(false)}
          onDrop={e => { e.preventDefault(); setLogoDragging(false); const f = e.dataTransfer.files?.[0]; if (f) processLogoFile(f) }}
          style={{ width: 200, height: 100, backgroundColor: '#111110', border: `2px dashed ${logoDragging ? '#F97316' : '#1E1E1C'}`, borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', marginBottom: form.logo_url ? 10 : 0, transition: 'border-color 0.15s' }}
        >
          {form.logo_url ? (
            <img src={form.logo_url} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          ) : (
            <div style={{ textAlign: 'center', color: '#7A7870', pointerEvents: 'none' }}>
              <p style={{ fontSize: 24, margin: '0 0 6px' }}>🖼</p>
              <p style={{ fontSize: 11, fontFamily: 'var(--font-dm-sans), sans-serif', margin: 0 }}>Glisser-déposer ou cliquer</p>
            </div>
          )}
        </div>
        {form.logo_url && (
          <button
            onClick={() => setForm(p => ({ ...p, logo_url: '' }))}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8A8880', fontSize: 13, fontFamily: 'var(--font-dm-sans), sans-serif', padding: 0 }}
          >
            Supprimer le logo
          </button>
        )}
      </Section>

      {/* Identité */}
      <Section title="Identité légale">
        <Grid>
          <Field label="Raison sociale" value={form.raison_sociale} onChange={set('raison_sociale')} />
          <Field label="Forme juridique" value={form.forme_juridique} onChange={set('forme_juridique')} placeholder="SAS, SARL, EI…" />
          <Field label="SIRET" value={form.siret} onChange={set('siret')} />
          <Field label="N° TVA intracommunautaire" value={form.tva_intracommunautaire} onChange={set('tva_intracommunautaire')} />
          <Field label="Capital social" value={form.capital} onChange={set('capital')} placeholder="10 000 €" />
          <Field label="RCS" value={form.rcs} onChange={set('rcs')} placeholder="RCS Paris A 123 456 789" />
        </Grid>
      </Section>

      {/* Coordonnées */}
      <Section title="Coordonnées">
        <div style={{ marginBottom: 16 }}>
          <AdresseField
            value={form.adresse}
            onChange={set('adresse')}
            onSelect={(name, postcode, city) => setForm(p => ({ ...p, adresse: name, code_postal: postcode, ville: city }))}
          />
        </div>
        <Grid>
          <Field label="Code postal" value={form.code_postal} onChange={set('code_postal')} />
          <Field label="Ville" value={form.ville} onChange={set('ville')} />
          <Field label="Pays" value={form.pays} onChange={set('pays')} />
          <Field label="Téléphone" value={form.telephone} onChange={set('telephone')} />
          <Field label="Email" value={form.email} onChange={set('email')} type="email" />
          <Field label="Site web" value={form.site_web} onChange={set('site_web')} placeholder="https://…" />
        </Grid>
      </Section>

      {/* Bancaires */}
      <Section title="Coordonnées bancaires">
        <Grid>
          <div>
            <label style={labelStyle}>IBAN</label>
            <input
              type="text"
              value={form.iban}
              onChange={set('iban')}
              onFocus={focus}
              onBlur={e => { setIbanTouched(true); if (validateIban(e.target.value).error) { e.target.style.borderColor = '#EF4444'; e.target.style.boxShadow = 'none' } else { blur(e) } }}
              style={{ ...inputStyle, borderColor: ibanTouched && ibanValidation.error ? '#EF4444' : '#1E1E1C' }}
              placeholder="FR76 3000 6000 0112 3456 7890 189"
            />
            {ibanTouched && ibanValidation.error && (
              <p style={{ margin: '5px 0 0', fontSize: 12, color: '#EF4444', fontFamily: 'var(--font-dm-sans), sans-serif' }}>{ibanValidation.error}</p>
            )}
            {ibanTouched && !ibanValidation.error && ibanValidation.warning && (
              <p style={{ margin: '5px 0 0', fontSize: 12, color: '#F97316', fontFamily: 'var(--font-dm-sans), sans-serif' }}>{ibanValidation.warning}</p>
            )}
          </div>
          <div>
            <label style={labelStyle}>BIC</label>
            <input
              type="text"
              value={form.bic}
              onChange={set('bic')}
              onFocus={focus}
              onBlur={e => { setBicTouched(true); if (validateBic(e.target.value)) { e.target.style.borderColor = '#EF4444'; e.target.style.boxShadow = 'none' } else { blur(e) } }}
              style={{ ...inputStyle, borderColor: bicTouched && bicError ? '#EF4444' : '#1E1E1C' }}
              placeholder="BNPAFRPP"
            />
            {bicTouched && bicError && (
              <p style={{ margin: '5px 0 0', fontSize: 12, color: '#EF4444', fontFamily: 'var(--font-dm-sans), sans-serif' }}>{bicError}</p>
            )}
          </div>
          <Field label="Banque" value={form.banque} onChange={set('banque')} />
        </Grid>
      </Section>

      {/* Mentions légales */}
      <Section title="Mentions légales & conditions">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={labelStyle}>Mention légale (pied de page)</label>
            <textarea
              value={form.mention_legale}
              onChange={set('mention_legale')}
              onFocus={focus}
              onBlur={blur}
              rows={3}
              style={{ ...inputStyle, resize: 'vertical' } as React.CSSProperties}
              placeholder="Mention légale imprimée en bas de chaque document…"
            />
          </div>
          <Grid>
            <div>
              <label style={labelStyle}>Conditions de paiement</label>
              <textarea
                value={form.conditions_paiement}
                onChange={set('conditions_paiement')}
                onFocus={focus}
                onBlur={blur}
                rows={2}
                style={{ ...inputStyle, resize: 'vertical' } as React.CSSProperties}
                placeholder="Paiement à 30 jours…"
              />
            </div>
            <div>
              <label style={labelStyle}>Pénalités de retard</label>
              <textarea
                value={form.penalites_retard}
                onChange={set('penalites_retard')}
                onFocus={focus}
                onBlur={blur}
                rows={2}
                style={{ ...inputStyle, resize: 'vertical' } as React.CSSProperties}
                placeholder="3× le taux légal…"
              />
            </div>
            <div>
              <label style={labelStyle}>Escompte</label>
              <input
                type="text"
                value={form.escompte}
                onChange={set('escompte')}
                onFocus={focus}
                onBlur={blur}
                style={inputStyle}
                placeholder="Aucun escompte accordé"
              />
            </div>
          </Grid>
        </div>
      </Section>

      <div style={{ display: 'flex', gap: 10 }}>
        <button
          onClick={handleSave}
          disabled={saving}
          style={{ padding: '11px 28px', backgroundColor: saving ? '#c45a10' : '#F97316', color: '#0D0D0B', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'var(--font-dm-sans), sans-serif' }}
          onMouseEnter={e => { if (!saving) { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 0 20px rgba(249,115,22,0.4)' } }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none' }}
        >
          {saving ? 'Sauvegarde…' : 'Sauvegarder'}
        </button>
        <Link href="/dashboard/documents" style={{ padding: '11px 20px', backgroundColor: 'transparent', color: '#8A8880', border: '1px solid #1E1E1C', borderRadius: 8, fontSize: 14, textDecoration: 'none', fontFamily: 'var(--font-dm-sans), sans-serif' }}>
          Annuler
        </Link>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ backgroundColor: '#111110', border: '1px solid #1E1E1C', borderRadius: 12, padding: 28, marginBottom: 20 }}>
      <h2 style={{ fontFamily: 'var(--font-syne), sans-serif', fontSize: 15, fontWeight: 600, color: '#F0EDE6', margin: '0 0 20px' }}>{title}</h2>
      {children}
    </div>
  )
}

function Grid({ children, cols = 2 }: { children: React.ReactNode; cols?: number }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 16 }}>
      {children}
    </div>
  )
}

type AdresseSuggestion = { label: string; name: string; postcode: string; city: string }

function AdresseField({ value, onChange, onSelect }: {
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onSelect: (name: string, postcode: string, city: string) => void
}) {
  const [suggestions, setSuggestions] = useState<AdresseSuggestion[]>([])
  const [open, setOpen] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    onChange(e)
    const val = e.target.value
    if (timerRef.current) clearTimeout(timerRef.current)
    if (val.length <= 2) { setSuggestions([]); setOpen(false); return }
    timerRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(val)}&limit=5`)
        const json = await res.json()
        const features = (json.features ?? []) as { properties: { label: string; name: string; postcode: string; city: string } }[]
        const items: AdresseSuggestion[] = features.map(f => ({
          label: f.properties.label,
          name: f.properties.name,
          postcode: f.properties.postcode,
          city: f.properties.city,
        }))
        setSuggestions(items)
        setOpen(items.length > 0)
      } catch {
        // silently ignore fetch errors
      }
    }, 300)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Escape') { setOpen(false); setSuggestions([]) }
  }

  function handleSelect(s: AdresseSuggestion) {
    onSelect(s.name, s.postcode, s.city)
    setOpen(false)
    setSuggestions([])
  }

  return (
    <div ref={wrapperRef} style={{ position: 'relative' }}>
      <label style={labelStyle}>Adresse</label>
      <input
        type="text"
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onFocus={focus}
        onBlur={blur}
        style={inputStyle}
        autoComplete="off"
      />
      {open && suggestions.length > 0 && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 4px)',
          left: 0,
          right: 0,
          backgroundColor: '#111110',
          border: '1px solid #1E1E1C',
          borderRadius: 8,
          zIndex: 100,
          overflow: 'hidden',
          boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
        }}>
          {suggestions.map((s, i) => (
            <button
              key={i}
              type="button"
              onMouseDown={() => handleSelect(s)}
              style={{
                width: '100%',
                display: 'block',
                padding: '10px 14px',
                backgroundColor: 'transparent',
                border: 'none',
                borderTop: i > 0 ? '1px solid #1E1E1C' : 'none',
                borderRadius: 0,
                color: '#F0EDE6',
                fontSize: 13,
                fontFamily: 'var(--font-dm-sans), sans-serif',
                textAlign: 'left',
                cursor: 'pointer',
              }}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#1E1E1C' }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent' }}
            >
              {s.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function Field({ label, value, onChange, placeholder, type = 'text' }: {
  label: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  placeholder?: string
  type?: string
}) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      <input
        type={type}
        value={value}
        onChange={onChange}
        onFocus={focus}
        onBlur={blur}
        placeholder={placeholder}
        style={inputStyle}
      />
    </div>
  )
}
