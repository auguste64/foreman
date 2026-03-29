'use client'
import { useEffect, useState, useCallback } from 'react'

const STEPS = [
  {
    id: 'nav-chantiers',
    title: 'Chantiers',
    description: 'Commencez par créer votre premier chantier. Tous vos projets sont centralisés ici.',
  },
  {
    id: 'nav-comptes-rendus',
    title: 'Comptes rendus',
    description: "Rédigez vos comptes rendus de chantier et envoyez-les en PDF directement depuis l'app.",
  },
  {
    id: 'nav-artisans',
    title: 'Artisans',
    description: 'Ajoutez vos artisans et convoquez-les en un clic par email.',
  },
  {
    id: 'nav-comptabilite',
    title: 'Comptabilité',
    description: 'Créez devis, factures et acomptes pour chaque chantier.',
  },
  {
    id: 'nav-planning',
    title: 'Planning',
    description: 'Visualisez tous vos événements de chantier sur un calendrier unifié.',
  },
]

const SIDEBAR_WIDTH = 240
const POPOVER_WIDTH = 300

export default function OnboardingOverlay() {
  const [visible, setVisible] = useState(false)
  const [step, setStep] = useState(0)
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (localStorage.getItem('onboarding_done') !== 'true') {
      setVisible(true)
    }
  }, [])

  const updateRect = useCallback((stepIndex: number) => {
    const el = document.getElementById(STEPS[stepIndex].id)
    if (el) setTargetRect(el.getBoundingClientRect())
  }, [])

  useEffect(() => {
    if (!visible) return
    // Small delay to let sidebar render completely
    const t = setTimeout(() => updateRect(step), 80)
    const handleResize = () => updateRect(step)
    window.addEventListener('resize', handleResize)
    return () => {
      clearTimeout(t)
      window.removeEventListener('resize', handleResize)
    }
  }, [visible, step, updateRect])

  function dismiss() {
    localStorage.setItem('onboarding_done', 'true')
    setVisible(false)
  }

  function next() {
    if (step < STEPS.length - 1) {
      setStep(s => s + 1)
    } else {
      dismiss()
    }
  }

  if (!visible || !targetRect) return null

  const HIGHLIGHT_PAD = 4
  const highlightTop  = targetRect.top  - HIGHLIGHT_PAD
  const highlightLeft = targetRect.left - HIGHLIGHT_PAD
  const highlightW    = targetRect.width  + HIGHLIGHT_PAD * 2
  const highlightH    = targetRect.height + HIGHLIGHT_PAD * 2

  // Popover vertically centered on the highlighted item, clamped to viewport
  const popoverHeight = 190
  let popoverTop = targetRect.top + targetRect.height / 2 - popoverHeight / 2
  popoverTop = Math.max(12, Math.min(popoverTop, window.innerHeight - popoverHeight - 12))
  const popoverLeft = SIDEBAR_WIDTH + 20

  // Arrow vertical center = midpoint of highlighted element
  const arrowY = targetRect.top + targetRect.height / 2

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200, pointerEvents: 'none' }}>
      {/* Backdrop — blocks all clicks outside popover */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'all' }} />

      {/* Spotlight cutout via box-shadow */}
      <div
        style={{
          position: 'absolute',
          top: highlightTop,
          left: highlightLeft,
          width: highlightW,
          height: highlightH,
          borderRadius: 8,
          boxShadow: '0 0 0 9999px rgba(0,0,0,0.72)',
          border: '1.5px solid #ea580c',
          zIndex: 1,
          pointerEvents: 'none',
        }}
      />

      {/* Arrow pointing left toward sidebar */}
      <div
        style={{
          position: 'absolute',
          top: arrowY - 8,
          left: popoverLeft - 9,
          width: 0,
          height: 0,
          borderTop: '8px solid transparent',
          borderBottom: '8px solid transparent',
          borderRight: '9px solid #ea580c',
          zIndex: 3,
          pointerEvents: 'none',
        }}
      />
      {/* Arrow inner fill */}
      <div
        style={{
          position: 'absolute',
          top: arrowY - 7,
          left: popoverLeft - 7,
          width: 0,
          height: 0,
          borderTop: '7px solid transparent',
          borderBottom: '7px solid transparent',
          borderRight: '8px solid #1A1A18',
          zIndex: 3,
          pointerEvents: 'none',
        }}
      />

      {/* Popover */}
      <div
        style={{
          position: 'absolute',
          top: popoverTop,
          left: popoverLeft,
          width: POPOVER_WIDTH,
          background: '#1A1A18',
          border: '1px solid #ea580c',
          borderRadius: 12,
          padding: '18px 20px 20px',
          zIndex: 3,
          pointerEvents: 'all',
          boxShadow: '0 12px 40px rgba(0,0,0,0.55)',
        }}
      >
        {/* Header row: progress + close */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <span style={{ fontSize: 11, color: '#5A5A58', fontFamily: 'var(--font-dm-sans), sans-serif', letterSpacing: '0.06em', fontWeight: 600 }}>
            {step + 1} / {STEPS.length}
          </span>
          <button
            onClick={dismiss}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#5A5A58', fontSize: 16, lineHeight: 1, padding: '2px 4px', display: 'flex', alignItems: 'center' }}
            aria-label="Passer l'onboarding"
          >
            ✕
          </button>
        </div>

        {/* Progress dots */}
        <div style={{ display: 'flex', gap: 5, marginBottom: 14 }}>
          {STEPS.map((_, i) => (
            <div
              key={i}
              style={{
                height: 3,
                flex: 1,
                borderRadius: 2,
                backgroundColor: i <= step ? '#ea580c' : '#2A2A27',
                transition: 'background-color 0.3s',
              }}
            />
          ))}
        </div>

        <h3 style={{ fontFamily: 'var(--font-syne), sans-serif', fontWeight: 700, fontSize: 16, color: '#F0EDE6', margin: '0 0 8px' }}>
          {STEPS[step].title}
        </h3>
        <p style={{ fontSize: 14, color: '#8A8880', fontFamily: 'var(--font-dm-sans), sans-serif', margin: '0 0 20px', lineHeight: 1.6 }}>
          {STEPS[step].description}
        </p>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button
            onClick={dismiss}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: '#5A5A58', padding: '8px 0', fontFamily: 'var(--font-dm-sans), sans-serif', transition: 'color 0.15s' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#8A8880' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#5A5A58' }}
          >
            Passer
          </button>
          <button
            onClick={next}
            style={{ background: '#ea580c', border: 'none', borderRadius: 8, padding: '9px 20px', fontSize: 13, fontWeight: 600, color: '#fff', cursor: 'pointer', fontFamily: 'var(--font-dm-sans), sans-serif', transition: 'background 0.15s' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#c94f0a' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '#ea580c' }}
          >
            {step === STEPS.length - 1 ? 'Commencer' : 'Suivant →'}
          </button>
        </div>
      </div>
    </div>
  )
}
