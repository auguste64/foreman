import Link from 'next/link'

export default function NotFound() {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#0D0D0B',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'var(--font-dm-sans), DM Sans, sans-serif',
      }}
    >
      <div style={{ textAlign: 'center', padding: '40px 24px' }}>
        <p
          style={{
            fontFamily: 'var(--font-syne), Syne, sans-serif',
            fontSize: '120px',
            fontWeight: 800,
            color: '#ea580c',
            lineHeight: 1,
            margin: '0 0 16px',
            letterSpacing: '-0.04em',
          }}
        >
          404
        </p>
        <h1
          style={{
            fontFamily: 'var(--font-syne), Syne, sans-serif',
            fontSize: '24px',
            fontWeight: 700,
            color: '#F0EDE6',
            margin: '0 0 12px',
          }}
        >
          Page introuvable
        </h1>
        <p
          style={{
            fontSize: '15px',
            color: '#8A8880',
            margin: '0 0 40px',
            lineHeight: 1.6,
          }}
        >
          La page que vous recherchez n&apos;existe pas ou a été déplacée.
        </p>
        <Link
          href="/dashboard"
          style={{
            display: 'inline-block',
            padding: '12px 28px',
            backgroundColor: '#ea580c',
            color: '#0D0D0B',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: 600,
            textDecoration: 'none',
            fontFamily: 'var(--font-dm-sans), DM Sans, sans-serif',
            letterSpacing: '0.01em',
          }}
        >
          Retour au dashboard
        </Link>
      </div>
    </div>
  )
}
