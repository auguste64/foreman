import React from 'react'
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import type { CgvProfile } from './cgv'

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
  sectionTitle: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: '#111111',
    marginBottom: 8,
    marginTop: 16,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 3,
  },
  label: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: '#555555',
    width: 140,
  },
  value: {
    fontSize: 8,
    color: '#1a1a1a',
    flex: 1,
  },
  paragraph: {
    fontSize: 9,
    lineHeight: 1.5,
    color: '#2a2a2a',
    marginBottom: 4,
  },
  signatureBox: {
    border: '1px solid #cccccc',
    borderRadius: 4,
    padding: '12 16',
    marginTop: 8,
  },
  signatureLabel: {
    fontSize: 8,
    color: '#555555',
    marginBottom: 30,
  },
  signatureLine: {
    borderTopWidth: 1,
    borderTopColor: '#999999',
    borderTopStyle: 'solid',
    paddingTop: 4,
  },
  signatureLineText: {
    fontSize: 7,
    color: '#888888',
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

const n = (v?: string | null) => v || '___________________________'

export function ContratMoeDocument({ profile }: { profile: CgvProfile }) {
  const societe = profile.societe || 'Le Prestataire'
  const today = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <Document>
      <Page size="A4" style={S.page}>
        <View style={S.header}>
          <Text style={S.headerTitle}>Contrat de Maîtrise d'Œuvre</Text>
          <Text style={S.headerSub}>Entre les soussignés — Modèle {societe}</Text>
        </View>

        <View style={S.body}>
          {/* Maître d'œuvre */}
          <Text style={S.sectionTitle}>Le Maître d'Œuvre</Text>
          <View style={S.row}>
            <Text style={S.label}>Société :</Text>
            <Text style={S.value}>{n(profile.societe)}</Text>
          </View>
          {(profile.prenom || profile.nom) && (
            <View style={S.row}>
              <Text style={S.label}>Représentant :</Text>
              <Text style={S.value}>{[profile.prenom, profile.nom].filter(Boolean).join(' ')}</Text>
            </View>
          )}
          <View style={S.row}>
            <Text style={S.label}>Adresse :</Text>
            <Text style={S.value}>{n(profile.adresse)}{profile.code_postal || profile.ville ? `, ${[profile.code_postal, profile.ville].filter(Boolean).join(' ')}` : ''}</Text>
          </View>
          <View style={S.row}>
            <Text style={S.label}>Téléphone :</Text>
            <Text style={S.value}>{n(profile.telephone)}</Text>
          </View>
          <View style={S.row}>
            <Text style={S.label}>Email :</Text>
            <Text style={S.value}>{n(profile.email)}</Text>
          </View>
          <View style={S.row}>
            <Text style={S.label}>SIRET :</Text>
            <Text style={S.value}>{n(profile.siret)}</Text>
          </View>
          <View style={S.row}>
            <Text style={S.label}>Assurance RC Pro :</Text>
            <Text style={S.value}>{n(profile.assurance_nom)}{profile.assurance_contrat ? ` — n° ${profile.assurance_contrat}` : ''}</Text>
          </View>

          {/* Maître d'ouvrage */}
          <Text style={S.sectionTitle}>Le Maître d'Ouvrage</Text>
          <View style={S.row}>
            <Text style={S.label}>Nom / Raison sociale :</Text>
            <Text style={S.value}>___________________________</Text>
          </View>
          <View style={S.row}>
            <Text style={S.label}>Adresse :</Text>
            <Text style={S.value}>___________________________</Text>
          </View>
          <View style={S.row}>
            <Text style={S.label}>Téléphone :</Text>
            <Text style={S.value}>___________________________</Text>
          </View>
          <View style={S.row}>
            <Text style={S.label}>Email :</Text>
            <Text style={S.value}>___________________________</Text>
          </View>

          {/* Objet de la mission */}
          <Text style={S.sectionTitle}>Objet de la mission</Text>
          <View style={S.row}>
            <Text style={S.label}>Adresse du chantier :</Text>
            <Text style={S.value}>___________________________</Text>
          </View>
          <View style={S.row}>
            <Text style={S.label}>Nature des travaux :</Text>
            <Text style={S.value}>___________________________</Text>
          </View>
          <View style={S.row}>
            <Text style={S.label}>Budget estimatif :</Text>
            <Text style={S.value}>_______________ € HT</Text>
          </View>

          {/* Missions */}
          <Text style={S.sectionTitle}>Missions confiées</Text>
          <Text style={S.paragraph}>
            Le Maître d'Ouvrage confie à {societe} les missions suivantes (cocher les missions concernées) :
          </Text>
          {['☐  ESQ — Esquisse', '☐  APS — Avant-Projet Sommaire', '☐  APD — Avant-Projet Définitif', '☐  PRO — Projet', '☐  ACT — Assistance aux Contrats de Travaux', '☐  DET — Direction de l\'Exécution des Travaux', '☐  OPC — Ordonnancement, Pilotage, Coordination', '☐  AOR — Assistance aux Opérations de Réception'].map((m, i) => (
            <Text key={i} style={{ ...S.paragraph, marginBottom: 2 }}>{m}</Text>
          ))}

          {/* Honoraires */}
          <Text style={S.sectionTitle}>Honoraires</Text>
          <View style={S.row}>
            <Text style={S.label}>Montant HT :</Text>
            <Text style={S.value}>_______________ € HT</Text>
          </View>
          <View style={S.row}>
            <Text style={S.label}>TVA (20%) :</Text>
            <Text style={S.value}>_______________ €</Text>
          </View>
          <View style={S.row}>
            <Text style={S.label}>Montant TTC :</Text>
            <Text style={S.value}>_______________ € TTC</Text>
          </View>
          <Text style={S.paragraph} style={{ ...S.paragraph, marginTop: 8 }}>
            Les modalités de règlement et l'échéancier détaillé sont définis en annexe.
          </Text>

          {/* Durée */}
          <Text style={S.sectionTitle}>Durée</Text>
          <View style={S.row}>
            <Text style={S.label}>Date de début :</Text>
            <Text style={S.value}>___________________________</Text>
          </View>
          <View style={S.row}>
            <Text style={S.label}>Date de fin prévisionnelle :</Text>
            <Text style={S.value}>___________________________</Text>
          </View>

          {/* Dispositions */}
          <Text style={S.sectionTitle}>Dispositions générales</Text>
          <Text style={S.paragraph}>
            Le présent contrat est régi par les Conditions Générales de Prestation de services de {societe}, dont le Maître d'Ouvrage reconnaît avoir pris connaissance et accepté sans réserve. Le droit applicable est le droit français.
          </Text>

          {/* Signatures */}
          <Text style={S.sectionTitle}>Signatures</Text>
          <Text style={{ ...S.paragraph, marginBottom: 12 }}>
            Fait à _______________, le {today}, en deux exemplaires originaux.
          </Text>

          <View style={{ flexDirection: 'row', gap: 20 }}>
            <View style={{ ...S.signatureBox, flex: 1 }}>
              <Text style={S.signatureLabel}>Le Maître d'Œuvre</Text>
              <Text style={{ ...S.signatureLabel, marginBottom: 4, fontFamily: 'Helvetica-Bold', fontSize: 8 }}>{societe}</Text>
              <View style={S.signatureLine}>
                <Text style={S.signatureLineText}>Signature et cachet</Text>
              </View>
            </View>
            <View style={{ ...S.signatureBox, flex: 1 }}>
              <Text style={S.signatureLabel}>Le Maître d'Ouvrage</Text>
              <Text style={{ ...S.signatureLabel, marginBottom: 4, fontSize: 8 }}>Lu et approuvé</Text>
              <View style={S.signatureLine}>
                <Text style={S.signatureLineText}>Signature</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={S.footer} fixed>
          <Text style={S.footerText}>{societe} — Contrat MOE</Text>
          <Text style={S.footerText} render={({ pageNumber, totalPages }) => `Page ${pageNumber} / ${totalPages}`} />
        </View>
      </Page>
    </Document>
  )
}
