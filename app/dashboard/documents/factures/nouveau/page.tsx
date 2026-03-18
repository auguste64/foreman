'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { createFactureDoc, calcTotauxDoc, formatEurDoc } from '@/lib/supabase/documents'
import { clientDisplayName, clientDisplayEmail, clientDisplayAdresse } from '@/lib/supabase/clients'
import type { Client } from '@/lib/supabase/clients'
import { useToast } from '@/components/ToastProvider'
import DocumentPreview from '@/components/DocumentPreview'
import CustomSelect from '@/components/CustomSelect'

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 14px', backgroundColor: '#0D0D0B',
  border: '1px solid #1E1E1C', borderRadius: 8, color: '#F0EDE6',
  fontSize: 14, outline: 'none', fontFamily: 'var(--font-dm-sans), sans-serif', boxSizing: 'border-box',
}
const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 11, fontWeight: 600, letterSpacing: '0.08em',
  textTransform: 'uppercase', color: '#8A8880', marginBottom: 6, fontFamily: 'var(--font-dm-sans), sans-serif',
}
const focus = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
  e.target.style.borderColor = '#ea580c'; e.target.style.boxShadow = '0 0 0 2px rgba(249,115,22,0.12)'
}
const blur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
  e.target.style.borderColor = '#1E1E1C'; e.target.style.boxShadow = 'none'
}

const UNITES = ['u', 'h', 'j', 'm²', 'm³', 'forfait', 'ml', 'kg']
type Ligne = { libelle: string; quantite: string; unite: string; prix_unitaire: string; tva_taux: string }
const emptyLigne = (): Ligne => ({ libelle: '', quantite: '1', unite: 'u', prix_unitaire: '0', tva_taux: '20' })
type Chantier = { id: string; nom: string }

const microLabel: React.CSSProperties = {
  margin: '0 0 4px', fontSize: 10, fontWeight: 600, letterSpacing: '0.08em',
  textTransform: 'uppercase', color: '#8A8880', fontFamily: 'var(--font-dm-sans), sans-serif',
}
const smallInput: React.CSSProperties = {
  width: '100%', backgroundColor: '#0D0D0B', border: '1px solid #1E1E1C', borderRadius: 6,
  padding: '8px 10px', color: '#F0EDE6', fontSize: 14, outline: 'none',
  fontFamily: 'var(--font-dm-sans), sans-serif', boxSizing: 'border-box',
}
const smallFocus = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
  e.target.style.borderColor = '#ea580c'; e.target.style.boxShadow = '0 0 0 2px rgba(249,115,22,0.12)'
}
const smallBlur = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
  e.target.style.borderColor = '#1E1E1C'; e.target.style.boxShadow = 'none'
}

function LigneCard({ ligne, canDelete, onChange, onDelete }: {
  ligne: Ligne; canDelete: boolean
  onChange: (k: keyof Ligne, v: string) => void; onDelete: () => void
}) {
  const [descFocused, setDescFocused] = useState(false)
  const [hovered, setHovered] = useState(false)
  const [cardActive, setCardActive] = useState(false)
  const totalHt = (parseFloat(ligne.quantite) || 0) * (parseFloat(ligne.prix_unitaire) || 0)
  const expanded = descFocused || ligne.libelle.includes('\n') || ligne.libelle.length > 60
  const borderColor = cardActive ? '#ea580c' : hovered ? '#2E2E2C' : '#1E1E1C'
  return (
    <div
      style={{ backgroundColor: '#111110', border: `1px solid ${borderColor}`, borderRadius: 8, padding: 16, boxShadow: cardActive ? '0 0 0 2px rgba(249,115,22,0.15)' : 'none', transition: 'border-color 0.15s, box-shadow 0.15s' }}
      onFocusCapture={() => setCardActive(true)}
      onBlurCapture={e => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setCardActive(false) }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <textarea
        value={ligne.libelle}
        onChange={e => onChange('libelle', e.target.value)}
        onFocus={() => setDescFocused(true)}
        onBlur={() => setDescFocused(false)}
        placeholder="Description de la prestation..."
        style={{ display: 'block', width: '100%', height: expanded ? 80 : 36, padding: '6px 0', border: 'none', borderBottom: `1px solid ${descFocused ? '#ea580c' : 'transparent'}`, borderRadius: 0, backgroundColor: 'transparent', color: '#F0EDE6', fontSize: 14, fontFamily: 'var(--font-dm-sans), sans-serif', outline: 'none', resize: 'none', lineHeight: 1.5, boxSizing: 'border-box', overflow: expanded ? 'auto' : 'hidden', marginBottom: 12, transition: 'height 0.2s ease' } as React.CSSProperties}
      />
      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
        <div style={{ width: 80, flexShrink: 0 }}>
          <p style={microLabel}>Qté</p>
          <input type="number" value={ligne.quantite} onChange={e => onChange('quantite', e.target.value)} onFocus={smallFocus} onBlur={smallBlur} style={{ ...smallInput, textAlign: 'right' }} min="0" />
        </div>
        <div style={{ width: 100, flexShrink: 0 }}>
          <p style={microLabel}>Unité</p>
          <CustomSelect
            value={ligne.unite}
            onChange={v => onChange('unite', v)}
            options={UNITES.map(u => ({ value: u, label: u }))}
            compact
          />
        </div>
        <div style={{ width: 120, flexShrink: 0 }}>
          <p style={microLabel}>Prix HT</p>
          <input type="number" value={ligne.prix_unitaire} onChange={e => onChange('prix_unitaire', e.target.value)} onFocus={smallFocus} onBlur={smallBlur} style={{ ...smallInput, textAlign: 'right' }} min="0" step="0.01" />
        </div>
        <div style={{ width: 80, flexShrink: 0 }}>
          <p style={microLabel}>TVA %</p>
          <input type="number" value={ligne.tva_taux} onChange={e => onChange('tva_taux', e.target.value)} onFocus={smallFocus} onBlur={smallBlur} style={{ ...smallInput, textAlign: 'right' }} min="0" max="100" />
        </div>
        <div style={{ flex: 1, minWidth: 100 }}>
          <p style={microLabel}>Total</p>
          <div style={{ ...smallInput, textAlign: 'right', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', height: 37 }}>
            {formatEurDoc(totalHt)}
          </div>
        </div>
        <button onClick={onDelete} disabled={!canDelete}
          style={{ width: 36, height: 37, flexShrink: 0, borderRadius: 6, border: '1px solid #1E1E1C', backgroundColor: 'transparent', color: '#7A7870', cursor: canDelete ? 'pointer' : 'not-allowed', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onMouseEnter={e => { if (canDelete) e.currentTarget.style.color = '#E85447' }}
          onMouseLeave={e => { e.currentTarget.style.color = '#7A7870' }}
        >×</button>
      </div>
    </div>
  )
}

export default function NouvelleFacturePage() {
  const router = useRouter()
  const { showToast } = useToast()

  const today = new Date().toISOString().split('T')[0]
  const in30 = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]

  const [form, setForm] = useState({
    numero: '', client_nom: '', client_email: '', client_adresse: '',
    objet: '', date_emission: today, date_echeance: in30,
    chantier_id: '', tva_taux: '20', remise_pct: '0', notes: '', conditions: '',
  })
  const [lignes, setLignes] = useState<Ligne[]>([emptyLigne()])
  const [chantiers, setChantiers] = useState<Chantier[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [selectedClientId, setSelectedClientId] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function init() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const [countRes, chantiersRes, clientsRes] = await Promise.all([
        supabase.from('factures').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('chantiers').select('id, nom').eq('user_id', user.id).order('nom'),
        supabase.from('clients').select('*').eq('user_id', user.id).order('nom'),
      ])
      const annee = new Date().getFullYear()
      setForm(p => ({ ...p, numero: `FACT-${annee}-${(countRes.count || 0) + 1}` }))
      setChantiers((chantiersRes.data ?? []) as Chantier[])
      setClients((clientsRes.data ?? []) as Client[])
    }
    init()
  }, [])

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(p => ({ ...p, [k]: e.target.value }))

  function setLigne(i: number, k: keyof Ligne, v: string) {
    setLignes(prev => prev.map((l, idx) => idx === i ? { ...l, [k]: v } : l))
  }
  function addLigne() { setLignes(p => [...p, emptyLigne()]) }
  function removeLigne(i: number) { setLignes(p => p.filter((_, idx) => idx !== i)) }

  const parsedLignes = lignes.map(l => ({
    libelle: l.libelle, quantite: parseFloat(l.quantite) || 0,
    unite: l.unite, prix_unitaire: parseFloat(l.prix_unitaire) || 0, tva_taux: parseFloat(l.tva_taux) || 20,
  }))
  const totaux = calcTotauxDoc(parsedLignes, parseFloat(form.tva_taux) || 0, parseFloat(form.remise_pct) || 0)

  async function handleSave() {
    setError(null)
    if (!form.numero.trim()) { setError('Le numéro est requis.'); return }
    setSaving(true)
    try {
      const id = await createFactureDoc({
        devis_id: null,
        numero: form.numero.trim(),
        statut: 'brouillon',
        client_nom: form.client_nom.trim(),
        client_email: form.client_email.trim(),
        client_adresse: form.client_adresse.trim(),
        objet: form.objet.trim(),
        chantier_id: form.chantier_id || null,
        date_emission: form.date_emission,
        date_echeance: form.date_echeance,
        tva_taux: parseFloat(form.tva_taux) || 20,
        remise_pct: parseFloat(form.remise_pct) || 0,
        notes: form.notes,
        conditions: form.conditions,
        total_ht: totaux.ht,
        total_tva: totaux.tva,
        total_ttc: totaux.ttc,
        montant_paye: 0,
        date_paiement: null,
        mode_paiement: null,
        envoye_at: null,
        lignes: parsedLignes,
      })
      showToast('Facture créée')
      router.push(`/dashboard/documents/factures/${id}`)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erreur')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="page-enter" style={{ flex: 1, padding: '40px', overflowY: 'auto' }}>
      <Link href="/dashboard/documents" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, backgroundColor: '#111110', border: '1px solid #1E1E1C', borderRadius: 8, padding: '8px 14px', color: '#F0EDE6', fontSize: 13, fontWeight: 500, cursor: 'pointer', textDecoration: 'none', transition: 'all 0.15s ease', fontFamily: 'var(--font-dm-sans), sans-serif', marginBottom: 28 }}
        onMouseEnter={e => { e.currentTarget.style.background = '#1E1E1C'; e.currentTarget.style.borderColor = '#ea580c'; e.currentTarget.style.color = '#ea580c' }}
        onMouseLeave={e => { e.currentTarget.style.background = '#111110'; e.currentTarget.style.borderColor = '#1E1E1C'; e.currentTarget.style.color = '#F0EDE6' }}
      >
        <span style={{ color: '#ea580c' }}>←</span>
        Retour aux documents
      </Link>
      <h1 style={{ fontFamily: 'var(--font-syne), sans-serif', fontSize: 24, fontWeight: 700, color: '#F0EDE6', margin: '0 0 28px' }}>
        Nouvelle facture
      </h1>

      <div style={{ display: 'grid', gridTemplateColumns: '55fr 45fr', gap: 24, alignItems: 'start' }}>
        {/* Left: Form */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <Card title="Informations">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <label style={labelStyle}>Numéro</label>
                <input type="text" value={form.numero} readOnly style={{ ...inputStyle, color: '#7A7870', opacity: 0.8 }} />
              </div>
              <div>
                <label style={labelStyle}>Chantier lié</label>
                <CustomSelect
                  value={form.chantier_id}
                  onChange={v => setForm(p => ({ ...p, chantier_id: v }))}
                  options={[{ value: '', label: '— Sans chantier —' }, ...chantiers.map(c => ({ value: c.id, label: c.nom }))]}
                  placeholder="— Sans chantier —"
                />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={labelStyle}>Objet</label>
                <input type="text" value={form.objet} onChange={set('objet')} onFocus={focus} onBlur={blur} style={inputStyle} placeholder="Travaux de rénovation…" />
              </div>
              <div>
                <label style={labelStyle}>Date d&apos;émission</label>
                <input type="date" value={form.date_emission} onChange={set('date_emission')} onFocus={focus} onBlur={blur} style={{ ...inputStyle, colorScheme: 'dark' }} />
              </div>
              <div>
                <label style={labelStyle}>Date d&apos;échéance</label>
                <input type="date" value={form.date_echeance} onChange={set('date_echeance')} onFocus={focus} onBlur={blur} style={{ ...inputStyle, colorScheme: 'dark' }} />
              </div>
            </div>
          </Card>

          <Card title="Client">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {clients.length > 0 && (
                <div style={{ paddingBottom: 14, borderBottom: '1px solid #1E1E1C' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                    <label style={labelStyle}>Sélectionner un client</label>
                    {selectedClientId && (
                      <button onClick={() => { setSelectedClientId(''); setForm(p => ({ ...p, client_nom: '', client_email: '', client_adresse: '' })) }}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8A8880', fontSize: 12, fontFamily: 'var(--font-dm-sans), sans-serif', padding: 0 }}
                        onMouseEnter={e => { e.currentTarget.style.color = '#ea580c' }}
                        onMouseLeave={e => { e.currentTarget.style.color = '#8A8880' }}>
                        × Effacer
                      </button>
                    )}
                  </div>
                  <CustomSelect
                    value={selectedClientId}
                    onChange={id => {
                      setSelectedClientId(id)
                      if (!id) { setForm(p => ({ ...p, client_nom: '', client_email: '', client_adresse: '' })); return }
                      const c = clients.find(c => c.id === id)
                      if (!c) return
                      setForm(p => ({
                        ...p,
                        client_nom: clientDisplayName(c),
                        client_email: clientDisplayEmail(c),
                        client_adresse: clientDisplayAdresse(c),
                      }))
                    }}
                    options={[{ value: '', label: '— Choisir un client existant —' }, ...clients.map(c => ({ value: c.id, label: clientDisplayName(c) }))]}
                    placeholder="— Choisir un client existant —"
                  />
                </div>
              )}
              <div>
                <label style={labelStyle}>Nom / Raison sociale</label>
                <input type="text" value={form.client_nom} onChange={set('client_nom')} onFocus={focus} onBlur={blur} style={inputStyle} placeholder="Client SAS" />
              </div>
              <div>
                <label style={labelStyle}>Email</label>
                <input type="email" value={form.client_email} onChange={set('client_email')} onFocus={focus} onBlur={blur} style={inputStyle} placeholder="client@example.com" />
              </div>
              <div>
                <label style={labelStyle}>Adresse</label>
                <textarea value={form.client_adresse} onChange={set('client_adresse')} onFocus={focus} onBlur={blur} rows={2} style={{ ...inputStyle, resize: 'vertical' } as React.CSSProperties} placeholder="12 rue de la Paix, 75001 Paris" />
              </div>
            </div>
          </Card>

          <Card title="Prestations">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
              {lignes.map((l, i) => (
                <LigneCard
                  key={i}
                  ligne={l}
                  canDelete={lignes.length > 1}
                  onChange={(k, v) => setLigne(i, k, v)}
                  onDelete={() => removeLigne(i)}
                />
              ))}
            </div>
            <button onClick={addLigne}
              style={{ width: '100%', padding: '14px', backgroundColor: 'transparent', color: '#ea580c', border: '1px dashed #1E1E1C', borderRadius: 8, fontSize: 14, cursor: 'pointer', fontFamily: 'var(--font-dm-sans), sans-serif', transition: 'background-color 0.15s, border-color 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#111110'; e.currentTarget.style.borderColor = '#ea580c' }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.borderColor = '#1E1E1C' }}
            >+ Ajouter une ligne</button>

            <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid #1E1E1C' }}>
              <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 16, marginBottom: 12 }}>
                <label style={{ ...labelStyle, margin: 0 }}>Remise globale (%)</label>
                <input type="number" value={form.remise_pct} onChange={set('remise_pct')} onFocus={focus} onBlur={blur}
                  style={{ ...inputStyle, width: 90, padding: '8px 12px', textAlign: 'right' }} min="0" max="100" step="0.5" />
              </div>
              <TotauxBlock totaux={totaux} tvaTaux={parseFloat(form.tva_taux) || 0} remisePct={parseFloat(form.remise_pct) || 0} />
            </div>
          </Card>

          <Card title="Notes & conditions">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={labelStyle}>Notes</label>
                <textarea value={form.notes} onChange={set('notes')} onFocus={focus} onBlur={blur} rows={3} style={{ ...inputStyle, resize: 'vertical' } as React.CSSProperties} />
              </div>
              <div>
                <label style={labelStyle}>Conditions</label>
                <textarea value={form.conditions} onChange={set('conditions')} onFocus={focus} onBlur={blur} rows={2} style={{ ...inputStyle, resize: 'vertical' } as React.CSSProperties} />
              </div>
            </div>
          </Card>

          {error && (
            <p style={{ fontSize: 13, color: '#E85447', background: 'rgba(232,84,71,0.08)', border: '1px solid rgba(232,84,71,0.2)', borderRadius: 6, padding: '10px 14px', fontFamily: 'var(--font-dm-sans), sans-serif' }}>{error}</p>
          )}

          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={handleSave} disabled={saving}
              style={{ padding: '11px 28px', backgroundColor: saving ? '#c45a10' : '#ea580c', color: '#0D0D0B', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'var(--font-dm-sans), sans-serif' }}
              onMouseEnter={e => { if (!saving) { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 0 20px rgba(249,115,22,0.4)' } }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none' }}
            >{saving ? 'Enregistrement…' : 'Enregistrer en brouillon'}</button>
            <Link href="/dashboard/documents" style={{ padding: '11px 20px', backgroundColor: 'transparent', color: '#8A8880', border: '1px solid #1E1E1C', borderRadius: 8, fontSize: 14, textDecoration: 'none', fontFamily: 'var(--font-dm-sans), sans-serif' }}>Annuler</Link>
          </div>
        </div>

        {/* Right: Preview */}
        <div style={{ position: 'sticky', top: 24 }}>
          <DocumentPreview
            type="facture"
            statut="brouillon"
            numero={form.numero}
            date_emission={form.date_emission}
            date_echeance={form.date_echeance}
            client_nom={form.client_nom}
            client_email={form.client_email}
            client_adresse={form.client_adresse}
            objet={form.objet}
            chantierNom={chantiers.find(c => c.id === form.chantier_id)?.nom}
            lignes={parsedLignes}
            totaux={totaux}
            remise_pct={parseFloat(form.remise_pct) || 0}
            tva_taux={parseFloat(form.tva_taux) || 0}
            notes={form.notes}
            conditions={form.conditions}
          />
        </div>
      </div>
    </div>
  )
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ backgroundColor: '#111110', border: '1px solid #1E1E1C', borderRadius: 12, padding: 24 }}>
      <h2 style={{ fontFamily: 'var(--font-syne), sans-serif', fontSize: 14, fontWeight: 600, color: '#F0EDE6', margin: '0 0 18px' }}>{title}</h2>
      {children}
    </div>
  )
}

function TotauxBlock({ totaux, tvaTaux, remisePct }: { totaux: ReturnType<typeof calcTotauxDoc>; tvaTaux: number; remisePct: number }) {
  const rowStyle: React.CSSProperties = { display: 'flex', justifyContent: 'flex-end', gap: 32, fontSize: 13, fontFamily: 'var(--font-dm-sans), sans-serif', marginBottom: 4 }
  return (
    <div>
      <div style={rowStyle}><span style={{ color: '#8A8880' }}>Sous-total HT</span><span style={{ color: '#F0EDE6', minWidth: 110, textAlign: 'right' }}>{formatEurDoc(totaux.sousTotal)}</span></div>
      {remisePct > 0 && <div style={rowStyle}><span style={{ color: '#8A8880' }}>Remise ({remisePct}%)</span><span style={{ color: '#E85447', minWidth: 110, textAlign: 'right' }}>- {formatEurDoc(totaux.sousTotal - totaux.ht)}</span></div>}
      <div style={rowStyle}><span style={{ color: '#8A8880' }}>Total HT</span><span style={{ color: '#F0EDE6', minWidth: 110, textAlign: 'right' }}>{formatEurDoc(totaux.ht)}</span></div>
      <div style={rowStyle}><span style={{ color: '#8A8880' }}>TVA ({tvaTaux}%)</span><span style={{ color: '#F0EDE6', minWidth: 110, textAlign: 'right' }}>{formatEurDoc(totaux.tva)}</span></div>
      <div style={{ ...rowStyle, fontSize: 16, fontWeight: 700, fontFamily: 'var(--font-syne), sans-serif', paddingTop: 8, borderTop: '1px solid #1E1E1C', marginTop: 4 }}>
        <span style={{ color: '#F0EDE6' }}>Total TTC</span>
        <span style={{ color: '#ea580c', minWidth: 110, textAlign: 'right' }}>{formatEurDoc(totaux.ttc)}</span>
      </div>
    </div>
  )
}

