'use client'

import { useEffect, useState } from 'react'
import './landing.css'

const CHECK_ICON_DEFAULT = (
  <svg width="16" height="16" viewBox="0 0 16 16" style={{ flexShrink: 0 }}>
    <circle cx="8" cy="8" r="7.5" fill="none" stroke="#333" />
    <polyline points="4.5,8 7,10.5 11.5,5.5" fill="none" stroke="#ea580c" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
)

const CHECK_ICON_ACCENT = (
  <svg width="16" height="16" viewBox="0 0 16 16" style={{ flexShrink: 0 }}>
    <circle cx="8" cy="8" r="7.5" fill="none" stroke="#ea580c" opacity="0.4" />
    <polyline points="4.5,8 7,10.5 11.5,5.5" fill="none" stroke="#ea580c" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
)

function PricingCards() {
  const [hoverEssentiel, setHoverEssentiel] = useState(false)
  const [hoverComplet, setHoverComplet] = useState(false)
  const [hoverBtnEssentiel, setHoverBtnEssentiel] = useState(false)
  const [hoverBtnComplet, setHoverBtnComplet] = useState(false)

  const featuresEssentiel = ['Comptes rendus PDF + email', 'Répertoire artisans & clients', 'Planning / calendrier']
  const featuresComplet = ['Comptes rendus PDF + email', 'Répertoire artisans & clients', 'Planning / calendrier', 'Comptabilité (devis & factures)', 'Analyse & statistiques', 'Toutes les futures fonctionnalités']

  return (
    <div style={{ display: 'flex', flexDirection: 'row', gap: '24px', maxWidth: '860px', margin: '40px auto 0', padding: '0 24px', justifyContent: 'center', flexWrap: 'wrap' }}>

      {/* Plan Essentiel */}
      <div
        onMouseEnter={() => setHoverEssentiel(true)}
        onMouseLeave={() => setHoverEssentiel(false)}
        style={{
          flex: '1 1 360px', maxWidth: '400px', padding: '36px 40px',
          background: 'rgba(10,10,9,0.75)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
          border: '1px solid rgba(255,255,255,0.10)', borderRadius: '20px',
          display: 'flex', flexDirection: 'column',
          animation: 'halo-pulse-subtle 4s ease-in-out infinite',
          transform: hoverEssentiel ? 'scale(1.02)' : 'scale(1)',
          transition: 'transform 0.3s ease',
        }}
      >
        <div style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#8A8880', marginBottom: '8px' }}>Essentiel</div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '4px' }}>
          <span style={{ fontSize: '48px', fontWeight: 500, lineHeight: 1, color: '#F0EDE6', fontFamily: 'var(--font-syne), sans-serif' }}>11,90€</span>
          <span style={{ fontSize: '18px', color: '#8A8880' }}>/mois</span>
        </div>
        <div style={{ fontSize: '13px', color: '#8A8880', marginBottom: '24px' }}>Sans engagement · Résiliable à tout moment</div>
        <hr style={{ border: 'none', borderTop: '1px solid #1E1E1C', margin: '0 0 24px 0' }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '32px', flex: 1 }}>
          {featuresEssentiel.map((f) => (
            <div key={f} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: '#F0EDE6' }}>
              {CHECK_ICON_DEFAULT}
              {f}
            </div>
          ))}
        </div>
        <a
          href="/dashboard"
          onMouseEnter={() => setHoverBtnEssentiel(true)}
          onMouseLeave={() => setHoverBtnEssentiel(false)}
          style={{
            display: 'block', textAlign: 'center', padding: '14px 32px',
            background: 'transparent', color: '#ea580c',
            border: '1px solid #ea580c', borderRadius: '10px',
            fontSize: '15px', fontWeight: 700,
            fontFamily: 'var(--font-syne), sans-serif', textDecoration: 'none',
            cursor: 'pointer',
            animation: 'btn-glow 3s ease-in-out infinite',
            transform: hoverBtnEssentiel ? 'scale(1.05)' : 'scale(1)',
            transition: 'transform 0.2s',
          }}
        >
          Commencer →
        </a>
      </div>

      {/* Plan Complet */}
      <div
        onMouseEnter={() => setHoverComplet(true)}
        onMouseLeave={() => setHoverComplet(false)}
        style={{
          flex: '1 1 360px', maxWidth: '400px', padding: '36px 40px',
          background: 'rgba(10,10,9,0.75)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
          border: '1px solid rgba(234,88,12,0.6)', borderRadius: '20px',
          display: 'flex', flexDirection: 'column', position: 'relative',
          animation: 'halo-pulse 3s ease-in-out infinite, float 6s ease-in-out infinite',
          transform: hoverComplet ? 'scale(1.02)' : undefined,
          transition: 'transform 0.3s ease',
        }}
      >
        <div style={{
          position: 'absolute', top: '20px', right: '20px',
          background: '#ea580c', color: '#0D0D0B',
          fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase',
          padding: '4px 14px', borderRadius: '20px',
          animation: 'badge-glow 2s ease-in-out infinite',
        }}>Tout inclus</div>
        <div style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#ea580c', marginBottom: '8px' }}>Pro</div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '4px' }}>
          <span style={{ fontSize: '48px', fontWeight: 500, lineHeight: 1, color: '#F0EDE6', fontFamily: 'var(--font-syne), sans-serif' }}>18,90€</span>
          <span style={{ fontSize: '18px', color: '#8A8880' }}>/mois</span>
        </div>
        <div style={{ fontSize: '13px', color: '#8A8880', marginBottom: '24px' }}>Sans engagement · Résiliable à tout moment</div>
        <hr style={{ border: 'none', borderTop: '1px solid #2a2a27', margin: '0 0 24px 0' }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '32px', flex: 1 }}>
          {featuresComplet.map((f) => (
            <div key={f} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: '#F0EDE6' }}>
              {CHECK_ICON_ACCENT}
              {f}
            </div>
          ))}
        </div>
        <a
          href="/dashboard"
          onMouseEnter={() => setHoverBtnComplet(true)}
          onMouseLeave={() => setHoverBtnComplet(false)}
          style={{
            display: 'block', textAlign: 'center', padding: '14px 32px',
            background: '#ea580c', color: '#fff',
            border: 'none', borderRadius: '10px',
            fontSize: '15px', fontWeight: 700,
            fontFamily: 'var(--font-syne), sans-serif', textDecoration: 'none',
            cursor: 'pointer',
            animation: 'btn-glow 2s ease-in-out infinite',
            transform: hoverBtnComplet ? 'scale(1.05)' : 'scale(1)',
            transition: 'transform 0.2s',
          }}
        >
          Commencer →
        </a>
      </div>

    </div>
  )
}

export default function Home() {
  useEffect(() => {
    const wrapper = document.querySelector('.lp-wrapper') as Element

    // ── Scroll reveal
    const obs = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add('on') }),
      { threshold: 0.1, root: wrapper }
    )
    document.querySelectorAll('.reveal').forEach((el) => obs.observe(el))

    // ── Button ripple
    const handlers: Array<{ el: Element; fn: (e: Event) => void }> = []
    document.querySelectorAll('.btn').forEach((btn) => {
      const fn = (e: Event) => {
        const me = e as MouseEvent
        const rect = btn.getBoundingClientRect()
        const size = Math.max(rect.width, rect.height) * 2
        const ripple = document.createElement('span')
        ripple.classList.add('ripple')
        ripple.style.cssText = `width:${size}px;height:${size}px;left:${me.clientX - rect.left - size / 2}px;top:${me.clientY - rect.top - size / 2}px;`
        btn.appendChild(ripple)
        setTimeout(() => ripple.remove(), 600)
      }
      btn.addEventListener('click', fn)
      handlers.push({ el: btn, fn })
    })

    return () => {
      obs.disconnect()
      handlers.forEach(({ el, fn }) => el.removeEventListener('click', fn))
    }
  }, [])

  return (
    <div className="lp-wrapper">

      <div id="bg-wrap" aria-hidden="true">
        <div className="bg-blob b1"></div>
        <div className="bg-blob b2"></div>
        <div className="bg-blob b3"></div>
        <div className="bg-blob b4"></div>
        <div className="bg-blob b5"></div>
        <div className="bg-blob b6"></div>
        <div className="bg-blob b7"></div>
      </div>


      {/* NAV */}
      <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 60px', height: '70px', background: 'transparent', border: 'none' }}>
        <a className="logo" href="#">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', flexShrink: 0 }}>
              <div style={{ display: 'flex', gap: '3px' }}>
                <div style={{ width: '18px', height: '8px', borderRadius: '2px', background: '#ea580c' }} />
                <div style={{ width: '12px', height: '8px', borderRadius: '2px', background: '#ea580c', opacity: 0.6 }} />
              </div>
              <div style={{ display: 'flex', gap: '3px' }}>
                <div style={{ width: '12px', height: '8px', borderRadius: '2px', background: '#ea580c', opacity: 0.6 }} />
                <div style={{ width: '18px', height: '8px', borderRadius: '2px', background: '#ea580c' }} />
              </div>
              <div style={{ display: 'flex', gap: '3px' }}>
                <div style={{ width: '18px', height: '8px', borderRadius: '2px', background: '#ea580c', opacity: 0.8 }} />
                <div style={{ width: '12px', height: '8px', borderRadius: '2px', background: '#ea580c', opacity: 0.5 }} />
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
              <span style={{ fontFamily: 'var(--font-syne)', fontWeight: 400, fontSize: '0.6rem', letterSpacing: '0.2em', color: '#8A8880' }}>THE</span>
              <span style={{ fontFamily: 'var(--font-syne)', fontWeight: 800, fontSize: '1rem', letterSpacing: '0.05em', color: '#F0EDE6' }}>BUILDER</span>
            </div>
          </div>
        </a>
        <div className="nav-right">
          <a href="/login" className="btn btn-ghost btn-sm">Se connecter</a>
          <a href="/login" className="btn btn-primary btn-sm">Commencer →</a>
        </div>
      </nav>

      {/* HERO */}
      <section className="hero" style={{ paddingBottom: '48px' }}>
        <div className="hero-badge">
          <span className="badge-dot"></span>
          Gestion de chantier · Architectes &amp; MOEs
        </div>

        <h1 className="hero-title">
          Pilotez vos chantiers<br />
          avec <span className="grad-text">10× plus d&apos;efficacité.</span>
        </h1>

        <p className="hero-sub">
          Comptes rendus, artisans, comptabilité, planning synchronisé. Tout en un. Conçu pour les professionnels du bâtiment.
        </p>

        <div className="hero-price">
          <span className="price-val">dès 11,90€/mois</span>
        </div>

        <div className="hero-cta">
          <a href="/login" className="btn btn-primary btn-md">Commencer gratuitement →</a>
        </div>

        <div className="hero-mockup">
          <div className="mockup-glow"></div>
          <div className="mockup-window">
            <div className="mockup-bar">
              <span className="dot r"></span>
              <span className="dot y"></span>
              <span className="dot g"></span>
              <div className="mockup-url">app.thebuilder.io/dashboard</div>
            </div>
            <div className="mockup-body">
              <div className="mc">
                <div className="mc-label">Chantiers actifs</div>
                <div className="mc-val">12</div>
                <div className="mc-sub">En cours</div>
              </div>
              <div className="mc">
                <div className="mc-label">CA facturé</div>
                <div className="mc-val orange">48k€</div>
                <div className="mc-sub">Ce trimestre</div>
              </div>
              <div className="mc">
                <div className="mc-label">Artisans</div>
                <div className="mc-val blue">34</div>
                <div className="mc-sub">Actifs</div>
              </div>
              <div className="mc">
                <div className="mc-label">Impayés</div>
                <div className="mc-val green">0€</div>
                <div className="mc-sub">✓ Tout à jour</div>
              </div>
            </div>
            <div className="mockup-bottom">
              <div className="ml">
                <div className="ml-title">Chantiers en cours</div>
                <div className="ml-row">
                  <span className="ml-name">Villa Orion — Biarritz</span>
                  <span className="tag g">En cours</span>
                </div>
                <div className="ml-row">
                  <span className="ml-name">Résidence FABOS</span>
                  <span className="tag o">CR à envoyer</span>
                </div>
                <div className="ml-row">
                  <span className="ml-name">Maison ETSOLA</span>
                  <span className="tag b">Planifié</span>
                </div>
              </div>
              <div className="ml">
                <div className="ml-title">Prochains événements</div>
                <div className="ml-row">
                  <span className="ml-name">Réunion FABOS</span>
                  <span style={{ fontSize: '11px', color: 'var(--muted)' }}>19 mars</span>
                </div>
                <div className="ml-row">
                  <span className="ml-name">Livraison Orion</span>
                  <span style={{ fontSize: '11px', color: 'var(--muted)' }}>27 mars</span>
                </div>
                <div className="ml-row">
                  <span className="ml-name">RDV ETSOLA</span>
                  <span style={{ fontSize: '11px', color: 'var(--muted)' }}>2 avr.</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PRICING */}
      <style>{`
        @keyframes halo-pulse {
          0%, 100% { box-shadow: 0 0 30px rgba(234,88,12,0.3), 0 0 60px rgba(234,88,12,0.15); }
          50%       { box-shadow: 0 0 50px rgba(234,88,12,0.5), 0 0 100px rgba(234,88,12,0.25); }
        }
        @keyframes halo-pulse-subtle {
          0%, 100% { box-shadow: 0 0 20px rgba(255,255,255,0.04), 0 0 40px rgba(255,255,255,0.02); }
          50%       { box-shadow: 0 0 30px rgba(255,255,255,0.08), 0 0 60px rgba(255,255,255,0.04); }
        }
        @keyframes btn-glow {
          0%, 100% { box-shadow: 0 0 12px rgba(234,88,12,0.6), 0 4px 24px rgba(234,88,12,0.4); }
          50%       { box-shadow: 0 0 24px rgba(234,88,12,0.9), 0 4px 40px rgba(234,88,12,0.6); }
        }
        @keyframes badge-glow {
          0%, 100% { box-shadow: 0 0 8px rgba(234,88,12,0.5); }
          50%       { box-shadow: 0 0 16px rgba(234,88,12,0.9); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-6px); }
        }
      `}</style>

      <section id="tarifs" style={{ paddingTop: '80px', paddingBottom: '80px', position: 'relative', zIndex: 2 }}>
        <div className="section-header reveal">
          <div className="section-chip">Tarifs</div>
          <h2 className="section-title">Simple. Transparent. Honnête.</h2>
        </div>

        <PricingCards />
      </section>

      {/* FEATURES */}
      <section className="features" id="fonctionnalites">
        <div className="section-header reveal">
          <div className="section-chip">Fonctionnalités</div>
          <h2 className="section-title">Tout ce dont vous avez besoin,<br />rien de superflu.</h2>
        </div>
        <div className="feat-grid">
          <div className="feat-card reveal d1">
            <img src="/screenshots/comptes-rendus.png" alt="Comptes rendus PDF" style={{ width: '100%', height: '180px', objectFit: 'cover', objectPosition: 'top left', borderRadius: '8px', marginBottom: '20px', display: 'block', background: '#1E1E1C' }} />
            <div className="feat-icon">📋</div>
            <h3 className="feat-title">Comptes rendus PDF</h3>
            <p className="feat-desc">Générez des CR professionnels en minutes. Envoi automatique aux artisans par email.</p>
          </div>
          <div className="feat-card reveal d2">
            <img src="/screenshots/artisans.png" alt="Gestion artisans" style={{ width: '100%', height: '180px', objectFit: 'cover', objectPosition: 'top left', borderRadius: '8px', marginBottom: '20px', display: 'block', background: '#1E1E1C' }} />
            <div className="feat-icon">👷</div>
            <h3 className="feat-title">Gestion artisans</h3>
            <p className="feat-desc">Magic link, convocations, présences. Interface dédiée pour vos artisans — gratuite.</p>
          </div>
          <div className="feat-card reveal d3">
            <img src="/screenshots/comptabilite.png" alt="Comptabilité intégrée" style={{ width: '100%', height: '180px', objectFit: 'cover', objectPosition: 'top left', borderRadius: '8px', marginBottom: '20px', display: 'block', background: '#1E1E1C' }} />
            <div className="feat-icon">💶</div>
            <h3 className="feat-title">Comptabilité intégrée</h3>
            <p className="feat-desc">Devis, factures, avoirs, acomptes. Aperçu PDF live et envoi en un clic.</p>
          </div>
          <div className="feat-card reveal d4">
            <img src="/screenshots/planning.png" alt="Planning synchronisé" style={{ width: '100%', height: '180px', objectFit: 'cover', objectPosition: 'top left', borderRadius: '8px', marginBottom: '20px', display: 'block', background: '#1E1E1C' }} />
            <div className="feat-icon">📅</div>
            <h3 className="feat-title">Planning synchronisé</h3>
            <p className="feat-desc">Google Calendar, Apple Calendar, Outlook. Tout synchronisé en temps réel.</p>
          </div>
          <div className="feat-card reveal d5">
            <img src="/screenshots/clients.png" alt="Clients &amp; contacts" style={{ width: '100%', height: '180px', objectFit: 'cover', objectPosition: 'top left', borderRadius: '8px', marginBottom: '20px', display: 'block', background: '#1E1E1C' }} />
            <div className="feat-icon">👥</div>
            <h3 className="feat-title">Clients &amp; contacts</h3>
            <p className="feat-desc">Import Google Contacts. Fiches liées automatiquement à vos chantiers.</p>
          </div>
          <div className="feat-card reveal d6">
            <img src="/screenshots/analyse.png" alt="Analyse &amp; statistiques" style={{ width: '100%', height: '180px', objectFit: 'cover', objectPosition: 'top left', borderRadius: '8px', marginBottom: '20px', display: 'block', background: '#1E1E1C' }} />
            <div className="feat-icon">📊</div>
            <h3 className="feat-title">Analyse &amp; statistiques</h3>
            <p className="feat-desc">CA, pipeline, projections, impayés. Pilotez votre activité avec précision.</p>
          </div>
        </div>
      </section>

      {/* CLOSER */}
      <section className="closer">
        <h2 className="closer-title reveal">Prêt à transformer votre façon de gérer vos chantiers ?</h2>
        <p className="closer-sub reveal d1">
          Rejoignez les architectes et MOEs qui ont adopté The Builder. Commencez en moins de 2 minutes.
        </p>
        <a href="/login" className="btn btn-primary btn-lg reveal d2">Essayer gratuitement →</a>
      </section>

      {/* FOOTER */}
      <footer>
        <div className="footer-logo">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', flexShrink: 0 }}>
              <div style={{ display: 'flex', gap: '3px' }}>
                <div style={{ width: '18px', height: '8px', borderRadius: '2px', background: '#ea580c' }} />
                <div style={{ width: '12px', height: '8px', borderRadius: '2px', background: '#ea580c', opacity: 0.6 }} />
              </div>
              <div style={{ display: 'flex', gap: '3px' }}>
                <div style={{ width: '12px', height: '8px', borderRadius: '2px', background: '#ea580c', opacity: 0.6 }} />
                <div style={{ width: '18px', height: '8px', borderRadius: '2px', background: '#ea580c' }} />
              </div>
              <div style={{ display: 'flex', gap: '3px' }}>
                <div style={{ width: '18px', height: '8px', borderRadius: '2px', background: '#ea580c', opacity: 0.8 }} />
                <div style={{ width: '12px', height: '8px', borderRadius: '2px', background: '#ea580c', opacity: 0.5 }} />
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
              <span style={{ fontFamily: 'var(--font-syne)', fontWeight: 400, fontSize: '0.6rem', letterSpacing: '0.2em', color: '#8A8880' }}>THE</span>
              <span style={{ fontFamily: 'var(--font-syne)', fontWeight: 800, fontSize: '1rem', letterSpacing: '0.05em', color: '#F0EDE6' }}>BUILDER</span>
            </div>
          </div>
        </div>
        <div className="footer-copy">© 2026 The Builder — Architectes &amp; MOEs</div>
      </footer>

    </div>
  )
}
