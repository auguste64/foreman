'use client'

import { useState, useEffect } from 'react'
import './landing.css'

const faqs = [
  {
    q: "Mes artisans ont besoin d'un compte ?",
    a: "Non. Ils reçoivent un lien magic link par email. Zéro inscription, zéro friction.",
  },
  {
    q: "Puis-je annuler à tout moment ?",
    a: "Oui. Sans engagement, sans frais de résiliation. Vous annulez en un clic depuis vos paramètres.",
  },
  {
    q: "Foreman fonctionne sur mobile ?",
    a: "Oui, l'interface est optimisée pour mobile. Idéal pour rédiger vos CR directement sur le chantier.",
  },
]

export default function Home() {
  const [openFaq, setOpenFaq] = useState<number | null>(null)

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
      <nav className="lp-nav">
        <a href="#" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, textDecoration: 'none' }}>
          <span style={{ width: 4, height: 24, backgroundColor: '#F97316', borderRadius: 1, flexShrink: 0 }} />
          <span style={{ fontFamily: 'var(--font-syne), sans-serif', fontWeight: 800, fontSize: 22, letterSpacing: '-0.5px', color: '#F0EDE6' }}>
            FORE<span style={{ color: '#F97316' }}>MAN</span>
          </span>
        </a>
        <ul>
          <li><a href="#features">Fonctionnalités</a></li>
          <li><a href="#workflow">Comment ça marche</a></li>
          <li><a href="#pricing">Tarifs</a></li>
          <li><a href="/login" className="nav-cta">Commencer — 19€/mois</a></li>
        </ul>
      </nav>

      {/* HERO */}
      <section className="lp-hero">
        <div className="hero-grid"></div>
        <div className="hero-glow"></div>

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

        <div className="hero-social-proof">
          <span className="hero-proof-dot"></span>
          Déjà utilisé par des architectes et MOE partout en France
        </div>
      </section>

      {/* FEATURES */}
      <section className="lp-features" id="features">
        <div className="features-header reveal">
          <div>
            <div className="section-label">Fonctionnalités</div>
            <h2 className="section-title">Tout ce dont vous avez besoin sur le terrain</h2>
          </div>
        </div>

        <div className="features-grid reveal">
          <div className="feature-card">
            <div className="feature-badge">01</div>
            <div className="feature-content">
              <svg className="feature-icon" viewBox="0 0 40 40" fill="none">
                <rect x="6" y="8" width="28" height="24" rx="2" stroke="currentColor" strokeWidth="1.5" />
                <path d="M12 16h16M12 20h12M12 24h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              <div className="feature-title">Comptes rendus automatisés</div>
              <div className="feature-text">Générez un PDF complet en quelques clics depuis le chantier. Envoi automatique aux artisans et au maître d&apos;ouvrage via Resend.</div>
            </div>
          </div>

          <div className="feature-card">
            <div className="feature-badge">02</div>
            <div className="feature-content">
              <svg className="feature-icon" viewBox="0 0 40 40" fill="none">
                <rect x="8" y="6" width="24" height="28" rx="2" stroke="currentColor" strokeWidth="1.5" />
                <circle cx="20" cy="18" r="5" stroke="currentColor" strokeWidth="1.5" />
                <path d="M20 25v3M14 34c0-3.314 2.686-6 6-6s6 2.686 6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              <div className="feature-title">Gestion des artisans</div>
              <div className="feature-text">Répertoire complet avec métiers, convocations automatiques et accès via magic link. Zéro compte à créer pour eux.</div>
            </div>
          </div>

          <div className="feature-card">
            <div className="feature-badge">03</div>
            <div className="feature-content">
              <svg className="feature-icon" viewBox="0 0 40 40" fill="none">
                <rect x="6" y="8" width="28" height="26" rx="2" stroke="currentColor" strokeWidth="1.5" />
                <path d="M6 14h28" stroke="currentColor" strokeWidth="1.5" />
                <path d="M14 6v4M26 6v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                <rect x="11" y="19" width="6" height="5" rx="1" fill="currentColor" opacity="0.4" />
                <rect x="23" y="19" width="6" height="5" rx="1" fill="currentColor" opacity="0.2" />
              </svg>
              <div className="feature-title">Planning &amp; interventions</div>
              <div className="feature-text">Vue calendrier mensuelle et hebdo. Planifiez visites, livraisons, OPR et réunions de chantier. Sync automatique depuis les CR.</div>
            </div>
          </div>

          <div className="feature-card">
            <div className="feature-badge">04</div>
            <div className="feature-content">
              <svg className="feature-icon" viewBox="0 0 40 40" fill="none">
                <path d="M10 30a10 10 0 1 1 20 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                <path d="M20 20v-8M20 20l5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                <circle cx="20" cy="20" r="2" fill="currentColor" />
              </svg>
              <div className="feature-title">Suivi d&apos;avancement</div>
              <div className="feature-text">Tableau de bord par chantier. Visualisez l&apos;état de chaque lot, les réserves ouvertes et les jalons à venir en un coup d&apos;œil.</div>
            </div>
          </div>

          <div className="feature-card">
            <div className="feature-badge">05</div>
            <div className="feature-content">
              <svg className="feature-icon" viewBox="0 0 40 40" fill="none">
                <rect x="8" y="8" width="24" height="24" rx="2" stroke="currentColor" strokeWidth="1.5" />
                <path d="M14 20l4 4 8-8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <div className="feature-title">Interface client</div>
              <div className="feature-text">Donnez accès à vos maîtres d&apos;ouvrage en lecture seule. Ils suivent l&apos;avancement sans polluer votre espace de travail.</div>
            </div>
          </div>

          <div className="feature-card">
            <div className="feature-badge">06</div>
            <div className="feature-content">
              <svg className="feature-icon" viewBox="0 0 40 40" fill="none">
                <path d="M20 8v4M20 28v4M8 20h4M28 20h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                <circle cx="20" cy="20" r="8" stroke="currentColor" strokeWidth="1.5" />
                <circle cx="20" cy="20" r="3" fill="currentColor" opacity="0.5" />
              </svg>
              <div className="feature-title">Photos intégrées</div>
              <div className="feature-text">Capturez depuis mobile, intégrez directement dans les CR. Les photos s&apos;insèrent dans le PDF automatiquement au bon endroit.</div>
            </div>
          </div>
        </div>
      </section>

      {/* AVANT / APRÈS */}
      <section className="lp-section lp-before-after">
        <h2 className="section-title reveal" style={{ marginBottom: '48px' }}>Avant. Après.</h2>
        <div className="before-after-grid reveal">
          <div className="ba-col ba-before">
            <div className="ba-title">Avant Foreman</div>
            <ul className="ba-list">
              <li>📄 CR tapé sur Word à 23h</li>
              <li>📧 Email avec 12 pièces jointes</li>
              <li>📞 Appel pour savoir qui vient</li>
              <li>🗓️ Planning sur Excel</li>
              <li>😓 2h d&apos;admin par visite</li>
            </ul>
          </div>
          <div className="ba-col ba-after">
            <div className="ba-title">Avec Foreman</div>
            <ul className="ba-list">
              <li>⚡ CR généré en 3 clics sur site</li>
              <li>📨 PDF envoyé automatiquement</li>
              <li>🔗 Magic link = présence confirmée</li>
              <li>📅 Planning synchro depuis les CR</li>
              <li>✅ 20 minutes par visite</li>
            </ul>
          </div>
        </div>
      </section>

      {/* WORKFLOW */}
      <section className="lp-section" id="workflow">
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

        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="lp-testimonials">
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
                <div className="author-role">MOE indépendant, France</div>
              </div>
            </div>
          </div>

          <div className="testimonial reveal">
            <p className="testimonial-text">&ldquo;Le suivi par lots donne enfin une vision claire à mes clients. Plus besoin de leur expliquer où en est le chantier à chaque appel.&rdquo;</p>
            <div className="testimonial-author">
              <div className="author-avatar">SA</div>
              <div>
                <div className="author-name">Sophie A.</div>
                <div className="author-role">Architecte, France</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="lp-section lp-faq">
        <div className="section-label reveal">FAQ</div>
        <h2 className="section-title reveal">Questions fréquentes</h2>
        <div className="faq-list reveal">
          {faqs.map((faq, i) => (
            <div key={i} className={`faq-item${openFaq === i ? ' open' : ''}`}>
              <button className="faq-question" onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                {faq.q}
                <span className="faq-icon">{openFaq === i ? '−' : '+'}</span>
              </button>
              <div className="faq-answer">
                <p>{faq.a}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* PRICING */}
      <section className="lp-pricing" id="pricing">
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
      <section className="lp-cta">
        <h2 className="reveal">Prêt à<br /><em>prendre le chantier</em><br />en main ?</h2>
        <p className="reveal">Rejoignez les architectes et MOE qui ont arrêté de perdre du temps sur l&apos;administratif.</p>
        <a href="/login" className="btn-primary lp-cta-btn reveal">
          Commencer gratuitement
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </a>
      </section>

      {/* FOOTER */}
      <footer className="lp-footer-v2">
        <div className="footer-v2-grid">
          <div className="footer-v2-col">
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: '12px' }}>
              <span style={{ width: 4, height: 24, backgroundColor: '#F97316', borderRadius: 1, flexShrink: 0 }} />
              <span style={{ fontFamily: 'var(--font-syne), sans-serif', fontWeight: 800, fontSize: '20px', letterSpacing: '-0.5px', color: '#F0EDE6' }}>
                FORE<span style={{ color: '#F97316' }}>MAN</span>
              </span>
            </div>
            <p className="footer-v2-desc">Gestion de chantier pour architectes et MOE.</p>
          </div>
          <div className="footer-v2-col">
            <a href="#features" className="footer-v2-link">Fonctionnalités</a>
            <a href="#pricing" className="footer-v2-link">Tarifs</a>
            <a href="#workflow" className="footer-v2-link">Comment ça marche</a>
          </div>
          <div className="footer-v2-col">
            <span className="footer-v2-info">contact@foreman.app</span>
          </div>
        </div>
        <div className="footer-v2-copy">© 2026 Foreman</div>
      </footer>
    </>
  )
}
