import React from 'react'
import { Document, Page, Text, View, StyleSheet, Image, renderToBuffer } from '@react-pdf/renderer'
import type { CompteRendu } from '@/lib/supabase/comptes-rendus'
import type { Chantier } from '@/lib/supabase/chantiers'

// ── Profile entreprise (optionnel) ───────────────────────────────────
export type PdfProfile = {
  societe?: string
  nom?: string
  adresse?: string
  telephone?: string
  email?: string
  siret?: string
  logo?: string   // URL publique (logo_url depuis entreprise_infos)
}

// ── Types données observ. ────────────────────────────────────────────
interface PresenceRow {
  artisanId?: string
  nom: string
  societe?: string
  statut: string
  convoque?: boolean
}

interface Reserve {
  id?: string
  description?: string
  lot?: string
  responsable?: string
  statut?: string
  photos?: string[]
}

interface Decision {
  id?: string
  description?: string
  texte?: string
  responsable?: string
  echeance?: string
}

interface Lot {
  id?: string
  nom?: string
  intervenant?: string
  dateDemarrage?: string
  dateFin?: string
  avancement?: number
  notes?: string
}

interface LotSuiviEntry {
  observations: string
  photos: string[]
}

interface ParsedObservations {
  texte: string
  presences: PresenceRow[]
  reserves: Reserve[]
  decisions: Decision[]
  lots: Lot[]
  lotSuivi: Record<string, LotSuiviEntry>
}

// ── Parser JSON observations ─────────────────────────────────────────
function parseObservations(raw: string | null): ParsedObservations {
  const empty: ParsedObservations = { texte: '', presences: [], reserves: [], decisions: [], lots: [], lotSuivi: {} }
  if (!raw) return empty
  try {
    const parsed = JSON.parse(raw)
    if (parsed && typeof parsed === 'object') {
      return {
        texte:     parsed.texte ?? parsed.observations ?? '',
        presences: parsed.presences ?? [],
        reserves:  parsed.reserves  ?? [],
        decisions: parsed.decisions ?? [],
        lots:      parsed.lots      ?? [],
        lotSuivi:  parsed.lotSuivi  ?? {},
      }
    }
    return { ...empty, texte: raw }
  } catch {
    return { ...empty, texte: raw }
  }
}

// ── Helpers ──────────────────────────────────────────────────────────
function fmt(dateStr: string | null | undefined) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'long', year: 'numeric',
  })
}

function fmtShort(dateStr: string | null | undefined) {
  if (!dateStr) return '—'
  const s = dateStr.includes('T') ? dateStr : dateStr + 'T12:00:00'
  return new Date(s).toLocaleDateString('fr-FR', {
    day: '2-digit', month: '2-digit', year: '2-digit',
  })
}

function fmtShortMD(dateStr: string | null | undefined) {
  if (!dateStr) return ''
  const s = dateStr.includes('T') ? dateStr : dateStr + 'T12:00:00'
  return new Date(s).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })
}

// ── Styles ───────────────────────────────────────────────────────────
const S = StyleSheet.create({
  page: {
    backgroundColor: '#FFFFFF',
    fontFamily: 'Helvetica',
    fontSize: 9,
    paddingBottom: 44,
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
  headerRight: {
    alignItems: 'flex-end',
    gap: 2,
  },
  docType: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: '#111111',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  docChantier: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: '#222222',
    textAlign: 'right',
  },
  docClient: {
    fontSize: 9,
    color: '#555555',
    textAlign: 'right',
  },
  docDate: {
    fontSize: 9,
    color: '#777777',
    textAlign: 'right',
    marginTop: 2,
  },

  // Progression band
  progressBand: {
    padding: '8 40',
    backgroundColor: '#F9F9F7',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    borderBottomStyle: 'solid',
  },
  progressLabel: {
    fontSize: 7,
    color: '#8A8880',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    width: 100,
  },
  progressBg: {
    flex: 1,
    height: 5,
    backgroundColor: '#E8E4DD',
    borderRadius: 3,
  },
  progressFill: {
    height: 5,
    backgroundColor: '#b45309',
    borderRadius: 3,
  },
  progressValue: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: '#b45309',
    width: 30,
    textAlign: 'right',
  },

  // Body
  body: {
    padding: '18 40',
  },
  section: {
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    color: '#111111',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 5,
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
  tdGray:  { color: '#666666' },
  tdNoBR:  { borderRightWidth: 0 },
  tdBold:  { fontFamily: 'Helvetica-Bold' },
  tdOrange:{ color: '#b45309', fontFamily: 'Helvetica-Bold' },

  // Reserve card
  card: {
    marginBottom: 5,
    padding: '5 7',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderStyle: 'solid',
    borderRadius: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  cardTitle: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: '#111111',
  },
  badgeOuvert: {
    fontSize: 7, fontFamily: 'Helvetica-Bold', color: '#dc2626',
    backgroundColor: '#fee2e2', padding: '1 4', borderRadius: 3,
  },
  badgeLeve: {
    fontSize: 7, fontFamily: 'Helvetica-Bold', color: '#16a34a',
    backgroundColor: '#dcfce7', padding: '1 4', borderRadius: 3,
  },
  cardDesc: {
    fontSize: 8, color: '#333333', lineHeight: 1.4,
  },
  cardResp: {
    fontSize: 7, color: '#777777', marginTop: 2,
  },
  cardPhotos: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 6,
  },
  cardPhoto: {
    width: 120, height: 90, objectFit: 'cover', borderRadius: 2,
  },

  // Decisions
  decRow: {
    flexDirection: 'row', gap: 5, marginBottom: 3,
  },
  decNum: {
    fontSize: 8, fontFamily: 'Helvetica-Bold', color: '#b45309', width: 13,
  },
  decText: {
    flex: 1, fontSize: 8, color: '#333333',
  },
  decMeta: {
    fontSize: 8, color: '#777777',
  },
  decDate: {
    fontSize: 8, color: '#888888', width: 34, textAlign: 'right',
  },

  // Photos
  photosGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 4,
  },
  photoWrap: {
    width: '48%',
  },
  photoImg: {
    width: '100%', height: 90, objectFit: 'cover', borderRadius: 2,
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
  footerLeft: {
    fontSize: 7, color: '#999999',
  },
  footerRight: {
    fontSize: 7, color: '#999999',
  },
})

// ── Safe image helper ────────────────────────────────────────────────
function isSafeImageSrc(src: string): boolean {
  if (src.startsWith('data:')) {
    return src.startsWith('data:image') && src.length <= 500000
  }
  return true
}

// ── PDF Component ────────────────────────────────────────────────────
export function CompteRenduPDF({
  compteRendu,
  chantier,
  pdfProfile,
}: {
  compteRendu: CompteRendu
  chantier: Chantier
  pdfProfile?: PdfProfile
}) {
  const obs = parseObservations(compteRendu.observations)
  const reservesOuvertes = obs.reserves.filter(
    (r) => r.statut === 'Ouvert' || r.statut === 'ouverte'
  ).length

  return (
    <Document
      title={`Compte rendu — ${chantier.nom} — ${fmt(compteRendu.date_visite)}`}
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

          {/* Droite : titre + chantier + dates */}
          <View style={S.headerRight}>
            <Text style={S.docType}>Compte Rendu de Visite</Text>
            <Text style={S.docChantier}>{chantier.nom}</Text>
            {chantier.client ? <Text style={S.docClient}>{chantier.client}</Text> : null}
            <Text style={S.docDate}>Visite du {fmt(compteRendu.date_visite)}</Text>
            {compteRendu.date_prochaine_visite ? (
              <Text style={S.docDate}>
                Prochaine : {fmt(compteRendu.date_prochaine_visite)}
              </Text>
            ) : null}
          </View>
        </View>

        {/* ── Body ── */}
        <View style={S.body}>

          {/* Présences */}
          {obs.presences.length > 0 && (
            <View style={S.section}>
              <Text style={S.sectionTitle}>Présences</Text>
              {/* Légende statuts */}
              <View style={{ flexDirection: 'row', gap: 10, marginBottom: 5 }}>
                {([
                  { code: 'P', label: 'Présent',  color: '#16a34a' },
                  { code: 'A', label: 'Absent',   color: '#dc2626' },
                  { code: 'E', label: 'Excusé',   color: '#ea580c' },
                  { code: 'C', label: 'Convoqué', color: '#2563eb' },
                ] as const).map(({ code, label, color }) => (
                  <View key={code} style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={{ fontSize: 7, fontFamily: 'Helvetica-Bold', color, marginRight: 3 }}>{code}</Text>
                    <Text style={{ fontSize: 7, color: '#777777' }}>= {label}</Text>
                  </View>
                ))}
              </View>
              <View style={S.tHead}>
                <Text style={[S.th, { flex: 2 }]}>Nom</Text>
                <Text style={[S.th, { flex: 2 }]}>Société</Text>
                <Text style={[S.th, { flex: 1, textAlign: 'center' }]}>Statut</Text>
                <Text style={[S.th, { flex: 1.5, textAlign: 'center', borderRightWidth: 0 }]}>Convoqué prochaine réunion</Text>
              </View>
              {obs.presences.map((p, i) => {
                const statutColor = p.statut === 'P' ? '#16a34a' : p.statut === 'A' ? '#dc2626' : p.statut === 'E' ? '#ea580c' : p.statut === 'C' ? '#2563eb' : '#333333'
                return (
                  <View key={i} style={S.tRow}>
                    <Text style={[S.td, { flex: 2 }]}>{p.nom || '—'}</Text>
                    <Text style={[S.td, S.tdGray, { flex: 2 }]}>{p.societe || '—'}</Text>
                    <Text style={[S.td, { flex: 1, textAlign: 'center', color: statutColor, fontFamily: 'Helvetica-Bold' }]}>{p.statut || '—'}</Text>
                    <Text style={[S.td, { flex: 1.5, textAlign: 'center', borderRightWidth: 0 }]}>
                      {p.convoque ? '✓' : '—'}
                    </Text>
                  </View>
                )
              })}
            </View>
          )}

          {/* Observations / Points de suivi */}
          {obs.reserves.length > 0 && (
            <View style={S.section}>
              <Text style={S.sectionTitle}>
                Observations / Points de suivi — {reservesOuvertes} ouverte{reservesOuvertes !== 1 ? 's' : ''}
              </Text>
              {obs.reserves.map((r, i) => {
                const isOuvert = r.statut === 'Ouvert' || r.statut === 'ouverte'
                const statutLabel = r.statut === 'ouverte' ? 'Ouvert' : r.statut === 'levee' ? 'Levé' : (r.statut || '—')
                return (
                  <View key={i} style={S.card}>
                    <View style={S.cardHeader}>
                      <Text style={S.cardTitle}>
                        Observation 1.{i + 1}{r.lot ? ` — ${r.lot}` : ''}
                      </Text>
                      <Text style={isOuvert ? S.badgeOuvert : S.badgeLeve}>{statutLabel}</Text>
                    </View>
                    <Text style={S.cardDesc}>{r.description || '—'}</Text>
                    {r.responsable ? (
                      <Text style={S.cardResp}>Resp. : {r.responsable}</Text>
                    ) : null}
                    {r.photos && r.photos.length > 0 && (
                      <View style={S.cardPhotos}>
                        {r.photos.slice(0, 4).filter(isSafeImageSrc).map((src, pi) => (
                          <Image key={pi} src={src} style={S.cardPhoto} />
                        ))}
                      </View>
                    )}
                  </View>
                )
              })}
            </View>
          )}

          {/* Lots */}
          {obs.lots.length > 0 && (
            <View style={S.section}>
              <Text style={S.sectionTitle}>Avancement des lots</Text>
              <View style={S.tHead}>
                <Text style={[S.th, { flex: 2 }]}>Lot</Text>
                <Text style={[S.th, { flex: 2 }]}>Intervenant</Text>
                <Text style={[S.th, { flex: 1 }]}>Démarrage</Text>
                <Text style={[S.th, { flex: 1 }]}>Fin</Text>
                <Text style={[S.th, { flex: 1, borderRightWidth: 0 }]}>Avancement</Text>
              </View>
              {obs.lots.map((l, i) => (
                <View key={i} style={S.tRow}>
                  <Text style={[S.td, S.tdBold, { flex: 2 }]}>{l.nom || '—'}</Text>
                  <Text style={[S.td, S.tdGray, { flex: 2 }]}>{l.intervenant || '—'}</Text>
                  <Text style={[S.td, S.tdGray, { flex: 1 }]}>{fmtShort(l.dateDemarrage)}</Text>
                  <Text style={[S.td, S.tdGray, { flex: 1 }]}>{fmtShort(l.dateFin)}</Text>
                  <View style={[S.td, { flex: 1, borderRightWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 6 }]}>
                    <View style={{ flex: 1, height: 6, backgroundColor: '#e5e7eb', borderRadius: 3, overflow: 'hidden' }}>
                      <View style={{ width: `${l.avancement ?? 0}%`, height: 6, backgroundColor: '#ea580c', borderRadius: 3 }} />
                    </View>
                    <Text style={{ fontSize: 8, color: '#ea580c', fontFamily: 'Helvetica-Bold', minWidth: 24, textAlign: 'right' }}>{l.avancement ?? 0}%</Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Décisions */}
          {obs.decisions.length > 0 && (
            <View style={S.section}>
              <Text style={S.sectionTitle}>Décisions</Text>
              {obs.decisions.map((d, i) => (
                <View key={i} style={S.decRow}>
                  <Text style={S.decNum}>{i + 1}.</Text>
                  <Text style={S.decText}>
                    {d.description || d.texte || '—'}
                    {d.responsable ? (
                      <Text style={S.decMeta}> — {d.responsable}</Text>
                    ) : null}
                  </Text>
                  {d.echeance ? (
                    <Text style={S.decDate}>{fmtShortMD(d.echeance)}</Text>
                  ) : null}
                </View>
              ))}
            </View>
          )}

          {/* Suivi par lot */}
          {(() => {
            const entries = Object.entries(obs.lotSuivi).filter(
              ([, e]) => e.observations || (e.photos && e.photos.length > 0)
            )
            if (entries.length === 0) return null
            return (
              <View style={S.section}>
                <Text style={S.sectionTitle}>Suivi par lot</Text>
                {entries.map(([lotId, entry]) => {
                  const lot = obs.lots.find((l) => l.id === lotId)
                  const lotLabel = lot?.nom
                    ? lot.nom + (lot.intervenant ? ` — ${lot.intervenant}` : '')
                    : lotId
                  return (
                    <View key={lotId} style={[S.card, { marginBottom: 8 }]}>
                      <Text style={[S.cardTitle, { marginBottom: entry.observations || entry.photos?.length ? 4 : 0 }]}>
                        {lotLabel}
                      </Text>
                      {entry.observations ? (
                        <Text style={S.cardDesc}>{entry.observations}</Text>
                      ) : null}
                      {entry.photos && entry.photos.length > 0 && (
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 6 }}>
                          {entry.photos.filter(isSafeImageSrc).map((src, pi) => (
                            <Image key={pi} src={src} style={S.cardPhoto} />
                          ))}
                        </View>
                      )}
                    </View>
                  )
                })}
              </View>
            )
          })()}

          {/* Remarques générales */}
          {obs.texte ? (
            <View style={S.section}>
              <Text style={S.sectionTitle}>Remarques générales</Text>
              <Text style={S.sectionText}>{obs.texte}</Text>
            </View>
          ) : null}

          {/* Travaux à réaliser */}
          {compteRendu.travaux_a_faire ? (
            <View style={S.section}>
              <Text style={S.sectionTitle}>Travaux à réaliser</Text>
              <Text style={S.sectionText}>{compteRendu.travaux_a_faire}</Text>
            </View>
          ) : null}

          {/* Photos */}
          {compteRendu.photos?.length > 0 && (
            <View style={S.section}>
              <Text style={S.sectionTitle}>Photos ({compteRendu.photos.length})</Text>
              <View style={S.photosGrid}>
                {compteRendu.photos.filter(isSafeImageSrc).map((url, i) => (
                  <View key={i} style={S.photoWrap}>
                    <Image src={url} style={S.photoImg} />
                  </View>
                ))}
              </View>
            </View>
          )}

        </View>

        {/* ── Footer ── */}
        <View style={S.footer} fixed>
          <Text style={S.footerLeft}>
            {pdfProfile?.societe || 'The Builder'} · Confidentiel
          </Text>
          <Text style={S.footerRight}>
            Généré le {new Date().toLocaleDateString('fr-FR')}
          </Text>
        </View>

      </Page>
    </Document>
  )
}

export async function generatePdfBuffer(
  compteRendu: CompteRendu,
  chantier: Chantier,
  pdfProfile?: PdfProfile
): Promise<Buffer> {
  return renderToBuffer(
    <CompteRenduPDF compteRendu={compteRendu} chantier={chantier} pdfProfile={pdfProfile} />
  )
}
