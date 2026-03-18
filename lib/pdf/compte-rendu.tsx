import React from 'react'
import { Document, Page, Text, View, StyleSheet, renderToBuffer } from '@react-pdf/renderer'
import type { CompteRendu } from '@/lib/supabase/comptes-rendus'
import type { Chantier } from '@/lib/supabase/chantiers'

const styles = StyleSheet.create({
  page: {
    backgroundColor: '#FFFFFF',
    fontFamily: 'Helvetica',
    paddingBottom: 60,
  },
  // ── Header ──────────────────────────────────────────────────────────
  header: {
    backgroundColor: '#0D0D0B',
    padding: '28 40',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerLeft: {
    flexDirection: 'column',
    gap: 4,
  },
  logo: {
    fontSize: 22,
    fontFamily: 'Helvetica-Bold',
    color: '#ea580c',
    letterSpacing: 3,
  },
  headerSubtitle: {
    fontSize: 9,
    color: '#8A8880',
    marginTop: 2,
  },
  headerRight: {
    alignItems: 'flex-end',
    gap: 2,
  },
  headerLabel: {
    fontSize: 8,
    color: '#8A8880',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  headerValue: {
    fontSize: 11,
    color: '#F0EDE6',
    fontFamily: 'Helvetica-Bold',
  },
  // ── Chantier band ───────────────────────────────────────────────────
  chantierBand: {
    backgroundColor: '#111110',
    padding: '14 40',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  chantierField: {
    flexDirection: 'column',
    gap: 2,
  },
  chantierLabel: {
    fontSize: 8,
    color: '#8A8880',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  chantierValue: {
    fontSize: 11,
    color: '#F0EDE6',
  },
  // ── Body ────────────────────────────────────────────────────────────
  body: {
    padding: '28 40',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: '#ea580c',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: 8,
    paddingBottom: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E4DD',
    borderBottomStyle: 'solid',
  },
  sectionText: {
    fontSize: 10,
    color: '#2D2D2B',
    lineHeight: 1.6,
  },
  // ── Progression bar ─────────────────────────────────────────────────
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  progressBg: {
    flex: 1,
    height: 8,
    backgroundColor: '#E8E4DD',
    borderRadius: 4,
  },
  progressFill: {
    height: 8,
    backgroundColor: '#ea580c',
    borderRadius: 4,
  },
  progressLabel: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    color: '#0D0D0B',
    width: 36,
    textAlign: 'right',
  },
  // ── Tags ────────────────────────────────────────────────────────────
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tag: {
    backgroundColor: '#F2EFE8',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 20,
    fontSize: 9,
    color: '#2D2D2B',
  },
  // ── Dates grid ──────────────────────────────────────────────────────
  datesGrid: {
    flexDirection: 'row',
    gap: 32,
  },
  dateField: {
    flexDirection: 'column',
    gap: 3,
  },
  dateLabel: {
    fontSize: 8,
    color: '#8A8880',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  dateValue: {
    fontSize: 11,
    color: '#2D2D2B',
    fontFamily: 'Helvetica-Bold',
  },
  // ── Footer ──────────────────────────────────────────────────────────
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#0D0D0B',
    padding: '10 40',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 8,
    color: '#8A8880',
  },
  footerAccent: {
    fontSize: 8,
    color: '#ea580c',
    fontFamily: 'Helvetica-Bold',
    letterSpacing: 1,
  },
  emptyText: {
    fontSize: 10,
    color: '#8A8880',
    fontStyle: 'italic',
  },
  divider: {
    height: 1,
    backgroundColor: '#E8E4DD',
    marginVertical: 16,
  },
})

function fmt(dateStr: string | null) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export function CompteRenduPDF({
  compteRendu,
  chantier,
}: {
  compteRendu: CompteRendu
  chantier: Chantier
}) {
  const progressWidth = `${compteRendu.progression}%`

  return (
    <Document
      title={`Compte rendu — ${chantier.nom} — ${fmt(compteRendu.date_visite)}`}
      author="Foreman"
    >
      <Page size="A4" style={styles.page}>
        {/* ── Header ── */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.logo}>FOREMAN</Text>
            <Text style={styles.headerSubtitle}>Compte rendu de visite de chantier</Text>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.headerLabel}>Date du rapport</Text>
            <Text style={styles.headerValue}>{fmt(compteRendu.date_visite)}</Text>
          </View>
        </View>

        {/* ── Chantier band ── */}
        <View style={styles.chantierBand}>
          <View style={styles.chantierField}>
            <Text style={styles.chantierLabel}>Chantier</Text>
            <Text style={styles.chantierValue}>{chantier.nom}</Text>
          </View>
          <View style={styles.chantierField}>
            <Text style={styles.chantierLabel}>Client</Text>
            <Text style={styles.chantierValue}>{chantier.client}</Text>
          </View>
          <View style={styles.chantierField}>
            <Text style={styles.chantierLabel}>Adresse</Text>
            <Text style={styles.chantierValue}>{chantier.adresse}</Text>
          </View>
        </View>

        {/* ── Body ── */}
        <View style={styles.body}>

          {/* Dates */}
          <View style={[styles.section]}>
            <View style={styles.datesGrid}>
              <View style={styles.dateField}>
                <Text style={styles.dateLabel}>Date de visite</Text>
                <Text style={styles.dateValue}>{fmt(compteRendu.date_visite)}</Text>
              </View>
              {compteRendu.date_prochaine_visite && (
                <View style={styles.dateField}>
                  <Text style={styles.dateLabel}>Prochaine visite</Text>
                  <Text style={styles.dateValue}>{fmt(compteRendu.date_prochaine_visite)}</Text>
                </View>
              )}
            </View>
          </View>

          <View style={styles.divider} />

          {/* Progression */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Avancement du chantier</Text>
            <View style={styles.progressRow}>
              <View style={styles.progressBg}>
                <View style={[styles.progressFill, { width: progressWidth }]} />
              </View>
              <Text style={styles.progressLabel}>{compteRendu.progression}%</Text>
            </View>
          </View>

          {/* Artisans présents */}
          {compteRendu.artisans_presents?.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Artisans présents</Text>
              <View style={styles.tagsRow}>
                {compteRendu.artisans_presents.map((a, i) => (
                  <View key={i} style={styles.tag}>
                    <Text>{a}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Observations */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Observations</Text>
            <Text style={compteRendu.observations ? styles.sectionText : styles.emptyText}>
              {compteRendu.observations ?? 'Aucune observation.'}
            </Text>
          </View>

          {/* Travaux à faire */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Travaux à réaliser</Text>
            <Text style={compteRendu.travaux_a_faire ? styles.sectionText : styles.emptyText}>
              {compteRendu.travaux_a_faire ?? 'Aucun travaux spécifiés.'}
            </Text>
          </View>

        </View>

        {/* ── Footer ── */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerAccent}>FOREMAN</Text>
          <Text style={styles.footerText}>
            Généré le {new Date().toLocaleDateString('fr-FR')} · Confidentiel
          </Text>
        </View>
      </Page>
    </Document>
  )
}

export async function generatePdfBuffer(
  compteRendu: CompteRendu,
  chantier: Chantier
): Promise<Buffer> {
  return renderToBuffer(<CompteRenduPDF compteRendu={compteRendu} chantier={chantier} />)
}
