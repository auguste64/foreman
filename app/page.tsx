'use client'

import { useEffect } from 'react'
import './landing.css'

export default function Home() {
  useEffect(() => {
    const reveals = document.querySelectorAll('.reveal')
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('visible')
            io.unobserve(e.target)
          }
        })
      },
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    )
    reveals.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [])

  return (
    <>
      {/* NAV */}
      <nav>
        <a href="#" className="logo">FORE<span>MAN</span></a>
        <ul>
          <li><a href="#features">Fonctionnalités</a></li>
          <li><a href="#workflow">Comment ça marche</a></li>
          <li><a href="#pricing">Tarifs</a></li>
          <li><a href="/login" className="nav-cta">Commencer — 19€/mois</a></li>
        </ul>
      </nav>

      {/* HERO */}
      <section className="hero">
        <div className="hero-grid"></div>
        <div className="hero-glow"></div>

        <div className="badge">Conçu pour les architectes et MOE</div>

        <h1>Pilotez vos<br />chantiers.<br /><em>Sans friction.</em></h1>

        <p className="hero-sub">
          Comptes rendus automatisés, suivi d&apos;avancement, coordination artisans — tout centralisé dans un outil taillé pour votre métier.
        </p>

        <div className="hero-actions">
          <a href="/login" className="btn-primary">
            Essayer gratuitement
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </a>
          <a href="#workflow" className="btn-ghost">
            Voir comment ça marche
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path d="M8 3l5 5-5 5M3 8h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </a>
        </div>

        <div className="hero-stats">
          <div>
            <div className="stat-num">100<span>%</span></div>
            <div className="stat-label">Mobile-first</div>
          </div>
          <div>
            <div className="stat-num"><span>—</span> ArchiReport</div>
            <div className="stat-label">Alternative directe</div>
          </div>
          <div>
            <div className="stat-num">19<span>€</span></div>
            <div className="stat-label">Par mois, tout inclus</div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="features" id="features">
        <div className="features-header reveal">
          <div>
            <div className="section-label">Fonctionnalités</div>
            <h2 className="section-title">Tout ce dont vous avez besoin sur le terrain</h2>
          </div>
          <p className="features-desc">
            De la photo de chantier au PDF envoyé aux artisans — Foreman automatise ce que vous faites à la main.
          </p>
        </div>

        <div className="features-grid reveal">
          <div className="feature-card">
            <svg className="feature-icon" viewBox="0 0 40 40" fill="none">
              <rect x="6" y="8" width="28" height="24" rx="2" stroke="currentColor" strokeWidth="1.5" />
              <path d="M12 16h16M12 20h12M12 24h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <div className="feature-title">Comptes rendus automatisés</div>
            <div className="feature-text">Générez un PDF complet en quelques clics depuis le chantier. Envoi automatique aux artisans et au maître d&apos;ouvrage via Resend.</div>
            <div className="feature-num">01</div>
          </div>

          <div className="feature-card">
            <svg className="feature-icon" viewBox="0 0 40 40" fill="none">
              <rect x="8" y="6" width="24" height="28" rx="2" stroke="currentColor" strokeWidth="1.5" />
              <circle cx="20" cy="18" r="5" stroke="currentColor" strokeWidth="1.5" />
              <path d="M20 25v3M14 34c0-3.314 2.686-6 6-6s6 2.686 6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <div className="feature-title">Gestion des artisans</div>
            <div className="feature-text">Répertoire complet avec métiers, convocations automatiques et accès via magic link. Zéro compte à créer pour eux.</div>
            <div className="feature-num">02</div>
          </div>

          <div className="feature-card">
            <svg className="feature-icon" viewBox="0 0 40 40" fill="none">
              <rect x="6" y="8" width="28" height="26" rx="2" stroke="currentColor" strokeWidth="1.5" />
              <path d="M6 14h28" stroke="currentColor" strokeWidth="1.5" />
              <path d="M14 6v4M26 6v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              <rect x="11" y="19" width="6" height="5" rx="1" fill="currentColor" opacity="0.4" />
              <rect x="23" y="19" width="6" height="5" rx="1" fill="currentColor" opacity="0.2" />
            </svg>
            <div className="feature-title">Planning & interventions</div>
            <div className="feature-text">Vue calendrier mensuelle et hebdo. Planifiez visites, livraisons, OPR et réunions de chantier. Sync automatique depuis les CR.</div>
            <div className="feature-num">03</div>
          </div>

          <div className="feature-card">
            <svg className="feature-icon" viewBox="0 0 40 40" fill="none">
              <path d="M10 30a10 10 0 1 1 20 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              <path d="M20 20v-8M20 20l5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              <circle cx="20" cy="20" r="2" fill="currentColor" />
            </svg>
            <div className="feature-title">Suivi d&apos;avancement</div>
            <div className="feature-text">Tableau de bord par chantier. Visualisez l&apos;état de chaque lot, les réserves ouvertes et les jalons à venir en un coup d&apos;œil.</div>
            <div className="feature-num">04</div>
          </div>

          <div className="feature-card">
            <svg className="feature-icon" viewBox="0 0 40 40" fill="none">
              <rect x="8" y="8" width="24" height="24" rx="2" stroke="currentColor" strokeWidth="1.5" />
              <path d="M14 20l4 4 8-8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <div className="feature-title">Interface client</div>
            <div className="feature-text">Donnez accès à vos maîtres d&apos;ouvrage en lecture seule. Ils suivent l&apos;avancement sans polluer votre espace de travail.</div>
            <div className="feature-num">05</div>
          </div>

          <div className="feature-card">
            <svg className="feature-icon" viewBox="0 0 40 40" fill="none">
              <path d="M20 8v4M20 28v4M8 20h4M28 20h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              <circle cx="20" cy="20" r="8" stroke="currentColor" strokeWidth="1.5" />
              <circle cx="20" cy="20" r="3" fill="currentColor" opacity="0.5" />
            </svg>
            <div className="feature-title">Photos intégrées</div>
            <div className="feature-text">Capturez depuis mobile, intégrez directement dans les CR. Les photos s&apos;insèrent dans le PDF automatiquement au bon endroit.</div>
            <div className="feature-num">06</div>
          </div>
        </div>
      </section>

      {/* WORKFLOW */}
      <section id="workflow">
        <div className="section-label reveal">Comment ça marche</div>
        <h2 className="section-title reveal">Du terrain au PDF en quelques minutes</h2>

        <div className="workflow-steps">
          <div>
            <div className="step reveal">
              <div className="step-num">01</div>
              <div>
                <div className="step-title">Créez votre chantier</div>
                <div className="step-desc">Renseignez les infos, ajoutez vos artisans et votre client. Tout est prêt en moins de 3 minutes.</div>
              </div>
            </div>
            <div className="step reveal">
              <div className="step-num">02</div>
              <div>
                <div className="step-title">Rédigez le compte rendu sur site</div>
                <div className="step-desc">Interface mobile pensée pour le terrain. Ajoutez photos, réserves, présents et décisions en temps réel.</div>
              </div>
            </div>
            <div className="step reveal">
              <div className="step-num">03</div>
              <div>
                <div className="step-title">Envoyez le PDF automatiquement</div>
                <div className="step-desc">Un clic. Le PDF part aux artisans concernés et au maître d&apos;ouvrage. Les convocations aussi.</div>
              </div>
            </div>
            <div className="step reveal">
              <div className="step-num">04</div>
              <div>
                <div className="step-title">Suivez tout depuis le tableau de bord</div>
                <div className="step-desc">Planning, réserves, artisans, historique des CR — tout centralisé, accessible depuis n&apos;importe où.</div>
              </div>
            </div>
          </div>

          <div className="workflow-visual reveal">
            <div className="mock-header">
              <div className="mock-dot"></div>
              <div className="mock-title">Résidence Les Pins — CR #4</div>
              <div className="mock-tag">Envoyé</div>
            </div>
            <div className="mock-row">
              <span className="mock-row-label">Lot Maçonnerie</span>
              <span className="mock-row-status status-done">Terminé</span>
            </div>
            <div className="mock-row">
              <span className="mock-row-label">Lot Plomberie</span>
              <span className="mock-row-status status-pending">En cours</span>
            </div>
            <div className="mock-row">
              <span className="mock-row-label">Lot Électricité</span>
              <span className="mock-row-status status-pending">En cours</span>
            </div>
            <div className="mock-row">
              <span className="mock-row-label">Lot Menuiserie ext.</span>
              <span className="mock-row-status status-wait">À venir</span>
            </div>
            <div className="mock-row">
              <span className="mock-row-label">Lot Peinture</span>
              <span className="mock-row-status status-wait">À venir</span>
            </div>
            <div style={{ marginTop: 'auto', paddingTop: '20px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', color: 'var(--muted)' }}>3 artisans convoqués</span>
              <span style={{ fontSize: '12px', color: 'var(--accent)', fontWeight: 500 }}>PDF généré ✓</span>
            </div>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section style={{ background: 'var(--surface)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
        <div className="section-label reveal">Ils utilisent Foreman</div>
        <h2 className="section-title reveal">Ce qu&apos;en disent les architectes</h2>

        <div className="testimonials-grid">
          <div className="testimonial reveal">
            <p className="testimonial-text">&ldquo;Fini les CR Word envoyés à 23h le soir du chantier. Foreman m&apos;a fait gagner facilement 2h par semaine sur l&apos;administratif.&rdquo;</p>
            <div className="testimonial-author">
              <div className="author-avatar">ML</div>
              <div>
                <div className="author-name">Marie L.</div>
                <div className="author-role">Architecte DPLG, Bordeaux</div>
              </div>
            </div>
          </div>

          <div className="testimonial reveal">
            <p className="testimonial-text">&ldquo;L&apos;interface magic link pour les artisans change tout — ils voient leurs convocations sans avoir à créer un compte. Aucune friction.&rdquo;</p>
            <div className="testimonial-author">
              <div className="author-avatar">TP</div>
              <div>
                <div className="author-name">Thomas P.</div>
                <div className="author-role">MOE indépendant, Bayonne</div>
              </div>
            </div>
          </div>

          <div className="testimonial reveal">
            <p className="testimonial-text">&ldquo;Le suivi par lots donne enfin une vision claire à mes clients. Plus besoin de leur expliquer où en est le chantier à chaque appel.&rdquo;</p>
            <div className="testimonial-author">
              <div className="author-avatar">SA</div>
              <div>
                <div className="author-name">Sophie A.</div>
                <div className="author-role">Architecte, Biarritz</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section className="pricing" id="pricing">
        <div className="section-label reveal">Tarifs</div>
        <h2 className="section-title reveal">Simple. Transparent.</h2>
        <p className="pricing-sub reveal">Aucun engagement. Résiliez quand vous voulez.</p>

        <div className="pricing-cards">
          <div className="pricing-card reveal">
            <div className="plan-name">Gratuit</div>
            <div className="plan-price"><span>€</span>0</div>
            <div className="plan-period">pour toujours</div>
            <ul className="plan-features">
              <li className="active">1 chantier actif</li>
              <li className="active">Comptes rendus PDF</li>
              <li className="active">Accès artisans (magic link)</li>
              <li>Envoi email automatique</li>
              <li>Chantiers illimités</li>
              <li>Planning &amp; calendrier</li>
            </ul>
            <a href="/login" className="btn-plan">Commencer gratuitement</a>
          </div>

          <div className="pricing-card featured reveal">
            <div className="plan-name">Pro</div>
            <div className="plan-price"><span>€</span>19</div>
            <div className="plan-period">par mois · sans engagement</div>
            <ul className="plan-features">
              <li className="active">Chantiers illimités</li>
              <li className="active">Comptes rendus PDF + photos</li>
              <li className="active">Accès artisans (magic link)</li>
              <li className="active">Envoi email automatique</li>
              <li className="active">Planning &amp; calendrier</li>
              <li className="active">Interface client lecture seule</li>
            </ul>
            <a href="/login" className="btn-plan primary">Essayer 14 jours gratuits</a>
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="cta-section">
        <h2 className="reveal">Prêt à<br /><em style={{ color: 'var(--accent)', fontStyle: 'normal' }}>prendre le chantier</em><br />en main ?</h2>
        <p className="reveal">Rejoignez les architectes et MOE qui ont arrêté de perdre du temps sur l&apos;administratif.</p>
        <a href="/login" className="btn-primary reveal" style={{ margin: '0 auto', width: 'fit-content' }}>
          Commencer gratuitement
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </a>
      </section>

      {/* FOOTER */}
      <footer>
        <div className="footer-copy">© 2026 Foreman. Tous droits réservés.</div>
        <div className="footer-links">
          <a href="#">Mentions légales</a>
          <a href="#">Confidentialité</a>
          <a href="#">Contact</a>
        </div>
      </footer>
    </>
  )
}
