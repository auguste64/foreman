import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Mentions légales — The Builder',
  description: 'Mentions légales du SaaS The Builder, édité par ETXELAB / Auguste Bouvée.',
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

export default function MentionsLegales() {
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
          Mentions légales
        </h1>
        <p style={{ fontSize: '14px', color: '#8A8880', marginBottom: '64px' }}>
          Conformément à la loi n° 2004-575 du 21 juin 2004 pour la confiance dans l&apos;économie numérique.
        </p>

        <hr style={{ border: 'none', borderTop: '1px solid #1E1E1C', marginBottom: '48px' }} />

        {/* Éditeur */}
        <div style={sectionStyle}>
          <h2 style={h2Style}>1. Éditeur du site</h2>
          <p style={pStyle}><span style={strongStyle}>Nom :</span> Auguste Bouvée</p>
          <p style={pStyle}><span style={strongStyle}>Statut :</span> Auto-entrepreneur</p>
          <p style={pStyle}><span style={strongStyle}>Nom commercial :</span> ETXELAB</p>
          <p style={pStyle}><span style={strongStyle}>SIREN :</span> 929 461 887</p>
          <p style={pStyle}><span style={strongStyle}>Adresse :</span> 1 avenue des Oeillets, 64600 Anglet, France</p>
          <p style={pStyle}><span style={strongStyle}>Activité :</span> Programmation informatique (code APE 6201Z)</p>
          <p style={pStyle}>
            <span style={strongStyle}>Contact :</span>{' '}
            <a href="mailto:contact@thebuilder.io" style={{ color: '#ea580c', textDecoration: 'none' }}>
              contact@thebuilder.io
            </a>
          </p>
        </div>

        {/* Directeur de publication */}
        <div style={sectionStyle}>
          <h2 style={h2Style}>2. Directeur de la publication</h2>
          <p style={pStyle}>
            Le directeur de la publication est <span style={strongStyle}>Auguste Bouvée</span>, en sa qualité d&apos;auto-entrepreneur responsable du site thebuilder.io.
          </p>
        </div>

        {/* Hébergeur */}
        <div style={sectionStyle}>
          <h2 style={h2Style}>3. Hébergement</h2>
          <p style={pStyle}><span style={strongStyle}>Hébergeur :</span> Vercel Inc.</p>
          <p style={pStyle}><span style={strongStyle}>Adresse :</span> 340 Pine Street, San Francisco, CA 94104, United States</p>
          <p style={pStyle}>
            <span style={strongStyle}>Site web :</span>{' '}
            <a href="https://vercel.com" target="_blank" rel="noopener noreferrer" style={{ color: '#ea580c', textDecoration: 'none' }}>
              vercel.com
            </a>
          </p>
        </div>

        {/* Propriété intellectuelle */}
        <div style={sectionStyle}>
          <h2 style={h2Style}>4. Propriété intellectuelle</h2>
          <p style={pStyle}>
            L&apos;ensemble du contenu de ce site (textes, images, interface, code source, marque) est la propriété exclusive d&apos;Auguste Bouvée / ETXELAB, sauf mention contraire. Toute reproduction, distribution, modification ou utilisation à des fins commerciales sans autorisation écrite préalable est strictement interdite.
          </p>
          <p style={pStyle}>
            Le nom commercial <span style={strongStyle}>The Builder</span> et le logotype associé sont la propriété d&apos;ETXELAB.
          </p>
        </div>

        {/* Limitation de responsabilité */}
        <div style={sectionStyle}>
          <h2 style={h2Style}>5. Limitation de responsabilité</h2>
          <p style={pStyle}>
            ETXELAB s&apos;efforce de maintenir le site thebuilder.io accessible et à jour. Toutefois, ETXELAB ne peut être tenu responsable des interruptions de service, erreurs, omissions ou résultats obtenus par un usage inapproprié du service.
          </p>
          <p style={pStyle}>
            Les liens hypertextes présents sur ce site pointant vers des sites tiers n&apos;engagent pas la responsabilité d&apos;ETXELAB quant au contenu de ces sites.
          </p>
          <p style={pStyle}>
            L&apos;utilisation du service The Builder est soumise aux{' '}
            <a href="/cgu" style={{ color: '#ea580c', textDecoration: 'none' }}>
              Conditions Générales d&apos;Utilisation
            </a>.
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
