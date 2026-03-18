'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClientRecord } from '@/lib/supabase/clients'
import { useToast } from '@/components/ToastProvider'

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 14px', backgroundColor: '#0D0D0B',
  border: '1px solid #1E1E1C', borderRadius: 8, color: '#F0EDE6',
  fontSize: 14, outline: 'none', fontFamily: 'var(--font-dm-sans), sans-serif', boxSizing: 'border-box',
}
const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 11, fontWeight: 600, letterSpacing: '0.08em',
  textTransform: 'uppercase', color: '#8A8880', marginBottom: 6, fontFamily: 'var(--font-dm-sans), sans-serif',
}
const focus = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
  e.target.style.borderColor = '#F97316'; e.target.style.boxShadow = '0 0 0 2px rgba(249,115,22,0.12)'
}
const blur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
  e.target.style.borderColor = '#1E1E1C'; e.target.style.boxShadow = 'none'
}

type AdresseSuggestion = { label: string; postcode: string; city: string }

function AdresseField({ value, onChange, onSelect }: {
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onSelect: (label: string, postcode: string, city: string) => void
}) {
  const [suggestions, setSuggestions] = useState<AdresseSuggestion[]>([])
  const [open, setOpen] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)

  const fetchSuggestions = useCallback((q: string) => {
    if (q.length < 3) { setSuggestions([]); setOpen(false); return }
    fetch(`https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(q)}&limit=5`)
      .then(r => r.json())
      .then(d => {
        const results = (d.features || []).map((f: { properties: { label: string; postcode: string; city: string } }) => ({
          label: f.properties.label,
          postcode: f.properties.postcode,
          city: f.properties.city,
        }))
        setSuggestions(results)
        setOpen(results.length > 0)
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [])

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [])

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <div ref={wrapperRef} style={{ position: 'relative' }}>
      <label style={labelStyle}>Adresse</label>
      <input
        type="text"
        value={value}
        onChange={e => {
          onChange(e)
          if (timerRef.current) clearTimeout(timerRef.current)
          timerRef.current = setTimeout(() => fetchSuggestions(e.target.value), 300)
        }}
        onFocus={focus}
        onBlur={blur}
        style={inputStyle}
        placeholder="12 rue de la Paix…"
        autoComplete="off"
      />
      {open && (
        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, backgroundColor: '#111110', border: '1px solid #1E1E1C', borderRadius: 8, marginTop: 4, zIndex: 50, overflow: 'hidden' }}>
          {suggestions.map((s, i) => (
            <div
              key={i}
              onMouseDown={() => { onSelect(s.label, s.postcode, s.city); setOpen(false) }}
              style={{ padding: '10px 14px', fontSize: 13, color: '#F0EDE6', fontFamily: 'var(--font-dm-sans), sans-serif', cursor: 'pointer' }}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#1E1E1C' }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent' }}
            >
              {s.label}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function Field({ label, value, onChange, type = 'text', placeholder }: {
  label: string; value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  type?: string; placeholder?: string
}) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      <input type={type} value={value} onChange={onChange} onFocus={focus} onBlur={blur} style={inputStyle} placeholder={placeholder} />
    </div>
  )
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ backgroundColor: '#111110', border: '1px solid #1E1E1C', borderRadius: 12, padding: 24 }}>
      <h2 style={{ fontFamily: 'var(--font-syne), sans-serif', fontSize: 13, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#7A7870', margin: '0 0 20px' }}>{title}</h2>
      {children}
    </div>
  )
}

const empty = {
  type: 'particulier' as 'particulier' | 'entreprise',
  prenom: '', nom: '', email: '', telephone: '',
  entreprise_nom: '', entreprise_siret: '', entreprise_tva: '', entreprise_forme_juridique: '',
  contact_nom: '', contact_prenom: '', contact_email: '', contact_telephone: '',
  adresse: '', code_postal: '', ville: '', pays: 'France', notes: '',
}

export default function NouveauClientPage() {
  const router = useRouter()
  const { showToast } = useToast()
  const [form, setForm] = useState(empty)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(p => ({ ...p, [k]: e.target.value }))

  const isEntreprise = form.type === 'entreprise'

  async function handleSave() {
    setError(null)
    const required = isEntreprise ? form.entreprise_nom.trim() : form.nom.trim()
    if (!required) {
      setError(isEntreprise ? 'La raison sociale est requise.' : 'Le nom est requis.')
      return
    }
    setSaving(true)
    try {
      const client = await createClientRecord({
        type: form.type,
        prenom: form.prenom.trim() || null,
        nom: form.nom.trim() || null,
        entreprise_nom: form.entreprise_nom.trim() || null,
        entreprise_siret: form.entreprise_siret.trim() || null,
        entreprise_tva: form.entreprise_tva.trim() || null,
        entreprise_forme_juridique: form.entreprise_forme_juridique.trim() || null,
        contact_nom: form.contact_nom.trim() || null,
        contact_prenom: form.contact_prenom.trim() || null,
        contact_email: form.contact_email.trim() || null,
        contact_telephone: form.contact_telephone.trim() || null,
        email: form.email.trim() || null,
        telephone: form.telephone.trim() || null,
        adresse: form.adresse.trim() || null,
        code_postal: form.code_postal.trim() || null,
        ville: form.ville.trim() || null,
        pays: form.pays.trim() || null,
        notes: form.notes.trim() || null,
      })
      showToast('Client créé')
      router.push(`/dashboard/clients/${client.id}`)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erreur')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="page-enter" style={{ flex: 1, padding: '40px', overflowY: 'auto', maxWidth: 760 }}>
      <Link href="/dashboard/clients" style={{ fontSize: 13, color: '#8A8880', textDecoration: 'none', fontFamily: 'var(--font-dm-sans), sans-serif', display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 28 }}>
        ← Retour aux clients
      </Link>
      <h1 style={{ fontFamily: 'var(--font-syne), sans-serif', fontSize: 24, fontWeight: 700, color: '#F0EDE6', margin: '0 0 28px' }}>
        Nouveau client
      </h1>

      {/* Type toggle */}
      <div style={{ display: 'flex', gap: 0, backgroundColor: '#111110', border: '1px solid #1E1E1C', borderRadius: 8, overflow: 'hidden', marginBottom: 24, width: 'fit-content' }}>
        {(['particulier', 'entreprise'] as const).map(t => (
          <button
            key={t}
            onClick={() => setForm(p => ({ ...p, type: t }))}
            style={{ padding: '10px 24px', fontSize: 13, fontWeight: form.type === t ? 600 : 400, fontFamily: 'var(--font-dm-sans), sans-serif', border: 'none', cursor: 'pointer', backgroundColor: form.type === t ? '#F97316' : 'transparent', color: form.type === t ? '#0D0D0B' : '#8A8880', transition: 'all 0.15s' }}
          >
            {t === 'particulier' ? 'Particulier' : 'Entreprise'}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {isEntreprise ? (
          <>
            <Card title="Identité entreprise">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div style={{ gridColumn: '1 / -1' }}>
                  <Field label="Raison sociale *" value={form.entreprise_nom} onChange={set('entreprise_nom')} placeholder="Acme SAS" />
                </div>
                <Field label="SIRET" value={form.entreprise_siret} onChange={set('entreprise_siret')} placeholder="123 456 789 00012" />
                <Field label="N° TVA" value={form.entreprise_tva} onChange={set('entreprise_tva')} placeholder="FR12345678901" />
                <div style={{ gridColumn: '1 / -1' }}>
                  <Field label="Forme juridique" value={form.entreprise_forme_juridique} onChange={set('entreprise_forme_juridique')} placeholder="SAS, SARL, EI…" />
                </div>
              </div>
            </Card>

            <Card title="Contact principal">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <Field label="Prénom" value={form.contact_prenom} onChange={set('contact_prenom')} />
                <Field label="Nom" value={form.contact_nom} onChange={set('contact_nom')} />
                <Field label="Email" type="email" value={form.contact_email} onChange={set('contact_email')} placeholder="contact@acme.fr" />
                <Field label="Téléphone" type="tel" value={form.contact_telephone} onChange={set('contact_telephone')} placeholder="06 12 34 56 78" />
              </div>
            </Card>
          </>
        ) : (
          <Card title="Identité">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <Field label="Prénom" value={form.prenom} onChange={set('prenom')} />
              <Field label="Nom *" value={form.nom} onChange={set('nom')} />
              <Field label="Email" type="email" value={form.email} onChange={set('email')} placeholder="jean.dupont@email.fr" />
              <Field label="Téléphone" type="tel" value={form.telephone} onChange={set('telephone')} placeholder="06 12 34 56 78" />
            </div>
          </Card>
        )}

        <Card title="Adresse">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <AdresseField
              value={form.adresse}
              onChange={set('adresse')}
              onSelect={(label, postcode, city) => setForm(p => ({ ...p, adresse: label, code_postal: postcode, ville: city }))}
            />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
              <Field label="Code postal" value={form.code_postal} onChange={set('code_postal')} />
              <Field label="Ville" value={form.ville} onChange={set('ville')} />
              <Field label="Pays" value={form.pays} onChange={set('pays')} />
            </div>
          </div>
        </Card>

        <Card title="Notes">
          <label style={labelStyle}>Notes internes</label>
          <textarea
            value={form.notes}
            onChange={set('notes')}
            onFocus={focus}
            onBlur={blur}
            rows={3}
            style={{ ...inputStyle, resize: 'vertical' } as React.CSSProperties}
            placeholder="Informations complémentaires, préférences, historique…"
          />
        </Card>

        {error && (
          <p style={{ fontSize: 13, color: '#E85447', background: 'rgba(232,84,71,0.08)', border: '1px solid rgba(232,84,71,0.2)', borderRadius: 6, padding: '10px 14px', fontFamily: 'var(--font-dm-sans), sans-serif' }}>{error}</p>
        )}

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{ padding: '11px 28px', backgroundColor: saving ? '#c45a10' : '#F97316', color: '#0D0D0B', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'var(--font-dm-sans), sans-serif' }}
            onMouseEnter={e => { if (!saving) { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 0 20px rgba(249,115,22,0.4)' } }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none' }}
          >
            {saving ? 'Enregistrement…' : 'Enregistrer'}
          </button>
          <Link href="/dashboard/clients" style={{ padding: '11px 20px', backgroundColor: 'transparent', color: '#8A8880', border: '1px solid #1E1E1C', borderRadius: 8, fontSize: 14, textDecoration: 'none', fontFamily: 'var(--font-dm-sans), sans-serif' }}>
            Annuler
          </Link>
        </div>
      </div>
    </div>
  )
}
