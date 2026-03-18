import React from 'react'
import {
  Document, Page, Text, View, Image, StyleSheet, renderToBuffer,
} from '@react-pdf/renderer'
import type { DevisDoc, DevisLigneDoc, FactureDoc, FactureLigneDoc, EntrepriseInfo } from '@/lib/supabase/documents'

// ── Helpers ────────────────────────────────────────────────────────

function fmtEur(n: number) {
  return n.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })
}
function fmtDate(iso: string | null | undefined): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

// A4 usable width = 595 - 80 margins = 515pt
const COL_DESC  = 206   // 40 %
const COL_QTY   = 52    // 10 %
const COL_UNIT  = 52    // 10 %
const COL_PU    = 103   // 20 %
const COL_TOTAL = 103   // 20 %

// ── Styles ─────────────────────────────────────────────────────────

const S = StyleSheet.create({
  page: {
    backgroundColor: '#FFFFFF',
    fontFamily: 'Helvetica',
    paddingTop: 40,
    paddingBottom: 60,
    paddingHorizontal: 40,
    fontSize: 9,
    color: '#111111',
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  logoBox: {
    width: 120,
    height: 56,
    backgroundColor: '#EBEBEB',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  logoImg: { width: 120, height: 56, objectFit: 'contain' },
  logoText: { fontSize: 7, color: '#BBBBBB', letterSpacing: 1 },
  companyName: { fontSize: 10, fontFamily: 'Helvetica-Bold', color: '#111111', marginBottom: 1 },
  companyForm: { fontSize: 8, color: '#666666' },
  docTypeTitle: {
    fontSize: 52,
    fontFamily: 'Helvetica-Bold',
    color: '#111111',
    textAlign: 'right',
    letterSpacing: -1,
    marginBottom: 8,
  },
  metaLabel: { fontSize: 8, color: '#444444', textAlign: 'right', marginBottom: 2 },
  metaBold: { fontFamily: 'Helvetica-Bold' },
  metaEcheance: { fontSize: 8, color: '#B45309', textAlign: 'right', marginBottom: 2 },
  metaObjet: { fontSize: 8, color: '#F97316', textAlign: 'right', marginTop: 4, fontStyle: 'italic' },

  // Divider
  divider: { borderBottomWidth: 1, borderBottomColor: '#DDDDDD', marginBottom: 14 },
  dividerThick: { borderBottomWidth: 2, borderBottomColor: '#111111', marginVertical: 6 },
  dividerLight: { borderBottomWidth: 1, borderBottomColor: '#DDDDDD', marginTop: 14, marginBottom: 12 },

  // Parties
  parties: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  partyCol: { width: '47%' },
  partyColRight: { width: '47%', alignItems: 'flex-end' },
  sectionLabel: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: '#111111',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 5,
  },
  bodyLine: { fontSize: 9, color: '#444444', marginBottom: 2, lineHeight: 1.5 },
  bodyBold: { fontFamily: 'Helvetica-Bold', color: '#111111' },
  bodyGray: { color: '#888888' },

  // Table
  table: { marginBottom: 14 },
  tableHeaderRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#DDDDDD',
    paddingVertical: 5,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#DDDDDD',
    paddingVertical: 5,
  },
  tableRowAlt: { backgroundColor: '#F9F9F9' },
  thText: {
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    color: '#111111',
  },
  tdText: { fontSize: 9, color: '#222222' },
  tdGray: { color: '#444444' },
  colDesc:  { width: COL_DESC },
  colQty:   { width: COL_QTY,   textAlign: 'right' },
  colUnit:  { width: COL_UNIT,  textAlign: 'right' },
  colPU:    { width: COL_PU,    textAlign: 'right' },
  colTotal: { width: COL_TOTAL, textAlign: 'right' },
  colTotalBold: { fontFamily: 'Helvetica-Bold' },

  // Totals
  totalsWrapper: { alignItems: 'flex-end', marginBottom: 16 },
  totalsInner: { width: 230 },
  totalDividerTop: { borderBottomWidth: 1, borderBottomColor: '#DDDDDD', marginBottom: 6 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 },
  totalLabel: { fontSize: 9, color: '#333333', textAlign: 'right', flex: 1, paddingRight: 14 },
  totalValue: { fontSize: 9, color: '#111111', width: 90, textAlign: 'right' },
  totalTTCLabel: { fontSize: 11, fontFamily: 'Helvetica-Bold', color: '#111111', textAlign: 'right', flex: 1, paddingRight: 14 },
  totalTTCValue: { fontSize: 13, fontFamily: 'Helvetica-Bold', color: '#F97316', width: 90, textAlign: 'right' },

  // Footer
  footer: { flexDirection: 'row', justifyContent: 'space-between', gap: 20 },
  footerCol: { flex: 1 },
  footerColRight: { flex: 1, alignItems: 'flex-end' },
  footerLabel: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: '#111111',
    marginBottom: 5,
  },
  footerLine: { fontSize: 8, color: '#444444', marginBottom: 2, lineHeight: 1.5 },
  footerGray: { fontSize: 7, color: '#888888', lineHeight: 1.4 },

  // Notes
  noteSection: { marginBottom: 10 },
  noteLabel: { fontSize: 7, fontFamily: 'Helvetica-Bold', textTransform: 'uppercase', letterSpacing: 0.8, color: '#888888', marginBottom: 3 },
  noteText: { fontSize: 8, color: '#555555', lineHeight: 1.6 },

  // Watermark
  watermarkWrap: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center' },
  watermarkBrouillon: { fontSize: 100, fontFamily: 'Helvetica-Bold', color: '#EEEEEE', transform: 'rotate(-45deg)', letterSpacing: 8 },
  watermarkAnnule: { fontSize: 100, fontFamily: 'Helvetica-Bold', color: 'rgba(220,40,40,0.12)', transform: 'rotate(-45deg)', letterSpacing: 8 },
})

// ── Shared components ───────────────────────────────────────────────

function Watermark({ text, annule }: { text: string; annule?: boolean }) {
  return (
    <View style={S.watermarkWrap} fixed>
      <Text style={annule ? S.watermarkAnnule : S.watermarkBrouillon}>{text}</Text>
    </View>
  )
}

function LignesTable({ lignes }: { lignes: { libelle: string; quantite: number; unite: string; prix_unitaire: number }[] }) {
  return (
    <View style={S.table}>
      {/* Header */}
      <View style={S.tableHeaderRow}>
        <Text style={[S.colDesc,  S.thText]}>Description :</Text>
        <Text style={[S.colQty,   S.thText]}>Qté :</Text>
        <Text style={[S.colUnit,  S.thText]}>Unité :</Text>
        <Text style={[S.colPU,    S.thText]}>Prix U. HT :</Text>
        <Text style={[S.colTotal, S.thText]}>Total HT :</Text>
      </View>
      {/* Rows */}
      {lignes.length === 0 ? (
        <View style={[S.tableRow]}>
          <Text style={[S.colDesc, S.tdText, { color: '#BBBBBB', fontStyle: 'italic' }]}>Aucune prestation</Text>
        </View>
      ) : lignes.map((l, i) => (
        <View key={i} style={[S.tableRow, i % 2 !== 0 ? S.tableRowAlt : {}]}>
          <Text style={[S.colDesc,  S.tdText]}>{l.libelle}</Text>
          <Text style={[S.colQty,   S.tdText, S.tdGray]}>{l.quantite}</Text>
          <Text style={[S.colUnit,  S.tdText, S.tdGray]}>{l.unite}</Text>
          <Text style={[S.colPU,    S.tdText]}>{fmtEur(l.prix_unitaire)}</Text>
          <Text style={[S.colTotal, S.tdText, S.colTotalBold]}>{fmtEur(l.quantite * l.prix_unitaire)}</Text>
        </View>
      ))}
    </View>
  )
}

function TotalsBlock({ ht, remisePct, tvaTaux, tva, ttc }: {
  ht: number; remisePct: number; tvaTaux: number; tva: number; ttc: number
}) {
  const sousTotal = remisePct > 0 ? ht / (1 - remisePct / 100) : ht
  return (
    <View style={S.totalsWrapper}>
      <View style={S.totalsInner}>
        <View style={S.totalDividerTop} />
        <View style={S.totalRow}>
          <Text style={S.totalLabel}>TOTAL HT :</Text>
          <Text style={S.totalValue}>{fmtEur(ht)}</Text>
        </View>
        <View style={S.totalRow}>
          <Text style={S.totalLabel}>TVA ({tvaTaux}%) :</Text>
          <Text style={S.totalValue}>{fmtEur(tva)}</Text>
        </View>
        <View style={S.totalRow}>
          <Text style={S.totalLabel}>REMISE :</Text>
          <Text style={S.totalValue}>{remisePct > 0 ? `- ${fmtEur(sousTotal - ht)}` : '—'}</Text>
        </View>
        <View style={S.dividerThick} />
        <View style={S.totalRow}>
          <Text style={S.totalTTCLabel}>TOTAL TTC :</Text>
          <Text style={S.totalTTCValue}>{fmtEur(ttc)}</Text>
        </View>
      </View>
    </View>
  )
}

function EmetteurBlock({ e }: { e: EntrepriseInfo | null }) {
  if (!e) return null
  return (
    <View>
      {e.telephone ? <Text style={S.bodyLine}>{e.telephone}</Text> : null}
      {e.email     ? <Text style={S.bodyLine}>{e.email}</Text>     : null}
      {e.adresse   ? <Text style={S.bodyLine}>{e.adresse}</Text>   : null}
      {(e.code_postal || e.ville) ? (
        <Text style={S.bodyLine}>{[e.code_postal, e.ville].filter(Boolean).join(' ')}</Text>
      ) : null}
      {e.siret ? <Text style={[S.bodyLine, S.bodyGray]}>SIRET : {e.siret}</Text> : null}
    </View>
  )
}

function FooterSection({ e, showBank }: { e: EntrepriseInfo | null; showBank: boolean }) {
  if (!e) return null
  const hasBank = showBank && !!(e.iban || e.bic)
  const hasTerms = !!(e.penalites_retard || e.escompte || e.mention_legale)
  if (!hasBank && !hasTerms && !e.conditions_paiement) return null

  return (
    <View style={S.footer}>
      {/* Règlement */}
      <View style={S.footerCol}>
        <Text style={S.footerLabel}>Règlement :</Text>
        {hasBank ? (
          <>
            <Text style={S.footerLine}>Par virement bancaire :</Text>
            {e.banque && <Text style={S.footerLine}>Banque : {e.banque}</Text>}
            {e.iban   && <Text style={S.footerLine}>IBAN : {e.iban}</Text>}
            {e.bic    && <Text style={S.footerLine}>BIC : {e.bic}</Text>}
          </>
        ) : e.conditions_paiement ? (
          <Text style={S.footerLine}>{e.conditions_paiement}</Text>
        ) : (
          <Text style={[S.footerLine, { color: '#BBBBBB' }]}>—</Text>
        )}
      </View>
      {/* Termes & conditions */}
      <View style={S.footerCol}>
        <Text style={S.footerLabel}>Termes &amp; Conditions</Text>
        {e.penalites_retard ? <Text style={S.footerLine}>{e.penalites_retard}</Text> : null}
        {e.escompte         ? <Text style={S.footerLine}>{e.escompte}</Text>         : null}
        {e.mention_legale   ? <Text style={S.footerGray}>{e.mention_legale}</Text>   : null}
      </View>
    </View>
  )
}

// ── Document templates ──────────────────────────────────────────────

type DevisDocProps   = { devis: DevisDoc;     lignes: DevisLigneDoc[];   entreprise: EntrepriseInfo | null }
type FactureDocProps = { facture: FactureDoc; lignes: FactureLigneDoc[]; entreprise: EntrepriseInfo | null }

function DevisPDF({ devis, lignes, entreprise }: DevisDocProps) {
  const isBrouillon = devis.statut === 'brouillon'
  const objet = [devis.objet].filter(Boolean).join(' — ')

  return (
    <Document>
      <Page size="A4" style={S.page}>
        {isBrouillon && <Watermark text="BROUILLON" />}

        {/* ── HEADER ── */}
        <View style={S.header}>
          {/* Left: logo + company */}
          <View>
            {entreprise?.logo_url ? (
              <Image src={entreprise.logo_url} style={S.logoImg} />
            ) : (
              <View style={S.logoBox}><Text style={S.logoText}>LOGO</Text></View>
            )}
            {entreprise?.raison_sociale ? (
              <Text style={S.companyName}>{entreprise.raison_sociale}</Text>
            ) : null}
            {entreprise?.forme_juridique ? (
              <Text style={S.companyForm}>{entreprise.forme_juridique}</Text>
            ) : null}
          </View>
          {/* Right: doc type + meta */}
          <View>
            <Text style={S.docTypeTitle}>DEVIS</Text>
            <Text style={S.metaLabel}><Text style={S.metaBold}>N° : </Text>{devis.numero}</Text>
            <Text style={S.metaLabel}><Text style={S.metaBold}>DATE : </Text>{fmtDate(devis.date_emission)}</Text>
            <Text style={S.metaLabel}><Text style={S.metaBold}>VALIDITÉ : </Text>{fmtDate(devis.date_validite)}</Text>
            {objet ? <Text style={S.metaObjet}>{objet}</Text> : null}
          </View>
        </View>

        {/* Divider */}
        <View style={S.divider} />

        {/* ── PARTIES ── */}
        <View style={S.parties}>
          <View style={S.partyCol}>
            <Text style={S.sectionLabel}>Émetteur :</Text>
            <EmetteurBlock e={entreprise} />
          </View>
          <View style={S.partyColRight}>
            <Text style={S.sectionLabel}>Destinataire :</Text>
            {devis.client_nom      ? <Text style={[S.bodyLine, S.bodyBold]}>{devis.client_nom}</Text>      : null}
            {devis.client_email    ? <Text style={S.bodyLine}>{devis.client_email}</Text>                  : null}
            {devis.client_adresse  ? <Text style={S.bodyLine}>{devis.client_adresse}</Text>                : null}
          </View>
        </View>

        {/* ── TABLE ── */}
        <LignesTable lignes={lignes} />

        {/* ── TOTALS ── */}
        <TotalsBlock
          ht={devis.total_ht}
          remisePct={devis.remise_pct}
          tvaTaux={devis.tva_taux}
          tva={devis.total_tva}
          ttc={devis.total_ttc}
        />

        {/* Notes / conditions from the document */}
        {(devis.notes || devis.conditions) && (
          <View style={{ marginBottom: 14 }}>
            {devis.notes && (
              <View style={S.noteSection}>
                <Text style={S.noteLabel}>Notes</Text>
                <Text style={S.noteText}>{devis.notes}</Text>
              </View>
            )}
            {devis.conditions && (
              <View style={S.noteSection}>
                <Text style={S.noteLabel}>Conditions</Text>
                <Text style={S.noteText}>{devis.conditions}</Text>
              </View>
            )}
          </View>
        )}

        {/* ── FOOTER ── */}
        <View style={S.dividerLight} />
        <FooterSection e={entreprise} showBank={false} />
      </Page>
    </Document>
  )
}

function FacturePDF({ facture, lignes, entreprise }: FactureDocProps) {
  const isBrouillon = facture.statut === 'brouillon'
  const isAnnulee   = facture.statut === 'annulee'
  const objet = [facture.objet].filter(Boolean).join(' — ')

  return (
    <Document>
      <Page size="A4" style={S.page}>
        {isBrouillon && <Watermark text="BROUILLON" />}
        {isAnnulee   && <Watermark text="ANNULÉ" annule />}

        {/* ── HEADER ── */}
        <View style={S.header}>
          <View>
            {entreprise?.logo_url ? (
              <Image src={entreprise.logo_url} style={S.logoImg} />
            ) : (
              <View style={S.logoBox}><Text style={S.logoText}>LOGO</Text></View>
            )}
            {entreprise?.raison_sociale ? <Text style={S.companyName}>{entreprise.raison_sociale}</Text> : null}
            {entreprise?.forme_juridique ? <Text style={S.companyForm}>{entreprise.forme_juridique}</Text> : null}
          </View>
          <View>
            <Text style={S.docTypeTitle}>FACTURE</Text>
            <Text style={S.metaLabel}><Text style={S.metaBold}>N° : </Text>{facture.numero}</Text>
            <Text style={S.metaLabel}><Text style={S.metaBold}>DATE : </Text>{fmtDate(facture.date_emission)}</Text>
            <Text style={S.metaEcheance}><Text style={{ fontFamily: 'Helvetica-Bold' }}>ÉCHÉANCE : </Text>{fmtDate(facture.date_echeance)}</Text>
            {objet ? <Text style={S.metaObjet}>{objet}</Text> : null}
          </View>
        </View>

        <View style={S.divider} />

        {/* ── PARTIES ── */}
        <View style={S.parties}>
          <View style={S.partyCol}>
            <Text style={S.sectionLabel}>Émetteur :</Text>
            <EmetteurBlock e={entreprise} />
          </View>
          <View style={S.partyColRight}>
            <Text style={S.sectionLabel}>Destinataire :</Text>
            {facture.client_nom     ? <Text style={[S.bodyLine, S.bodyBold]}>{facture.client_nom}</Text>     : null}
            {facture.client_email   ? <Text style={S.bodyLine}>{facture.client_email}</Text>                  : null}
            {facture.client_adresse ? <Text style={S.bodyLine}>{facture.client_adresse}</Text>                : null}
          </View>
        </View>

        {/* ── TABLE ── */}
        <LignesTable lignes={lignes} />

        {/* ── TOTALS ── */}
        <TotalsBlock
          ht={facture.total_ht}
          remisePct={facture.remise_pct}
          tvaTaux={facture.tva_taux}
          tva={facture.total_tva}
          ttc={facture.total_ttc}
        />

        {/* Notes */}
        {(facture.notes || facture.conditions) && (
          <View style={{ marginBottom: 14 }}>
            {facture.notes && (
              <View style={S.noteSection}>
                <Text style={S.noteLabel}>Notes</Text>
                <Text style={S.noteText}>{facture.notes}</Text>
              </View>
            )}
            {facture.conditions && (
              <View style={S.noteSection}>
                <Text style={S.noteLabel}>Conditions</Text>
                <Text style={S.noteText}>{facture.conditions}</Text>
              </View>
            )}
          </View>
        )}

        {/* ── FOOTER ── */}
        <View style={S.dividerLight} />
        <FooterSection e={entreprise} showBank />
      </Page>
    </Document>
  )
}

// ── Public exports ──────────────────────────────────────────────────

export async function generateDevisPdfBuffer(
  devis: DevisDoc,
  lignes: DevisLigneDoc[],
  entreprise: EntrepriseInfo | null
): Promise<Buffer> {
  return renderToBuffer(<DevisPDF devis={devis} lignes={lignes} entreprise={entreprise} />) as Promise<Buffer>
}

export async function generateFacturePdfBuffer(
  facture: FactureDoc,
  lignes: FactureLigneDoc[],
  entreprise: EntrepriseInfo | null
): Promise<Buffer> {
  return renderToBuffer(<FacturePDF facture={facture} lignes={lignes} entreprise={entreprise} />) as Promise<Buffer>
}
