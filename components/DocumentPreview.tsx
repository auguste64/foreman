'use client'

import { useEffect, useState } from 'react'
import { getEntrepriseInfo, formatEurDoc } from '@/lib/supabase/documents'
import type { EntrepriseInfo } from '@/lib/supabase/documents'

export interface DocLigne {
  libelle: string
  quantite: number
  unite: string
  prix_unitaire: number
  tva_taux: number
}

export interface DocTotaux {
  sousTotal: number
  ht: number
  tva: number
  ttc: number
}

export interface DocumentPreviewProps {
  type: 'devis' | 'facture' | 'acompte'
  statut?: string
  numero: string
  date_emission: string
  date_validite?: string
  date_echeance?: string
  client_nom: string
  client_email: string
  client_adresse: string
  objet: string
  chantierNom?: string
  lignes: DocLigne[]
  totaux: DocTotaux
  remise_pct: number
  tva_taux: number
  notes?: string
  conditions?: string
  documentId?: string
}

const TYPE_LABEL: Record<string, string> = {
  devis: 'DEVIS',
  facture: 'FACTURE',
  acompte: 'ACOMPTE',
}

function fmtD(d?: string | null): string {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

const FONT = 'Arial, sans-serif'

function MetaRow({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'baseline', gap: 8, marginBottom: 3 }}>
      <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: '#111111', fontFamily: FONT }}>
        {label}
      </span>
      <span style={{ fontSize: 12, color: color ?? '#333333', fontFamily: FONT, minWidth: 90, textAlign: 'right' }}>
        {value}
      </span>
    </div>
  )
}

function FooterLabel({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ margin: '0 0 12px', fontSize: 11, fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: '#111111', fontFamily: FONT, borderBottom: '2px solid #111111', paddingBottom: 8 }}>
      {children}
    </p>
  )
}

export default function DocumentPreview({
  type, statut = 'brouillon', numero, date_emission, date_validite, date_echeance,
  client_nom, client_email, client_adresse, objet, chantierNom,
  lignes, totaux, remise_pct, tva_taux, notes, conditions, documentId,
}: DocumentPreviewProps) {
  const [entreprise, setEntreprise] = useState<EntrepriseInfo | null>(null)
  const [loadingE, setLoadingE] = useState(true)

  useEffect(() => {
    getEntrepriseInfo()
      .then(info => { setEntreprise(info); setLoadingE(false) })
      .catch(() => setLoadingE(false))
  }, [])

  const isBrouillon = statut === 'brouillon'
  const isAnnule = statut === 'annulee' || statut === 'annule'
  const showBank = type === 'facture' || type === 'acompte'
  const activeLignes = lignes.filter(l => l.libelle || l.prix_unitaire > 0)

  const watermarkText = isAnnule ? 'ANNULÉ' : isBrouillon ? 'BROUILLON' : null
  const watermarkColor = isAnnule ? 'rgba(220,40,40,0.06)' : 'rgba(0,0,0,0.04)'

  return (
    <div style={{ backgroundColor: '#111110', border: '1px solid #1E1E1C', borderRadius: 12, overflow: 'hidden' }}>
      {/* Panel header */}
      <div style={{ backgroundColor: '#0D0D0B', padding: '11px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #1E1E1C' }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: '#8A8880', fontFamily: 'var(--font-dm-sans), sans-serif', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          ↻ Aperçu du document
        </span>
        {documentId && (
          <a
            href={`/api/documents-pdf?type=${type === 'acompte' ? 'facture' : type}&id=${documentId}`}
            target="_blank"
            rel="noreferrer"
            style={{ fontSize: 11, color: '#ea580c', fontFamily: 'var(--font-dm-sans), sans-serif', textDecoration: 'none', padding: '3px 10px', border: '1px solid rgba(249,115,22,0.35)', borderRadius: 5 }}
          >
            ↓ Télécharger PDF
          </a>
        )}
      </div>

      {/* Scrollable document area */}
      <div style={{ padding: '16px', overflowY: 'auto', maxHeight: 'calc(100vh - 180px)', backgroundColor: '#1A1A18' }}>
        {/* White document sheet */}
        <div style={{ backgroundColor: '#FFFFFF', borderRadius: 4, padding: '40px', color: '#111111', position: 'relative', overflow: 'hidden', boxShadow: '0 4px 24px rgba(0,0,0,0.12)', fontFamily: FONT, maxWidth: 720, margin: '0 auto' }}>

          {/* ── Watermark ── */}
          {watermarkText && (
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%) rotate(-35deg)', pointerEvents: 'none', zIndex: 0, userSelect: 'none' }}>
              <span style={{ fontSize: 120, fontWeight: 900, color: watermarkColor, letterSpacing: '8px', whiteSpace: 'nowrap', fontFamily: FONT, display: 'block' }}>
                {watermarkText}
              </span>
            </div>
          )}

          {/* All content above watermark */}
          <div style={{ position: 'relative', zIndex: 1 }}>

            {/* ── HEADER: Logo + Company | Doc type + Meta ── */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>

              {/* Left: Logo + company identity */}
              <div style={{ maxWidth: '45%' }}>
                {loadingE ? (
                  <div style={{ width: 120, height: 48, backgroundColor: '#F0F0F0', borderRadius: 3, marginBottom: 12 }} />
                ) : entreprise?.logo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={entreprise.logo_url} alt="Logo" style={{ maxHeight: 70, maxWidth: '100%', objectFit: 'contain', display: 'block', marginBottom: 12 }} />
                ) : (
                  <div style={{ width: 120, height: 48, backgroundColor: '#F0F0F0', borderRadius: 3, marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: 9, color: '#CCCCCC', letterSpacing: 2 }}>LOGO</span>
                  </div>
                )}
                {!loadingE && !entreprise?.raison_sociale ? (
                  <p style={{ fontSize: 11, color: '#AAAAAA', fontStyle: 'italic', margin: 0, lineHeight: 1.6, fontFamily: FONT }}>
                    Configurez vos infos<br />dans Paramètres documents
                  </p>
                ) : (
                  <>
                    <p style={{ margin: '0 0 2px', fontSize: 15, fontWeight: 700, color: '#111111', fontFamily: FONT }}>{entreprise?.raison_sociale}</p>
                    {entreprise?.forme_juridique && <p style={{ margin: 0, fontSize: 12, color: '#555555', fontFamily: FONT, lineHeight: 1.6 }}>{entreprise.forme_juridique}</p>}
                  </>
                )}
              </div>

              {/* Right: Document type (huge) + meta */}
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <p style={{ margin: '0 0 12px', fontSize: 72, fontWeight: 900, color: '#111111', letterSpacing: '-2px', lineHeight: 1, textTransform: 'uppercase', fontFamily: FONT }}>
                  {TYPE_LABEL[type]}
                </p>
                <MetaRow label="N°" value={numero || '—'} />
                <MetaRow label="Date" value={fmtD(date_emission)} />
                {date_validite && <MetaRow label="Validité" value={fmtD(date_validite)} />}
                {date_echeance && <MetaRow label="Échéance" value={fmtD(date_echeance)} color="#B45309" />}
                {(chantierNom || objet) && (
                  <p style={{ margin: '8px 0 0', fontSize: 11, color: '#ea580c', fontFamily: FONT, fontStyle: 'italic', textAlign: 'right' }}>
                    {[chantierNom, objet].filter(Boolean).join(' — ')}
                  </p>
                )}
              </div>
            </div>

            {/* ── Thin divider ── */}
            <div style={{ borderTop: '1px solid #DDDDDD', margin: '24px 0' }} />

            {/* ── PARTIES: Émetteur | Destinataire ── */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, paddingBottom: 24, marginBottom: 24, borderBottom: '1px solid #EEEEEE' }}>
              {/* Émetteur */}
              <div>
                <p style={{ margin: '0 0 8px', fontSize: 11, fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: '#111111', fontFamily: FONT }}>
                  Émetteur :
                </p>
                {!loadingE && entreprise ? (
                  <>
                    {entreprise.telephone && <p style={{ margin: '0 0 2px', fontSize: 12, color: '#333333', fontFamily: FONT, lineHeight: 1.6 }}>{entreprise.telephone}</p>}
                    {entreprise.email && <p style={{ margin: '0 0 2px', fontSize: 12, color: '#333333', fontFamily: FONT, lineHeight: 1.6 }}>{entreprise.email}</p>}
                    {entreprise.adresse && <p style={{ margin: '0 0 2px', fontSize: 12, color: '#333333', fontFamily: FONT, lineHeight: 1.6 }}>{entreprise.adresse}</p>}
                    {(entreprise.code_postal || entreprise.ville) && (
                      <p style={{ margin: '0 0 2px', fontSize: 12, color: '#333333', fontFamily: FONT, lineHeight: 1.6 }}>{[entreprise.code_postal, entreprise.ville].filter(Boolean).join(' ')}</p>
                    )}
                    {entreprise.siret && <p style={{ margin: '4px 0 0', fontSize: 11, color: '#888888', fontFamily: FONT, lineHeight: 1.6 }}>SIRET : {entreprise.siret}</p>}
                  </>
                ) : (
                  <p style={{ margin: 0, fontSize: 12, color: '#AAAAAA', fontFamily: FONT }}>—</p>
                )}
              </div>

              {/* Destinataire */}
              <div style={{ paddingLeft: 20, borderLeft: '3px solid #ea580c' }}>
                <p style={{ margin: '0 0 8px', fontSize: 11, fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: '#111111', fontFamily: FONT }}>
                  Destinataire :
                </p>
                <p style={{ margin: '0 0 2px', fontSize: 15, fontWeight: 700, color: '#111111', fontFamily: FONT, lineHeight: 1.4 }}>{client_nom || '—'}</p>
                {client_email && <p style={{ margin: '0 0 2px', fontSize: 12, color: '#333333', fontFamily: FONT, lineHeight: 1.6 }}>{client_email}</p>}
                {client_adresse && <p style={{ margin: 0, fontSize: 12, color: '#333333', fontFamily: FONT, lineHeight: 1.6 }}>{client_adresse}</p>}
              </div>
            </div>

            {/* ── ITEMS TABLE ── */}
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 20 }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #111111' }}>
                  <th style={{ padding: '10px 8px', textAlign: 'left', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.5px', color: '#111111', fontFamily: FONT }}>
                    Description
                  </th>
                  <th style={{ padding: '10px 8px', textAlign: 'right', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.5px', color: '#111111', fontFamily: FONT, width: 44 }}>
                    Qté
                  </th>
                  <th style={{ padding: '10px 8px', textAlign: 'right', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.5px', color: '#111111', fontFamily: FONT, width: 44 }}>
                    Unité
                  </th>
                  <th style={{ padding: '10px 8px', textAlign: 'right', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.5px', color: '#111111', fontFamily: FONT, width: 80 }}>
                    P.U. HT
                  </th>
                  <th style={{ padding: '10px 8px', textAlign: 'right', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.5px', color: '#111111', fontFamily: FONT, width: 80 }}>
                    Total HT
                  </th>
                </tr>
              </thead>
              <tbody>
                {activeLignes.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ padding: '16px 8px', textAlign: 'center', color: '#BBBBBB', fontStyle: 'italic', fontFamily: FONT, fontSize: 12 }}>
                      Aucune prestation
                    </td>
                  </tr>
                ) : activeLignes.map((l, i) => (
                  <tr key={i} style={{ backgroundColor: i % 2 === 0 ? '#FFFFFF' : '#FAFAFA' }}>
                    <td style={{ padding: '12px 8px', fontSize: 12, color: '#222222', borderBottom: '1px solid #EEEEEE', fontFamily: FONT, lineHeight: 1.6 }}>{l.libelle || '—'}</td>
                    <td style={{ padding: '12px 8px', fontSize: 12, color: '#444444', textAlign: 'right', borderBottom: '1px solid #EEEEEE', fontFamily: FONT }}>{l.quantite}</td>
                    <td style={{ padding: '12px 8px', fontSize: 12, color: '#444444', textAlign: 'right', borderBottom: '1px solid #EEEEEE', fontFamily: FONT }}>{l.unite}</td>
                    <td style={{ padding: '12px 8px', fontSize: 12, color: '#333333', textAlign: 'right', borderBottom: '1px solid #EEEEEE', fontFamily: FONT }}>{formatEurDoc(l.prix_unitaire)}</td>
                    <td style={{ padding: '12px 8px', fontSize: 12, fontWeight: 700, color: '#111111', textAlign: 'right', borderBottom: '1px solid #EEEEEE', fontFamily: FONT }}>{formatEurDoc(l.quantite * l.prix_unitaire)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* ── TOTALS BLOCK (right-aligned) ── */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 28 }}>
              <div style={{ minWidth: 240, backgroundColor: '#F9F9F9', borderRadius: 4, padding: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', paddingBottom: 6 }}>
                  <span style={{ fontSize: 13, color: '#555555', fontFamily: FONT }}>Total HT :</span>
                  <span style={{ fontSize: 13, color: '#111111', fontFamily: FONT, fontWeight: 600 }}>{formatEurDoc(totaux.ht)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', paddingBottom: 6 }}>
                  <span style={{ fontSize: 13, color: '#555555', fontFamily: FONT }}>TVA ({tva_taux}%) :</span>
                  <span style={{ fontSize: 13, color: '#111111', fontFamily: FONT, fontWeight: 600 }}>{formatEurDoc(totaux.tva)}</span>
                </div>
                {remise_pct > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', paddingBottom: 6 }}>
                    <span style={{ fontSize: 13, color: '#555555', fontFamily: FONT }}>Remise ({remise_pct}%) :</span>
                    <span style={{ fontSize: 13, color: '#E85447', fontFamily: FONT, fontWeight: 600 }}>- {formatEurDoc(totaux.sousTotal - totaux.ht)}</span>
                  </div>
                )}
                <div style={{ borderTop: '2px solid #111111', margin: '8px 0' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <span style={{ fontSize: 16, fontWeight: 800, color: '#111111', fontFamily: FONT }}>Total TTC :</span>
                  <span style={{ fontSize: 16, fontWeight: 800, color: '#ea580c', fontFamily: FONT }}>{formatEurDoc(totaux.ttc)}</span>
                </div>
              </div>
            </div>

            {/* ── FOOTER: Règlement | Termes & Conditions ── */}
            {entreprise && (
              <div style={{ borderTop: '1px solid #DDDDDD', paddingTop: 20, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48 }}>
                {/* Règlement */}
                <div>
                  <FooterLabel>Règlement :</FooterLabel>
                  {showBank && entreprise.iban ? (
                    <>
                      <p style={{ margin: '0 0 4px', fontSize: 11, color: '#555555', fontFamily: FONT, lineHeight: 1.8 }}>Par virement bancaire :</p>
                      {entreprise.banque && <p style={{ margin: '0 0 4px', fontSize: 11, color: '#555555', fontFamily: FONT, lineHeight: 1.8 }}>Banque : {entreprise.banque}</p>}
                      <p style={{ margin: '0 0 4px', fontSize: 11, color: '#555555', fontFamily: FONT, lineHeight: 1.8 }}>IBAN : {entreprise.iban}</p>
                      {entreprise.bic && <p style={{ margin: 0, fontSize: 11, color: '#555555', fontFamily: FONT, lineHeight: 1.8 }}>BIC : {entreprise.bic}</p>}
                    </>
                  ) : entreprise.conditions_paiement ? (
                    <p style={{ margin: 0, fontSize: 11, color: '#555555', fontFamily: FONT, lineHeight: 1.8 }}>{entreprise.conditions_paiement}</p>
                  ) : (
                    <p style={{ margin: 0, fontSize: 11, color: '#BBBBBB', fontFamily: FONT, lineHeight: 1.8 }}>—</p>
                  )}
                </div>

                {/* Termes & conditions */}
                <div>
                  <FooterLabel>Termes &amp; Conditions</FooterLabel>
                  {entreprise.penalites_retard && <p style={{ margin: '0 0 4px', fontSize: 11, color: '#555555', fontFamily: FONT, lineHeight: 1.8 }}>{entreprise.penalites_retard}</p>}
                  {entreprise.escompte && <p style={{ margin: '0 0 4px', fontSize: 11, color: '#555555', fontFamily: FONT, lineHeight: 1.8 }}>{entreprise.escompte}</p>}
                  {entreprise.mention_legale && <p style={{ margin: 0, fontSize: 11, color: '#888888', fontFamily: FONT, lineHeight: 1.8 }}>{entreprise.mention_legale}</p>}
                  {!entreprise.penalites_retard && !entreprise.escompte && !entreprise.mention_legale && (
                    <p style={{ margin: 0, fontSize: 11, color: '#BBBBBB', fontFamily: FONT, lineHeight: 1.8 }}>—</p>
                  )}
                </div>
              </div>
            )}

            {/* Notes/conditions from form */}
            {(notes || conditions) && (
              <div style={{ marginTop: 20, borderTop: '1px solid #F0F0F0', paddingTop: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {notes && (
                  <div>
                    <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: '#888888', margin: '0 0 4px', fontFamily: FONT }}>Notes</p>
                    <p style={{ margin: 0, fontSize: 11, color: '#555555', whiteSpace: 'pre-wrap', lineHeight: 1.8, fontFamily: FONT }}>{notes}</p>
                  </div>
                )}
                {conditions && (
                  <div>
                    <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: '#888888', margin: '0 0 4px', fontFamily: FONT }}>Conditions</p>
                    <p style={{ margin: 0, fontSize: 11, color: '#555555', whiteSpace: 'pre-wrap', lineHeight: 1.8, fontFamily: FONT }}>{conditions}</p>
                  </div>
                )}
              </div>
            )}

          </div>{/* end z-index wrapper */}
        </div>
      </div>
    </div>
  )
}
