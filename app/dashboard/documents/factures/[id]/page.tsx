'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { getFactureDoc, formatEurDoc, fmtDate } from '@/lib/supabase/documents'
import type { FactureDoc, FactureLigneDoc } from '@/lib/supabase/documents'
import { toast } from '@/components/Toast'
import CustomSelect from '@/components/CustomSelect'
import UpgradeGate from '@/components/UpgradeGate'
import { usePlan } from '@/lib/usePlan'

const FACTURE_STATUT: Record<string, { label: string; bg: string; color: string }> = {
  brouillon:           { label: 'Brouillon',    bg: 'rgba(138,136,128,0.15)', color: '#8A8880' },
  envoyee:             { label: 'Envoyée',      bg: 'rgba(96,165,250,0.15)',  color: '#60a5fa' },
  partiellement_payee: { label: 'Part. payée',  bg: 'rgba(249,115,22,0.15)',  color: '#ea580c' },
  payee:               { label: 'Payée',        bg: 'rgba(74,222,128,0.15)',  color: '#4ade80' },
  annulee:             { label: 'Annulée',      bg: 'rgba(232,84,71,0.15)',   color: '#E85447' },
}

const MODE_PAIEMENT = ['virement', 'chèque', 'espèces', 'carte']

export default function FactureDetailPage() {
  const params = useParams()
  const id = params.id as string
  const router = useRouter()

  const [facture, setFacture] = useState<FactureDoc | null>(null)
  const [lignes, setLignes] = useState<FactureLigneDoc[]>([])
  const [loading, setLoading] = useState(true)
  const [showEmail, setShowEmail] = useState(false)
  const [showPaiement, setShowPaiement] = useState(false)
  const [showConfirmDelete, setShowConfirmDelete] = useState(false)
  const [emailForm, setEmailForm] = useState({ to: '', subject: '', body: '' })
  const [sending, setSending] = useState(false)
  const [paiementForm, setPaiementForm] = useState({ date_paiement: new Date().toISOString().split('T')[0], montant: '', mode_paiement: 'virement' })
  const [savingPaiement, setSavingPaiement] = useState(false)
  const { isComplet, loading: planLoading } = usePlan()

  useEffect(() => {
    getFactureDoc(id).then(f => {
      setFacture(f)
      setLignes(f.lignes)
      setEmailForm({
        to: f.client_email || '',
        subject: `Facture ${f.numero}${f.objet ? ` — ${f.objet}` : ''}`,
        body: `Bonjour,\n\nVeuillez trouver ci-joint la facture ${f.numero}.\n\nCordialement`,
      })
      setPaiementForm(p => ({ ...p, montant: String(Math.max(0, (f.total_ttc ?? 0) - (f.montant_paye ?? 0)).toFixed(2)) }))
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [id])

  async function handleStatut(statut: string) {
    if (!facture) return
    const supabase = createClient()
    await supabase.from('factures').update({ statut }).eq('id', id)
    setFacture(p => p ? { ...p, statut: statut as FactureDoc['statut'] } : p)
    toast.success('Statut mis à jour')
  }

  async function handleDelete() {
    const supabase = createClient()
    await supabase.from('factures').delete().eq('id', id)
    toast.success('Facture supprimée')
    router.push('/dashboard/documents')
  }

  async function handleSendEmail() {
    if (!emailForm.to || !emailForm.subject) return
    setSending(true)
    try {
      const res = await fetch('/api/send-document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'facture', id, to: emailForm.to, subject: emailForm.subject, body: emailForm.body }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success('Email envoyé')
      setShowEmail(false)
      if (facture?.statut === 'brouillon') {
        setFacture(p => p ? { ...p, statut: 'envoyee', envoye_at: new Date().toISOString() } : p)
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erreur envoi')
    } finally {
      setSending(false)
    }
  }

  async function handlePointerPaiement() {
    if (!facture) return
    const montant = parseFloat(paiementForm.montant) || 0
    if (montant <= 0) { toast.error('Montant invalide'); return }
    setSavingPaiement(true)
    try {
      const supabase = createClient()
      const newMontantPaye = (facture.montant_paye ?? 0) + montant
      const newStatut = newMontantPaye >= (facture.total_ttc ?? 0) ? 'payee' : 'partiellement_payee'
      await supabase.from('factures').update({
        montant_paye: newMontantPaye,
        statut: newStatut,
        date_paiement: paiementForm.date_paiement,
        mode_paiement: paiementForm.mode_paiement,
      }).eq('id', id)
      setFacture(p => p ? { ...p, montant_paye: newMontantPaye, statut: newStatut as FactureDoc['statut'], date_paiement: paiementForm.date_paiement, mode_paiement: paiementForm.mode_paiement } : p)
      toast.success('Paiement enregistré')
      setShowPaiement(false)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erreur')
    } finally {
      setSavingPaiement(false)
    }
  }

  if (loading) return <div style={{ flex: 1, padding: 40 }}><p style={{ color: '#8A8880', fontFamily: 'var(--font-dm-sans), sans-serif' }}>Chargement…</p></div>
  if (planLoading) return null
  if (!isComplet) return <UpgradeGate feature="Comptabilité (devis & factures)" requiredPlan="complet" />
  if (!facture) return <div style={{ flex: 1, padding: 40 }}><p style={{ color: '#E85447', fontFamily: 'var(--font-dm-sans), sans-serif' }}>Facture introuvable.</p></div>

  const statut = FACTURE_STATUT[facture.statut] ?? { label: facture.statut, bg: 'rgba(138,136,128,0.15)', color: '#8A8880' }
  const reste = Math.max(0, (facture.total_ttc ?? 0) - (facture.montant_paye ?? 0))
  const progressPct = facture.total_ttc ? Math.min(100, ((facture.montant_paye ?? 0) / facture.total_ttc) * 100) : 0

  return (
    <div className="page-enter" style={{ flex: 1, padding: '40px', overflowY: 'auto', maxWidth: 900 }}>
      <Link href="/dashboard/documents" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, backgroundColor: '#111110', border: '1px solid #1E1E1C', borderRadius: 8, padding: '8px 14px', color: '#F0EDE6', fontSize: 13, fontWeight: 500, cursor: 'pointer', textDecoration: 'none', transition: 'all 0.15s ease', fontFamily: 'var(--font-dm-sans), sans-serif', marginBottom: 24 }}
        onMouseEnter={e => { e.currentTarget.style.background = '#1E1E1C'; e.currentTarget.style.borderColor = '#ea580c'; e.currentTarget.style.color = '#ea580c' }}
        onMouseLeave={e => { e.currentTarget.style.background = '#111110'; e.currentTarget.style.borderColor = '#1E1E1C'; e.currentTarget.style.color = '#F0EDE6' }}
      >
        <span style={{ color: '#ea580c' }}>←</span>
        Retour aux documents
      </Link>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
            <h1 style={{ fontFamily: 'var(--font-syne), sans-serif', fontSize: 22, fontWeight: 700, color: '#F0EDE6', margin: 0 }}>{facture.numero}</h1>
            <span style={{ padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600, backgroundColor: statut.bg, color: statut.color, fontFamily: 'var(--font-dm-sans), sans-serif' }}>{statut.label}</span>
          </div>
          {facture.objet && <p style={{ color: '#8A8880', fontSize: 13, fontFamily: 'var(--font-dm-sans), sans-serif', margin: 0 }}>{facture.objet}</p>}
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <a href={`/api/documents-pdf?type=facture&id=${id}`} target="_blank" rel="noreferrer" style={btnOutline}>PDF</a>
          <button onClick={() => setShowEmail(true)} style={btnOutline}>Email</button>
          <button onClick={() => setShowPaiement(true)} style={{ ...btnPrimary, backgroundColor: '#4ade80', color: '#0D0D0B' }}>Enregistrer un paiement</button>
          <Link href={`/dashboard/documents/avoirs/nouveau/${id}`} style={btnOutline}>Émettre avoir</Link>
          <button onClick={() => setShowConfirmDelete(true)} style={btnDanger}>Supprimer</button>
        </div>
      </div>

      {/* Statut */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <span style={{ fontSize: 12, color: '#8A8880', fontFamily: 'var(--font-dm-sans), sans-serif' }}>Statut :</span>
        <div style={{ width: 200 }}>
          <CustomSelect
            value={facture.statut}
            onChange={handleStatut}
            options={Object.entries(FACTURE_STATUT).map(([v, s]) => ({ value: v, label: s.label, color: s.color }))}
            compact
          />
        </div>
        {facture.envoye_at && <span style={{ fontSize: 11, color: '#8A8880', fontFamily: 'var(--font-dm-sans), sans-serif' }}>Envoyée le {fmtDate(facture.envoye_at)}</span>}
      </div>

      {/* Payment summary */}
      <div style={{ backgroundColor: '#111110', border: '1px solid #1E1E1C', borderRadius: 12, padding: 20, marginBottom: 20 }}>
        <h3 style={{ fontFamily: 'var(--font-syne), sans-serif', fontSize: 13, fontWeight: 600, color: '#F0EDE6', margin: '0 0 14px' }}>Suivi du paiement</h3>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
          <span style={{ fontSize: 13, color: '#8A8880', fontFamily: 'var(--font-dm-sans), sans-serif' }}>Encaissé : <strong style={{ color: '#4ade80' }}>{formatEurDoc(facture.montant_paye ?? 0)}</strong></span>
          <span style={{ fontSize: 13, color: '#8A8880', fontFamily: 'var(--font-dm-sans), sans-serif' }}>Restant : <strong style={{ color: reste > 0 ? '#E85447' : '#4ade80' }}>{formatEurDoc(reste)}</strong></span>
          <span style={{ fontSize: 13, color: '#8A8880', fontFamily: 'var(--font-dm-sans), sans-serif' }}>Total TTC : <strong style={{ color: '#ea580c' }}>{formatEurDoc(facture.total_ttc ?? 0)}</strong></span>
        </div>
        <div style={{ height: 6, backgroundColor: '#1E1E1C', borderRadius: 3 }}>
          <div style={{ height: 6, backgroundColor: progressPct >= 100 ? '#4ade80' : '#ea580c', borderRadius: 3, width: `${progressPct}%`, transition: 'width 0.5s ease' }} />
        </div>
        {facture.date_paiement && (
          <p style={{ fontSize: 12, color: '#8A8880', fontFamily: 'var(--font-dm-sans), sans-serif', margin: '8px 0 0' }}>
            Dernier paiement : {fmtDate(facture.date_paiement)} — {facture.mode_paiement}
          </p>
        )}
      </div>

      {/* Info grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
        <InfoCard title="Client">
          <InfoRow label="Nom" value={facture.client_nom} />
          <InfoRow label="Email" value={facture.client_email} />
          <InfoRow label="Adresse" value={facture.client_adresse} />
        </InfoCard>
        <InfoCard title="Dates">
          <InfoRow label="Émission" value={fmtDate(facture.date_emission)} />
          <InfoRow label="Échéance" value={fmtDate(facture.date_echeance)} />
          <InfoRow label="Envoyée" value={fmtDate(facture.envoye_at)} />
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

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, marginTop: 16, paddingTop: 12, borderTop: '1px solid #1E1E1C' }}>
          {facture.remise_pct > 0 && (
            <>
              <TotalRow label="Sous-total HT" value={formatEurDoc(facture.total_ht / (1 - facture.remise_pct / 100))} />
              <TotalRow label={`Remise (${facture.remise_pct}%)`} value={`- ${formatEurDoc(facture.total_ht / (1 - facture.remise_pct / 100) - facture.total_ht)}`} color="#E85447" />
            </>
          )}
          <TotalRow label="Total HT" value={formatEurDoc(facture.total_ht)} />
          <TotalRow label={`TVA (${facture.tva_taux}%)`} value={formatEurDoc(facture.total_tva)} />
          <div style={{ display: 'flex', gap: 32, fontSize: 16, fontWeight: 700, fontFamily: 'var(--font-syne), sans-serif', marginTop: 6, paddingTop: 8, borderTop: '1px solid #1E1E1C' }}>
            <span style={{ color: '#F0EDE6' }}>Total TTC</span>
            <span style={{ color: '#ea580c', minWidth: 120, textAlign: 'right' }}>{formatEurDoc(facture.total_ttc)}</span>
          </div>
        </div>
      </div>

      {/* Notes */}
      {(facture.notes || facture.conditions) && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
          {facture.notes && <InfoCard title="Notes"><p style={{ fontSize: 13, color: '#F0EDE6', fontFamily: 'var(--font-dm-sans), sans-serif', margin: 0, whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>{facture.notes}</p></InfoCard>}
          {facture.conditions && <InfoCard title="Conditions"><p style={{ fontSize: 13, color: '#F0EDE6', fontFamily: 'var(--font-dm-sans), sans-serif', margin: 0, whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>{facture.conditions}</p></InfoCard>}
        </div>
      )}

      {/* Paiement Modal */}
      {showPaiement && (
        <Modal title="Enregistrer un paiement" onClose={() => setShowPaiement(false)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={labelStyle}>Date du paiement</label>
              <input type="date" value={paiementForm.date_paiement} onChange={e => setPaiementForm(p => ({ ...p, date_paiement: e.target.value }))} style={{ ...inputStyle, colorScheme: 'dark' }} />
            </div>
            <div>
              <label style={labelStyle}>Montant encaissé (€)</label>
              <input type="number" value={paiementForm.montant} onChange={e => setPaiementForm(p => ({ ...p, montant: e.target.value }))} style={inputStyle} min="0" step="0.01" placeholder={`Reste dû : ${formatEurDoc(reste)}`} />
            </div>
            <div>
              <label style={labelStyle}>Mode de paiement</label>
              <CustomSelect
                value={paiementForm.mode_paiement}
                onChange={v => setPaiementForm(p => ({ ...p, mode_paiement: v }))}
                options={[
                  { value: 'virement', label: 'Virement bancaire' },
                  { value: 'chèque', label: 'Chèque' },
                  { value: 'espèces', label: 'Espèces' },
                  { value: 'carte', label: 'Carte bancaire' },
                  { value: 'prélèvement', label: 'Prélèvement' },
                ]}
              />
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={handlePointerPaiement} disabled={savingPaiement} style={{ ...btnPrimary, backgroundColor: '#4ade80', opacity: savingPaiement ? 0.7 : 1 }}>{savingPaiement ? 'Enregistrement…' : 'Enregistrer'}</button>
              <button onClick={() => setShowPaiement(false)} style={btnOutline}>Annuler</button>
            </div>
          </div>
        </Modal>
      )}

      {/* Email Modal */}
      {showEmail && (
        <Modal title="Envoyer par email" onClose={() => setShowEmail(false)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div><label style={labelStyle}>Destinataire</label><input type="email" value={emailForm.to} onChange={e => setEmailForm(p => ({ ...p, to: e.target.value }))} style={inputStyle} /></div>
            <div><label style={labelStyle}>Objet</label><input type="text" value={emailForm.subject} onChange={e => setEmailForm(p => ({ ...p, subject: e.target.value }))} style={inputStyle} /></div>
            <div><label style={labelStyle}>Message</label><textarea value={emailForm.body} onChange={e => setEmailForm(p => ({ ...p, body: e.target.value }))} rows={5} style={{ ...inputStyle, resize: 'vertical' } as React.CSSProperties} /></div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={handleSendEmail} disabled={sending} style={{ ...btnPrimary, opacity: sending ? 0.7 : 1 }}>{sending ? 'Envoi…' : 'Envoyer'}</button>
              <button onClick={() => setShowEmail(false)} style={btnOutline}>Annuler</button>
            </div>
          </div>
        </Modal>
      )}

      {/* Confirm delete */}
      {showConfirmDelete && (
        <Modal title="Supprimer cette facture ?" onClose={() => setShowConfirmDelete(false)}>
          <p style={{ fontSize: 13, color: '#8A8880', fontFamily: 'var(--font-dm-sans), sans-serif', marginBottom: 20 }}>Cette action est irréversible.</p>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={handleDelete} style={btnDanger}>Supprimer</button>
            <button onClick={() => setShowConfirmDelete(false)} style={btnOutline}>Annuler</button>
          </div>
        </Modal>
      )}
    </div>
  )
}

const btnPrimary: React.CSSProperties = { padding: '8px 16px', backgroundColor: '#ea580c', color: '#0D0D0B', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-dm-sans), sans-serif' }
const btnOutline: React.CSSProperties = { padding: '8px 16px', backgroundColor: 'transparent', color: '#F0EDE6', border: '1px solid #1E1E1C', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'var(--font-dm-sans), sans-serif', textDecoration: 'none', display: 'inline-block' }
const btnDanger: React.CSSProperties = { padding: '8px 16px', backgroundColor: 'rgba(232,84,71,0.1)', color: '#E85447', border: '1px solid rgba(232,84,71,0.2)', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-dm-sans), sans-serif' }
const inputStyle: React.CSSProperties = { width: '100%', padding: '10px 14px', backgroundColor: '#0D0D0B', border: '1px solid #1E1E1C', borderRadius: 8, color: '#F0EDE6', fontSize: 14, outline: 'none', fontFamily: 'var(--font-dm-sans), sans-serif', boxSizing: 'border-box' }
const labelStyle: React.CSSProperties = { display: 'block', fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#8A8880', marginBottom: 6, fontFamily: 'var(--font-dm-sans), sans-serif' }

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
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={onClose}>
      <div style={{ backgroundColor: '#111110', border: '1px solid #1E1E1C', borderRadius: 16, padding: 32, width: '100%', maxWidth: 480, boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }} onClick={e => e.stopPropagation()}>
        <h2 style={{ fontFamily: 'var(--font-syne), sans-serif', fontSize: 18, fontWeight: 700, color: '#F0EDE6', margin: '0 0 20px' }}>{title}</h2>
        {children}
      </div>
    </div>
  )
}
