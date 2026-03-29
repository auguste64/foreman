'use client'

import { useEffect, useState } from 'react'
import { FileText, Download, Mail, AlertCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from '@/components/Toast'
import type { CgvProfile } from '@/lib/pdf/cgv'

type DocCard = {
  id: 'cgv' | 'contrat-moe'
  title: string
  description: string
}

const docs: DocCard[] = [
  {
    id: 'cgv',
    title: 'Conditions Générales de Prestation',
    description: 'CGP pré-remplies avec les informations de votre société — Maîtrise d\'œuvre',
  },
  {
    id: 'contrat-moe',
    title: 'Contrat MOE',
    description: 'Modèle de contrat de maîtrise d\'œuvre pré-rempli avec vos coordonnées',
  },
]

export default function DocumentsPage() {
  const [profile, setProfile] = useState<CgvProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState<string | null>(null)
  const [sending, setSending] = useState<string | null>(null)
  const [emailTo, setEmailTo] = useState('')
  const [showEmailInput, setShowEmailInput] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      if (data) {
        setProfile({
          societe: data.societe || data.entreprise || '',
          prenom: data.prenom,
          nom: data.nom,
          adresse: data.adresse,
          ville: data.ville,
          code_postal: data.code_postal,
          telephone: data.telephone,
          email: data.email || user.email,
          siret: data.siret,
          code_ape: data.code_ape,
          tva_intracom: data.tva_intracom,
          assurance_nom: data.assurance_nom,
          assurance_contrat: data.assurance_contrat,
        })
        setEmailTo(data.email || user.email || '')
      }
      setLoading(false)
    }
    load()
  }, [])

  async function handleDownload(docId: string) {
    if (!profile) return
    setDownloading(docId)
    try {
      const { pdf } = await import('@react-pdf/renderer')
      let element: React.ReactElement

      if (docId === 'cgv') {
        const { CgvDocument } = await import('@/lib/pdf/cgv')
        element = <CgvDocument profile={profile} />
      } else {
        const { ContratMoeDocument } = await import('@/lib/pdf/contrat-moe-template')
        element = <ContratMoeDocument profile={profile} />
      }

      const blob = await pdf(element).toBlob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      const filename = docId === 'cgv'
        ? `CGV_${(profile.societe || 'Document').replace(/\s+/g, '_')}.pdf`
        : `Contrat_MOE_${(profile.societe || 'Document').replace(/\s+/g, '_')}.pdf`
      a.href = url
      a.download = filename
      a.click()
      URL.revokeObjectURL(url)
      toast.success('PDF téléchargé')
    } catch (err) {
      console.error(err)
      toast.error('Erreur lors de la génération du PDF')
    } finally {
      setDownloading(null)
    }
  }

  async function handleSendEmail(docId: string) {
    if (!emailTo.trim()) return
    setSending(docId)
    try {
      const route = docId === 'cgv' ? '/api/send-cgv' : '/api/send-contrat-moe'
      const res = await fetch(route, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: emailTo.trim() }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Erreur')
      toast.success(`Document envoyé à ${emailTo}`)
      setShowEmailInput(null)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erreur envoi email')
    } finally {
      setSending(null)
    }
  }

  const missingFields = profile && !profile.societe

  return (
    <div className="page-enter" style={{ flex: 1, padding: '40px', overflowY: 'auto', maxWidth: '720px' }}>
      <div style={{ marginBottom: '40px' }}>
        <h1 style={{ fontFamily: 'var(--font-syne), sans-serif', fontSize: '24px', fontWeight: 700, color: '#F0EDE6', margin: 0 }}>
          Documents
        </h1>
        <p style={{ color: '#8A8880', fontSize: '14px', marginTop: '6px', fontFamily: 'var(--font-dm-sans), sans-serif' }}>
          Générez et envoyez vos documents contractuels pré-remplis
        </p>
      </div>

      {loading ? (
        <p style={{ color: '#8A8880', fontSize: '14px', fontFamily: 'var(--font-dm-sans), sans-serif' }}>Chargement…</p>
      ) : (
        <>
          {missingFields && (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', backgroundColor: 'rgba(234,88,12,0.08)', border: '1px solid rgba(234,88,12,0.2)', borderRadius: '10px', padding: '16px', marginBottom: '24px' }}>
              <AlertCircle size={16} color="#ea580c" style={{ flexShrink: 0, marginTop: '1px' }} />
              <p style={{ fontSize: '13px', color: '#F0EDE6', fontFamily: 'var(--font-dm-sans), sans-serif', margin: 0, lineHeight: 1.5 }}>
                Votre profil est incomplet. Renseignez le nom de votre société dans{' '}
                <a href="/dashboard/parametres" style={{ color: '#ea580c', textDecoration: 'underline' }}>Paramètres</a>{' '}
                pour générer des documents personnalisés.
              </p>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {docs.map(doc => (
              <div
                key={doc.id}
                style={{ backgroundColor: '#111110', border: '1px solid #1E1E1C', borderRadius: '12px', padding: '24px' }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', marginBottom: '20px' }}>
                  <div style={{ width: '40px', height: '40px', backgroundColor: 'rgba(234,88,12,0.1)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <FileText size={18} color="#ea580c" />
                  </div>
                  <div>
                    <h3 style={{ fontFamily: 'var(--font-syne), sans-serif', fontSize: '15px', fontWeight: 600, color: '#F0EDE6', margin: '0 0 4px' }}>
                      {doc.title}
                    </h3>
                    <p style={{ fontFamily: 'var(--font-dm-sans), sans-serif', fontSize: '13px', color: '#8A8880', margin: 0, lineHeight: 1.5 }}>
                      {doc.description}
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' as const }}>
                  <button
                    onClick={() => handleDownload(doc.id)}
                    disabled={downloading === doc.id || !profile}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '8px',
                      padding: '9px 18px', backgroundColor: '#ea580c', color: '#0D0D0B',
                      border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 600,
                      cursor: downloading === doc.id || !profile ? 'not-allowed' : 'pointer',
                      opacity: !profile ? 0.5 : 1,
                      fontFamily: 'var(--font-dm-sans), sans-serif', transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={e => { if (!downloading && profile) { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 0 16px rgba(234,88,12,0.35)' } }}
                    onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}
                  >
                    <Download size={14} />
                    {downloading === doc.id ? 'Génération…' : 'Télécharger PDF'}
                  </button>

                  <button
                    onClick={() => setShowEmailInput(showEmailInput === doc.id ? null : doc.id)}
                    disabled={!profile}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '8px',
                      padding: '9px 18px', backgroundColor: 'transparent', color: '#F0EDE6',
                      border: '1px solid #1E1E1C', borderRadius: '8px', fontSize: '13px', fontWeight: 500,
                      cursor: !profile ? 'not-allowed' : 'pointer',
                      opacity: !profile ? 0.5 : 1,
                      fontFamily: 'var(--font-dm-sans), sans-serif', transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={e => { if (profile) { e.currentTarget.style.borderColor = '#ea580c'; e.currentTarget.style.color = '#ea580c' } }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = '#1E1E1C'; e.currentTarget.style.color = '#F0EDE6' }}
                  >
                    <Mail size={14} />
                    Envoyer par mail
                  </button>
                </div>

                {showEmailInput === doc.id && (
                  <div style={{ marginTop: '16px', display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' as const }}>
                    <input
                      type="email"
                      value={emailTo}
                      onChange={e => setEmailTo(e.target.value)}
                      placeholder="destinataire@exemple.fr"
                      style={{
                        flex: 1, minWidth: '220px', padding: '9px 14px',
                        backgroundColor: '#0D0D0B', border: '1px solid #1E1E1C', borderRadius: '8px',
                        color: '#F0EDE6', fontSize: '13px', outline: 'none',
                        fontFamily: 'var(--font-dm-sans), sans-serif', boxSizing: 'border-box' as const,
                      }}
                      onFocus={e => { e.target.style.borderColor = '#ea580c'; e.target.style.boxShadow = '0 0 0 2px rgba(249,115,22,0.12)' }}
                      onBlur={e => { e.target.style.borderColor = '#1E1E1C'; e.target.style.boxShadow = 'none' }}
                    />
                    <button
                      onClick={() => handleSendEmail(doc.id)}
                      disabled={sending === doc.id || !emailTo.trim()}
                      style={{
                        padding: '9px 18px', backgroundColor: '#ea580c', color: '#0D0D0B',
                        border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 600,
                        cursor: sending === doc.id || !emailTo.trim() ? 'not-allowed' : 'pointer',
                        fontFamily: 'var(--font-dm-sans), sans-serif',
                      }}
                    >
                      {sending === doc.id ? 'Envoi…' : 'Envoyer'}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
