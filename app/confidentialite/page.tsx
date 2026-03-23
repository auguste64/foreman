import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Politique de confidentialité — The Builder',
  description: 'Politique de confidentialité et traitement des données personnelles du SaaS The Builder.',
}

const sectionStyle: React.CSSProperties = {
  marginBottom: '48px',
}

const h2Style: React.CSSProperties = {
  fontFamily: 'var(--font-syne), sans-serif',
  fontSize: '20px',
  fontWeight: 700,
  color: '#ea580c',
  marginBottom: '16px',
  letterSpacing: '-0.3px',
}

const pStyle: React.CSSProperties = {
  fontSize: '15px',
  lineHeight: '1.8',
  color: '#C8C4BC',
  marginBottom: '8px',
}

const strongStyle: React.CSSProperties = {
  color: '#F0EDE6',
  fontWeight: 500,
}

const listStyle: React.CSSProperties = {
  fontSize: '15px',
  lineHeight: '1.8',
  color: '#C8C4BC',
  paddingLeft: '20px',
  marginBottom: '8px',
}

export default function Confidentialite() {
  return (
    <div
      style={{
        background: '#0D0D0B',
        color: '#F0EDE6',
        minHeight: '100vh',
        fontFamily: 'var(--font-dm-sans), DM Sans, sans-serif',
        position: 'relative',
        zIndex: 2,
      }}
    >
      <div
        style={{
          maxWidth: '760px',
          margin: '0 auto',
          padding: '100px 32px 80px',
        }}
      >
        {/* Back link */}
        <a
          href="/"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '13px',
            color: '#8A8880',
            textDecoration: 'none',
            marginBottom: '48px',
          }}
        >
          ← The Builder
        </a>

        <h1
          style={{
            fontFamily: 'var(--font-syne), sans-serif',
            fontSize: 'clamp(28px, 4vw, 40px)',
            fontWeight: 800,
            color: '#F0EDE6',
            letterSpacing: '-1px',
            marginBottom: '12px',
          }}
        >
          Politique de confidentialité
        </h1>
        <p style={{ fontSize: '14px', color: '#8A8880', marginBottom: '64px' }}>
          Conformément au Règlement Général sur la Protection des Données (RGPD — UE 2016/679).
        </p>

        <hr style={{ border: 'none', borderTop: '1px solid #1E1E1C', marginBottom: '48px' }} />

        {/* Responsable du traitement */}
        <div style={sectionStyle}>
          <h2 style={h2Style}>1. Responsable du traitement</h2>
          <p style={pStyle}><span style={strongStyle}>Identité :</span> Auguste Bouvée — ETXELAB</p>
          <p style={pStyle}><span style={strongStyle}>Statut :</span> Auto-entrepreneur</p>
          <p style={pStyle}><span style={strongStyle}>SIREN :</span> 929 461 887</p>
          <p style={pStyle}><span style={strongStyle}>Adresse :</span> 1 avenue des Oeillets, 64600 Anglet, France</p>
          <p style={pStyle}>
            <span style={strongStyle}>Contact :</span>{' '}
            <a href="mailto:contact@thebuilder.io" style={{ color: '#ea580c', textDecoration: 'none' }}>
              contact@thebuilder.io
            </a>
          </p>
        </div>

        {/* Données collectées */}
        <div style={sectionStyle}>
          <h2 style={h2Style}>2. Données collectées</h2>
          <p style={pStyle}>Dans le cadre de l&apos;utilisation du service The Builder, les données suivantes sont susceptibles d&apos;être collectées :</p>
          <ul style={listStyle}>
            <li><span style={strongStyle}>Données d&apos;identification :</span> nom, prénom, adresse e-mail</li>
            <li><span style={strongStyle}>Données de chantier :</span> informations relatives aux projets de construction (artisans, clients, planning, comptes rendus)</li>
            <li><span style={strongStyle}>Données de paiement :</span> traitées exclusivement par Stripe (numéros de carte non stockés par ETXELAB)</li>
            <li><span style={strongStyle}>Données de connexion :</span> adresse IP, type de navigateur, pages consultées (à des fins de sécurité et de débogage)</li>
          </ul>
        </div>

        {/* Finalités */}
        <div style={sectionStyle}>
          <h2 style={h2Style}>3. Finalités du traitement</h2>
          <p style={pStyle}>Les données sont traitées pour les finalités suivantes :</p>
          <ul style={listStyle}>
            <li>Fourniture et amélioration du service The Builder</li>
            <li>Gestion de la facturation et des abonnements (via Stripe)</li>
            <li>Envoi d&apos;e-mails transactionnels liés à l&apos;utilisation du service (via Resend)</li>
            <li>Support utilisateur et réponse aux demandes</li>
            <li>Respect des obligations légales et réglementaires</li>
          </ul>
        </div>

        {/* Base légale */}
        <div style={sectionStyle}>
          <h2 style={h2Style}>4. Base légale</h2>
          <p style={pStyle}>
            Le traitement de vos données repose sur l&apos;exécution du contrat d&apos;abonnement au service The Builder (article 6.1.b du RGPD). Pour les communications marketing éventuelles, le traitement repose sur votre consentement préalable.
          </p>
        </div>

        {/* Hébergement et sous-traitants */}
        <div style={sectionStyle}>
          <h2 style={h2Style}>5. Hébergement des données</h2>
          <p style={pStyle}>Vos données sont hébergées par les sous-traitants suivants :</p>
          <ul style={listStyle}>
            <li>
              <span style={strongStyle}>Vercel Inc.</span> — Hébergement de l&apos;application web.
              340 Pine Street, San Francisco, CA 94104, États-Unis.
              Vercel est soumis au Data Privacy Framework UE-États-Unis.
            </li>
            <li>
              <span style={strongStyle}>Supabase</span> — Hébergement de la base de données.
              Données stockées à Dublin, Irlande (Union Européenne). Conforme au RGPD.
            </li>
            <li>
              <span style={strongStyle}>Stripe Inc.</span> — Traitement des paiements.
              Les données de paiement sont régies par la politique de confidentialité de Stripe.
            </li>
            <li>
              <span style={strongStyle}>Resend</span> — Envoi des e-mails transactionnels.
            </li>
          </ul>
          <p style={pStyle}>
            Les données de la base de données (Supabase) sont hébergées au sein de l&apos;Union Européenne (Dublin, Irlande) et bénéficient du niveau de protection garanti par le RGPD.
          </p>
        </div>

        {/* Durée de conservation */}
        <div style={sectionStyle}>
          <h2 style={h2Style}>6. Durée de conservation</h2>
          <p style={pStyle}>
            Vos données sont conservées pendant toute la durée de votre abonnement actif, puis pendant une période de <span style={strongStyle}>3 ans</span> à compter de la résiliation, conformément aux obligations légales en matière de conservation des données comptables et fiscales.
          </p>
          <p style={pStyle}>
            À l&apos;issue de cette période, vos données sont supprimées ou anonymisées de manière irréversible.
          </p>
        </div>

        {/* Droits des utilisateurs */}
        <div style={sectionStyle}>
          <h2 style={h2Style}>7. Vos droits</h2>
          <p style={pStyle}>Conformément au RGPD, vous disposez des droits suivants sur vos données personnelles :</p>
          <ul style={listStyle}>
            <li><span style={strongStyle}>Droit d&apos;accès :</span> obtenir une copie des données vous concernant</li>
            <li><span style={strongStyle}>Droit de rectification :</span> corriger des données inexactes ou incomplètes</li>
            <li><span style={strongStyle}>Droit à l&apos;effacement :</span> demander la suppression de vos données (« droit à l&apos;oubli »)</li>
            <li><span style={strongStyle}>Droit à la portabilité :</span> recevoir vos données dans un format structuré et lisible</li>
            <li><span style={strongStyle}>Droit d&apos;opposition :</span> vous opposer au traitement de vos données</li>
            <li><span style={strongStyle}>Droit à la limitation :</span> demander la limitation du traitement</li>
          </ul>
          <p style={pStyle}>
            Pour exercer ces droits, contactez-nous à{' '}
            <a href="mailto:contact@thebuilder.io" style={{ color: '#ea580c', textDecoration: 'none' }}>
              contact@thebuilder.io
            </a>.
            Nous nous engageons à répondre dans un délai maximum d&apos;un mois.
          </p>
          <p style={pStyle}>
            Vous avez également le droit d&apos;introduire une réclamation auprès de la Commission Nationale de l&apos;Informatique et des Libertés (CNIL) : <a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer" style={{ color: '#ea580c', textDecoration: 'none' }}>cnil.fr</a>.
          </p>
        </div>

        {/* Cookies */}
        <div style={sectionStyle}>
          <h2 style={h2Style}>8. Cookies</h2>
          <p style={pStyle}>
            The Builder n&apos;utilise pas de cookies tiers à des fins publicitaires ou de tracking.
          </p>
          <p style={pStyle}>
            Le seul cookie utilisé est le cookie de session Supabase, strictement nécessaire au fonctionnement de l&apos;authentification. Ce cookie n&apos;est pas partagé avec des tiers.
          </p>
        </div>

        {/* DPO */}
        <div style={sectionStyle}>
          <h2 style={h2Style}>9. Délégué à la protection des données (DPO)</h2>
          <p style={pStyle}>
            En l&apos;absence d&apos;obligation légale de désigner un DPO pour une structure de cette taille, le responsable du traitement assume directement cette fonction.
          </p>
          <p style={pStyle}>
            Contact :{' '}
            <a href="mailto:contact@thebuilder.io" style={{ color: '#ea580c', textDecoration: 'none' }}>
              contact@thebuilder.io
            </a>
          </p>
        </div>

        <hr style={{ border: 'none', borderTop: '1px solid #1E1E1C', marginBottom: '32px' }} />

        <p style={{ fontSize: '13px', color: '#8A8880' }}>
          Dernière mise à jour : mars 2026
        </p>
      </div>
    </div>
  )
}
