'use client'

import { useEffect } from 'react'
import './landing.css'

export default function Home() {
  useEffect(() => {
    const wrapper = document.querySelector('.lp-wrapper') as Element

    // ── Feature cards: staggered entrance via JS setTimeout
    const featGrid = document.querySelector('.feat-grid')
    if (featGrid) {
      const cards = Array.from(featGrid.querySelectorAll('.feat-card'))
      const gridObs = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            cards.forEach((card, i) =>
              setTimeout(() => card.classList.add('feat-visible'), i * 100)
            )
            gridObs.disconnect()
          }
        },
        { threshold: 0.1, root: wrapper }
      )
      gridObs.observe(featGrid)
    }

    // ── Counter animation for "8'" stat (ease-out cubic)
    const statEl = document.getElementById('stat-minutes') as HTMLElement | null
    const bandEl = document.querySelector('.color-band')
    if (statEl && bandEl) {
      let triggered = false
      const bandObs = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting && !triggered) {
            triggered = true
            let startTs = 0
            const DURATION = 1000
            const TARGET = 8
            const tick = (ts: number) => {
              if (!startTs) startTs = ts
              const p = Math.min((ts - startTs) / DURATION, 1)
              const eased = 1 - Math.pow(1 - p, 3)
              statEl.textContent = Math.floor(eased * TARGET) + "'"
              if (p < 1) requestAnimationFrame(tick)
              else statEl.textContent = "8'"
            }
            requestAnimationFrame(tick)
            bandObs.disconnect()
          }
        },
        { threshold: 0.4, root: wrapper }
      )
      bandObs.observe(bandEl)
    }
  }, [])

  return (
    <div className="lp-wrapper">

      {/* NAV */}
      <nav>
        <a className="nav-logo" href="#">
          <span className="bar"></span>
          <span className="fore">FORE</span><span className="man">MAN</span>
        </a>
        <div className="nav-links">
          <a href="#">Fonctionnalités</a>
          <a href="#">Tarifs</a>
          <a href="#">Démo</a>
          <a href="#">Blog</a>
        </div>
        <div className="nav-right">
          <a href="/login" className="nav-login">Se connecter</a>
          <a href="/login" className="nav-cta">Commencer →</a>
        </div>
      </nav>

      {/* HERO */}
      <section className="hero">
        <div className="hero-content">
          <h1 className="hero-title">
            <span className="line-1">FORE</span>
            <span className="line-2">MAN</span>
            <span className="line-3">VOTRE</span>
            <span className="line-1" style={{ fontSize: '0.72em', letterSpacing: '-3px' }}>CHANTIER.</span>
          </h1>
          <div className="hero-divider"></div>
          <p className="hero-sub" style={{ opacity: 0, animation: 'fadeUp 0.65s 0.35s forwards' }}>
            La plateforme des architectes et maîtres d&apos;œuvre pour piloter chantiers, artisans et documents — en un seul endroit.
          </p>
          <div className="hero-actions">
            <a href="/login" className="btn-primary"><span>Essayer gratuitement</span></a>
            <a href="#" className="btn-secondary">Voir la démo</a>
          </div>
          <p className="hero-note" style={{ opacity: 0, animation: 'fadeUp 0.6s 0.52s forwards' }}>
            <strong>19€/mois</strong> — Sans engagement. Artisans et clients gratuits.
          </p>
        </div>

        <div className="hero-deco">
          <div className="hero-bg-letter">F</div>
          <div className="hero-card-float">
            <div className="hero-card">
              <div className="hero-card-header">
                <div className="hero-card-title">Tableau de bord</div>
              </div>
              <div className="card-row">
                <span className="card-label">Chantiers actifs</span>
                <span className="card-value">12</span>
              </div>
              <div className="card-row">
                <span className="card-label">CA facturé</span>
                <span className="card-value accent">48k€</span>
              </div>
              <div className="card-row">
                <span className="card-label">Artisans</span>
                <span className="card-value">34</span>
              </div>
              <div className="card-row">
                <span className="card-label">CR ce mois</span>
                <span className="card-value">8</span>
              </div>
              <div className="hero-card-footer">
                <span className="card-footer-label">Impayés</span>
                <span className="card-footer-badge">0 €</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* MARQUEE */}
      <div className="marquee-wrap">
        <div className="marquee">
          <span className="marquee-item">Comptes rendus PDF <span className="marquee-sep">✦</span></span>
          <span className="marquee-item">Suivi artisans <span className="marquee-sep">✦</span></span>
          <span className="marquee-item">Devis &amp; factures <span className="marquee-sep">✦</span></span>
          <span className="marquee-item">Planning calendrier <span className="marquee-sep">✦</span></span>
          <span className="marquee-item">Google Calendar sync <span className="marquee-sep">✦</span></span>
          <span className="marquee-item">Interface client <span className="marquee-sep">✦</span></span>
          <span className="marquee-item">Import contacts Google <span className="marquee-sep">✦</span></span>
          <span className="marquee-item">Comptes rendus PDF <span className="marquee-sep">✦</span></span>
          <span className="marquee-item">Suivi artisans <span className="marquee-sep">✦</span></span>
          <span className="marquee-item">Devis &amp; factures <span className="marquee-sep">✦</span></span>
          <span className="marquee-item">Planning calendrier <span className="marquee-sep">✦</span></span>
          <span className="marquee-item">Google Calendar sync <span className="marquee-sep">✦</span></span>
          <span className="marquee-item">Interface client <span className="marquee-sep">✦</span></span>
          <span className="marquee-item">Import contacts Google <span className="marquee-sep">✦</span></span>
        </div>
      </div>

      {/* FEATURES */}
      <section className="features">
        <div className="section-header">
          <div className="section-label">01 — Fonctionnalités</div>
          <h2 className="section-title">Tout ce dont<br />vous avez besoin.</h2>
        </div>
        <div className="feat-grid">
          <div className="feat-card">
            <div className="feat-num">01</div>
            <div className="feat-icon">📋</div>
            <h3 className="feat-title">Comptes rendus automatisés</h3>
            <p className="feat-desc">Générez des CR professionnels en PDF et envoyez-les aux artisans en un clic. Templates configurables.</p>
          </div>
          <div className="feat-card">
            <div className="feat-num">02</div>
            <div className="feat-icon">👷</div>
            <h3 className="feat-title">Gestion artisans</h3>
            <p className="feat-desc">Magic link, convocations, présences. Interface artisan dédiée — entièrement gratuite.</p>
          </div>
          <div className="feat-card">
            <div className="feat-num">03</div>
            <div className="feat-icon">💶</div>
            <h3 className="feat-title">Comptabilité intégrée</h3>
            <p className="feat-desc">Devis, factures, avoirs et acomptes. Aperçu PDF live et envoi automatique par email.</p>
          </div>
          <div className="feat-card">
            <div className="feat-num">04</div>
            <div className="feat-icon">📅</div>
            <h3 className="feat-title">Planning synchronisé</h3>
            <p className="feat-desc">Sync Google Calendar, Apple Calendar et Outlook. Vos événements Foreman partout, en temps réel.</p>
          </div>
          <div className="feat-card">
            <div className="feat-num">05</div>
            <div className="feat-icon">👥</div>
            <h3 className="feat-title">Clients &amp; contacts</h3>
            <p className="feat-desc">Import Google Contacts en un clic. Fiches clients et artisans liées à vos chantiers.</p>
          </div>
          <div className="feat-card">
            <div className="feat-num">06</div>
            <div className="feat-icon">📊</div>
            <h3 className="feat-title">Analyse &amp; statistiques</h3>
            <p className="feat-desc">CA, pipeline, projections, impayés. Tout pour piloter votre activité avec précision.</p>
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section className="pricing">
        <div className="price-wrap">
          <div>
            <div className="price-label">Tarif unique</div>
            <div className="price-amount">19€<sub>/mois</sub></div>
            <p className="price-desc">Un abonnement. Tout inclus. Artisans et clients toujours gratuits. Sans engagement.</p>
            <div className="price-cta">
              <a href="/login" className="btn-accent">Commencer maintenant</a>
            </div>
          </div>
          <ul className="price-perks">
            <li><span className="perk-dot"></span>Chantiers illimités</li>
            <li><span className="perk-dot"></span>Comptes rendus PDF illimités</li>
            <li><span className="perk-dot"></span>Artisans &amp; clients gratuits</li>
            <li><span className="perk-dot"></span>Comptabilité complète</li>
            <li><span className="perk-dot"></span>Planning + sync calendrier</li>
            <li><span className="perk-dot"></span>Import contacts Google</li>
            <li><span className="perk-dot"></span>Support prioritaire</li>
            <li><span className="perk-dot"></span>Sans engagement</li>
          </ul>
        </div>
      </section>

      {/* COLOR BAND */}
      <div className="color-band">
        <div>
          <h2 className="band-title">Conçu par un architecte,<br />pour les architectes.</h2>
          <p className="band-sub">Foreman est né du terrain. Chaque fonctionnalité répond à un problème réel rencontré sur chantier.</p>
        </div>
        <div className="band-stats">
          <div>
            <div id="stat-minutes" className="band-stat-value">0&apos;</div>
            <div className="band-stat-label">Pour un CR complet</div>
          </div>
          <div>
            <div className="band-stat-value">∞</div>
            <div className="band-stat-label">Chantiers &amp; artisans</div>
          </div>
          <div>
            <div className="band-stat-value">0€</div>
            <div className="band-stat-label">Pour les artisans</div>
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <footer>
        <div className="footer-logo">
          <span className="bar"></span>
          <span className="fore">FORE</span><span className="man">MAN</span>
        </div>
        <div className="footer-copy">© 2026 Foreman — Conçu pour les architectes et MOEs</div>
      </footer>

    </div>
  )
}
