import React from 'react'
import { Document, Page, Text, View, StyleSheet, Image, renderToBuffer } from '@react-pdf/renderer'
import type { LivraisonWithReserves } from '@/lib/supabase/livraisons'
import type { PdfProfile } from './compte-rendu'

// ── Helpers ──────────────────────────────────────────────────────────
function fmt(dateStr: string | null | undefined) {
  if (!dateStr) return '—'
  const s = dateStr.includes('T') ? dateStr : dateStr + 'T12:00:00'
  return new Date(s).toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'long', year: 'numeric',
  })
}

// ── Styles ───────────────────────────────────────────────────────────
const S = StyleSheet.create({
  page: {
    backgroundColor: '#FFFFFF',
    fontFamily: 'Helvetica',
    fontSize: 9,
    paddingBottom: 60,
  },

  // Header
  header: {
    padding: '20 40 14 40',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 2,
    borderBottomColor: '#111111',
    borderBottomStyle: 'solid',
  },
  headerLeft: {
    flexDirection: 'column',
    gap: 2,
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
  },
  logoImg: {
    height: 90,
    maxWidth: 180,
    objectFit: 'contain',
    marginBottom: 5,
  },
  companySociete: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: '#111111',
  },
  companyLine: {
    fontSize: 8,
    color: '#555555',
    marginTop: 1,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  docType: {
    fontSize: 13,
    fontFamily: 'Helvetica-Bold',
    color: '#111111',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    textAlign: 'center',
  },
  docSubtype: {
    fontSize: 8,
    color: '#777777',
    textAlign: 'center',
    marginTop: 3,
    letterSpacing: 0.3,
  },
  headerRight: {
    alignItems: 'flex-end',
    gap: 2,
  },
  docNumero: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: '#111111',
    textAlign: 'right',
  },
  docDate: {
    fontSize: 9,
    color: '#777777',
    textAlign: 'right',
    marginTop: 2,
  },

  // Body
  body: {
    padding: '18 40',
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    color: '#111111',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 6,
    paddingBottom: 3,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    borderBottomStyle: 'solid',
  },
  sectionText: {
    fontSize: 8,
    color: '#333333',
    lineHeight: 1.6,
  },

  // Info grid
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 0,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderStyle: 'solid',
  },
  infoCell: {
    width: '50%',
    padding: '5 8',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    borderBottomStyle: 'solid',
  },
  infoCellFull: {
    width: '100%',
    padding: '5 8',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    borderBottomStyle: 'solid',
  },
  infoLabel: {
    fontSize: 7,
    color: '#888888',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 9,
    color: '#111111',
    fontFamily: 'Helvetica-Bold',
  },
  infoValueNormal: {
    fontSize: 9,
    color: '#333333',
  },

  // Statut badge
  badgeAccepte: {
    fontSize: 8, fontFamily: 'Helvetica-Bold', color: '#16a34a',
    backgroundColor: '#dcfce7', padding: '2 6', borderRadius: 3,
  },
  badgeAccepteRes: {
    fontSize: 8, fontFamily: 'Helvetica-Bold', color: '#ea580c',
    backgroundColor: '#fff7ed', padding: '2 6', borderRadius: 3,
  },
  badgeRefuse: {
    fontSize: 8, fontFamily: 'Helvetica-Bold', color: '#dc2626',
    backgroundColor: '#fee2e2', padding: '2 6', borderRadius: 3,
  },

  // Table
  tHead: {
    flexDirection: 'row',
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderStyle: 'solid',
  },
  tRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    borderBottomStyle: 'solid',
    borderLeftWidth: 1,
    borderLeftColor: '#E0E0E0',
    borderLeftStyle: 'solid',
    borderRightWidth: 1,
    borderRightColor: '#E0E0E0',
    borderRightStyle: 'solid',
  },
  th: {
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    color: '#111111',
    padding: '3 5',
    borderRightWidth: 1,
    borderRightColor: '#E0E0E0',
    borderRightStyle: 'solid',
  },
  td: {
    fontSize: 8,
    color: '#333333',
    padding: '3 5',
    borderRightWidth: 1,
    borderRightColor: '#E0E0E0',
    borderRightStyle: 'solid',
  },
  tdGray: { color: '#666666' },

  // Reserve card
  card: {
    marginBottom: 5,
    padding: '6 8',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderStyle: 'solid',
    borderRadius: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 3,
  },
  cardNum: {
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    color: '#777777',
    marginRight: 6,
  },
  cardTitle: {
    flex: 1,
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: '#111111',
  },
  cardLot: {
    fontSize: 7,
    color: '#777777',
    marginBottom: 2,
  },
  cardDesc: {
    fontSize: 8,
    color: '#333333',
    lineHeight: 1.4,
  },
  badgeALever: {
    fontSize: 7, fontFamily: 'Helvetica-Bold', color: '#dc2626',
    backgroundColor: '#fee2e2', padding: '1 4', borderRadius: 3,
  },
  badgeLevee: {
    fontSize: 7, fontFamily: 'Helvetica-Bold', color: '#16a34a',
    backgroundColor: '#dcfce7', padding: '1 4', borderRadius: 3,
  },

  // Signature blocks
  signaturesFait: {
    fontSize: 8,
    color: '#333333',
    textAlign: 'center',
    marginBottom: 8,
  },
  signaturesRow: {
    flexDirection: 'row',
    gap: 10,
  },
  signatureBlock: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderStyle: 'solid',
    borderRadius: 3,
    padding: '6 8',
  },
  signatureTitle: {
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    color: '#111111',
    marginBottom: 5,
    textAlign: 'center',
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    borderBottomStyle: 'solid',
  },
  signatureField: {
    fontSize: 6.5,
    color: '#555555',
    marginBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
    borderBottomStyle: 'solid',
    paddingBottom: 2,
  },
  signatureFieldLabel: {
    color: '#888888',
  },
  signatureZoneHint: {
    fontSize: 6,
    color: '#BBBBBB',
    textAlign: 'center',
    marginBottom: 2,
    marginTop: 2,
  },
  signatureZone: {
    height: 38,
    borderWidth: 1,
    borderColor: '#E8E8E8',
    borderStyle: 'dashed',
    borderRadius: 2,
    marginTop: 4,
  },

  // Footer
  footer: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    padding: '7 40',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    borderTopStyle: 'solid',
    backgroundColor: '#FFFFFF',
  },
  footerLeft: { fontSize: 7, color: '#999999' },
  footerRight: { fontSize: 7, color: '#999999' },
  footerCenter: { fontSize: 7, color: '#999999', textAlign: 'center' },
})

// ── Statut helpers ───────────────────────────────────────────────────
function StatutBadge({ statut }: { statut: string }) {
  if (statut === 'accepte') return <Text style={S.badgeAccepte}>Accepté</Text>
  if (statut === 'accepte_reserves') return <Text style={S.badgeAccepteRes}>Accepté avec réserves</Text>
  return <Text style={S.badgeRefuse}>Refusé</Text>
}

function statutLabel(statut: string): string {
  if (statut === 'accepte') return 'Accepté'
  if (statut === 'accepte_reserves') return 'Accepté avec réserves'
  return 'Refusé'
}

// ── PDF Component ────────────────────────────────────────────────────
export function LivraisonPDF({
  livraison,
  pdfProfile,
}: {
  livraison: LivraisonWithReserves
  pdfProfile?: PdfProfile
}) {
  const chantier = livraison.chantiers
  const reserves = livraison.livraisons_reserves ?? []

  // Group reserves by lot
  const reservesParLot: Record<string, typeof reserves> = {}
  const reservesLibres: typeof reserves = []
  for (const r of reserves) {
    if (r.lot_nom) {
      if (!reservesParLot[r.lot_nom]) reservesParLot[r.lot_nom] = []
      reservesParLot[r.lot_nom].push(r)
    } else {
      reservesLibres.push(r)
    }
  }

  return (
    <Document
      title={`PV de réception — ${chantier.nom} — ${livraison.numero ?? ''}`}
      author="The Builder"
    >
      <Page size="A4" style={S.page}>

        {/* ── Header ── */}
        <View style={S.header}>

          {/* Gauche : logo + infos entreprise */}
          <View style={S.headerLeft}>
            {pdfProfile?.logo ? (
              <Image src={pdfProfile.logo} style={S.logoImg} />
            ) : null}
            <Text style={S.companySociete}>
              {pdfProfile?.societe || "Cabinet d'architecture"}
            </Text>
            {pdfProfile?.nom       ? <Text style={S.companyLine}>{pdfProfile.nom}</Text>       : null}
            {pdfProfile?.adresse   ? <Text style={S.companyLine}>{pdfProfile.adresse}</Text>   : null}
            {pdfProfile?.telephone ? <Text style={S.companyLine}>{pdfProfile.telephone}</Text> : null}
            {pdfProfile?.email     ? <Text style={S.companyLine}>{pdfProfile.email}</Text>     : null}
            {pdfProfile?.siret     ? <Text style={S.companyLine}>SIRET : {pdfProfile.siret}</Text> : null}
          </View>

          {/* Centre : titre */}
          <View style={S.headerCenter}>
            <Text style={S.docType}>Procès-verbal de réception</Text>
            <Text style={S.docSubtype}>Livraison de chantier</Text>
          </View>

          {/* Droite : numéro + date */}
          <View style={S.headerRight}>
            <Text style={S.docNumero}>{livraison.numero ?? '—'}</Text>
            <Text style={S.docDate}>{fmt(livraison.date_reception)}</Text>
            <View style={{ marginTop: 6 }}>
              <StatutBadge statut={livraison.statut} />
            </View>
          </View>
        </View>

        {/* ── Body ── */}
        <View style={S.body}>

          {/* Informations générales */}
          <View style={S.section}>
            <Text style={S.sectionTitle}>Informations générales</Text>
            <View style={S.infoGrid}>
              <View style={S.infoCell}>
                <Text style={S.infoLabel}>Chantier</Text>
                <Text style={S.infoValue}>{chantier.nom}</Text>
              </View>
              <View style={S.infoCell}>
                <Text style={S.infoLabel}>Client / Maître d'ouvrage</Text>
                <Text style={S.infoValue}>{chantier.client || '—'}</Text>
              </View>
              <View style={S.infoCell}>
                <Text style={S.infoLabel}>Adresse du chantier</Text>
                <Text style={S.infoValueNormal}>{chantier.adresse || '—'}</Text>
              </View>
              <View style={S.infoCell}>
                <Text style={S.infoLabel}>Date de réception</Text>
                <Text style={S.infoValueNormal}>{fmt(livraison.date_reception)}</Text>
              </View>
              <View style={S.infoCell}>
                <Text style={S.infoLabel}>Statut</Text>
                <Text style={S.infoValueNormal}>{statutLabel(livraison.statut)}</Text>
              </View>
              {livraison.delai_levee_reserves ? (
                <View style={S.infoCell}>
                  <Text style={S.infoLabel}>Délai de levée des réserves</Text>
                  <Text style={S.infoValueNormal}>{fmt(livraison.delai_levee_reserves)}</Text>
                </View>
              ) : <View style={S.infoCell} />}
              {livraison.observations ? (
                <View style={[S.infoCellFull, { borderBottomWidth: 0 }]}>
                  <Text style={S.infoLabel}>Observations générales</Text>
                  <Text style={S.infoValueNormal}>{livraison.observations}</Text>
                </View>
              ) : (
                <View style={[S.infoCellFull, { borderBottomWidth: 0 }]} />
              )}
            </View>
          </View>

          {/* Présences */}
          {livraison.presences && livraison.presences.length > 0 && (
            <View style={S.section}>
              <Text style={S.sectionTitle}>Présences</Text>
              <View style={S.tHead}>
                <Text style={[S.th, { flex: 2.5 }]}>Nom</Text>
                <Text style={[S.th, { flex: 2 }]}>Société</Text>
                <Text style={[S.th, { flex: 0.8, textAlign: 'center' }]}>Statut</Text>
                <Text style={[S.th, { flex: 2, textAlign: 'center', borderRightWidth: 0 }]}>Signature</Text>
              </View>
              {livraison.presences.map((p, i) => {
                const c = p.statut === 'P' ? '#16a34a' : p.statut === 'A' ? '#dc2626' : '#ea580c'
                const label = p.statut === 'P' ? 'Présent' : p.statut === 'A' ? 'Absent' : 'Excusé'
                return (
                  <View key={i} style={S.tRow}>
                    <Text style={[S.td, { flex: 2.5, fontFamily: 'Helvetica-Bold' }]}>{p.nom || '—'}</Text>
                    <Text style={[S.td, S.tdGray, { flex: 2 }]}>{p.societe || '—'}</Text>
                    <Text style={[S.td, { flex: 0.8, textAlign: 'center', color: c, fontFamily: 'Helvetica-Bold' }]}>{label}</Text>
                    {/* Case vide pour signature manuscrite */}
                    <View style={[S.td, { flex: 2, borderRightWidth: 0, minHeight: 28 }]} />
                  </View>
                )
              })}
            </View>
          )}

          {/* Réserves par lot */}
          {Object.keys(reservesParLot).length > 0 && (
            <View style={S.section}>
              <Text style={S.sectionTitle}>
                Réserves par lot ({reserves.length} réserve{reserves.length !== 1 ? 's' : ''})
              </Text>
              {Object.entries(reservesParLot).map(([lotNom, lotReserves]) => (
                <View key={lotNom} style={{ marginBottom: 8 }}>
                  <Text style={{
                    fontSize: 8,
                    fontFamily: 'Helvetica-Bold',
                    color: '#555555',
                    marginBottom: 4,
                    paddingLeft: 2,
                    borderLeftWidth: 2,
                    borderLeftColor: '#b45309',
                    borderLeftStyle: 'solid',
                    paddingTop: 1,
                    paddingBottom: 1,
                  }}>
                    Lot : {lotNom}
                  </Text>
                  {lotReserves.map((r, i) => (
                    <View key={r.id} style={S.card}>
                      <View style={S.cardHeader}>
                        <Text style={S.cardNum}>{i + 1}.</Text>
                        <Text style={S.cardTitle}>{r.description}</Text>
                        <Text style={r.statut === 'a_lever' ? S.badgeALever : S.badgeLevee}>
                          {r.statut === 'a_lever' ? 'À lever' : 'Levée'}
                        </Text>
                      </View>
                      {r.artisan_nom ? (
                        <Text style={{ fontSize: 7, color: '#777777', marginTop: 2 }}>
                          Resp. : {r.artisan_nom}
                        </Text>
                      ) : null}
                      {r.statut === 'levee' && r.date_levee ? (
                        <Text style={{ fontSize: 7, color: '#16a34a', marginTop: 2 }}>
                          Levée le {fmt(r.date_levee)}
                        </Text>
                      ) : null}
                    </View>
                  ))}
                </View>
              ))}
            </View>
          )}

          {/* Réserves libres */}
          {reservesLibres.length > 0 && (
            <View style={S.section}>
              <Text style={S.sectionTitle}>
                Réserves générales ({reservesLibres.length} réserve{reservesLibres.length !== 1 ? 's' : ''})
              </Text>
              {reservesLibres.map((r, i) => (
                <View key={r.id} style={S.card}>
                  <View style={S.cardHeader}>
                    <Text style={S.cardNum}>{i + 1}.</Text>
                    <Text style={S.cardTitle}>{r.description}</Text>
                    <Text style={r.statut === 'a_lever' ? S.badgeALever : S.badgeLevee}>
                      {r.statut === 'a_lever' ? 'À lever' : 'Levée'}
                    </Text>
                  </View>
                  {r.artisan_nom ? (
                    <Text style={{ fontSize: 7, color: '#777777', marginTop: 2 }}>
                      Resp. : {r.artisan_nom}
                    </Text>
                  ) : null}
                  {r.statut === 'levee' && r.date_levee ? (
                    <Text style={{ fontSize: 7, color: '#16a34a', marginTop: 2 }}>
                      Levée le {fmt(r.date_levee)}
                    </Text>
                  ) : null}
                </View>
              ))}
            </View>
          )}

          {/* Mention légale */}
          <View style={{ marginBottom: 14, padding: '8 10', backgroundColor: '#F9F9F7', borderRadius: 3, borderWidth: 1, borderColor: '#E8E8E8', borderStyle: 'solid' }}>
            <Text style={{ fontSize: 6.5, color: '#555555', lineHeight: 1.6 }}>
              Ce procès-verbal de réception est établi contradictoirement entre les parties, en deux exemplaires originaux, un remis à chaque partie. La réception est prononcée conformément à l'article 1792-6 du Code civil et vaut point de départ des garanties légales : parfait achèvement (1 an), garantie biennale (2 ans), garantie décennale (10 ans). Les réserves éventuelles devront être levées dans le délai imparti mentionné ci-dessus, sous peine de mise en demeure puis d'exécution aux frais de l'entrepreneur défaillant. Le solde du marché n'est exigible qu'après levée complète des réserves.
            </Text>
          </View>

          {/* Signatures */}
          <View style={[S.section, { marginTop: 40 }]} wrap={false}>
            <Text style={S.sectionTitle}>Signatures</Text>
            <Text style={S.signaturesFait}>
              Fait à {pdfProfile?.ville || '_______________'}, le {fmt(livraison.date_reception)}, en deux exemplaires originaux.
            </Text>
            <View style={S.signaturesRow}>
              {/* Maître d'œuvre */}
              <View style={S.signatureBlock}>
                <Text style={S.signatureTitle}>Le Maître d'œuvre</Text>
                <Text style={S.signatureField}>
                  <Text style={S.signatureFieldLabel}>Nom et prénom : </Text>
                  {pdfProfile?.nom || pdfProfile?.societe || ''}
                </Text>
                <Text style={S.signatureField}>
                  <Text style={S.signatureFieldLabel}>Qualité : </Text>
                  {'Maître d\'œuvre'}
                </Text>
                <Text style={S.signatureField}>
                  <Text style={S.signatureFieldLabel}>Date : </Text>
                  {fmt(livraison.date_reception)}
                </Text>
                <Text style={S.signatureZoneHint}>Lu et approuvé</Text>
                <View style={S.signatureZone} />
              </View>
              {/* Maître d'ouvrage */}
              <View style={S.signatureBlock}>
                <Text style={S.signatureTitle}>Le Maître d'ouvrage</Text>
                <Text style={S.signatureField}>
                  <Text style={S.signatureFieldLabel}>Nom et prénom : </Text>
                  {chantier.client || ''}
                </Text>
                <Text style={S.signatureField}>
                  <Text style={S.signatureFieldLabel}>Qualité : </Text>
                  {'Maître d\'ouvrage'}
                </Text>
                <Text style={S.signatureField}>
                  <Text style={S.signatureFieldLabel}>Date : </Text>
                  {''}
                </Text>
                <Text style={S.signatureZoneHint}>Lu et approuvé</Text>
                <View style={S.signatureZone} />
              </View>
            </View>
          </View>

        </View>

        {/* ── Footer ── */}
        <View style={S.footer} fixed>
          <Text style={S.footerLeft}>
            {pdfProfile?.societe || 'The Builder'} · Confidentiel
          </Text>
          <Text style={S.footerCenter}>
            {livraison.numero ?? ''} · {chantier.nom}
          </Text>
          <Text style={S.footerRight}>
            Généré le {new Date().toLocaleDateString('fr-FR')}
          </Text>
        </View>

      </Page>
    </Document>
  )
}

export async function generateLivraisonPdfBuffer(
  livraison: LivraisonWithReserves,
  pdfProfile?: PdfProfile
): Promise<Buffer> {
  return renderToBuffer(
    <LivraisonPDF livraison={livraison} pdfProfile={pdfProfile} />
  )
}
