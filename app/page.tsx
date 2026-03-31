import './landing.css'
import LandingAnimations from './LandingAnimations'
import Image from 'next/image'

export const metadata = {
  title: "The Builder — Gestion de chantier pour architectes et MOEs",
  description: "Comptes rendus PDF, gestion artisans, comptabilité et planning synchronisé. Dès 11,90€/mois. Sans engagement.",
}

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
  const featuresEssentiel = ['Comptes rendus PDF + email', 'Répertoire artisans & clients', 'Planning / calendrier']
  const featuresComplet = ['Comptes rendus PDF + email', 'Répertoire artisans & clients', 'Planning / calendrier', 'Comptabilité (devis & factures)', 'Analyse & statistiques', 'Toutes les futures fonctionnalités']

  return (
    <div style={{ display: 'flex', flexDirection: 'row', gap: '24px', maxWidth: '860px', margin: '40px auto 0', padding: '0 24px', justifyContent: 'center', flexWrap: 'wrap' }}>

      {/* Plan Essentiel */}
      <div
        className="anim d1"
        style={{
          flex: '1 1 360px', maxWidth: '400px', padding: '36px 40px',
          background: 'rgba(10,10,9,0.75)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
          border: '1px solid rgba(255,255,255,0.10)', borderRadius: '20px',
          display: 'flex', flexDirection: 'column',
          animation: 'halo-pulse-subtle 4s ease-in-out infinite',
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
          href="/login"
          style={{
            display: 'block', textAlign: 'center', padding: '14px 32px',
            background: 'transparent', color: '#ea580c',
            border: '1px solid #ea580c', borderRadius: '10px',
            fontSize: '15px', fontWeight: 700,
            fontFamily: 'var(--font-syne), sans-serif', textDecoration: 'none',
            cursor: 'pointer',
            animation: 'btn-glow 3s ease-in-out infinite',
          }}
        >
          Commencer →
        </a>
      </div>

      {/* Plan Pro */}
      <div
        className="anim d2"
        style={{
          flex: '1 1 360px', maxWidth: '400px', padding: '36px 40px',
          background: 'rgba(10,10,9,0.75)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
          border: '1px solid rgba(234,88,12,0.6)', borderRadius: '20px',
          display: 'flex', flexDirection: 'column', position: 'relative',
          animation: 'halo-pulse 3s ease-in-out infinite',
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
          href="/login"
          style={{
            display: 'block', textAlign: 'center', padding: '14px 32px',
            background: '#ea580c', color: '#fff',
            border: 'none', borderRadius: '10px',
            fontSize: '15px', fontWeight: 700,
            fontFamily: 'var(--font-syne), sans-serif', textDecoration: 'none',
            cursor: 'pointer',
            animation: 'btn-glow 2s ease-in-out infinite',
          }}
        >
          Commencer →
        </a>
      </div>

    </div>
  )
}

export default function Home() {
  return (
    <div className="lp-wrapper">
      <LandingAnimations />

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'SoftwareApplication',
        name: 'The Builder',
        applicationCategory: 'BusinessApplication',
        operatingSystem: 'Web',
        inLanguage: 'fr',
        description: "SaaS de gestion de chantier pour architectes et maîtres d'œuvre",
        url: 'https://thebuilder.io',
        audience: { '@type': 'Audience', audienceType: "Architectes et maîtres d'œuvre", geographicArea: { '@type': 'Country', name: 'France' } },
        offers: [
          { '@type': 'Offer', name: 'Essentiel', price: '11.90', priceCurrency: 'EUR', availability: 'https://schema.org/OnlineOnly', priceSpecification: { '@type': 'UnitPriceSpecification', price: '11.90', priceCurrency: 'EUR', unitText: 'MONTH' } },
          { '@type': 'Offer', name: 'Pro', price: '18.90', priceCurrency: 'EUR', availability: 'https://schema.org/OnlineOnly', priceSpecification: { '@type': 'UnitPriceSpecification', price: '18.90', priceCurrency: 'EUR', unitText: 'MONTH' } },
        ]
      }) }} />

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
        <a className="logo" href="/">
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
        <div className="hero-badge anim">
          <span className="badge-dot"></span>
          Gestion de chantier · Architectes &amp; MOEs
        </div>

        <h1 className="hero-title anim d1">
          Pilotez vos chantiers<br />
          avec <span className="grad-text">10× plus d&apos;efficacité.</span>
        </h1>

        <p className="hero-sub anim d2">
          Finis les CR rédigés le soir. Artisans convoqués et relancés automatiquement. Comptabilité chantier en un clic. Conçu pour les architectes et maîtres d&apos;œuvre.
        </p>

        <div className="hero-price anim d3">
          <span className="price-val">dès 11,90€/mois</span>
        </div>

        <div className="hero-cta anim d4">
          <a href="/login" className="btn btn-primary btn-md">Commencer gratuitement →</a>
        </div>

        <div className="anim d5" style={{ marginTop: '16px', position: 'relative', zIndex: 3 }}>
          <p style={{ fontSize: '13px', color: '#8A8880', display: 'flex', gap: '16px', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap', fontFamily: 'var(--font-jakarta), sans-serif' }}>
            <span>✓ Sans carte bancaire</span>
            <span style={{ color: 'rgba(255,255,255,0.1)' }}>·</span>
            <span>✓ Données hébergées en France</span>
            <span style={{ color: 'rgba(255,255,255,0.1)' }}>·</span>
            <span>✓ Annulable à tout moment</span>
          </p>
        </div>

        <div className="hero-mockup anim d6">
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

      {/* COMMENT ÇA MARCHE */}
      <section style={{ position: 'relative', zIndex: 2, padding: '80px 60px', textAlign: 'center' }}>
        <div className="section-header reveal">
          <div className="section-chip">En 3 étapes</div>
          <h2 className="section-title" style={{ marginBottom: '0' }}>Opérationnel en moins de 10 minutes</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px', maxWidth: '900px', margin: '48px auto 0' }}>
          {[
            { n: '1', title: 'Créez votre compte en 2 minutes', desc: 'Sans carte bancaire. Importez vos contacts Google directement. Votre espace est prêt en 120 secondes.' },
            { n: '2', title: 'Ajoutez votre premier chantier', desc: 'Nom, adresse, artisans associés. Votre premier projet configuré en quelques clics.' },
            { n: '3', title: 'Générez votre premier CR professionnel', desc: 'Remplissez, signez, envoyez. Vos artisans reçoivent le PDF automatiquement par email.' },
          ].map((step, i) => (
            <div key={step.n} className={`reveal anim d${i + 1}`} style={{ background: 'rgba(15,18,32,0.6)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '20px', padding: '36px 32px', textAlign: 'left', position: 'relative', zIndex: 2 }}>
              <div style={{ fontSize: '56px', fontWeight: 800, color: '#ea580c', fontFamily: 'var(--font-syne), sans-serif', lineHeight: 1, marginBottom: '20px', letterSpacing: '-2px' }}>{step.n}</div>
              <h3 style={{ fontSize: '17px', fontWeight: 700, color: '#F0EDE6', marginBottom: '12px', fontFamily: 'var(--font-syne), sans-serif', lineHeight: 1.3 }}>{step.title}</h3>
              <p style={{ fontSize: '14px', color: 'rgba(232,234,242,0.55)', lineHeight: 1.75, fontFamily: 'var(--font-jakarta), sans-serif', margin: 0 }}>{step.desc}</p>
            </div>
          ))}
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
          {[
            { img: '/screenshots/comptes-rendus.png', alt: 'Comptes rendus PDF', icon: '📋', title: 'Comptes rendus PDF', desc: 'Générez des CR professionnels en minutes. Envoi automatique aux artisans par email.', delay: 'd1' },
            { img: '/screenshots/artisans.png', alt: 'Gestion artisans', icon: '👷', title: 'Gestion artisans', desc: 'Magic link, convocations, présences. Interface dédiée pour vos artisans — gratuite.', delay: 'd2' },
            { img: '/screenshots/comptabilite.png', alt: 'Comptabilité intégrée', icon: '💶', title: 'Comptabilité intégrée', desc: 'Devis, factures, avoirs, acomptes. Aperçu PDF live et envoi en un clic.', delay: 'd3' },
            { img: '/screenshots/planning.png', alt: 'Planning synchronisé', icon: '📅', title: 'Planning synchronisé', desc: 'Google Calendar, Apple Calendar, Outlook. Tout synchronisé en temps réel.', delay: 'd4' },
            { img: '/screenshots/clients.png', alt: 'Clients & contacts', icon: '👥', title: 'Clients & contacts', desc: 'Import Google Contacts. Fiches liées automatiquement à vos chantiers.', delay: 'd5' },
            { img: '/screenshots/analyse.png', alt: 'Analyse & statistiques', icon: '📊', title: 'Analyse & statistiques', desc: 'CA, pipeline, projections, impayés. Pilotez votre activité avec précision.', delay: 'd6' },
          ].map((card) => (
            <div key={card.title} className={`feat-card reveal anim ${card.delay}`}>
              <Image src={card.img} alt={card.alt} width={800} height={180} loading="lazy" sizes="(max-width: 768px) 100vw, 800px" style={{ width: '100%', objectFit: 'cover', objectPosition: 'top left', borderRadius: '8px', marginBottom: '20px', display: 'block', background: '#1E1E1C' }} />
              <div className="feat-icon">{card.icon}</div>
              <h3 className="feat-title">{card.title}</h3>
              <p className="feat-desc">{card.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* TÉMOIGNAGES */}
      <section style={{ position: 'relative', zIndex: 2, padding: '80px 60px' }}>
        <div className="section-header reveal">
          <div className="section-chip">Ils nous font confiance</div>
          <h2 className="section-title">Ce que disent les architectes<br />et maîtres d&apos;œuvre</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px', maxWidth: '1100px', margin: '0 auto' }}>
          {[
            { quote: 'Avant The Builder, je passais 2h à rédiger le CR après chaque visite. Maintenant c'est 20 minutes, PDF envoyé aux artisans avant même de rentrer du chantier.', name: 'Sophie M.', role: 'Architecte DPLG', city: 'Lyon', delay: 'd1' },
            { quote: 'Les artisans reçoivent leur convocation automatiquement. Zéro oubli, zéro relance manuelle. J'ai récupéré au moins 3h par semaine.', name: 'Marc T.', role: 'Maître d\'œuvre', city: 'Bordeaux', delay: 'd2' },
            { quote: 'La comptabilité chantier en temps réel m'a évité un impayé de 8 000€. Je vois immédiatement ce qui est dû, par qui, et depuis quand.', name: 'Julie R.', role: 'MOE indépendante', city: 'Paris', delay: 'd3' },
          ].map((t) => (
            <div key={t.name} className={`reveal anim ${t.delay}`} style={{ background: '#111110', border: '1px solid #1E1E1C', borderRadius: '20px', padding: '36px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div style={{ fontSize: '40px', lineHeight: 1, color: '#ea580c', fontFamily: 'Georgia, serif', marginBottom: '-8px' }}>&ldquo;</div>
              <p style={{ fontSize: '15px', lineHeight: 1.75, color: 'rgba(240,237,230,0.85)', fontFamily: 'var(--font-jakarta), sans-serif', margin: 0, flex: 1 }}>{t.quote}</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', borderTop: '1px solid #1E1E1C', paddingTop: '20px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(234,88,12,0.15)', border: '1px solid rgba(234,88,12,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: 700, color: '#ea580c', fontFamily: 'var(--font-syne), sans-serif', flexShrink: 0 }}>
                  {t.name[0]}
                </div>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: '#F0EDE6', fontFamily: 'var(--font-syne), sans-serif' }}>{t.name}</div>
                  <div style={{ fontSize: '12px', color: '#8A8880', fontFamily: 'var(--font-jakarta), sans-serif' }}>{t.role} · {t.city}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CLOSER */}
      <section className="closer">
        <h2 className="closer-title reveal anim">Prêt à transformer votre façon de gérer vos chantiers ?</h2>
        <p className="closer-sub reveal anim d1">
          Rejoignez les architectes et MOEs qui ont adopté The Builder. Commencez en moins de 2 minutes.
        </p>
        <a href="/login" className="btn btn-primary btn-lg reveal anim d2">Essayer gratuitement →</a>
      </section>

      {/* FOOTER */}
      <footer className="anim">
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
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '10px' }}>
          <div className="footer-copy">© 2026 The Builder — Architectes &amp; MOEs</div>
          <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
            <a href="/mentions-legales" style={{ fontSize: '12px', color: '#8A8880', textDecoration: 'none' }}>Mentions légales</a>
            <span style={{ fontSize: '12px', color: '#2A2A27' }}>·</span>
            <a href="/confidentialite" style={{ fontSize: '12px', color: '#8A8880', textDecoration: 'none' }}>Politique de confidentialité</a>
            <span style={{ fontSize: '12px', color: '#2A2A27' }}>·</span>
            <a href="/cgu" style={{ fontSize: '12px', color: '#8A8880', textDecoration: 'none' }}>CGU</a>
          </div>
        </div>
      </footer>

    </div>
  )
}
