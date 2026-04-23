'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { createDevis, calcTotaux, formatEur } from '@/lib/supabase/devis'
import { createClient } from '@/lib/supabase/client'
import { toast } from '@/components/Toast'
import { usePlan } from '@/lib/usePlan'
import UpgradeGate from '@/components/UpgradeGate'

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

const STATUT_OPTIONS = [
  { value: 'brouillon', label: 'Brouillon' },
  { value: 'envoye',    label: 'Envoyé' },
  { value: 'accepte',   label: 'Accepté' },
  { value: 'refuse',    label: 'Refusé' },
] as const

type Ligne = { description: string; quantite: string; unite: string; prix_unitaire: string }
const emptyLigne = (): Ligne => ({ description: '', quantite: '1', unite: 'u', prix_unitaire: '0' })

export default function NouveauDevisPage() {
  const params = useParams()
  const chantierId = params.id as string
  const router = useRouter()

  const today = new Date().toISOString().split('T')[0]
  const in30 = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]

  const [form, setForm] = useState({
    numero: '',
    client_nom: '',
    statut: 'brouillon' as string,
    date_emission: today,
    date_validite: in30,
    tva_pct: '20',
    notes: '',
  })
  const [lignes, setLignes] = useState<Ligne[]>([emptyLigne()])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [statutOpen, setStatutOpen] = useState(false)
  const statutRef = useRef<HTMLDivElement>(null)
  const { isPro, loading: planLoading } = usePlan()

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (statutRef.current && !statutRef.current.contains(e.target as Node)) {
        setStatutOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  useEffect(() => {
    async function genNumero() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { count } = await supabase
        .from('devis')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
      const annee = new Date().getFullYear()
      setForm(p => ({ ...p, numero: `DEVIS-${annee}-${(count || 0) + 1}` }))
    }
    genNumero()
  }, [])

  const setField = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(p => ({ ...p, [k]: e.target.value }))

  function setLigne(i: number, k: keyof Ligne, v: string) {
    setLignes(prev => prev.map((l, idx) => idx === i ? { ...l, [k]: v } : l))
  }
  function addLigne() { setLignes(p => [...p, emptyLigne()]) }
  function removeLigne(i: number) { setLignes(p => p.filter((_, idx) => idx !== i)) }

  const parsedLignes = lignes.map(l => ({
    description: l.description,
    quantite: parseFloat(l.quantite) || 0,
    unite: l.unite,
    prix_unitaire: parseFloat(l.prix_unitaire) || 0,
  }))
  const totaux = calcTotaux(parsedLignes, parseFloat(form.tva_pct) || 0)

  const statutLabel = STATUT_OPTIONS.find(o => o.value === form.statut)?.label ?? form.statut

  async function handleSave() {
    setError(null)
    if (!form.numero.trim()) { setError('Le numéro est requis.'); return }
    setSaving(true)
    try {
      const titre = `${form.numero} - ${form.client_nom.trim() || 'Sans client'}`
      const id = await createDevis({
        chantier_id: chantierId,
        numero: form.numero.trim(),
        titre,
        client_nom: form.client_nom.trim(),
        statut: form.statut,
        date_emission: form.date_emission,
        date_validite: form.date_validite,
        tva_pct: parseFloat(form.tva_pct) || 20,
        notes: form.notes,
        lignes: parsedLignes,
      })
      toast.success('Devis créé')
      router.push(`/dashboard/chantiers/${chantierId}/devis/${id}`)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erreur')
    } finally {
      setSaving(false)
    }
  }

  if (planLoading) return null
  if (!isPro) return <UpgradeGate feature="Comptabilité" requiredPlan="pro" />

  return (
    <div className="page-enter" style={{ flex: 1, padding: '40px', overflowY: 'auto', maxWidth: '800px' }}>
      <Link
        href={`/dashboard/chantiers/${chantierId}/devis`}
        style={{ display: 'inline-flex', alignItems: 'center', gap: 8, backgroundColor: '#111110', border: '1px solid #1E1E1C', borderRadius: 8, padding: '8px 14px', color: '#F0EDE6', fontSize: 13, fontWeight: 500, cursor: 'pointer', textDecoration: 'none', transition: 'all 0.15s ease', fontFamily: 'var(--font-dm-sans), sans-serif', marginBottom: 28 }}
        onMouseEnter={e => { e.currentTarget.style.background = '#1E1E1C'; e.currentTarget.style.borderColor = '#ea580c'; e.currentTarget.style.color = '#ea580c' }}
        onMouseLeave={e => { e.currentTarget.style.background = '#111110'; e.currentTarget.style.borderColor = '#1E1E1C'; e.currentTarget.style.color = '#F0EDE6' }}
      >
        <span style={{ color: '#ea580c' }}>←</span>
        Retour aux devis
      </Link>

      <h1 style={{ fontFamily: 'var(--font-syne), sans-serif', fontSize: '24px', fontWeight: 700, color: '#F0EDE6', margin: '0 0 32px' }}>
        Nouveau devis
      </h1>

      {/* Infos générales */}
      <div style={{ backgroundColor: '#111110', border: '1px solid #1E1E1C', borderRadius: '12px', padding: '28px', marginBottom: '20px' }}>
        <h2 style={{ fontFamily: 'var(--font-syne), sans-serif', fontSize: '15px', fontWeight: 600, color: '#F0EDE6', margin: '0 0 20px' }}>Informations</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>

          {/* Numéro */}
          <div>
            <label style={labelStyle}>Numéro</label>
            <input type="text" value={form.numero} readOnly style={{ ...inputStyle, color: '#7A7870', cursor: 'default', opacity: 0.8 }} />
          </div>

          {/* Statut */}
          <div>
            <label style={labelStyle}>Statut</label>
            <div ref={statutRef} style={{ position: 'relative' }}>
              <button
                type="button"
                onClick={() => setStatutOpen(p => !p)}
                style={{ ...inputStyle, display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', borderColor: statutOpen ? '#ea580c' : '#1E1E1C', boxShadow: statutOpen ? '0 0 0 2px rgba(249,115,22,0.12)' : 'none' }}
              >
                <span>{statutLabel}</span>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0, transform: statutOpen ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s' }}>
                  <path d="M3 5l4 4 4-4" stroke="#8A8880" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              {statutOpen && (
                <div style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, backgroundColor: '#111110', border: '1px solid #1E1E1C', borderRadius: '8px', zIndex: 50, overflow: 'hidden', boxShadow: '0 8px 24px rgba(0,0,0,0.4)' }}>
                  {STATUT_OPTIONS.map(({ value, label }) => (
                    <div
                      key={value}
                      onMouseDown={() => { setForm(p => ({ ...p, statut: value })); setStatutOpen(false) }}
                      style={{ padding: '10px 16px', fontSize: '14px', fontFamily: 'var(--font-dm-sans), sans-serif', cursor: 'pointer', color: form.statut === value ? '#ea580c' : '#F0EDE6' }}
                      onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#1E1E1C' }}
                      onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent' }}
                    >
                      {label}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Client — pleine largeur */}
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={labelStyle}>Client</label>
            <input
              type="text"
              value={form.client_nom}
              onChange={setField('client_nom')}
              style={inputStyle}
              onFocus={focus}
              onBlur={blur}
              placeholder="Nom du maître d'ouvrage"
            />
          </div>

          <div>
            <label style={labelStyle}>TVA (%)</label>
            <input type="number" value={form.tva_pct} onChange={setField('tva_pct')} style={inputStyle} onFocus={focus} onBlur={blur} min="0" max="100" />
          </div>
          <div>
            <label style={labelStyle}>Date d'émission</label>
            <input type="date" value={form.date_emission} onChange={setField('date_emission')} style={{ ...inputStyle, colorScheme: 'dark' }} onFocus={focus} onBlur={blur} />
          </div>
          <div>
            <label style={labelStyle}>Date de validité</label>
            <input type="date" value={form.date_validite} onChange={setField('date_validite')} style={{ ...inputStyle, colorScheme: 'dark' }} onFocus={focus} onBlur={blur} />
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={labelStyle}>Notes</label>
            <textarea
              value={form.notes}
              onChange={setField('notes')}
              style={{ ...inputStyle, height: '80px', resize: 'vertical' } as React.CSSProperties}
              onFocus={focus}
              onBlur={blur}
              placeholder="Conditions particulières, délais..."
            />
          </div>
        </div>
      </div>

      {/* Lignes */}
      <div style={{ backgroundColor: '#111110', border: '1px solid #1E1E1C', borderRadius: '12px', padding: '28px', marginBottom: '20px' }}>
        <h2 style={{ fontFamily: 'var(--font-syne), sans-serif', fontSize: '15px', fontWeight: 600, color: '#F0EDE6', margin: '0 0 20px' }}>Prestations</h2>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 60px 110px 32px', gap: '8px', marginBottom: '8px' }}>
          {['Description', 'Qté', 'Unité', 'Prix unit. HT', ''].map((h, i) => (
            <span key={i} style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#7A7870', fontFamily: 'var(--font-dm-sans), sans-serif' }}>{h}</span>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
          {lignes.map((l, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 80px 60px 110px 32px', gap: '8px', alignItems: 'center' }}>
              <input type="text" value={l.description} onChange={e => setLigne(i, 'description', e.target.value)} style={{ ...inputStyle, padding: '8px 12px' }} onFocus={focus} onBlur={blur} placeholder="Fourniture et pose..." />
              <input type="number" value={l.quantite} onChange={e => setLigne(i, 'quantite', e.target.value)} style={{ ...inputStyle, padding: '8px 12px', textAlign: 'right' }} onFocus={focus} onBlur={blur} min="0" />
              <input type="text" value={l.unite} onChange={e => setLigne(i, 'unite', e.target.value)} style={{ ...inputStyle, padding: '8px 12px' }} onFocus={focus} onBlur={blur} placeholder="u" />
              <input type="number" value={l.prix_unitaire} onChange={e => setLigne(i, 'prix_unitaire', e.target.value)} style={{ ...inputStyle, padding: '8px 12px', textAlign: 'right' }} onFocus={focus} onBlur={blur} min="0" step="0.01" />
              <button
                onClick={() => removeLigne(i)}
                disabled={lignes.length === 1}
                style={{ width: '28px', height: '28px', borderRadius: '6px', border: '1px solid #1E1E1C', backgroundColor: 'transparent', color: '#7A7870', cursor: lignes.length === 1 ? 'not-allowed' : 'pointer', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
                onMouseEnter={e => { if (lignes.length > 1) e.currentTarget.style.color = '#E85447' }}
                onMouseLeave={e => { e.currentTarget.style.color = '#7A7870' }}
              >×</button>
            </div>
          ))}
        </div>

        <button
          onClick={addLigne}
          style={{ padding: '8px 16px', backgroundColor: 'transparent', color: '#ea580c', border: '1px dashed rgba(249,115,22,0.3)', borderRadius: '8px', fontSize: '13px', cursor: 'pointer', fontFamily: 'var(--font-dm-sans), sans-serif' }}
          onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(249,115,22,0.06)' }}
          onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent' }}
        >
          + Ajouter une ligne
        </button>

        <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid #1E1E1C', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
          <div style={{ display: 'flex', gap: '24px', fontSize: '13px', color: '#8A8880', fontFamily: 'var(--font-dm-sans), sans-serif' }}>
            <span>Total HT</span>
            <span style={{ color: '#F0EDE6', minWidth: '100px', textAlign: 'right' }}>{formatEur(totaux.ht)}</span>
          </div>
          <div style={{ display: 'flex', gap: '24px', fontSize: '13px', color: '#8A8880', fontFamily: 'var(--font-dm-sans), sans-serif' }}>
            <span>TVA ({form.tva_pct}%)</span>
            <span style={{ color: '#F0EDE6', minWidth: '100px', textAlign: 'right' }}>{formatEur(totaux.tva)}</span>
          </div>
          <div style={{ display: 'flex', gap: '24px', fontSize: '16px', fontWeight: 700, fontFamily: 'var(--font-syne), sans-serif', marginTop: '4px', paddingTop: '8px', borderTop: '1px solid #1E1E1C' }}>
            <span style={{ color: '#F0EDE6' }}>Total TTC</span>
            <span style={{ color: '#ea580c', minWidth: '100px', textAlign: 'right' }}>{formatEur(totaux.ttc)}</span>
          </div>
        </div>
      </div>

      {error && (
        <p style={{ fontSize: '13px', color: '#E85447', marginBottom: '16px', fontFamily: 'var(--font-dm-sans), sans-serif', background: 'rgba(232,84,71,0.08)', border: '1px solid rgba(232,84,71,0.2)', borderRadius: '6px', padding: '10px 14px' }}>
          {error}
        </p>
      )}

      <div style={{ display: 'flex', gap: '10px' }}>
        <button
          onClick={handleSave}
          disabled={saving}
          style={{ padding: '11px 28px', backgroundColor: saving ? '#c45a10' : '#ea580c', color: '#0D0D0B', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'var(--font-dm-sans), sans-serif', transition: 'all 0.2s' }}
          onMouseEnter={e => { if (!saving) { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 0 20px rgba(249,115,22,0.4)' } }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}
        >
          {saving ? 'Enregistrement...' : 'Enregistrer le devis'}
        </button>
        <Link
          href={`/dashboard/chantiers/${chantierId}/devis`}
          style={{ padding: '11px 20px', backgroundColor: 'transparent', color: '#8A8880', border: '1px solid #1E1E1C', borderRadius: '8px', fontSize: '14px', fontWeight: 500, textDecoration: 'none', fontFamily: 'var(--font-dm-sans), sans-serif' }}
        >
          Annuler
        </Link>
      </div>
    </div>
  )
}
