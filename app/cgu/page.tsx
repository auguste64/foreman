import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: "Conditions générales d'utilisation — The Builder",
  description: "Conditions générales d'utilisation du SaaS The Builder, édité par ETXELAB / Auguste Bouvée.",
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

export default function CGU() {
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
          Conditions générales d&apos;utilisation
        </h1>
        <p style={{ fontSize: '14px', color: '#8A8880', marginBottom: '64px' }}>
          En vigueur à compter du 1er mars 2026 — ETXELAB / Auguste Bouvée
        </p>

        <hr style={{ border: 'none', borderTop: '1px solid #1E1E1C', marginBottom: '48px' }} />

        {/* Objet */}
        <div style={sectionStyle}>
          <h2 style={h2Style}>1. Objet du service</h2>
          <p style={pStyle}>
            The Builder est un logiciel SaaS (Software as a Service) de gestion de chantier édité par ETXELAB (Auguste Bouvée, auto-entrepreneur, SIREN 929 461 887), ci-après dénommé &laquo; l&apos;Éditeur &raquo;.
          </p>
          <p style={pStyle}>
            Le service permet aux architectes, maîtres d&apos;œuvre et professionnels du bâtiment de gérer leurs chantiers, artisans, clients, comptabilité et planning depuis une interface unifiée accessible en ligne sur thebuilder.io.
          </p>
        </div>

        {/* Acceptation */}
        <div style={sectionStyle}>
          <h2 style={h2Style}>2. Acceptation des CGU</h2>
          <p style={pStyle}>
            L&apos;utilisation du service The Builder implique l&apos;acceptation pleine et entière des présentes Conditions Générales d&apos;Utilisation (CGU). Si vous n&apos;acceptez pas ces conditions, vous ne devez pas utiliser le service.
          </p>
          <p style={pStyle}>
            L&apos;Éditeur se réserve le droit de modifier les présentes CGU à tout moment. Les utilisateurs seront informés de toute modification substantielle par e-mail ou notification dans l&apos;application.
          </p>
        </div>

        {/* Plans */}
        <div style={sectionStyle}>
          <h2 style={h2Style}>3. Description des offres</h2>
          <p style={pStyle}>Le service The Builder est proposé selon deux formules d&apos;abonnement :</p>

          <div style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid #1E1E1C',
            borderRadius: '12px',
            padding: '24px',
            marginBottom: '16px',
          }}>
            <p style={{ ...pStyle, marginBottom: '4px' }}>
              <span style={{ ...strongStyle, fontFamily: 'var(--font-syne)', fontSize: '16px' }}>Plan Essentiel</span>
              {' '}<span style={{ color: '#ea580c', fontWeight: 600 }}>— 11,90 € / mois</span>
            </p>
            <p style={pStyle}>Comptes rendus PDF, répertoire artisans &amp; clients, planning / calendrier.</p>
          </div>

          <div style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(234,88,12,0.3)',
            borderRadius: '12px',
            padding: '24px',
            marginBottom: '16px',
          }}>
            <p style={{ ...pStyle, marginBottom: '4px' }}>
              <span style={{ ...strongStyle, fontFamily: 'var(--font-syne)', fontSize: '16px' }}>Plan Pro</span>
              {' '}<span style={{ color: '#ea580c', fontWeight: 600 }}>— 18,90 € / mois</span>
            </p>
            <p style={pStyle}>Toutes les fonctionnalités du plan Essentiel, plus : comptabilité (devis &amp; factures), analyse &amp; statistiques, et toutes les futures fonctionnalités.</p>
          </div>

          <p style={pStyle}>
            Les tarifs sont indiqués TTC (TVA non applicable, article 293 B du CGI — auto-entrepreneur). L&apos;Éditeur se réserve le droit de modifier ses tarifs avec un préavis de 30 jours.
          </p>
        </div>

        {/* Inscription */}
        <div style={sectionStyle}>
          <h2 style={h2Style}>4. Inscription et compte utilisateur</h2>
          <p style={pStyle}>
            L&apos;accès au service nécessite la création d&apos;un compte avec une adresse e-mail valide. L&apos;utilisateur est responsable de la confidentialité de ses identifiants et de toutes les actions effectuées depuis son compte.
          </p>
          <p style={pStyle}>
            L&apos;utilisateur s&apos;engage à fournir des informations exactes et à les maintenir à jour. Tout usage frauduleux ou non autorisé du compte doit être signalé immédiatement à{' '}
            <a href="mailto:contact@thebuilder.io" style={{ color: '#ea580c', textDecoration: 'none' }}>
              contact@thebuilder.io
            </a>.
          </p>
          <p style={pStyle}>
            L&apos;Éditeur se réserve le droit de refuser l&apos;inscription ou de suspendre un compte ne respectant pas les présentes CGU.
          </p>
        </div>

        {/* Paiement */}
        <div style={sectionStyle}>
          <h2 style={h2Style}>5. Paiement et facturation</h2>
          <p style={pStyle}>
            L&apos;abonnement est facturé <span style={strongStyle}>mensuellement</span>, à terme échu, via la solution de paiement sécurisé Stripe. Le premier prélèvement intervient à la souscription.
          </p>
          <p style={pStyle}>
            L&apos;abonnement est <span style={strongStyle}>sans engagement</span> : l&apos;utilisateur peut résilier à tout moment depuis son espace personnel ou en contactant l&apos;Éditeur. La résiliation prend effet à la fin de la période d&apos;abonnement en cours. Aucun remboursement prorata temporis n&apos;est effectué.
          </p>
          <p style={pStyle}>
            En cas d&apos;échec de paiement, l&apos;accès au service peut être suspendu après un délai de grâce raisonnable, à l&apos;issue duquel l&apos;Éditeur tentera de recontacter l&apos;utilisateur par e-mail.
          </p>
        </div>

        {/* Données et confidentialité */}
        <div style={sectionStyle}>
          <h2 style={h2Style}>6. Données et confidentialité</h2>
          <p style={pStyle}>
            Le traitement des données personnelles des utilisateurs est régi par la{' '}
            <a href="/confidentialite" style={{ color: '#ea580c', textDecoration: 'none' }}>
              Politique de confidentialité
            </a>{' '}
            de The Builder, conforme au Règlement Général sur la Protection des Données (RGPD).
          </p>
          <p style={pStyle}>
            Les données saisies par l&apos;utilisateur (chantiers, clients, artisans, documents) lui appartiennent. L&apos;Éditeur ne les exploite pas à des fins commerciales et ne les cède pas à des tiers.
          </p>
        </div>

        {/* Propriété intellectuelle */}
        <div style={sectionStyle}>
          <h2 style={h2Style}>7. Propriété intellectuelle</h2>
          <p style={pStyle}>
            L&apos;ensemble des éléments constituant le service The Builder (interface, code source, design, marque, logotype) est la propriété exclusive d&apos;ETXELAB. Toute reproduction, modification ou utilisation non autorisée est strictement interdite.
          </p>
          <p style={pStyle}>
            L&apos;abonnement confère à l&apos;utilisateur un droit d&apos;usage personnel, non exclusif et non cessible du service. Ce droit prend fin automatiquement à la résiliation de l&apos;abonnement.
          </p>
        </div>

        {/* Responsabilités */}
        <div style={sectionStyle}>
          <h2 style={h2Style}>8. Responsabilités et limitations</h2>
          <p style={pStyle}>
            L&apos;Éditeur s&apos;engage à mettre en œuvre tous les moyens raisonnables pour assurer la disponibilité et la sécurité du service. Toutefois, The Builder est fourni &laquo; en l&apos;état &raquo; et l&apos;Éditeur ne peut garantir une disponibilité à 100 %.
          </p>
          <p style={pStyle}>L&apos;Éditeur ne saurait être tenu responsable :</p>
          <ul style={listStyle}>
            <li>d&apos;une interruption de service due à une maintenance planifiée ou à une défaillance technique</li>
            <li>de la perte de données consécutive à une défaillance technique imprévue (des sauvegardes régulières sont effectuées)</li>
            <li>d&apos;un usage inapproprié du service par l&apos;utilisateur</li>
            <li>des préjudices indirects résultant de l&apos;utilisation du service</li>
          </ul>
          <p style={pStyle}>
            La responsabilité de l&apos;Éditeur est en tout état de cause limitée au montant des sommes effectivement versées par l&apos;utilisateur au cours des 12 mois précédant le sinistre.
          </p>
        </div>

        {/* Résiliation */}
        <div style={sectionStyle}>
          <h2 style={h2Style}>9. Résiliation</h2>
          <p style={pStyle}>
            <span style={strongStyle}>Par l&apos;utilisateur :</span> L&apos;utilisateur peut résilier son abonnement à tout moment, sans justification, depuis son espace personnel ou en contactant l&apos;Éditeur à{' '}
            <a href="mailto:contact@thebuilder.io" style={{ color: '#ea580c', textDecoration: 'none' }}>
              contact@thebuilder.io
            </a>. L&apos;accès au service reste actif jusqu&apos;à la fin de la période payée en cours.
          </p>
          <p style={pStyle}>
            <span style={strongStyle}>Par l&apos;Éditeur :</span> L&apos;Éditeur se réserve le droit de résilier ou suspendre l&apos;accès au service en cas de violation des présentes CGU, notamment en cas d&apos;utilisation frauduleuse, de non-paiement persistant ou de comportement nuisant à l&apos;intégrité du service. L&apos;utilisateur sera notifié par e-mail.
          </p>
          <p style={pStyle}>
            À l&apos;issue de la résiliation, les données de l&apos;utilisateur sont conservées pendant 3 ans conformément aux obligations légales, puis supprimées.
          </p>
        </div>

        {/* Droit applicable */}
        <div style={sectionStyle}>
          <h2 style={h2Style}>10. Droit applicable et juridiction compétente</h2>
          <p style={pStyle}>
            Les présentes CGU sont soumises au <span style={strongStyle}>droit français</span>. En cas de litige relatif à l&apos;interprétation ou à l&apos;exécution des présentes conditions, les parties s&apos;engagent à rechercher une solution amiable dans un premier temps.
          </p>
          <p style={pStyle}>
            À défaut de résolution amiable, tout litige sera soumis à la compétence exclusive du <span style={strongStyle}>Tribunal compétent de Bayonne (France)</span>.
          </p>
        </div>

        {/* Modifications CGU */}
        <div style={sectionStyle}>
          <h2 style={h2Style}>11. Modifications des CGU</h2>
          <p style={pStyle}>
            L&apos;Éditeur se réserve le droit de modifier les présentes CGU à tout moment. Les utilisateurs seront informés de toute modification significative par e-mail au moins 15 jours avant leur entrée en vigueur.
          </p>
          <p style={pStyle}>
            La poursuite de l&apos;utilisation du service après modification des CGU vaut acceptation des nouvelles conditions. Si vous refusez les nouvelles CGU, vous devez résilier votre abonnement avant leur entrée en vigueur.
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
