export type Clause = {
  id: string
  titre: string
  contenu: string
  ordre: number
  modifiable: boolean
}

export const DEFAULT_CGV_CLAUSES: Clause[] = [
  {
    id: 'cgv-1',
    titre: 'Objet des présentes conditions',
    contenu: `Les présentes conditions générales de prestation de services (ci-après « CGP ») ont pour objet de définir les modalités et conditions dans lesquelles le Prestataire réalise des missions de maîtrise d'œuvre et de conseil en architecture au profit de ses clients (ci-après « le Maître d'Ouvrage »).

Toute commande passée auprès du Prestataire implique l'acceptation sans réserve des présentes CGP. Les présentes CGP prévalent sur tout autre document, sauf accord écrit et préalable du Prestataire.`,
    ordre: 1,
    modifiable: true,
  },
  {
    id: 'cgv-2',
    titre: 'Honoraires et prix',
    contenu: `Les honoraires sont fixés dans le devis ou contrat d'honoraires signé entre les parties. Ils sont exprimés en euros hors taxes. La TVA applicable est celle en vigueur au jour de la facturation.

Toute prestation supplémentaire non prévue dans le périmètre initial fera l'objet d'un avenant précisant les nouvelles prestations et les honoraires correspondants.`,
    ordre: 2,
    modifiable: true,
  },
  {
    id: 'cgv-3',
    titre: 'Modalités de paiement',
    contenu: `Sauf stipulation contraire, les factures sont payables à réception dans un délai de 30 jours. Le paiement s'effectue par virement bancaire ou chèque.

Tout retard de paiement donnera lieu, de plein droit et sans mise en demeure préalable, à des pénalités de retard calculées au taux légal majoré de 3 points, ainsi qu'à une indemnité forfaitaire de recouvrement de 40 €. En cas de retard persistant, le Prestataire se réserve le droit de suspendre l'exécution de la mission.`,
    ordre: 3,
    modifiable: true,
  },
  {
    id: 'cgv-4',
    titre: 'Responsabilité',
    contenu: `La responsabilité du Prestataire est limitée au montant des honoraires perçus au titre de la mission concernée, sauf faute lourde ou dolosive. Le Prestataire ne peut être tenu responsable des dommages indirects ou consécutifs.

Le Prestataire dispose d'une assurance responsabilité civile professionnelle couvrant les risques liés à l'exercice de ses activités. Les coordonnées de l'assureur figurent dans la section d'identification du prestataire.`,
    ordre: 4,
    modifiable: true,
  },
  {
    id: 'cgv-5',
    titre: 'Protection des données personnelles',
    contenu: `Les données personnelles collectées dans le cadre de la relation contractuelle sont traitées conformément au Règlement (UE) 2016/679 (RGPD). Elles sont utilisées uniquement pour les besoins de l'exécution de la mission et ne sont pas transmises à des tiers sans accord préalable.

Le Maître d'Ouvrage dispose d'un droit d'accès, de rectification et de suppression de ses données personnelles en adressant une demande écrite au Prestataire.`,
    ordre: 5,
    modifiable: true,
  },
  {
    id: 'cgv-6',
    titre: 'Médiation et règlement des litiges',
    contenu: `En cas de litige relatif à la formation, l'exécution ou l'interprétation des présentes, les parties s'engagent à rechercher une solution amiable avant tout recours judiciaire. À défaut d'accord dans un délai de 30 jours, elles pourront faire appel à un médiateur agréé.

Les présentes CGP sont soumises au droit français. En cas de litige non résolu par voie amiable, les tribunaux français seront seuls compétents.`,
    ordre: 6,
    modifiable: true,
  },
]

export const DEFAULT_CONTRAT_MOE_CLAUSES: Clause[] = [
  {
    id: 'moe-1',
    titre: "Mission de maîtrise d'œuvre",
    contenu: `La mission de maîtrise d'œuvre confiée au Maître d'Œuvre comprend, selon le périmètre défini au contrat : les études d'esquisse (ESQ), l'avant-projet sommaire (APS), l'avant-projet définitif (APD), le projet (PRO), l'assistance à la consultation des entreprises (ACT), la direction de l'exécution des travaux (DET), l'ordonnancement, le pilotage et la coordination (OPC), et l'assistance aux opérations de réception (AOR).

Le périmètre exact de la mission est défini dans le contrat d'honoraires signé entre les parties. Toute extension de mission fera l'objet d'un avenant.`,
    ordre: 1,
    modifiable: true,
  },
  {
    id: 'moe-2',
    titre: 'Honoraires',
    contenu: `Les honoraires du Maître d'Œuvre sont calculés sur la base du montant estimatif des travaux, selon le taux défini au contrat. Ils sont exprimés en euros hors taxes et soumis à la TVA en vigueur au jour de la facturation.

Les honoraires sont facturés par tranches correspondant à l'avancement des phases de la mission. Le calendrier de facturation est défini dans le contrat d'honoraires.`,
    ordre: 2,
    modifiable: true,
  },
  {
    id: 'moe-3',
    titre: 'Planning et délais',
    contenu: `Les délais d'exécution sont définis d'un commun accord entre les parties et consignés dans le calendrier prévisionnel annexé au contrat. Le Maître d'Œuvre s'engage à respecter ces délais sauf circonstances extérieures indépendantes de sa volonté.

Tout retard imputable au Maître d'Ouvrage (décisions tardives, documents manquants, modifications de programme) entraîne automatiquement le report des délais convenus, sans pénalité pour le Maître d'Œuvre.`,
    ordre: 3,
    modifiable: true,
  },
  {
    id: 'moe-4',
    titre: 'Résiliation',
    contenu: `En cas de manquement grave de l'une des parties à ses obligations, l'autre partie pourra résilier le contrat de plein droit après mise en demeure restée sans effet pendant 15 jours.

En cas de résiliation à l'initiative du Maître d'Ouvrage, le Maître d'Œuvre sera rémunéré pour les prestations effectuées jusqu'à la date de résiliation, majorées d'une indemnité de 15 % des honoraires restant à courir au titre des phases non commencées.`,
    ordre: 4,
    modifiable: true,
  },
  {
    id: 'moe-5',
    titre: 'Assurance',
    contenu: `Le Maître d'Œuvre justifie être titulaire d'une assurance responsabilité civile professionnelle et, le cas échéant, d'une garantie décennale, couvrant les risques liés à l'exercice de ses missions. Les coordonnées de l'assureur sont mentionnées dans l'en-tête du présent contrat.

Le Maître d'Ouvrage s'engage à souscrire une assurance dommages-ouvrage avant l'ouverture du chantier, conformément à l'article L.242-1 du Code des assurances.`,
    ordre: 5,
    modifiable: true,
  },
  {
    id: 'moe-6',
    titre: 'Litiges',
    contenu: `En cas de différend relatif à l'interprétation ou à l'exécution du présent contrat, les parties s'engagent à privilégier une résolution amiable. À défaut d'accord dans un délai de 30 jours suivant la notification du litige, celui-ci sera soumis aux juridictions compétentes.

Le présent contrat est soumis au droit français.`,
    ordre: 6,
    modifiable: true,
  },
]
