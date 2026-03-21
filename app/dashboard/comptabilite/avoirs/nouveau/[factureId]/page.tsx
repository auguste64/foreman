'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { getFactureDoc, createAvoirDoc, calcTotauxDoc, formatEurDoc } from '@/lib/supabase/documents'
import type { FactureLigneDoc } from '@/lib/supabase/documents'
import { toast } from '@/components/Toast'
import UpgradeGate from '@/components/UpgradeGate'
import { usePlan } from '@/lib/usePlan'

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
  e.target.style.borderColor = '#ea580c'; e.target.style.boxShadow = '0 0 0 2px rgba(249,115,22,0.12)'
}
const blur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
  e.target.style.borderColor = '#1E1E1C'; e.target.style.boxShadow = 'none'
}

const UNITES = ['u', 'h', 'j', 'm²', 'm³', 'forfait', 'ml', 'kg']

type LigneEdit = { libelle: string; quantite: string; unite: string; prix_unitaire: string }

export default function NouvelAvoirPage() {
  const params = useParams()
  const factureId = params.factureId as string
  const router = useRouter()

  const today = new Date().toISOString().split('T')[0]

  const [factureNumero, setFactureNumero] = useState('')
  const [lignes, setLignes] = useState<LigneEdit[]>([])
  const [form, setForm] = useState({ numero: '', motif: '', date_emission: today })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const { isComplet, loading: planLoading } = usePlan()

  useEffect(() => {
    async function init() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const [factureRes, countRes] = await Promise.all([
        getFactureDoc(factureId),
        supabase.from('avoirs').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
      ])
      setFactureNumero(factureRes.numero)
      setLignes(factureRes.lignes.map((l: FactureLigneDoc) => ({
        libelle: l.libelle,
        quantite: String(l.quantite),
        unite: l.unite,
        prix_unitaire: String(l.prix_unitaire),
      })))
      const annee = new Date().getFullYear()
      setForm(p => ({ ...p, numero: `AVOIR-${annee}-${(countRes.count || 0) + 1}` }))
      setLoading(false)
    }
    init().catch(() => setLoading(false))
  }, [factureId])

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(p => ({ ...p, [k]: e.target.value }))

  function setLigne(i: number, k: keyof LigneEdit, v: string) {
    setLignes(prev => prev.map((l, idx) => idx === i ? { ...l, [k]: v } : l))
  }
  function addLigne() { setLignes(p => [...p, { libelle: '', quantite: '1', unite: 'u', prix_unitaire: '0' }]) }
  function removeLigne(i: number) { setLignes(p => p.filter((_, idx) => idx !== i)) }

  const parsedLignes = lignes.map(l => ({
    libelle: l.libelle,
    quantite: parseFloat(l.quantite) || 0,
    unite: l.unite,
    prix_unitaire: parseFloat(l.prix_unitaire) || 0,
  }))

  const sousTotal = parsedLignes.reduce((s, l) => s + l.quantite * l.prix_unitaire, 0)

  async function handleSave() {
    setError(null)
    if (!form.numero.trim()) { setError('Le numéro est requis.'); return }
    setSaving(true)
    try {
      const id = await createAvoirDoc({
        facture_id: factureId,
        numero: form.numero.trim(),
        statut: 'brouillon',
        motif: form.motif.trim(),
        date_emission: form.date_emission,
        total_ht: sousTotal,
        total_tva: 0,
        total_ttc: sousTotal,
        lignes: parsedLignes,
      })
      toast.success('Avoir créé')
      router.push(`/dashboard/comptabilite/factures/${factureId}`)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erreur')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div style={{ flex: 1, padding: 40 }}><p style={{ color: '#8A8880', fontFamily: 'var(--font-dm-sans), sans-serif' }}>Chargement…</p></div>
  if (planLoading) return null
  if (!isComplet) return <UpgradeGate feature="Comptabilité (devis & factures)" requiredPlan="complet" />

  return (
    <div className="page-enter" style={{ flex: 1, padding: '40px', overflowY: 'auto', maxWidth: 800 }}>
      <Link href={`/dashboard/comptabilite/factures/${factureId}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, backgroundColor: '#111110', border: '1px solid #1E1E1C', borderRadius: 8, padding: '8px 14px', color: '#F0EDE6', fontSize: 13, fontWeight: 500, cursor: 'pointer', textDecoration: 'none', transition: 'all 0.15s ease', fontFamily: 'var(--font-dm-sans), sans-serif', marginBottom: 28 }}
        onMouseEnter={e => { e.currentTarget.style.background = '#1E1E1C'; e.currentTarget.style.borderColor = '#ea580c'; e.currentTarget.style.color = '#ea580c' }}
        onMouseLeave={e => { e.currentTarget.style.background = '#111110'; e.currentTarget.style.borderColor = '#1E1E1C'; e.currentTarget.style.color = '#F0EDE6' }}
      >
        <span style={{ color: '#ea580c' }}>←</span>
        Retour à la facture {factureNumero}
      </Link>

      <h1 style={{ fontFamily: 'var(--font-syne), sans-serif', fontSize: 24, fontWeight: 700, color: '#F0EDE6', margin: '0 0 6px' }}>
        Nouvel avoir
      </h1>
      <p style={{ color: '#8A8880', fontSize: 13, fontFamily: 'var(--font-dm-sans), sans-serif', marginBottom: 28 }}>
        Avoir lié à la facture <strong style={{ color: '#ea580c' }}>{factureNumero}</strong>
      </p>

      {/* Infos */}
      <div style={{ backgroundColor: '#111110', border: '1px solid #1E1E1C', borderRadius: 12, padding: 24, marginBottom: 20 }}>
        <h2 style={{ fontFamily: 'var(--font-syne), sans-serif', fontSize: 14, fontWeight: 600, color: '#F0EDE6', margin: '0 0 18px' }}>Informations</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div>
            <label style={labelStyle}>Numéro</label>
            <input type="text" value={form.numero} readOnly style={{ ...inputStyle, color: '#7A7870', opacity: 0.8 }} />
          </div>
          <div>
            <label style={labelStyle}>Date d&apos;émission</label>
            <input type="date" value={form.date_emission} onChange={set('date_emission')} onFocus={focus} onBlur={blur} style={{ ...inputStyle, colorScheme: 'dark' }} />
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={labelStyle}>Motif</label>
            <textarea
              value={form.motif}
              onChange={set('motif')}
              onFocus={focus}
              onBlur={blur}
              rows={3}
              style={{ ...inputStyle, resize: 'vertical' } as React.CSSProperties}
              placeholder="Erreur de facturation, annulation partielle…"
            />
          </div>
        </div>
      </div>

      {/* Lignes */}
      <div style={{ backgroundColor: '#111110', border: '1px solid #1E1E1C', borderRadius: 12, padding: 24, marginBottom: 20 }}>
        <h2 style={{ fontFamily: 'var(--font-syne), sans-serif', fontSize: 14, fontWeight: 600, color: '#F0EDE6', margin: '0 0 18px' }}>Lignes de l&apos;avoir</h2>
        <p style={{ fontSize: 12, color: '#8A8880', fontFamily: 'var(--font-dm-sans), sans-serif', marginBottom: 16 }}>
          Pré-remplies depuis la facture d&apos;origine. Modifiez si nécessaire.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 70px 80px 120px 32px', gap: 8, marginBottom: 8 }}>
          {['Description', 'Qté', 'Unité', 'Prix HT', ''].map((h, i) => (
            <span key={i} style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#7A7870', fontFamily: 'var(--font-dm-sans), sans-serif' }}>{h}</span>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
          {lignes.map((l, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 70px 80px 120px 32px', gap: 8, alignItems: 'center' }}>
              <input type="text" value={l.libelle} onChange={e => setLigne(i, 'libelle', e.target.value)} onFocus={focus} onBlur={blur} style={{ ...inputStyle, padding: '8px 12px' }} placeholder="Description…" />
              <input type="number" value={l.quantite} onChange={e => setLigne(i, 'quantite', e.target.value)} onFocus={focus} onBlur={blur} style={{ ...inputStyle, padding: '8px 10px', textAlign: 'right' }} min="0" />
              <select value={l.unite} onChange={e => setLigne(i, 'unite', e.target.value)}
                style={{ ...inputStyle, padding: '8px 8px', colorScheme: 'dark' }}>
                {UNITES.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
              <input type="number" value={l.prix_unitaire} onChange={e => setLigne(i, 'prix_unitaire', e.target.value)} onFocus={focus} onBlur={blur} style={{ ...inputStyle, padding: '8px 10px', textAlign: 'right' }} min="0" step="0.01" />
              <button onClick={() => removeLigne(i)} disabled={lignes.length === 1}
                style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid #1E1E1C', backgroundColor: 'transparent', color: '#7A7870', cursor: lignes.length === 1 ? 'not-allowed' : 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                onMouseEnter={e => { if (lignes.length > 1) e.currentTarget.style.color = '#E85447' }}
                onMouseLeave={e => { e.currentTarget.style.color = '#7A7870' }}
              >×</button>
            </div>
          ))}
        </div>

        <button onClick={addLigne}
          style={{ padding: '8px 16px', backgroundColor: 'transparent', color: '#ea580c', border: '1px dashed rgba(249,115,22,0.3)', borderRadius: 8, fontSize: 13, cursor: 'pointer', fontFamily: 'var(--font-dm-sans), sans-serif', marginBottom: 20 }}
          onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(249,115,22,0.06)' }}
          onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent' }}
        >+ Ajouter une ligne</button>

        {/* Total */}
        <div style={{ paddingTop: 16, borderTop: '1px solid #1E1E1C', display: 'flex', justifyContent: 'flex-end' }}>
          <div style={{ display: 'flex', gap: 32, fontSize: 16, fontWeight: 700, fontFamily: 'var(--font-syne), sans-serif' }}>
            <span style={{ color: '#F0EDE6' }}>Total HT avoir</span>
            <span style={{ color: '#60a5fa', minWidth: 120, textAlign: 'right' }}>{formatEurDoc(sousTotal)}</span>
          </div>
        </div>
      </div>

      {error && (
        <p style={{ fontSize: 13, color: '#E85447', background: 'rgba(232,84,71,0.08)', border: '1px solid rgba(232,84,71,0.2)', borderRadius: 6, padding: '10px 14px', fontFamily: 'var(--font-dm-sans), sans-serif', marginBottom: 16 }}>{error}</p>
      )}

      <div style={{ display: 'flex', gap: 10 }}>
        <button onClick={handleSave} disabled={saving}
          style={{ padding: '11px 28px', backgroundColor: saving ? '#3a80e0' : '#60a5fa', color: '#0D0D0B', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'var(--font-dm-sans), sans-serif' }}
          onMouseEnter={e => { if (!saving) { e.currentTarget.style.transform = 'translateY(-1px)' } }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'none' }}
        >{saving ? 'Enregistrement…' : 'Créer l\'avoir'}</button>
        <Link href={`/dashboard/comptabilite/factures/${factureId}`} style={{ padding: '11px 20px', backgroundColor: 'transparent', color: '#8A8880', border: '1px solid #1E1E1C', borderRadius: 8, fontSize: 14, textDecoration: 'none', fontFamily: 'var(--font-dm-sans), sans-serif' }}>Annuler</Link>
      </div>
    </div>
  )
}
