'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { getClient, updateClient, deleteClient, clientDisplayName } from '@/lib/supabase/clients'
import type { Client } from '@/lib/supabase/clients'
import { createClient as supabaseClient } from '@/lib/supabase/client'
import { formatEurDoc } from '@/lib/supabase/documents'
import { toast } from '@/components/Toast'

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 14px', backgroundColor: '#0D0D0B',
  border: '1px solid #1E1E1C', borderRadius: 8, color: '#F0EDE6',
  fontSize: 14, outline: 'none', fontFamily: 'var(--font-dm-sans), sans-serif', boxSizing: 'border-box',
}
const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 11, fontWeight: 600, letterSpacing: '0.08em',
  textTransform: 'uppercase', color: '#8A8880', marginBottom: 6, fontFamily: 'var(--font-dm-sans), sans-serif',
}
const readValueStyle: React.CSSProperties = {
  fontSize: 14, color: '#F0EDE6', fontFamily: 'var(--font-dm-sans), sans-serif',
}
const readMutedStyle: React.CSSProperties = {
  fontSize: 14, color: '#7A7870', fontFamily: 'var(--font-dm-sans), sans-serif',
}
const focus = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
  e.target.style.borderColor = '#ea580c'; e.target.style.boxShadow = '0 0 0 2px rgba(249,115,22,0.12)'
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
          label: f.properties.label, postcode: f.properties.postcode, city: f.properties.city,
        }))
        setSuggestions(results); setOpen(results.length > 0)
      }).catch(() => {})
  }, [])

  useEffect(() => { return () => { if (timerRef.current) clearTimeout(timerRef.current) } }, [])
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('keydown', h); return () => document.removeEventListener('keydown', h)
  }, [])
  useEffect(() => {
    const h = (e: MouseEvent) => { if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', h); return () => document.removeEventListener('mousedown', h)
  }, [])

  return (
    <div ref={wrapperRef} style={{ position: 'relative' }}>
      <label style={labelStyle}>Adresse</label>
      <input type="text" value={value} onChange={e => { onChange(e); if (timerRef.current) clearTimeout(timerRef.current); timerRef.current = setTimeout(() => fetchSuggestions(e.target.value), 300) }}
        onFocus={focus} onBlur={blur} style={inputStyle} placeholder="12 rue de la Paix…" autoComplete="off" />
      {open && (
        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, backgroundColor: '#111110', border: '1px solid #1E1E1C', borderRadius: 8, marginTop: 4, zIndex: 50, overflow: 'hidden' }}>
          {suggestions.map((s, i) => (
            <div key={i} onMouseDown={() => { onSelect(s.label, s.postcode, s.city); setOpen(false) }}
              style={{ padding: '10px 14px', fontSize: 13, color: '#F0EDE6', fontFamily: 'var(--font-dm-sans), sans-serif', cursor: 'pointer' }}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#1E1E1C' }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent' }}>
              {s.label}
            </div>
          ))}
        </div>
      )}
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

function ReadRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <p style={{ ...labelStyle, marginBottom: 2 }}>{label}</p>
      <p style={value ? readValueStyle : readMutedStyle}>{value || '—'}</p>
    </div>
  )
}

type DocRow = { id: string; type: 'devis' | 'facture'; numero: string; statut: string; montant_ttc: number; date: string }

const DEVIS_STATUT: Record<string, { label: string; color: string }> = {
  brouillon: { label: 'Brouillon', color: '#8A8880' },
  envoye:    { label: 'Envoyé',    color: '#60a5fa' },
  accepte:   { label: 'Accepté',   color: '#4ade80' },
  refuse:    { label: 'Refusé',    color: '#E85447' },
  expire:    { label: 'Expiré',    color: '#ea580c' },
}
const FACTURE_STATUT: Record<string, { label: string; color: string }> = {
  brouillon:           { label: 'Brouillon', color: '#8A8880' },
  envoyee:             { label: 'Envoyée',   color: '#60a5fa' },
  partiellement_payee: { label: 'Partiel',   color: '#ea580c' },
  payee:               { label: 'Payée',     color: '#4ade80' },
  annulee:             { label: 'Annulée',   color: '#E85447' },
}

function fmtDate(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function initials(c: Client): string {
  if (c.type === 'entreprise') return (c.entreprise_nom || '?')[0].toUpperCase()
  const p = (c.prenom || '')[0] || ''
  const n = (c.nom || '')[0] || ''
  return (p + n).toUpperCase() || '?'
}

export default function ClientDetailPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()

  const [client, setClient] = useState<Client | null>(null)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState<Partial<Client>>({})
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [docs, setDocs] = useState<DocRow[]>([])
  const [loadingDocs, setLoadingDocs] = useState(true)

  useEffect(() => {
    if (!params.id) return
    getClient(params.id).then(c => { setClient(c); setForm(c) })
  }, [params.id])

  useEffect(() => {
    if (!client) return
    const sb = supabaseClient()
    const email = client.email || client.contact_email || ''
    const name = clientDisplayName(client)

    Promise.all([
      sb.from('devis').select('id, numero, statut, total_ttc, date_emission, client_nom, client_email')
        .or(email ? `client_email.eq.${email},client_nom.eq.${name}` : `client_nom.eq.${name}`),
      sb.from('factures').select('id, numero, statut, total_ttc, date_emission, client_nom, client_email')
        .or(email ? `client_email.eq.${email},client_nom.eq.${name}` : `client_nom.eq.${name}`),
    ]).then(([dr, fr]) => {
      const devisRows: DocRow[] = (dr.data || []).map((d: { id: string; numero: string; statut: string; total_ttc: number; date_emission: string }) => ({
        id: d.id, type: 'devis', numero: d.numero, statut: d.statut, montant_ttc: d.total_ttc, date: d.date_emission,
      }))
      const factRows: DocRow[] = (fr.data || []).map((f: { id: string; numero: string; statut: string; total_ttc: number; date_emission: string }) => ({
        id: f.id, type: 'facture', numero: f.numero, statut: f.statut, montant_ttc: f.total_ttc, date: f.date_emission,
      }))
      setDocs([...devisRows, ...factRows].sort((a, b) => b.date.localeCompare(a.date)))
      setLoadingDocs(false)
    })
  }, [client])

  const set = (k: keyof Client) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(p => ({ ...p, [k]: e.target.value }))

  async function handleSave() {
    if (!client) return
    setSaving(true)
    try {
      const updated = await updateClient(client.id, form as Partial<Client>)
      setClient(updated)
      setEditing(false)
      toast.success('Client mis à jour')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erreur')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!client) return
    try {
      await deleteClient(client.id)
      toast.success('Client supprimé')
      router.push('/dashboard/clients')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erreur')
    }
  }

  if (!client) {
    return (
      <div style={{ flex: 1, padding: '40px' }}>
        <p style={{ color: '#8A8880', fontFamily: 'var(--font-dm-sans), sans-serif' }}>Chargement…</p>
      </div>
    )
  }

  const isEntreprise = client.type === 'entreprise'
  const formIsEntreprise = (form.type ?? client.type) === 'entreprise'
  const name = clientDisplayName(client)

  return (
    <div className="page-enter" style={{ flex: 1, padding: '40px', overflowY: 'auto', maxWidth: 800 }}>
      <Link href="/dashboard/clients" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, backgroundColor: '#111110', border: '1px solid #1E1E1C', borderRadius: 8, padding: '8px 14px', color: '#F0EDE6', fontSize: 13, fontWeight: 500, cursor: 'pointer', textDecoration: 'none', transition: 'all 0.15s ease', fontFamily: 'var(--font-dm-sans), sans-serif', marginBottom: 28 }}
        onMouseEnter={e => { e.currentTarget.style.background = '#1E1E1C'; e.currentTarget.style.borderColor = '#ea580c'; e.currentTarget.style.color = '#ea580c' }}
        onMouseLeave={e => { e.currentTarget.style.background = '#111110'; e.currentTarget.style.borderColor = '#1E1E1C'; e.currentTarget.style.color = '#F0EDE6' }}
      >
        <span style={{ color: '#ea580c' }}>←</span>
        Retour aux clients
      </Link>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32 }}>
        <div style={{ width: 52, height: 52, borderRadius: '50%', backgroundColor: isEntreprise ? '#ea580c' : '#1E1E1C', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 700, color: isEntreprise ? '#0D0D0B' : '#F0EDE6', fontFamily: 'var(--font-syne), sans-serif', flexShrink: 0, border: isEntreprise ? 'none' : '1px solid #2A2A28' }}>
          {initials(client)}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1 style={{ fontFamily: 'var(--font-syne), sans-serif', fontSize: 22, fontWeight: 700, color: '#F0EDE6', margin: '0 0 4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {name}
          </h1>
          <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20, backgroundColor: isEntreprise ? 'rgba(249,115,22,0.12)' : 'rgba(138,136,128,0.15)', color: isEntreprise ? '#ea580c' : '#8A8880', fontFamily: 'var(--font-dm-sans), sans-serif' }}>
            {isEntreprise ? 'Entreprise' : 'Particulier'}
          </span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {editing ? (
            <>
              <button onClick={handleSave} disabled={saving}
                style={{ padding: '9px 20px', backgroundColor: '#ea580c', color: '#0D0D0B', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-dm-sans), sans-serif' }}>
                {saving ? 'Enregistrement…' : 'Enregistrer'}
              </button>
              <button onClick={() => { setEditing(false); setForm(client) }}
                style={{ padding: '9px 16px', backgroundColor: 'transparent', color: '#8A8880', border: '1px solid #1E1E1C', borderRadius: 8, fontSize: 13, cursor: 'pointer', fontFamily: 'var(--font-dm-sans), sans-serif' }}>
                Annuler
              </button>
            </>
          ) : (
            <>
              <button onClick={() => setEditing(true)}
                style={{ padding: '9px 20px', backgroundColor: 'transparent', color: '#F0EDE6', border: '1px solid #1E1E1C', borderRadius: 8, fontSize: 13, cursor: 'pointer', fontFamily: 'var(--font-dm-sans), sans-serif' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#ea580c'; e.currentTarget.style.color = '#ea580c' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#1E1E1C'; e.currentTarget.style.color = '#F0EDE6' }}>
                Modifier
              </button>
              <button onClick={() => setConfirmDelete(true)}
                style={{ padding: '9px 16px', backgroundColor: 'transparent', color: '#8A8880', border: '1px solid #1E1E1C', borderRadius: 8, fontSize: 13, cursor: 'pointer', fontFamily: 'var(--font-dm-sans), sans-serif' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#E85447'; e.currentTarget.style.color = '#E85447' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#1E1E1C'; e.currentTarget.style.color = '#8A8880' }}>
                Supprimer
              </button>
            </>
          )}
        </div>
      </div>

      {/* Delete confirm modal */}
      {confirmDelete && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ backgroundColor: '#111110', border: '1px solid #1E1E1C', borderRadius: 12, padding: 32, maxWidth: 400, width: '90%' }}>
            <h3 style={{ fontFamily: 'var(--font-syne), sans-serif', fontSize: 18, color: '#F0EDE6', margin: '0 0 12px' }}>Supprimer ce client ?</h3>
            <p style={{ color: '#8A8880', fontSize: 14, fontFamily: 'var(--font-dm-sans), sans-serif', margin: '0 0 24px' }}>
              Cette action est irréversible. Le client sera définitivement supprimé.
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={handleDelete}
                style={{ padding: '10px 20px', backgroundColor: '#E85447', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-dm-sans), sans-serif' }}>
                Supprimer
              </button>
              <button onClick={() => setConfirmDelete(false)}
                style={{ padding: '10px 16px', backgroundColor: 'transparent', color: '#8A8880', border: '1px solid #1E1E1C', borderRadius: 8, fontSize: 14, cursor: 'pointer', fontFamily: 'var(--font-dm-sans), sans-serif' }}>
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Identity */}
        <Card title={editing ? 'Identité' : isEntreprise ? 'Identité entreprise' : 'Identité'}>
          {editing ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Type toggle */}
              <div>
                <label style={labelStyle}>Type de client</label>
                <div style={{ display: 'flex', borderRadius: 8, overflow: 'hidden', border: '1px solid #1E1E1C', width: 'fit-content' }}>
                  {(['particulier', 'entreprise'] as const).map(t => {
                    const active = (form.type ?? client.type) === t
                    return (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setForm(p => ({ ...p, type: t }))}
                        style={{ padding: '9px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-dm-sans), sans-serif', border: 'none', transition: 'all 0.15s', backgroundColor: active ? '#ea580c' : 'transparent', color: active ? '#0D0D0B' : '#7A7870' }}
                      >
                        {t === 'particulier' ? 'Particulier' : 'Entreprise'}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Entreprise fields */}
              {formIsEntreprise ? (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={labelStyle}>Raison sociale</label>
                    <input type="text" value={form.entreprise_nom || ''} onChange={set('entreprise_nom')} onFocus={focus} onBlur={blur} style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>SIRET</label>
                    <input type="text" value={form.entreprise_siret || ''} onChange={set('entreprise_siret')} onFocus={focus} onBlur={blur} style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>N° TVA</label>
                    <input type="text" value={form.entreprise_tva || ''} onChange={set('entreprise_tva')} onFocus={focus} onBlur={blur} style={inputStyle} />
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={labelStyle}>Forme juridique</label>
                    <input type="text" value={form.entreprise_forme_juridique || ''} onChange={set('entreprise_forme_juridique')} onFocus={focus} onBlur={blur} style={inputStyle} />
                  </div>
                </div>
              ) : (
                /* Particulier fields */
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div>
                    <label style={labelStyle}>Prénom</label>
                    <input type="text" value={form.prenom || ''} onChange={set('prenom')} onFocus={focus} onBlur={blur} style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Nom</label>
                    <input type="text" value={form.nom || ''} onChange={set('nom')} onFocus={focus} onBlur={blur} style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Email</label>
                    <input type="email" value={form.email || ''} onChange={set('email')} onFocus={focus} onBlur={blur} style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Téléphone</label>
                    <input type="tel" value={form.telephone || ''} onChange={set('telephone')} onFocus={focus} onBlur={blur} style={inputStyle} />
                  </div>
                </div>
              )}
            </div>
          ) : isEntreprise ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div style={{ gridColumn: '1 / -1' }}><ReadRow label="Raison sociale" value={client.entreprise_nom} /></div>
              <ReadRow label="SIRET" value={client.entreprise_siret} />
              <ReadRow label="N° TVA" value={client.entreprise_tva} />
              <div style={{ gridColumn: '1 / -1' }}><ReadRow label="Forme juridique" value={client.entreprise_forme_juridique} /></div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <ReadRow label="Prénom" value={client.prenom} />
              <ReadRow label="Nom" value={client.nom} />
              <ReadRow label="Email" value={client.email} />
              <ReadRow label="Téléphone" value={client.telephone} />
            </div>
          )}
        </Card>

        {/* Contact (entreprise only) */}
        {(editing ? formIsEntreprise : isEntreprise) && (
          <Card title="Contact principal">
            {editing ? (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={labelStyle}>Prénom</label>
                  <input type="text" value={form.contact_prenom || ''} onChange={set('contact_prenom')} onFocus={focus} onBlur={blur} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Nom</label>
                  <input type="text" value={form.contact_nom || ''} onChange={set('contact_nom')} onFocus={focus} onBlur={blur} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Email</label>
                  <input type="email" value={form.contact_email || ''} onChange={set('contact_email')} onFocus={focus} onBlur={blur} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Téléphone</label>
                  <input type="tel" value={form.contact_telephone || ''} onChange={set('contact_telephone')} onFocus={focus} onBlur={blur} style={inputStyle} />
                </div>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <ReadRow label="Prénom" value={client.contact_prenom} />
                <ReadRow label="Nom" value={client.contact_nom} />
                <ReadRow label="Email" value={client.contact_email} />
                <ReadRow label="Téléphone" value={client.contact_telephone} />
              </div>
            )}
          </Card>
        )}

        {/* Adresse */}
        <Card title="Adresse">
          {editing ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <AdresseField
                value={form.adresse || ''}
                onChange={set('adresse')}
                onSelect={(label, postcode, city) => setForm(p => ({ ...p, adresse: label, code_postal: postcode, ville: city }))}
              />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
                <div>
                  <label style={labelStyle}>Code postal</label>
                  <input type="text" value={form.code_postal || ''} onChange={set('code_postal')} onFocus={focus} onBlur={blur} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Ville</label>
                  <input type="text" value={form.ville || ''} onChange={set('ville')} onFocus={focus} onBlur={blur} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Pays</label>
                  <input type="text" value={form.pays || ''} onChange={set('pays')} onFocus={focus} onBlur={blur} style={inputStyle} />
                </div>
              </div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
              <div style={{ gridColumn: '1 / -1' }}><ReadRow label="Adresse" value={client.adresse} /></div>
              <ReadRow label="Code postal" value={client.code_postal} />
              <ReadRow label="Ville" value={client.ville} />
              <ReadRow label="Pays" value={client.pays} />
            </div>
          )}
        </Card>

        {/* Notes */}
        <Card title="Notes">
          {editing ? (
            <>
              <label style={labelStyle}>Notes internes</label>
              <textarea value={form.notes || ''} onChange={set('notes')} onFocus={focus} onBlur={blur} rows={3} style={{ ...inputStyle, resize: 'vertical' } as React.CSSProperties} />
            </>
          ) : (
            <p style={client.notes ? readValueStyle : readMutedStyle}>{client.notes || 'Aucune note'}</p>
          )}
        </Card>

        {/* Documents liés */}
        <Card title="Documents liés">
          {loadingDocs ? (
            <p style={readMutedStyle}>Chargement…</p>
          ) : docs.length === 0 ? (
            <p style={readMutedStyle}>Aucun document lié à ce client.</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['Numéro', 'Type', 'Montant TTC', 'Statut', 'Date'].map(h => (
                    <th key={h} style={{ padding: '8px 12px', fontSize: 10, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#7A7870', fontFamily: 'var(--font-dm-sans), sans-serif', textAlign: 'left', borderBottom: '1px solid #1E1E1C' }}>{h}</th>
                  ))}
                  <th style={{ padding: '8px 12px', borderBottom: '1px solid #1E1E1C' }} />
                </tr>
              </thead>
              <tbody>
                {docs.map(d => {
                  const statutMap = d.type === 'devis' ? DEVIS_STATUT : FACTURE_STATUT
                  const s = statutMap[d.statut] ?? { label: d.statut, color: '#8A8880' }
                  const href = `/dashboard/documents/${d.type === 'devis' ? 'devis' : 'factures'}/${d.id}`
                  return (
                    <tr key={`${d.type}-${d.id}`}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(249,115,22,0.04)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <td style={{ padding: '10px 12px', fontSize: 12, fontFamily: 'var(--font-syne), sans-serif', fontWeight: 600, color: '#F0EDE6', borderBottom: '1px solid #1E1E1C' }}>{d.numero}</td>
                      <td style={{ padding: '10px 12px', fontSize: 12, fontFamily: 'var(--font-dm-sans), sans-serif', color: '#8A8880', borderBottom: '1px solid #1E1E1C', textTransform: 'capitalize' }}>{d.type}</td>
                      <td style={{ padding: '10px 12px', fontSize: 13, fontFamily: 'var(--font-dm-sans), sans-serif', fontWeight: 600, color: '#ea580c', borderBottom: '1px solid #1E1E1C' }}>{formatEurDoc(d.montant_ttc)}</td>
                      <td style={{ padding: '10px 12px', borderBottom: '1px solid #1E1E1C' }}>
                        <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20, color: s.color, backgroundColor: `${s.color}22`, fontFamily: 'var(--font-dm-sans), sans-serif' }}>{s.label}</span>
                      </td>
                      <td style={{ padding: '10px 12px', fontSize: 12, color: '#8A8880', fontFamily: 'var(--font-dm-sans), sans-serif', borderBottom: '1px solid #1E1E1C' }}>{fmtDate(d.date)}</td>
                      <td style={{ padding: '10px 12px', borderBottom: '1px solid #1E1E1C' }}>
                        <Link href={href} style={{ fontSize: 12, color: '#ea580c', textDecoration: 'none', fontFamily: 'var(--font-dm-sans), sans-serif' }}>Voir →</Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </Card>
      </div>
    </div>
  )
}
