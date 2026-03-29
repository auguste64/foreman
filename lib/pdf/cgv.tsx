import React from 'react'
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'

export type CgvProfile = {
  societe: string
  prenom?: string
  nom?: string
  adresse?: string
  ville?: string
  code_postal?: string
  telephone?: string
  email?: string
  siret?: string
  code_ape?: string
  tva_intracom?: string
  assurance_nom?: string
  assurance_contrat?: string
}

const S = StyleSheet.create({
  page: {
    backgroundColor: '#FFFFFF',
    fontFamily: 'Helvetica',
    fontSize: 9,
    color: '#1a1a1a',
    paddingBottom: 50,
  },
  header: {
    padding: '24 40 16 40',
    borderBottomWidth: 2,
    borderBottomColor: '#111111',
    borderBottomStyle: 'solid',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 13,
    fontFamily: 'Helvetica-Bold',
    color: '#111111',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  headerSub: {
    fontSize: 9,
    color: '#555555',
  },
  body: {
    padding: '0 40',
  },
  articleTitle: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: '#111111',
    marginBottom: 6,
    marginTop: 14,
  },
  paragraph: {
    fontSize: 9,
    lineHeight: 1.5,
    color: '#2a2a2a',
    marginBottom: 4,
  },
  identRow: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: 3,
  },
  identLabel: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: '#555555',
    width: 130,
  },
  identValue: {
    fontSize: 8,
    color: '#1a1a1a',
    flex: 1,
  },
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 40,
    right: 40,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    borderTopStyle: 'solid',
    paddingTop: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerText: {
    fontSize: 7,
    color: '#888888',
  },
})

function art(num: number, title: string) {
  return `Article ${num} — ${title}`
}

const n = (v?: string | null) => v || '—'

export function CgvDocument({ profile }: { profile: CgvProfile }) {
  const societe = profile.societe || 'Le Prestataire'
  const today = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <Document>
      <Page size="A4" style={S.page}>
        {/* En-tête */}
        <View style={S.header}>
          <Text style={S.headerTitle}>
            Conditions générales de prestation de service de {societe}
          </Text>
          <Text style={S.headerSub}>Maîtrise d'œuvre — Version en vigueur au {today}</Text>
        </View>

        <View style={S.body}>
          {/* Article 1 */}
          <Text style={S.articleTitle}>{art(1, 'Objet')}</Text>
          <Text style={S.paragraph}>
            Les présentes conditions générales de prestation de services (ci-après « CGP ») ont pour objet de définir les modalités et conditions dans lesquelles {societe} (ci-après « le Prestataire ») réalise des missions de maîtrise d'œuvre et de conseil en architecture au profit de ses clients (ci-après « le Maître d'Ouvrage »).
          </Text>
          <Text style={S.paragraph}>
            Toute commande passée auprès de {societe} implique l'acceptation sans réserve des présentes CGP. Les présentes CGP prévalent sur tout autre document, sauf accord écrit et préalable du Prestataire.
          </Text>

          {/* Article 2 */}
          <Text style={S.articleTitle}>{art(2, "Identification du prestataire")}</Text>
          <View style={S.identRow}>
            <Text style={S.identLabel}>Raison sociale :</Text>
            <Text style={S.identValue}>{n(profile.societe)}</Text>
          </View>
          {(profile.prenom || profile.nom) && (
            <View style={S.identRow}>
              <Text style={S.identLabel}>Représentant :</Text>
              <Text style={S.identValue}>{[profile.prenom, profile.nom].filter(Boolean).join(' ')}</Text>
            </View>
          )}
          <View style={S.identRow}>
            <Text style={S.identLabel}>Adresse :</Text>
            <Text style={S.identValue}>{n(profile.adresse)}{profile.code_postal || profile.ville ? `, ${[profile.code_postal, profile.ville].filter(Boolean).join(' ')}` : ''}</Text>
          </View>
          <View style={S.identRow}>
            <Text style={S.identLabel}>Téléphone :</Text>
            <Text style={S.identValue}>{n(profile.telephone)}</Text>
          </View>
          <View style={S.identRow}>
            <Text style={S.identLabel}>Email :</Text>
            <Text style={S.identValue}>{n(profile.email)}</Text>
          </View>
          <View style={S.identRow}>
            <Text style={S.identLabel}>SIRET :</Text>
            <Text style={S.identValue}>{n(profile.siret)}</Text>
          </View>
          <View style={S.identRow}>
            <Text style={S.identLabel}>Code APE :</Text>
            <Text style={S.identValue}>{n(profile.code_ape)}</Text>
          </View>
          <View style={S.identRow}>
            <Text style={S.identLabel}>TVA intracommunautaire :</Text>
            <Text style={S.identValue}>{n(profile.tva_intracom)}</Text>
          </View>
          <View style={S.identRow}>
            <Text style={S.identLabel}>Assurance RC Pro :</Text>
            <Text style={S.identValue}>{n(profile.assurance_nom)}{profile.assurance_contrat ? ` — Contrat n° ${profile.assurance_contrat}` : ''}</Text>
          </View>

          {/* Article 3 */}
          <Text style={S.articleTitle}>{art(3, 'Définitions')}</Text>
          <Text style={S.paragraph}>
            « Mission » : l'ensemble des prestations de maîtrise d'œuvre confiées à {societe} par le Maître d'Ouvrage, définies dans le contrat ou le devis d'honoraires signé entre les parties.
          </Text>
          <Text style={S.paragraph}>
            « Maître d'Ouvrage » : la personne physique ou morale qui confie à {societe} une mission de maîtrise d'œuvre.
          </Text>
          <Text style={S.paragraph}>
            « Ouvrage » : la construction, réhabilitation ou aménagement faisant l'objet de la mission.
          </Text>

          {/* Article 4 */}
          <Text style={S.articleTitle}>{art(4, 'Missions de maîtrise d\'œuvre')}</Text>
          <Text style={S.paragraph}>
            Les missions proposées par {societe} peuvent comprendre, selon les besoins du Maître d'Ouvrage : les études d'esquisse (ESQ), les études de faisabilité, l'avant-projet sommaire (APS), l'avant-projet définitif (APD), le projet (PRO), les pièces nécessaires à la consultation des entreprises (ACT), l'assistance au contrat de travaux (ACT), la direction de l'exécution des contrats de travaux (DET), l'ordonnancement, le pilotage et la coordination (OPC), et l'assistance aux opérations de réception (AOR).
          </Text>
          <Text style={S.paragraph}>
            Le périmètre exact de la mission est défini dans le contrat ou le devis d'honoraires signé entre les parties.
          </Text>
        </View>

        {/* Pied de page */}
        <View style={S.footer} fixed>
          <Text style={S.footerText}>{societe} — CGP Maîtrise d'œuvre</Text>
          <Text style={S.footerText} render={({ pageNumber, totalPages }) => `Page ${pageNumber} / ${totalPages}`} />
        </View>
      </Page>

      <Page size="A4" style={S.page}>
        <View style={S.body}>
          {/* Article 5 */}
          <Text style={S.articleTitle}>{art(5, 'Obligations du prestataire')}</Text>
          <Text style={S.paragraph}>
            {societe} s'engage à exécuter sa mission avec soin, diligence et compétence, conformément aux règles de l'art et à la réglementation en vigueur. {societe} est tenu à une obligation de moyens.
          </Text>
          <Text style={S.paragraph}>
            {societe} est titulaire d'une assurance responsabilité civile professionnelle et garantie décennale couvrant les risques liés à l'exercice de ses activités.
          </Text>

          {/* Article 6 */}
          <Text style={S.articleTitle}>{art(6, 'Obligations du maître d\'ouvrage')}</Text>
          <Text style={S.paragraph}>
            Le Maître d'Ouvrage s'engage à fournir en temps utile à {societe} tous les éléments, informations et documents nécessaires à la bonne exécution de la mission. Il s'engage également à prendre les décisions nécessaires dans les délais convenus.
          </Text>
          <Text style={S.paragraph}>
            Le Maître d'Ouvrage garantit être propriétaire ou avoir les droits nécessaires sur le bien objet de la mission.
          </Text>

          {/* Article 7 */}
          <Text style={S.articleTitle}>{art(7, 'Honoraires et modalités de paiement')}</Text>
          <Text style={S.paragraph}>
            Les honoraires sont fixés dans le devis ou contrat d'honoraires signé entre les parties. Ils sont exprimés en euros hors taxes. La TVA applicable est celle en vigueur au jour de la facturation.
          </Text>
          <Text style={S.paragraph}>
            Sauf stipulation contraire, les factures sont payables à réception. Tout retard de paiement donnera lieu, de plein droit et sans mise en demeure préalable, à des pénalités de retard calculées au taux légal majoré de 3 points, ainsi qu'à une indemnité forfaitaire de recouvrement de 40 €.
          </Text>

          {/* Article 8 */}
          <Text style={S.articleTitle}>{art(8, 'Délais et planning')}</Text>
          <Text style={S.paragraph}>
            Les délais d'exécution sont donnés à titre indicatif, sauf mention expresse de délai impératif dans le contrat. {societe} ne saurait être tenu responsable de retards imputables au Maître d'Ouvrage, aux entreprises, aux administrations ou à des circonstances extérieures.
          </Text>

          {/* Article 9 */}
          <Text style={S.articleTitle}>{art(9, 'Responsabilité et assurance')}</Text>
          <Text style={S.paragraph}>
            La responsabilité de {societe} est limitée au montant des honoraires perçus au titre de la mission concernée, sauf faute lourde ou dolosive. {societe} ne peut être tenu responsable des dommages indirects ou consécutifs.
          </Text>
          <Text style={S.paragraph}>
            {societe} dispose d'une assurance responsabilité civile professionnelle. Les coordonnées de l'assureur sont mentionnées à l'article 2.
          </Text>

          {/* Article 10 */}
          <Text style={S.articleTitle}>{art(10, 'Propriété intellectuelle')}</Text>
          <Text style={S.paragraph}>
            Les études, plans, esquisses, maquettes et documents produits par {societe} dans le cadre de sa mission sont protégés par le droit d'auteur. Leur reproduction, diffusion ou utilisation à d'autres fins que celles prévues au contrat est soumise à l'accord préalable et écrit de {societe}.
          </Text>
          <Text style={S.paragraph}>
            Le Maître d'Ouvrage dispose d'un droit d'utilisation des documents remis, limité au projet objet du contrat.
          </Text>

          {/* Article 11 */}
          <Text style={S.articleTitle}>{art(11, 'Confidentialité')}</Text>
          <Text style={S.paragraph}>
            {societe} s'engage à conserver confidentielles toutes les informations communiquées par le Maître d'Ouvrage dans le cadre de la mission et à ne pas les divulguer à des tiers sans son accord préalable, sauf obligation légale.
          </Text>

          {/* Article 12 */}
          <Text style={S.articleTitle}>{art(12, 'Modification du contrat')}</Text>
          <Text style={S.paragraph}>
            Toute modification de la mission initiale (prestations supplémentaires, changement de programme, contraintes nouvelles) fera l'objet d'un avenant signé entre les parties, précisant les nouvelles prestations et les honoraires correspondants.
          </Text>

          {/* Article 13 */}
          <Text style={S.articleTitle}>{art(13, 'Résiliation')}</Text>
          <Text style={S.paragraph}>
            En cas de manquement grave de l'une des parties à ses obligations, l'autre partie pourra résilier le contrat de plein droit après mise en demeure restée sans effet pendant 15 jours.
          </Text>
          <Text style={S.paragraph}>
            En cas de résiliation à l'initiative du Maître d'Ouvrage, {societe} sera rémunéré pour les prestations effectuées jusqu'à la date de résiliation, majorées d'une indemnité de 15 % des honoraires restant à courir.
          </Text>

          {/* Article 14 */}
          <Text style={S.articleTitle}>{art(14, 'Force majeure')}</Text>
          <Text style={S.paragraph}>
            Ni {societe} ni le Maître d'Ouvrage ne pourront être tenus responsables de l'inexécution ou du retard dans l'exécution de leurs obligations lorsque ceux-ci résultent d'un cas de force majeure au sens de l'article 1218 du Code civil.
          </Text>

          {/* Article 15 */}
          <Text style={S.articleTitle}>{art(15, 'Protection des données personnelles')}</Text>
          <Text style={S.paragraph}>
            Les données personnelles collectées dans le cadre de la relation contractuelle sont traitées conformément au Règlement (UE) 2016/679 (RGPD). Elles sont utilisées uniquement pour les besoins de l'exécution de la mission. Le Maître d'Ouvrage dispose d'un droit d'accès, de rectification et de suppression de ses données.
          </Text>

          {/* Article 16 */}
          <Text style={S.articleTitle}>{art(16, 'Médiation et règlement des litiges')}</Text>
          <Text style={S.paragraph}>
            En cas de litige relatif à la formation, l'exécution ou l'interprétation des présentes, les parties s'engagent à rechercher une solution amiable avant tout recours judiciaire. À défaut d'accord, elles pourront faire appel à un médiateur agréé.
          </Text>

          {/* Article 17 */}
          <Text style={S.articleTitle}>{art(17, 'Droit applicable et juridiction compétente')}</Text>
          <Text style={S.paragraph}>
            Les présentes CGP sont soumises au droit français. En cas de litige non résolu par voie amiable, les tribunaux français seront seuls compétents.
          </Text>
          <Text style={S.paragraph}>
            Fait et applicable à compter du {today}.
          </Text>
        </View>

        <View style={S.footer} fixed>
          <Text style={S.footerText}>{societe} — CGP Maîtrise d'œuvre</Text>
          <Text style={S.footerText} render={({ pageNumber, totalPages }) => `Page ${pageNumber} / ${totalPages}`} />
        </View>
      </Page>
    </Document>
  )
}
