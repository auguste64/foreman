'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type Props = {
  userId: string
  onClose: () => void
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '11px 14px',
  backgroundColor: '#0D0D0B',
  border: '1px solid #1E1E1C',
  borderRadius: 8,
  color: '#F0EDE6',
  fontSize: 14,
  outline: 'none',
  fontFamily: 'var(--font-dm-sans), sans-serif',
  boxSizing: 'border-box',
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: '#8A8880',
  marginBottom: 6,
  fontFamily: 'var(--font-dm-sans), sans-serif',
}

const focus = (e: React.FocusEvent<HTMLInputElement>) => {
  e.target.style.borderColor = '#ea580c'
  e.target.style.boxShadow = '0 0 0 2px rgba(234,88,12,0.12)'
}
const blur = (e: React.FocusEvent<HTMLInputElement>) => {
  e.target.style.borderColor = '#1E1E1C'
  e.target.style.boxShadow = 'none'
}

export default function OnboardingModal({ userId, onClose }: Props) {
  const TOTAL_STEPS = 4
  const [step, setStep] = useState(1)
  const [saving, setSaving] = useState(false)

  // Step 1 — Entreprise
  const [nomEntreprise, setNomEntreprise] = useState('')
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Step 2 — Chantier
  const [chantierNom, setChantierNom] = useState('')
  const [chantierAdresse, setChantierAdresse] = useState('')
  const [chantierClient, setChantierClient] = useState('')
  const [chantierCreated, setChantierCreated] = useState(false)

  // Step 3 — Artisan
  const [artisanNom, setArtisanNom] = useState('')
  const [artisanEmail, setArtisanEmail] = useState('')
  const [artisanMetier, setArtisanMetier] = useState('')
  const [artisanCreated, setArtisanCreated] = useState(false)

  const backdropRef = useRef<HTMLDivElement>(null)

  async function markDone() {
    const supabase = createClient()
    const { error } = await supabase
      .from('profiles')
      .upsert({ id: userId, onboarding_done: true }, { onConflict: 'id' })
    if (error) console.error('[Onboarding] Failed to mark done:', error.message)
    onClose()
  }

  // Escape key + backdrop click → close
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') markDone()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function handleBackdropClick(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === backdropRef.current) markDone()
  }

  function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setLogoFile(file)
    const reader = new FileReader()
    reader.onload = ev => setLogoPreview(ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  async function handleNext() {
    setSaving(true)
    try {
      const supabase = createClient()

      if (step === 1) {
        // Save entreprise name
        if (nomEntreprise.trim()) {
          await Promise.all([
            supabase.from('entreprise_infos').upsert(
              { user_id: userId, raison_sociale: nomEntreprise.trim() },
              { onConflict: 'user_id' }
            ),
            supabase.from('profiles').upsert(
              { id: userId, entreprise: nomEntreprise.trim() },
              { onConflict: 'id' }
            ),
          ])
          // Upload logo if provided
          if (logoFile) {
            const ext = logoFile.name.split('.').pop()
            await supabase.storage
              .from('logos')
              .upload(`${userId}/logo.${ext}`, logoFile, { upsert: true })
              .catch(() => {}) // bucket may not exist yet
          }
        }
        setStep(2)

      } else if (step === 2) {
        // Create chantier if name provided
        if (chantierNom.trim()) {
          const { error } = await supabase.from('chantiers').insert({
            user_id: userId,
            nom: chantierNom.trim(),
            adresse: chantierAdresse.trim() || '',
            client: chantierClient.trim() || '',
            statut: 'En cours',
            date_debut: new Date().toISOString().split('T')[0],
          })
          if (!error) setChantierCreated(true)
        }
        setStep(3)

      } else if (step === 3) {
        // Create artisan if anything provided
        if (artisanNom.trim() || artisanEmail.trim()) {
          const { error } = await supabase.from('artisans').insert({
            user_id: userId,
            nom: artisanNom.trim() || (artisanEmail.split('@')[0] ?? 'Artisan'),
            email: artisanEmail.trim(),
            telephone: '',
            metier: artisanMetier.trim() || 'Non spécifié',
          })
          if (!error) setArtisanCreated(true)
        }
        setStep(4)

      } else if (step === 4) {
        await markDone()
        return
      }
    } catch { /* ignore */ }
    setSaving(false)
  }

  async function handleSkip() {
    if (step < TOTAL_STEPS) {
      // Mark done immediately so a page refresh won't re-show the modal
      const supabase = createClient()
      await supabase
        .from('profiles')
        .upsert({ id: userId, onboarding_done: true }, { onConflict: 'id' })
      setStep(s => s + 1)
    } else {
      await markDone()
    }
  }

  const progress = ((step - 1) / (TOTAL_STEPS - 1)) * 100

  return (
    <div
      ref={backdropRef}
      onClick={handleBackdropClick}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.72)',
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
    >
      <div
        style={{
          backgroundColor: '#111110',
          border: '1px solid #1E1E1C',
          borderRadius: 16,
          width: '100%',
          maxWidth: 480,
          overflow: 'hidden',
          boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
        }}
      >
        {/* Progress bar */}
        <div style={{ height: 3, backgroundColor: '#1E1E1C', position: 'relative' }}>
          <div
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              height: '100%',
              width: `${progress}%`,
              backgroundColor: '#ea580c',
              transition: 'width 0.4s ease',
            }}
          />
        </div>

        <div style={{ padding: '32px 32px 28px' }}>
          {/* Step counter */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
            <div style={{ display: 'flex', gap: 6 }}>
              {Array.from({ length: TOTAL_STEPS }, (_, i) => (
                <div
                  key={i}
                  style={{
                    width: i + 1 === step ? 20 : 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: i + 1 <= step ? '#ea580c' : '#1E1E1C',
                    transition: 'all 0.3s ease',
                  }}
                />
              ))}
            </div>
            <span style={{ fontSize: 12, color: '#8A8880', fontFamily: 'var(--font-dm-sans), sans-serif' }}>
              Étape {step}/{TOTAL_STEPS}
            </span>
          </div>

          {/* ── Step 1 — Entreprise ── */}
          {step === 1 && (
            <div>
              <p style={{ fontFamily: 'var(--font-syne)', fontWeight: 800, fontSize: 22, color: '#F0EDE6', margin: '0 0 6px' }}>
                Bienvenue sur The Builder 👋
              </p>
              <p style={{ fontSize: 14, color: '#8A8880', fontFamily: 'var(--font-dm-sans), sans-serif', margin: '0 0 28px', lineHeight: 1.6 }}>
                Commençons par configurer votre espace de travail.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                <div>
                  <label style={labelStyle}>Nom de votre entreprise</label>
                  <input
                    type="text"
                    value={nomEntreprise}
                    onChange={e => setNomEntreprise(e.target.value)}
                    placeholder="Ex : Martin Bâtiment, SAS Dupont…"
                    style={inputStyle}
                    onFocus={focus}
                    onBlur={blur}
                    autoFocus
                  />
                </div>

                <div>
                  <label style={labelStyle}>Logo (optionnel)</label>
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                      border: '1px dashed #1E1E1C',
                      borderRadius: 8,
                      padding: logoPreview ? '12px' : '24px',
                      textAlign: 'center',
                      cursor: 'pointer',
                      backgroundColor: '#0D0D0B',
                      transition: 'border-color 0.15s',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 12,
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = '#ea580c' }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = '#1E1E1C' }}
                  >
                    {logoPreview ? (
                      <>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={logoPreview} alt="Logo" style={{ width: 48, height: 48, objectFit: 'contain', borderRadius: 6 }} />
                        <span style={{ fontSize: 13, color: '#8A8880', fontFamily: 'var(--font-dm-sans), sans-serif' }}>
                          {logoFile?.name}
                        </span>
                      </>
                    ) : (
                      <div>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" style={{ margin: '0 auto 8px', display: 'block' }}>
                          <path d="M12 16V8M8 12l4-4 4 4" stroke="#8A8880" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          <rect x="3" y="3" width="18" height="18" rx="2" stroke="#8A8880" strokeWidth="1.5"/>
                        </svg>
                        <p style={{ fontSize: 13, color: '#8A8880', fontFamily: 'var(--font-dm-sans), sans-serif', margin: 0 }}>
                          Cliquer pour importer
                        </p>
                      </div>
                    )}
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleLogoChange}
                    style={{ display: 'none' }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* ── Step 2 — Premier chantier ── */}
          {step === 2 && (
            <div>
              <p style={{ fontFamily: 'var(--font-syne)', fontWeight: 800, fontSize: 22, color: '#F0EDE6', margin: '0 0 6px' }}>
                Votre premier chantier 🏗️
              </p>
              <p style={{ fontSize: 14, color: '#8A8880', fontFamily: 'var(--font-dm-sans), sans-serif', margin: '0 0 28px', lineHeight: 1.6 }}>
                Ajoutez un chantier pour commencer à tout suivre depuis le dashboard.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={labelStyle}>Nom du chantier *</label>
                  <input
                    type="text"
                    value={chantierNom}
                    onChange={e => setChantierNom(e.target.value)}
                    placeholder="Ex : Rénovation villa Les Pins"
                    style={inputStyle}
                    onFocus={focus}
                    onBlur={blur}
                    autoFocus
                  />
                </div>
                <div>
                  <label style={labelStyle}>Adresse</label>
                  <input
                    type="text"
                    value={chantierAdresse}
                    onChange={e => setChantierAdresse(e.target.value)}
                    placeholder="12 rue de la Paix, 75001 Paris"
                    style={inputStyle}
                    onFocus={focus}
                    onBlur={blur}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Nom du client</label>
                  <input
                    type="text"
                    value={chantierClient}
                    onChange={e => setChantierClient(e.target.value)}
                    placeholder="M. et Mme Dupont"
                    style={inputStyle}
                    onFocus={focus}
                    onBlur={blur}
                  />
                </div>
              </div>
            </div>
          )}

          {/* ── Step 3 — Artisan ── */}
          {step === 3 && (
            <div>
              <p style={{ fontFamily: 'var(--font-syne)', fontWeight: 800, fontSize: 22, color: '#F0EDE6', margin: '0 0 6px' }}>
                Ajoutez un artisan 👷
              </p>
              <p style={{ fontSize: 14, color: '#8A8880', fontFamily: 'var(--font-dm-sans), sans-serif', margin: '0 0 28px', lineHeight: 1.6 }}>
                Facultatif — vous pouvez en ajouter d&apos;autres plus tard depuis la section Artisans.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={labelStyle}>Nom complet</label>
                  <input
                    type="text"
                    value={artisanNom}
                    onChange={e => setArtisanNom(e.target.value)}
                    placeholder="Jean Leclerc"
                    style={inputStyle}
                    onFocus={focus}
                    onBlur={blur}
                    autoFocus
                  />
                </div>
                <div>
                  <label style={labelStyle}>Métier</label>
                  <input
                    type="text"
                    value={artisanMetier}
                    onChange={e => setArtisanMetier(e.target.value)}
                    placeholder="Électricien, Plombier, Maçon…"
                    style={inputStyle}
                    onFocus={focus}
                    onBlur={blur}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Email</label>
                  <input
                    type="email"
                    value={artisanEmail}
                    onChange={e => setArtisanEmail(e.target.value)}
                    placeholder="jean.leclerc@example.com"
                    style={inputStyle}
                    onFocus={focus}
                    onBlur={blur}
                  />
                </div>
              </div>
            </div>
          )}

          {/* ── Step 4 — Récap ── */}
          {step === 4 && (
            <div>
              <p style={{ fontFamily: 'var(--font-syne)', fontWeight: 800, fontSize: 22, color: '#F0EDE6', margin: '0 0 6px' }}>
                C&apos;est parti ! 🚀
              </p>
              <p style={{ fontSize: 14, color: '#8A8880', fontFamily: 'var(--font-dm-sans), sans-serif', margin: '0 0 24px', lineHeight: 1.6 }}>
                Votre espace est prêt. Voici ce qui a été configuré :
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 8 }}>
                {nomEntreprise.trim() && (
                  <RecapItem icon="🏢" label="Entreprise" value={nomEntreprise} />
                )}
                {chantierCreated ? (
                  <RecapItem icon="🏗️" label="Chantier créé" value={chantierNom} />
                ) : (
                  <RecapItem icon="🏗️" label="Chantier" value="Aucun créé — à faire depuis Chantiers" muted />
                )}
                {artisanCreated ? (
                  <RecapItem icon="👷" label="Artisan ajouté" value={artisanNom || artisanEmail} />
                ) : (
                  <RecapItem icon="👷" label="Artisan" value="Aucun ajouté — à faire depuis Artisans" muted />
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', gap: 10, marginTop: 28, alignItems: 'center' }}>
            <button
              onClick={handleNext}
              disabled={saving}
              style={{
                flex: 1,
                padding: '12px 20px',
                backgroundColor: '#ea580c',
                color: '#0D0D0B',
                border: 'none',
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 700,
                cursor: saving ? 'not-allowed' : 'pointer',
                fontFamily: 'var(--font-dm-sans), sans-serif',
                opacity: saving ? 0.7 : 1,
                transition: 'opacity 0.15s',
              }}
            >
              {saving ? 'Enregistrement…' : step === 4 ? 'Commencer →' : step === 2 && !chantierNom.trim() ? 'Continuer sans chantier →' : 'Continuer →'}
            </button>
            {step < TOTAL_STEPS && (
              <button
                onClick={handleSkip}
                disabled={saving}
                style={{
                  padding: '12px 16px',
                  backgroundColor: 'transparent',
                  color: '#8A8880',
                  border: '1px solid #1E1E1C',
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: 'pointer',
                  fontFamily: 'var(--font-dm-sans), sans-serif',
                  transition: 'color 0.15s, border-color 0.15s',
                  whiteSpace: 'nowrap',
                }}
                onMouseEnter={e => { e.currentTarget.style.color = '#F0EDE6'; e.currentTarget.style.borderColor = '#8A8880' }}
                onMouseLeave={e => { e.currentTarget.style.color = '#8A8880'; e.currentTarget.style.borderColor = '#1E1E1C' }}
              >
                Passer
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function RecapItem({ icon, label, value, muted }: { icon: string; label: string; value: string; muted?: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', backgroundColor: '#0D0D0B', borderRadius: 8, border: '1px solid #1E1E1C' }}>
      <span style={{ fontSize: 18, flexShrink: 0 }}>{icon}</span>
      <div style={{ minWidth: 0 }}>
        <p style={{ fontSize: 11, color: '#8A8880', fontFamily: 'var(--font-dm-sans), sans-serif', margin: '0 0 2px', textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 600 }}>
          {label}
        </p>
        <p style={{ fontSize: 13, color: muted ? '#5A5A58' : '#F0EDE6', fontFamily: 'var(--font-dm-sans), sans-serif', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontStyle: muted ? 'italic' : 'normal' }}>
          {value}
        </p>
      </div>
      {!muted && (
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ marginLeft: 'auto', flexShrink: 0 }}>
          <path d="M2 7l4 4 6-7" stroke="#ea580c" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )}
    </div>
  )
}
