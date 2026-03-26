import React from 'react'
import { Document, Page, Text, View, StyleSheet, Image, renderToBuffer } from '@react-pdf/renderer'
import type { Contrat } from '@/lib/supabase/contrats'
import type { PdfProfile } from '@/lib/pdf/compte-rendu'

function fmt(dateStr: string | null | undefined) {
  if (!dateStr) return '—'
  const s = dateStr.includes('T') ? dateStr : dateStr + 'T12:00:00'
  return new Date(s).toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'long', year: 'numeric',
  })
}

function fmtEur(n: number) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n)
}

const S = StyleSheet.create({
  page: {
    backgroundColor: '#FFFFFF',
    fontFamily: 'Helvetica',
    fontSize: 9,
    paddingBottom: 50,
  },
  header: {
    padding: '24 40 16 40',
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
  },
  logoImg: {
    height: 80,
    maxWidth: 160,
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
    fontSize: 13,
    fontFamily: 'Helvetica-Bold',
    color: '#111111',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  docMeta: {
    fontSize: 9,
    color: '#555555',
    textAlign: 'right',
  },
  body: {
    padding: '20 40',
  },
  title: {
    fontSize: 16,
    fontFamily: 'Helvetica-Bold',
    color: '#111111',
    textAlign: 'center',
    marginBottom: 20,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: '#111111',
    textAlign: 'center',
    marginBottom: 6,
  },
  centeredText: {
    fontSize: 9,
    color: '#333333',
    textAlign: 'center',
    marginBottom: 3,
  },
  separator: {
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    borderBottomStyle: 'solid',
    marginTop: 14,
    marginBottom: 14,
  },
  partiesBox: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 14,
  },
  partyCol: {
    flex: 1,
    padding: '8 10',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderStyle: 'solid',
    borderRadius: 3,
  },
  partyLabel: {
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    color: '#888888',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  partyName: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: '#111111',
    marginBottom: 2,
  },
  partyDetail: {
    fontSize: 8,
    color: '#555555',
    marginTop: 1,
  },
  section: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: '#111111',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 5,
    paddingBottom: 3,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    borderBottomStyle: 'solid',
  },
  sectionSubtitle: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: '#333333',
    marginBottom: 3,
    marginTop: 6,
  },
  text: {
    fontSize: 8,
    color: '#333333',
    lineHeight: 1.6,
    marginBottom: 3,
  },
  bullet: {
    fontSize: 8,
    color: '#333333',
    lineHeight: 1.6,
    paddingLeft: 10,
    marginBottom: 2,
  },
  signatureBox: {
    flexDirection: 'row',
    gap: 30,
    marginTop: 30,
  },
  signatureCol: {
    flex: 1,
    padding: '12 14',
    borderWidth: 1,
    borderColor: '#CCCCCC',
    borderStyle: 'solid',
    borderRadius: 3,
    minHeight: 80,
  },
  signatureLabel: {
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    color: '#888888',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  signatureName: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: '#111111',
    marginBottom: 3,
  },
  signatureHint: {
    fontSize: 7,
    color: '#AAAAAA',
    marginTop: 20,
  },
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

export function ContratMoePDF({
  contrat,
  pdfProfile,
}: {
  contrat: Contrat
  pdfProfile?: PdfProfile
}) {
  return (
    <Document
      title={`Contrat MOE — ${contrat.nom_client} — ${fmt(contrat.date_contrat)}`}
      author="The Builder"
    >
      <Page size="A4" style={S.page}>

        {/* Header */}
        <View style={S.header}>
          <View style={S.headerLeft}>
            {pdfProfile?.logo ? (
              <Image src={pdfProfile.logo} style={S.logoImg} />
            ) : null}
            <Text style={S.companySociete}>
              {pdfProfile?.societe || contrat.nom_moe}
            </Text>
            {pdfProfile?.adresse   ? <Text style={S.companyLine}>{pdfProfile.adresse}</Text>   : null}
            {pdfProfile?.telephone ? <Text style={S.companyLine}>{pdfProfile.telephone}</Text> : null}
            {pdfProfile?.email     ? <Text style={S.companyLine}>{pdfProfile.email}</Text>     : null}
            {pdfProfile?.siret     ? <Text style={S.companyLine}>SIRET : {pdfProfile.siret}</Text> : null}
          </View>
          <View style={S.headerRight}>
            <Text style={S.docType}>Contrat de Maîtrise d&apos;Oeuvre</Text>
            <Text style={S.docMeta}>Date : {fmt(contrat.date_contrat)}</Text>
          </View>
        </View>

        <View style={S.body}>

          {/* Titre */}
          <Text style={S.title}>LE CONTRAT</Text>

          {/* Objet */}
          <Text style={S.subtitle}>Objet</Text>
          <Text style={S.centeredText}>
            Mission de Maîtrise d&apos;Oeuvre de conception et d&apos;exécution, réception de chantier
          </Text>
          <Text style={S.centeredText}>
            Opération : Construction d&apos;un bâtiment à usage d&apos;habitation
          </Text>
          <Text style={S.centeredText}>
            Adresse : {contrat.adresse_chantier}
          </Text>

          <View style={S.separator} />

          {/* Parties */}
          <View style={S.partiesBox}>
            <View style={S.partyCol}>
              <Text style={S.partyLabel}>Maître d&apos;Ouvrage</Text>
              <Text style={S.partyName}>{contrat.nom_client}</Text>
              <Text style={S.partyDetail}>Ci-après dénommé « le Maître d&apos;Ouvrage »</Text>
            </View>
            <View style={S.partyCol}>
              <Text style={S.partyLabel}>Maître d&apos;Oeuvre</Text>
              <Text style={S.partyName}>{contrat.nom_moe}</Text>
              <Text style={S.partyDetail}>Ci-après dénommé « le Maître d&apos;Oeuvre »</Text>
            </View>
          </View>

          <View style={S.separator} />

          {/* ARTICLE 1 – ESTIMATIF DES TRAVAUX */}
          <View style={S.section}>
            <Text style={S.sectionTitle}>Article 1 — Estimatif des travaux</Text>
            <Text style={S.text}>
              Le montant estimatif des travaux objet du présent contrat s&apos;élève à la somme de {fmtEur(contrat.budget_estimatif)} TTC.
            </Text>
            <Text style={S.text}>
              Ce montant est donné à titre indicatif et pourra être révisé d&apos;un commun accord entre les parties au fur et à mesure de l&apos;avancement des études et de la consultation des entreprises.
            </Text>
            <Text style={S.text}>
              Le Maître d&apos;Oeuvre s&apos;engage à informer le Maître d&apos;Ouvrage de toute évolution significative du budget prévisionnel et à proposer des solutions alternatives en cas de dépassement.
            </Text>
          </View>

          {/* ARTICLE 2 – PERMIS DE CONSTRUIRE */}
          <View style={S.section}>
            <Text style={S.sectionTitle}>Article 2 — Permis de construire</Text>
            <Text style={S.text}>
              Le Maître d&apos;Oeuvre établit le dossier de demande de permis de construire comprenant l&apos;ensemble des pièces graphiques et écrites nécessaires au dépôt du dossier.
            </Text>
            <Text style={S.text}>
              Le Maître d&apos;Oeuvre assure le suivi de l&apos;instruction du permis de construire auprès des services compétents et informe le Maître d&apos;Ouvrage de l&apos;avancement de la procédure.
            </Text>
            <Text style={S.text}>
              Les frais administratifs liés au dépôt du permis de construire restent à la charge du Maître d&apos;Ouvrage.
            </Text>
          </View>

          {/* ARTICLE 3 – MARCHES ENTREPRISES */}
          <View style={S.section}>
            <Text style={S.sectionTitle}>Article 3 — Marchés entreprises</Text>
            <Text style={S.text}>
              Le Maître d&apos;Oeuvre assiste le Maître d&apos;Ouvrage dans la consultation des entreprises. Il établit les dossiers de consultation (DCE), analyse les offres reçues et présente un rapport comparatif au Maître d&apos;Ouvrage.
            </Text>
            <Text style={S.text}>
              Le choix final des entreprises appartient au Maître d&apos;Ouvrage. Le Maître d&apos;Oeuvre assiste à la mise au point des marchés de travaux et vérifie leur conformité avec les pièces du marché.
            </Text>
            <Text style={S.text}>
              Le Maître d&apos;Oeuvre vérifie les situations de travaux présentées par les entreprises et propose au Maître d&apos;Ouvrage le règlement des acomptes correspondants.
            </Text>
          </View>

          {/* ARTICLE 4 – MAITRISE D'OEUVRE D'EXECUTION */}
          <View style={S.section}>
            <Text style={S.sectionTitle}>Article 4 — Maîtrise d&apos;oeuvre d&apos;exécution</Text>
            <Text style={S.text}>
              La mission de maîtrise d&apos;oeuvre d&apos;exécution comprend les éléments suivants :
            </Text>

            <Text style={S.sectionSubtitle}>4.1 — Ordonnancement</Text>
            <Text style={S.text}>
              Le Maître d&apos;Oeuvre établit le calendrier prévisionnel d&apos;exécution des travaux, définit l&apos;ordre d&apos;intervention des différents corps d&apos;état et fixe les délais d&apos;exécution de chaque lot. Il met à jour ce planning tout au long du chantier et en informe les parties concernées.
            </Text>

            <Text style={S.sectionSubtitle}>4.2 — Pilotage</Text>
            <Text style={S.text}>
              Le Maître d&apos;Oeuvre organise et dirige les réunions de chantier. Il convoque les entreprises concernées, rédige les comptes rendus de chantier et les diffuse à l&apos;ensemble des intervenants. Il veille au respect du planning et prend les mesures nécessaires en cas de retard.
            </Text>

            <Text style={S.sectionSubtitle}>4.3 — Coordination</Text>
            <Text style={S.text}>
              Le Maître d&apos;Oeuvre assure la coordination entre les différents corps d&apos;état intervenant sur le chantier. Il veille à la bonne exécution des travaux conformément aux plans et aux prescriptions techniques. Il gère les interfaces entre les lots et résout les éventuels conflits techniques.
            </Text>

            <Text style={S.sectionSubtitle}>4.4 — Réception des travaux</Text>
            <Text style={S.text}>
              Le Maître d&apos;Oeuvre assiste le Maître d&apos;Ouvrage lors des opérations préalables à la réception des travaux. Il établit la liste des réserves éventuelles et s&apos;assure de leur levée dans les délais impartis. Il prépare le procès-verbal de réception et assure le suivi de la garantie de parfait achèvement.
            </Text>
          </View>

          {/* ARTICLE 5 – CONTENU DU COMPTE RENDU */}
          <View style={S.section}>
            <Text style={S.sectionTitle}>Article 5 — Contenu du compte rendu de chantier</Text>
            <Text style={S.text}>
              Chaque compte rendu de chantier établi par le Maître d&apos;Oeuvre comprend les éléments suivants :
            </Text>
            <Text style={S.bullet}>• Liste des présents et absents à la réunion de chantier</Text>
            <Text style={S.bullet}>• Avancement des travaux par lot et par corps d&apos;état</Text>
            <Text style={S.bullet}>• Points techniques soulevés et solutions retenues</Text>
            <Text style={S.bullet}>• Réserves émises et suivi de leur levée</Text>
            <Text style={S.bullet}>• Décisions prises et actions à mener avec responsables et échéances</Text>
            <Text style={S.bullet}>• Observations générales sur la qualité d&apos;exécution</Text>
            <Text style={S.bullet}>• Date de la prochaine réunion de chantier</Text>
            <Text style={S.bullet}>• Reportage photographique de l&apos;avancement</Text>
          </View>

          {/* Signatures */}
          <View style={S.signatureBox}>
            <View style={S.signatureCol}>
              <Text style={S.signatureLabel}>Le Maître d&apos;Ouvrage</Text>
              <Text style={S.signatureName}>{contrat.nom_client}</Text>
              <Text style={S.signatureHint}>Signature précédée de la mention « Lu et approuvé »</Text>
            </View>
            <View style={S.signatureCol}>
              <Text style={S.signatureLabel}>Le Maître d&apos;Oeuvre</Text>
              <Text style={S.signatureName}>{contrat.nom_moe}</Text>
              <Text style={S.signatureHint}>Signature précédée de la mention « Lu et approuvé »</Text>
            </View>
          </View>

        </View>

        {/* Footer */}
        <View style={S.footer} fixed>
          <Text style={S.footerLeft}>
            {pdfProfile?.societe || contrat.nom_moe} · Confidentiel
          </Text>
          <Text style={S.footerRight}>
            Fait à ______________, le {fmt(contrat.date_contrat)}
          </Text>
        </View>

      </Page>
    </Document>
  )
}

export async function generateContratPdfBuffer(
  contrat: Contrat,
  pdfProfile?: PdfProfile
): Promise<Buffer> {
  return renderToBuffer(
    <ContratMoePDF contrat={contrat} pdfProfile={pdfProfile} />
  )
}
