'use client'

import { useEffect } from 'react'
import './landing.css'

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
          <div className="logo-mark">
            <svg viewBox="0 0 38 38" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="38" height="38" rx="10" fill="url(#lg)" />
              <path d="M10 28V12h8c2.2 0 3.9.5 5 1.5 1.2 1 1.8 2.3 1.8 4 0 1-.3 1.9-.8 2.6-.5.7-1.2 1.2-2 1.5 1 .2 1.8.7 2.4 1.5.6.8.9 1.8.9 3 0 1.8-.6 3.2-1.9 4.2-1.2 1-3 1.4-5.3 1.4H10zm3.5-9.5h4.2c1.1 0 2-.2 2.6-.7.6-.5.9-1.2.9-2.1 0-1-.3-1.7-.9-2.2-.6-.5-1.5-.7-2.8-.7h-4v5.7zm0 7.2h4.6c1.2 0 2.2-.3 2.8-.8.7-.5 1-1.3 1-2.3 0-1-.3-1.8-1-2.3-.6-.5-1.6-.8-2.9-.8h-4.5V25.7z" fill="white" />
              <defs>
                <linearGradient id="lg" x1="0" y1="0" x2="38" y2="38" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#FF6B35" />
                  <stop offset="1" stopColor="#FF9A5C" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <div className="logo-text">
            <span className="logo-the">the</span>
            <span className="logo-name">Builder</span>
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
          <span className="price-val">19€/mois</span>
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
      <section id="tarifs" style={{ paddingTop: '80px', paddingBottom: '80px', position: 'relative', zIndex: 2 }}>
        <div className="section-header reveal">
          <div className="section-chip">Tarifs</div>
          <h2 className="section-title">Simple. Transparent. Honnête.</h2>
        </div>
        <div style={{ maxWidth: '560px', margin: '32px auto 0', padding: '40px 48px', background: 'rgba(10, 10, 9, 0.75)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', border: '1px solid rgba(255,255,255,0.10)', borderRadius: '20px' }}>

          {/* Label */}
          <div style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#8A8880', marginBottom: '24px' }}>Accès complet</div>

          <hr style={{ border: 'none', borderTop: '1px solid #1E1E1C', margin: '0 0 24px 0' }} />

          {/* Prix */}
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
            <span style={{ fontSize: '56px', fontWeight: 500, lineHeight: 1, color: '#F0EDE6', fontFamily: 'var(--font-syne), sans-serif' }}>19€</span>
            <span style={{ fontSize: '20px', color: '#8A8880' }}>/mois</span>
          </div>
          <div style={{ fontSize: '13px', color: '#8A8880', marginTop: '6px', marginBottom: '24px' }}>Sans engagement · Résiliable à tout moment</div>

          <hr style={{ border: 'none', borderTop: '1px solid #1E1E1C', margin: '0 0 24px 0' }} />

          {/* Features */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 16px', marginBottom: '32px' }}>
            {['Chantiers illimités', 'CR PDF illimités', 'Comptabilité complète', 'Planning + sync calendrier', 'Import contacts Google', 'Support prioritaire'].map((f) => (
              <div key={f} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#F0EDE6' }}>
                <svg width="16" height="16" viewBox="0 0 16 16" style={{ flexShrink: 0 }}>
                  <circle cx="8" cy="8" r="7.5" fill="none" stroke="#333" />
                  <polyline points="4.5,8 7,10.5 11.5,5.5" fill="none" stroke="#ea580c" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
                {f}
              </div>
            ))}
          </div>

          {/* CTA */}
          <a href="/login" style={{ display: 'block', textAlign: 'center', padding: '14px', background: '#F0EDE6', color: '#0D0D0B', borderRadius: '10px', fontSize: '15px', fontWeight: 600, fontFamily: 'var(--font-syne), sans-serif', textDecoration: 'none' }}>
            Commencer maintenant →
          </a>

        </div>
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
          <svg viewBox="0 0 28 28" fill="none">
            <rect width="28" height="28" rx="7" fill="url(#fl)" />
            <path d="M7 21V9h6c1.6 0 2.9.4 3.7 1.1.9.7 1.3 1.7 1.3 2.9 0 .7-.2 1.4-.6 1.9-.4.5-.9.9-1.5 1.1.8.2 1.4.6 1.8 1.1.4.6.7 1.3.7 2.2 0 1.3-.5 2.4-1.4 3.1-.9.7-2.2 1-3.9 1H7zm2.6-7h3.1c.8 0 1.4-.2 1.9-.5.4-.4.7-.9.7-1.6 0-.7-.2-1.3-.7-1.6-.4-.3-1.1-.5-2-.5H9.6V14zm0 5.3h3.4c.9 0 1.6-.2 2.1-.6.5-.4.7-1 .7-1.7 0-.7-.2-1.3-.7-1.7-.5-.4-1.2-.6-2.2-.6H9.6v4.6z" fill="white" />
            <defs>
              <linearGradient id="fl" x1="0" y1="0" x2="28" y2="28" gradientUnits="userSpaceOnUse">
                <stop stopColor="#FF6B35" />
                <stop offset="1" stopColor="#FF9A5C" />
              </linearGradient>
            </defs>
          </svg>
          <span className="footer-name">The Builder</span>
        </div>
        <div className="footer-copy">© 2026 The Builder — Architectes &amp; MOEs</div>
      </footer>

    </div>
  )
}
