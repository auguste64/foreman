'use client'

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { getDevisDoc, createFactureDoc, formatEurDoc, fmtDate, calcTotauxDoc } from '@/lib/supabase/documents'
import type { DevisDoc, DevisLigneDoc } from '@/lib/supabase/documents'
import { useToast } from '@/components/ToastProvider'
import CustomSelect from '@/components/CustomSelect'

const DEVIS_STATUT: Record<string, { label: string; bg: string; color: string }> = {
  brouillon: { label: 'Brouillon', bg: 'rgba(138,136,128,0.15)', color: '#8A8880' },
  envoye:    { label: 'Envoyé',    bg: 'rgba(96,165,250,0.15)',  color: '#60a5fa' },
  accepte:   { label: 'Accepté',  bg: 'rgba(74,222,128,0.15)',  color: '#4ade80' },
  refuse:    { label: 'Refusé',   bg: 'rgba(232,84,71,0.15)',   color: '#E85447' },
  expire:    { label: 'Expiré',   bg: 'rgba(249,115,22,0.15)',  color: '#F97316' },
}

export default function DevisDetailPage() {
  const params = useParams()
  const id = params.id as string
  const router = useRouter()
  const { showToast } = useToast()

  const [devis, setDevis] = useState<DevisDoc | null>(null)
  const [lignes, setLignes] = useState<DevisLigneDoc[]>([])
  const [loading, setLoading] = useState(true)
  const [converting, setConverting] = useState(false)
  const [showEmail, setShowEmail] = useState(false)
  const [showConfirmDelete, setShowConfirmDelete] = useState(false)
  const [emailForm, setEmailForm] = useState({ to: '', subject: '', body: '' })
  const [sending, setSending] = useState(false)

  useEffect(() => {
    getDevisDoc(id).then(d => {
      setDevis(d)
      setLignes(d.lignes)
      setEmailForm(p => ({
        ...p,
        to: d.client_email || '',
        subject: `Devis ${d.numero}${d.objet ? ` — ${d.objet}` : ''}`,
        body: `Bonjour,\n\nVeuillez trouver ci-joint le devis ${d.numero}.\n\nCordialement`,
      }))
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [id])

  async function handleConvertirFacture() {
    if (!devis) return
    setConverting(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Non authentifié')
      const { count } = await supabase.from('factures').select('*', { count: 'exact', head: true }).eq('user_id', user.id)
      const annee = new Date().getFullYear()
      const numero = `FACT-${annee}-${(count || 0) + 1}`
      const in30 = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]
      const fid = await createFactureDoc({
        devis_id: devis.id,
        chantier_id: devis.chantier_id,
        numero,
        statut: 'brouillon',
        client_nom: devis.client_nom,
        client_email: devis.client_email,
        client_adresse: devis.client_adresse,
        objet: devis.objet,
        date_emission: new Date().toISOString().split('T')[0],
        date_echeance: in30,
        tva_taux: devis.tva_taux,
        remise_pct: devis.remise_pct,
        notes: devis.notes,
        conditions: devis.conditions,
        total_ht: devis.total_ht,
        total_tva: devis.total_tva,
        total_ttc: devis.total_ttc,
        montant_paye: 0,
        date_paiement: null,
        mode_paiement: null,
        envoye_at: null,
        lignes: lignes.map(l => ({ libelle: l.libelle, quantite: l.quantite, unite: l.unite, prix_unitaire: l.prix_unitaire, tva_taux: l.tva_taux })),
      })
      await supabase.from('devis').update({ statut: 'accepte' }).eq('id', devis.id)
      showToast('Facture créée')
      router.push(`/dashboard/documents/factures/${fid}`)
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Erreur')
      setConverting(false)
    }
  }

  async function handleStatut(statut: string) {
    if (!devis) return
    const supabase = createClient()
    await supabase.from('devis').update({ statut }).eq('id', devis.id)
    setDevis(p => p ? { ...p, statut: statut as DevisDoc['statut'] } : p)
    showToast('Statut mis à jour')
  }

  async function handleDelete() {
    const supabase = createClient()
    await supabase.from('devis').delete().eq('id', id)
    showToast('Devis supprimé')
    router.push('/dashboard/documents')
  }

  async function handleSendEmail() {
    if (!emailForm.to || !emailForm.subject) return
    setSending(true)
    try {
      const res = await fetch('/api/send-document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'devis', id, to: emailForm.to, subject: emailForm.subject, body: emailForm.body }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      showToast('Email envoyé')
      setShowEmail(false)
      if (devis?.statut === 'brouillon') {
        setDevis(p => p ? { ...p, statut: 'envoye', envoye_at: new Date().toISOString() } : p)
      }
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Erreur envoi')
    } finally {
      setSending(false)
    }
  }

  if (loading) return <div style={{ flex: 1, padding: 40 }}><p style={{ color: '#8A8880', fontFamily: 'var(--font-dm-sans), sans-serif' }}>Chargement…</p></div>
  if (!devis) return <div style={{ flex: 1, padding: 40 }}><p style={{ color: '#E85447', fontFamily: 'var(--font-dm-sans), sans-serif' }}>Devis introuvable.</p></div>

  const statut = DEVIS_STATUT[devis.statut] ?? { label: devis.statut, bg: 'rgba(138,136,128,0.15)', color: '#8A8880' }

  return (
    <div className="page-enter" style={{ flex: 1, padding: '40px', overflowY: 'auto', maxWidth: 900 }}>
      <Link href="/dashboard/documents" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, backgroundColor: '#111110', border: '1px solid #1E1E1C', borderRadius: 8, padding: '8px 14px', color: '#F0EDE6', fontSize: 13, fontWeight: 500, cursor: 'pointer', textDecoration: 'none', transition: 'all 0.15s ease', fontFamily: 'var(--font-dm-sans), sans-serif', marginBottom: 24 }}
        onMouseEnter={e => { e.currentTarget.style.background = '#1E1E1C'; e.currentTarget.style.borderColor = '#F97316'; e.currentTarget.style.color = '#F97316' }}
        onMouseLeave={e => { e.currentTarget.style.background = '#111110'; e.currentTarget.style.borderColor = '#1E1E1C'; e.currentTarget.style.color = '#F0EDE6' }}
      >
        <span style={{ color: '#F97316' }}>←</span>
        Retour aux documents
      </Link>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
            <h1 style={{ fontFamily: 'var(--font-syne), sans-serif', fontSize: 22, fontWeight: 700, color: '#F0EDE6', margin: 0 }}>{devis.numero}</h1>
            <span style={{ padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600, backgroundColor: statut.bg, color: statut.color, fontFamily: 'var(--font-dm-sans), sans-serif' }}>{statut.label}</span>
          </div>
          {devis.objet && <p style={{ color: '#8A8880', fontSize: 13, fontFamily: 'var(--font-dm-sans), sans-serif', margin: 0 }}>{devis.objet}</p>}
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Link href={`/dashboard/documents/devis/nouveau?edit=${id}`} style={btnOutline}>Modifier</Link>
          <a href={`/api/documents-pdf?type=devis&id=${id}`} target="_blank" rel="noreferrer" style={btnOutline}>PDF</a>
          <button onClick={() => setShowEmail(true)} style={btnOutline}>Email</button>
          <button onClick={handleConvertirFacture} disabled={converting}
            style={{ ...btnPrimary, opacity: converting ? 0.7 : 1, cursor: converting ? 'not-allowed' : 'pointer' }}>
            {converting ? 'Conversion…' : 'Convertir en facture →'}
          </button>
          <button onClick={() => setShowConfirmDelete(true)} style={btnDanger}>Supprimer</button>
        </div>
      </div>

      {/* Statut selector */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <span style={{ fontSize: 12, color: '#8A8880', fontFamily: 'var(--font-dm-sans), sans-serif' }}>Statut :</span>
        <div style={{ width: 200 }}>
          <CustomSelect
            value={devis.statut}
            onChange={handleStatut}
            options={Object.entries(DEVIS_STATUT).map(([v, s]) => ({ value: v, label: s.label, color: s.color }))}
            compact
          />
        </div>
        {devis.envoye_at && <span style={{ fontSize: 11, color: '#8A8880', fontFamily: 'var(--font-dm-sans), sans-serif' }}>Envoyé le {fmtDate(devis.envoye_at)}</span>}
      </div>

      {/* Info grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
        <InfoCard title="Client">
          <InfoRow label="Nom" value={devis.client_nom} />
          <InfoRow label="Email" value={devis.client_email} />
          <InfoRow label="Adresse" value={devis.client_adresse} />
        </InfoCard>
        <InfoCard title="Dates">
          <InfoRow label="Émission" value={fmtDate(devis.date_emission)} />
          <InfoRow label="Validité" value={fmtDate(devis.date_validite)} />
          <InfoRow label="Envoyé" value={fmtDate(devis.envoye_at)} />
          <InfoRow label="Accepté" value={fmtDate(devis.accepte_at)} />
        </InfoCard>
      </div>

      {/* Lignes */}
      <div style={{ backgroundColor: '#111110', border: '1px solid #1E1E1C', borderRadius: 12, padding: 24, marginBottom: 20 }}>
        <h2 style={{ fontFamily: 'var(--font-syne), sans-serif', fontSize: 14, fontWeight: 600, color: '#F0EDE6', margin: '0 0 16px' }}>Prestations</h2>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {['Description', 'Qté', 'Unité', 'Prix HT', 'TVA', 'Total HT'].map(h => (
                <th key={h} style={{ padding: '8px 12px', fontSize: 10, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#7A7870', textAlign: h === 'Description' ? 'left' : 'right', fontFamily: 'var(--font-dm-sans), sans-serif', borderBottom: '1px solid #1E1E1C' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {lignes.map((l, i) => (
              <tr key={i}>
                <td style={{ padding: '10px 12px', fontSize: 13, color: '#F0EDE6', fontFamily: 'var(--font-dm-sans), sans-serif', borderBottom: '1px solid #1E1E1C' }}>{l.libelle}</td>
                <td style={{ padding: '10px 12px', fontSize: 13, color: '#8A8880', textAlign: 'right', fontFamily: 'var(--font-dm-sans), sans-serif', borderBottom: '1px solid #1E1E1C' }}>{l.quantite}</td>
                <td style={{ padding: '10px 12px', fontSize: 13, color: '#8A8880', textAlign: 'right', fontFamily: 'var(--font-dm-sans), sans-serif', borderBottom: '1px solid #1E1E1C' }}>{l.unite}</td>
                <td style={{ padding: '10px 12px', fontSize: 13, color: '#F0EDE6', textAlign: 'right', fontFamily: 'var(--font-dm-sans), sans-serif', borderBottom: '1px solid #1E1E1C' }}>{formatEurDoc(l.prix_unitaire)}</td>
                <td style={{ padding: '10px 12px', fontSize: 13, color: '#8A8880', textAlign: 'right', fontFamily: 'var(--font-dm-sans), sans-serif', borderBottom: '1px solid #1E1E1C' }}>{l.tva_taux}%</td>
                <td style={{ padding: '10px 12px', fontSize: 13, fontWeight: 600, color: '#F0EDE6', textAlign: 'right', fontFamily: 'var(--font-dm-sans), sans-serif', borderBottom: '1px solid #1E1E1C' }}>{formatEurDoc(l.quantite * l.prix_unitaire)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totaux */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, marginTop: 16, paddingTop: 12, borderTop: '1px solid #1E1E1C' }}>
          {devis.remise_pct > 0 && (
            <>
              <TotalRow label="Sous-total HT" value={formatEurDoc(devis.total_ht / (1 - devis.remise_pct / 100))} />
              <TotalRow label={`Remise (${devis.remise_pct}%)`} value={`- ${formatEurDoc(devis.total_ht / (1 - devis.remise_pct / 100) - devis.total_ht)}`} color="#E85447" />
            </>
          )}
          <TotalRow label="Total HT" value={formatEurDoc(devis.total_ht)} />
          <TotalRow label={`TVA (${devis.tva_taux}%)`} value={formatEurDoc(devis.total_tva)} />
          <div style={{ display: 'flex', gap: 32, fontSize: 16, fontWeight: 700, fontFamily: 'var(--font-syne), sans-serif', marginTop: 6, paddingTop: 8, borderTop: '1px solid #1E1E1C' }}>
            <span style={{ color: '#F0EDE6' }}>Total TTC</span>
            <span style={{ color: '#F97316', minWidth: 120, textAlign: 'right' }}>{formatEurDoc(devis.total_ttc)}</span>
          </div>
        </div>
      </div>

      {/* Notes */}
      {(devis.notes || devis.conditions) && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
          {devis.notes && <InfoCard title="Notes"><p style={{ fontSize: 13, color: '#F0EDE6', fontFamily: 'var(--font-dm-sans), sans-serif', margin: 0, whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>{devis.notes}</p></InfoCard>}
          {devis.conditions && <InfoCard title="Conditions"><p style={{ fontSize: 13, color: '#F0EDE6', fontFamily: 'var(--font-dm-sans), sans-serif', margin: 0, whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>{devis.conditions}</p></InfoCard>}
        </div>
      )}

      {/* Email Modal */}
      {showEmail && (
        <Modal title="Envoyer par email" onClose={() => setShowEmail(false)}>
          <EmailForm form={emailForm} onChange={setEmailForm} onSend={handleSendEmail} onCancel={() => setShowEmail(false)} sending={sending} />
        </Modal>
      )}

      {/* Confirm delete */}
      {showConfirmDelete && (
        <Modal title="Supprimer ce devis ?" onClose={() => setShowConfirmDelete(false)}>
          <p style={{ fontSize: 13, color: '#8A8880', fontFamily: 'var(--font-dm-sans), sans-serif', marginBottom: 20 }}>
            Cette action est irréversible.
          </p>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={handleDelete} style={btnDanger}>Supprimer</button>
            <button onClick={() => setShowConfirmDelete(false)} style={btnOutline}>Annuler</button>
          </div>
        </Modal>
      )}
    </div>
  )
}

const btnPrimary: React.CSSProperties = { padding: '8px 16px', backgroundColor: '#F97316', color: '#0D0D0B', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-dm-sans), sans-serif' }
const btnOutline: React.CSSProperties = { padding: '8px 16px', backgroundColor: 'transparent', color: '#F0EDE6', border: '1px solid #1E1E1C', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'var(--font-dm-sans), sans-serif', textDecoration: 'none', display: 'inline-block' }
const btnDanger: React.CSSProperties = { padding: '8px 16px', backgroundColor: 'rgba(232,84,71,0.1)', color: '#E85447', border: '1px solid rgba(232,84,71,0.2)', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-dm-sans), sans-serif' }

function InfoCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ backgroundColor: '#111110', border: '1px solid #1E1E1C', borderRadius: 12, padding: 20 }}>
      <h3 style={{ fontFamily: 'var(--font-syne), sans-serif', fontSize: 12, fontWeight: 600, color: '#8A8880', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 12px' }}>{title}</h3>
      {children}
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string | null }) {
  if (!value) return null
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6, fontFamily: 'var(--font-dm-sans), sans-serif' }}>
      <span style={{ color: '#8A8880' }}>{label}</span>
      <span style={{ color: '#F0EDE6', textAlign: 'right', maxWidth: '60%' }}>{value}</span>
    </div>
  )
}

function TotalRow({ label, value, color = '#F0EDE6' }: { label: string; value: string; color?: string }) {
  return (
    <div style={{ display: 'flex', gap: 32, fontSize: 13, fontFamily: 'var(--font-dm-sans), sans-serif' }}>
      <span style={{ color: '#8A8880' }}>{label}</span>
      <span style={{ color, minWidth: 120, textAlign: 'right' }}>{value}</span>
    </div>
  )
}

function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
      onClick={onClose}
    >
      <div style={{ backgroundColor: '#111110', border: '1px solid #1E1E1C', borderRadius: 16, padding: 32, width: '100%', maxWidth: 480, boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}
        onClick={e => e.stopPropagation()}
      >
        <h2 style={{ fontFamily: 'var(--font-syne), sans-serif', fontSize: 18, fontWeight: 700, color: '#F0EDE6', margin: '0 0 20px' }}>{title}</h2>
        {children}
      </div>
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 14px', backgroundColor: '#0D0D0B',
  border: '1px solid #1E1E1C', borderRadius: 8, color: '#F0EDE6',
  fontSize: 14, outline: 'none', fontFamily: 'var(--font-dm-sans), sans-serif', boxSizing: 'border-box',
}
const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 11, fontWeight: 600, letterSpacing: '0.08em',
  textTransform: 'uppercase', color: '#8A8880', marginBottom: 6, fontFamily: 'var(--font-dm-sans), sans-serif',
}

function EmailForm({ form, onChange, onSend, onCancel, sending }: {
  form: { to: string; subject: string; body: string }
  onChange: (f: { to: string; subject: string; body: string }) => void
  onSend: () => void
  onCancel: () => void
  sending: boolean
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div>
        <label style={labelStyle}>Destinataire</label>
        <input type="email" value={form.to} onChange={e => onChange({ ...form, to: e.target.value })} style={inputStyle} placeholder="client@example.com" />
      </div>
      <div>
        <label style={labelStyle}>Objet</label>
        <input type="text" value={form.subject} onChange={e => onChange({ ...form, subject: e.target.value })} style={inputStyle} />
      </div>
      <div>
        <label style={labelStyle}>Message</label>
        <textarea value={form.body} onChange={e => onChange({ ...form, body: e.target.value })} rows={5} style={{ ...inputStyle, resize: 'vertical' } as React.CSSProperties} />
      </div>
      <div style={{ display: 'flex', gap: 10 }}>
        <button onClick={onSend} disabled={sending} style={{ ...btnPrimary, opacity: sending ? 0.7 : 1 }}>{sending ? 'Envoi…' : 'Envoyer'}</button>
        <button onClick={onCancel} style={btnOutline}>Annuler</button>
      </div>
    </div>
  )
}
