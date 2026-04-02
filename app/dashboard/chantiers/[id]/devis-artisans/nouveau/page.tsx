'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { getArtisans, type Artisan } from '@/lib/supabase/artisans'
import { createDevisArtisan } from '@/lib/supabase/devis-artisans'
import { toast } from '@/components/Toast'

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
  fontSize: '12px',
  color: '#8A8880',
  marginBottom: '6px',
  fontFamily: 'var(--font-dm-sans), sans-serif',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
}

const STATUT_OPTIONS = [
  { value: 'recu',    label: 'Reçu' },
  { value: 'accepte', label: 'Accepté' },
  { value: 'refuse',  label: 'Refusé' },
]

const LOTS_SUGGESTIONS = [
  'Gros œuvre', 'Charpente', 'Couverture', 'Menuiseries extérieures',
  'Menuiseries intérieures', 'Isolation', 'Électricité', 'Plomberie',
  'Chauffage / VMC', 'Carrelage', 'Peinture', 'Revêtements de sol', 'Façade', 'VRD',
]

export default function NouveauDevisArtisanPage() {
  const params = useParams()
  const chantierId = params.id as string
  const router = useRouter()

  const [artisans, setArtisans] = useState<Artisan[]>([])
  const [chantierNom, setChantierNom] = useState('')

  const [form, setForm] = useState({
    artisan_id:     '',
    numero:         '',
    lot:            '',
    montant_ht:     '',
    tva:            '20',
    montant_ttc:    '',
    statut:         'recu' as 'recu' | 'accepte' | 'refuse',
    date_reception: '',
    description:    '',
  })

  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [extracting, setExtracting] = useState(false)
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [pdfName, setPdfName] = useState<string | null>(null)
  const [extractError, setExtractError] = useState<string | null>(null)
  const [showLotSuggestions, setShowLotSuggestions] = useState(false)
  const lotRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const [artisansData, chantierRes] = await Promise.all([
        getArtisans().catch(() => []),
        supabase.from('chantiers').select('nom').eq('id', chantierId).single(),
      ])
      setArtisans(artisansData)
      setChantierNom(chantierRes.data?.nom ?? '')
    }
    load()
  }, [chantierId])

  // Close lot suggestions on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (lotRef.current && !lotRef.current.contains(e.target as Node)) {
        setShowLotSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function setField(field: keyof typeof form, value: string) {
    setForm(prev => {
      const next = { ...prev, [field]: value }
      // Auto-calculate TTC when HT or TVA changes
      if (field === 'montant_ht' || field === 'tva') {
        const ht = parseFloat(field === 'montant_ht' ? value : prev.montant_ht)
        const tva = parseFloat(field === 'tva' ? value : prev.tva)
        if (!isNaN(ht) && !isNaN(tva)) {
          next.montant_ttc = (ht * (1 + tva / 100)).toFixed(2)
        } else {
          next.montant_ttc = ''
        }
      }
      // Auto-calculate HT when TTC changes manually
      if (field === 'montant_ttc') {
        const ttc = parseFloat(value)
        const tva = parseFloat(prev.tva)
        if (!isNaN(ttc) && !isNaN(tva) && tva >= 0) {
          next.montant_ht = (ttc / (1 + tva / 100)).toFixed(2)
        }
      }
      return next
    })
  }

  async function handlePdfUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    setExtractError(null)
    setPdfUrl(null)
    setPdfName(null)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Non authentifié')

      const ext = file.name.split('.').pop() ?? 'pdf'
      const path = `${user.id}/${Date.now()}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('devis-artisans')
        .upload(path, file, { contentType: file.type, upsert: false })

      if (uploadError) throw new Error(uploadError.message)

      const { data: urlData } = supabase.storage.from('devis-artisans').getPublicUrl(path)
      const url = urlData.publicUrl
      setPdfUrl(url)
      setPdfName(file.name)
      toast.success('PDF uploadé')

      // Auto-extract
      setUploading(false)
      setExtracting(true)
      const res = await fetch('/api/extract-devis-artisan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pdf_url: url }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Extraction échouée')

      // Pre-fill form fields
      setForm(prev => {
        const next = { ...prev }
        if (json.numero)         next.numero = String(json.numero)
        if (json.lot)            next.lot = String(json.lot)
        if (json.description)    next.description = String(json.description)
        if (json.date_reception) next.date_reception = String(json.date_reception)
        if (json.tva != null)    next.tva = String(json.tva)
        if (json.montant_ht != null) next.montant_ht = String(json.montant_ht)
        if (json.montant_ttc != null) next.montant_ttc = String(json.montant_ttc)
        // Recalculate TTC if we have HT + TVA but no TTC
        if (json.montant_ht != null && json.tva != null && json.montant_ttc == null) {
          next.montant_ttc = (json.montant_ht * (1 + json.tva / 100)).toFixed(2)
        }
        return next
      })
      toast.success('Champs pré-remplis par l\'IA')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur'
      setExtractError(msg)
      toast.error(msg)
    } finally {
      setUploading(false)
      setExtracting(false)
    }
  }

  async function handleSave() {
    setSaving(true)
    try {
      await createDevisArtisan({
        chantier_id:    chantierId,
        artisan_id:     form.artisan_id || null,
        numero:         form.numero || null,
        lot:            form.lot || null,
        montant_ht:     form.montant_ht ? parseFloat(form.montant_ht) : null,
        tva:            form.tva ? parseFloat(form.tva) : null,
        montant_ttc:    form.montant_ttc ? parseFloat(form.montant_ttc) : null,
        statut:         form.statut,
        date_reception: form.date_reception || null,
        description:    form.description || null,
        pdf_url:        pdfUrl,
      })
      toast.success('Devis artisan enregistré')
      router.push(`/dashboard/chantiers/${chantierId}/devis-artisans`)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur lors de l\'enregistrement'
      toast.error(msg)
    } finally {
      setSaving(false)
    }
  }

  const filteredLots = LOTS_SUGGESTIONS.filter(l =>
    l.toLowerCase().includes(form.lot.toLowerCase()) && l.toLowerCase() !== form.lot.toLowerCase()
  )

  return (
    <div style={{ flex: 1, padding: '40px', overflowY: 'auto', maxWidth: '720px' }}>
      {/* Back */}
      <Link
        href={`/dashboard/chantiers/${chantierId}/devis-artisans`}
        style={{ display: 'inline-flex', alignItems: 'center', gap: 8, backgroundColor: '#111110', border: '1px solid #1E1E1C', borderRadius: 8, padding: '8px 14px', color: '#F0EDE6', fontSize: 13, fontWeight: 500, cursor: 'pointer', textDecoration: 'none', transition: 'all 0.15s ease', fontFamily: 'var(--font-dm-sans), sans-serif', marginBottom: 28 }}
        onMouseEnter={e => { e.currentTarget.style.background = '#1E1E1C'; e.currentTarget.style.borderColor = '#ea580c'; e.currentTarget.style.color = '#ea580c' }}
        onMouseLeave={e => { e.currentTarget.style.background = '#111110'; e.currentTarget.style.borderColor = '#1E1E1C'; e.currentTarget.style.color = '#F0EDE6' }}
      >
        <span style={{ color: '#ea580c' }}>←</span>
        Retour
      </Link>

      <h1 style={{ fontFamily: 'var(--font-syne), sans-serif', fontSize: '24px', fontWeight: 700, color: '#F0EDE6', margin: '0 0 4px' }}>
        Nouveau devis artisan
      </h1>
      {chantierNom && (
        <p style={{ color: '#8A8880', fontSize: '13px', fontFamily: 'var(--font-dm-sans), sans-serif', margin: '0 0 32px' }}>
          {chantierNom}
        </p>
      )}

      {/* PDF Upload zone */}
      <div style={{ backgroundColor: '#111110', border: '1px solid #1E1E1C', borderRadius: '12px', padding: '24px', marginBottom: '24px' }}>
        <h2 style={{ fontFamily: 'var(--font-syne), sans-serif', fontSize: '15px', fontWeight: 600, color: '#F0EDE6', margin: '0 0 12px' }}>
          Analyser un PDF
        </h2>
        <p style={{ color: '#8A8880', fontSize: '13px', fontFamily: 'var(--font-dm-sans), sans-serif', margin: '0 0 16px', lineHeight: '1.5' }}>
          Uploadez le PDF du devis artisan — l&apos;IA extraira automatiquement les montants, le lot et la description.
        </p>

        <label
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            padding: '10px 18px',
            backgroundColor: uploading || extracting ? '#2a2a27' : '#1E1E1C',
            border: '1px solid #2a2a27',
            borderRadius: '8px',
            fontSize: '13px', fontWeight: 600,
            color: uploading || extracting ? '#8A8880' : '#F0EDE6',
            cursor: uploading || extracting ? 'not-allowed' : 'pointer',
            fontFamily: 'var(--font-dm-sans), sans-serif',
            transition: 'all 0.15s',
          }}
          onMouseEnter={e => { if (!uploading && !extracting) { e.currentTarget.style.borderColor = '#ea580c'; e.currentTarget.style.color = '#ea580c' } }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = '#2a2a27'; e.currentTarget.style.color = uploading || extracting ? '#8A8880' : '#F0EDE6' }}
        >
          <input
            type="file"
            accept=".pdf"
            style={{ display: 'none' }}
            disabled={uploading || extracting}
            onChange={handlePdfUpload}
          />
          {uploading ? '⏳ Upload…' : extracting ? '🤖 Analyse IA…' : '📄 Analyser un PDF'}
        </label>

        {pdfName && (
          <p style={{ marginTop: '12px', fontSize: '13px', color: '#4ade80', fontFamily: 'var(--font-dm-sans), sans-serif' }}>
            ✓ {pdfName}
          </p>
        )}
        {extractError && (
          <p style={{ marginTop: '12px', fontSize: '13px', color: '#E85447', fontFamily: 'var(--font-dm-sans), sans-serif' }}>
            ✗ {extractError}
          </p>
        )}
      </div>

      {/* Form */}
      <div style={{ backgroundColor: '#111110', border: '1px solid #1E1E1C', borderRadius: '12px', padding: '28px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>

          {/* Artisan */}
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={labelStyle}>Artisan</label>
            <select
              value={form.artisan_id}
              onChange={e => setField('artisan_id', e.target.value)}
              style={{ ...inputStyle, appearance: 'none', WebkitAppearance: 'none', backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 16 16' fill='none'%3E%3Cpath d='M4 6L8 10L12 6' stroke='%23ea580c' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E\")", backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', paddingRight: '36px', cursor: 'pointer' } as React.CSSProperties}
              onFocus={e => { e.target.style.borderColor = '#ea580c' }}
              onBlur={e => { e.target.style.borderColor = '#1E1E1C' }}
            >
              <option value="">— Sélectionner un artisan —</option>
              {artisans.map(a => (
                <option key={a.id} value={a.id} style={{ backgroundColor: '#0D0D0B' }}>
                  {a.nom} · {a.metier}
                </option>
              ))}
            </select>
          </div>

          {/* Numéro */}
          <div>
            <label style={labelStyle}>Numéro du devis</label>
            <input
              type="text"
              value={form.numero}
              onChange={e => setField('numero', e.target.value)}
              placeholder="ex: DEV-2024-001"
              style={inputStyle}
              onFocus={e => { e.target.style.borderColor = '#ea580c' }}
              onBlur={e => { e.target.style.borderColor = '#1E1E1C' }}
            />
          </div>

          {/* Statut */}
          <div>
            <label style={labelStyle}>Statut</label>
            <select
              value={form.statut}
              onChange={e => setField('statut', e.target.value)}
              style={{ ...inputStyle, appearance: 'none', WebkitAppearance: 'none', backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 16 16' fill='none'%3E%3Cpath d='M4 6L8 10L12 6' stroke='%23ea580c' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E\")", backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', paddingRight: '36px', cursor: 'pointer' } as React.CSSProperties}
              onFocus={e => { e.target.style.borderColor = '#ea580c' }}
              onBlur={e => { e.target.style.borderColor = '#1E1E1C' }}
            >
              {STATUT_OPTIONS.map(o => (
                <option key={o.value} value={o.value} style={{ backgroundColor: '#0D0D0B' }}>{o.label}</option>
              ))}
            </select>
          </div>

          {/* Lot */}
          <div ref={lotRef} style={{ gridColumn: '1 / -1', position: 'relative' }}>
            <label style={labelStyle}>Lot</label>
            <input
              type="text"
              value={form.lot}
              onChange={e => { setField('lot', e.target.value); setShowLotSuggestions(true) }}
              placeholder="ex: Électricité, Plomberie…"
              style={inputStyle}
              onFocus={e => { e.target.style.borderColor = '#ea580c'; setShowLotSuggestions(true) }}
              onBlur={e => { e.target.style.borderColor = '#1E1E1C' }}
            />
            {showLotSuggestions && filteredLots.length > 0 && (
              <div style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, backgroundColor: '#111110', border: '1px solid #1E1E1C', borderRadius: '8px', boxShadow: '0 8px 24px rgba(0,0,0,0.4)', zIndex: 50, overflow: 'hidden' }}>
                {filteredLots.map(lot => (
                  <div
                    key={lot}
                    onMouseDown={e => { e.preventDefault(); setField('lot', lot); setShowLotSuggestions(false) }}
                    style={{ padding: '10px 14px', fontSize: '13px', color: '#F0EDE6', cursor: 'pointer', fontFamily: 'var(--font-dm-sans), sans-serif', transition: 'background 0.1s' }}
                    onMouseEnter={e => { e.currentTarget.style.background = '#1E1E1C' }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
                  >
                    {lot}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Montant HT */}
          <div>
            <label style={labelStyle}>Montant HT (€)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.montant_ht}
              onChange={e => setField('montant_ht', e.target.value)}
              placeholder="0.00"
              style={inputStyle}
              onFocus={e => { e.target.style.borderColor = '#ea580c' }}
              onBlur={e => { e.target.style.borderColor = '#1E1E1C' }}
            />
          </div>

          {/* TVA */}
          <div>
            <label style={labelStyle}>TVA (%)</label>
            <input
              type="number"
              min="0"
              max="100"
              step="0.1"
              value={form.tva}
              onChange={e => setField('tva', e.target.value)}
              placeholder="20"
              style={inputStyle}
              onFocus={e => { e.target.style.borderColor = '#ea580c' }}
              onBlur={e => { e.target.style.borderColor = '#1E1E1C' }}
            />
          </div>

          {/* Montant TTC */}
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={labelStyle}>Montant TTC (€) <span style={{ color: '#ea580c', fontSize: '11px' }}>— calculé automatiquement</span></label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.montant_ttc}
              onChange={e => setField('montant_ttc', e.target.value)}
              placeholder="0.00"
              style={{ ...inputStyle, fontWeight: 600 }}
              onFocus={e => { e.target.style.borderColor = '#ea580c' }}
              onBlur={e => { e.target.style.borderColor = '#1E1E1C' }}
            />
          </div>

          {/* Date réception */}
          <div>
            <label style={labelStyle}>Date de réception</label>
            <input
              type="date"
              value={form.date_reception}
              onChange={e => setField('date_reception', e.target.value)}
              style={{ ...inputStyle, colorScheme: 'dark' }}
              onFocus={e => { e.target.style.borderColor = '#ea580c' }}
              onBlur={e => { e.target.style.borderColor = '#1E1E1C' }}
            />
          </div>

          {/* Description */}
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={labelStyle}>Description des travaux</label>
            <textarea
              value={form.description}
              onChange={e => setField('description', e.target.value)}
              rows={3}
              placeholder="Travaux concernés par ce devis…"
              style={{ ...inputStyle, resize: 'vertical', lineHeight: '1.5' }}
              onFocus={e => { e.target.style.borderColor = '#ea580c' }}
              onBlur={e => { e.target.style.borderColor = '#1E1E1C' }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', marginTop: '28px' }}>
          <button
            onClick={handleSave}
            disabled={saving}
            className="transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_0_20px_rgba(249,115,22,0.4)] active:translate-y-0 active:shadow-none"
            style={{
              padding: '11px 24px',
              backgroundColor: saving ? '#9a4a1a' : '#ea580c',
              color: '#0D0D0B',
              border: 'none',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 700,
              cursor: saving ? 'not-allowed' : 'pointer',
              fontFamily: 'var(--font-dm-sans), sans-serif',
              opacity: saving ? 0.7 : 1,
            }}
          >
            {saving ? 'Enregistrement…' : 'Enregistrer'}
          </button>
          <Link
            href={`/dashboard/chantiers/${chantierId}/devis-artisans`}
            style={{
              padding: '11px 24px',
              backgroundColor: 'transparent',
              color: '#8A8880',
              border: '1px solid #1E1E1C',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 500,
              textDecoration: 'none',
              fontFamily: 'var(--font-dm-sans), sans-serif',
              display: 'inline-flex',
              alignItems: 'center',
            }}
          >
            Annuler
          </Link>
        </div>
      </div>
    </div>
  )
}
