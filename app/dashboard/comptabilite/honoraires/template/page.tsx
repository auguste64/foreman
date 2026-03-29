'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { toast } from '@/components/Toast'

// ── Types ──────────────────────────────────────────────────────────────────────
type Phase = {
  _id: string
  nom: string
  description_points: string[]
  condition_reglement: string
  montant_ht: string
}

// ── Styles ─────────────────────────────────────────────────────────────────────
const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 14px', backgroundColor: '#0D0D0B',
  border: '1px solid #1E1E1C', borderRadius: 8, color: '#F0EDE6',
  fontSize: 14, outline: 'none', fontFamily: 'var(--font-dm-sans), sans-serif',
  boxSizing: 'border-box',
}
const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 11, fontWeight: 600, letterSpacing: '0.08em',
  textTransform: 'uppercase', color: '#8A8880', marginBottom: 6,
  fontFamily: 'var(--font-dm-sans), sans-serif',
}
const cardStyle: React.CSSProperties = {
  backgroundColor: '#111110', border: '1px solid #1E1E1C', borderRadius: 12, padding: 24,
}
const focus = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
  e.target.style.borderColor = '#ea580c'; e.target.style.boxShadow = '0 0 0 2px rgba(249,115,22,0.12)'
}
const blur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
  e.target.style.borderColor = '#1E1E1C'; e.target.style.boxShadow = 'none'
}

function uid() { return Math.random().toString(36).substring(2, 11) }

// ── Component ──────────────────────────────────────────────────────────────────
export default function HonorairesTemplatePage() {
  const [saving, setSaving] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [templateId, setTemplateId] = useState<string | null>(null)

  const [phases, setPhases] = useState<Phase[]>([])
  const [tvaTaux, setTvaTaux] = useState(10)
  const [texteIntro, setTexteIntro] = useState('')
  const [texteMissionDefaut, setTexteMissionDefaut] = useState('')
  const [clausesSpeciales, setClausesSpeciales] = useState('')

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from('honoraires_templates')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle()

      if (data) {
        setTemplateId(data.id)
        setTvaTaux(data.tva_taux ?? 10)
        setTexteIntro(data.texte_intro ?? '')
        setTexteMissionDefaut(data.texte_mission_defaut ?? '')
        setClausesSpeciales(data.clauses_speciales ?? '')
        if (Array.isArray(data.phases) && data.phases.length > 0) {
          setPhases(data.phases.map((p: { nom: string; description_points: string[]; condition_reglement: string; montant_ht: number }) => ({
            _id: uid(),
            nom: p.nom ?? '',
            description_points: Array.isArray(p.description_points) ? p.description_points : [],
            condition_reglement: p.condition_reglement ?? '',
            montant_ht: p.montant_ht?.toString() ?? '',
          })))
        } else {
          setPhases(defaultPhases())
        }
      } else {
        setPhases(defaultPhases())
      }
      setLoaded(true)
    }
    load()
  }, [])

  function defaultPhases(): Phase[] {
    return [
      { _id: uid(), nom: 'Avant-Projet', description_points: ['Analyse du programme', 'Visite du site', 'Esquisse'], condition_reglement: 'À la signature du contrat', montant_ht: '' },
      { _id: uid(), nom: 'Études de Conception (PC)', description_points: ['APS / APD', 'Permis de construire'], condition_reglement: 'À l\'obtention du permis', montant_ht: '' },
      { _id: uid(), nom: 'Études de Réalisation (EXE)', description_points: ['Plans d\'exécution', 'CCTP', 'Consultation entreprises'], condition_reglement: 'À l\'attribution des marchés', montant_ht: '' },
      { _id: uid(), nom: 'Direction des Travaux', description_points: ['Suivi de chantier', 'Comptes rendus', 'Réception'], condition_reglement: 'Acomptes mensuels', montant_ht: '' },
    ]
  }

  // ── Phase ops ─────────────────────────────────────────────────────────────────
  function addPhase() {
    setPhases(prev => [...prev, { _id: uid(), nom: '', description_points: [''], condition_reglement: '', montant_ht: '' }])
  }
  function updatePhase(_id: string, field: 'nom' | 'condition_reglement' | 'montant_ht', value: string) {
    setPhases(prev => prev.map(p => p._id === _id ? { ...p, [field]: value } : p))
  }
  function deletePhase(_id: string) {
    setPhases(prev => prev.filter(p => p._id !== _id))
  }
  function addPoint(_id: string) {
    setPhases(prev => prev.map(p => p._id === _id ? { ...p, description_points: [...p.description_points, ''] } : p))
  }
  function updatePoint(_id: string, idx: number, value: string) {
    setPhases(prev => prev.map(p => p._id === _id
      ? { ...p, description_points: p.description_points.map((pt, i) => i === idx ? value : pt) }
      : p))
  }
  function removePoint(_id: string, idx: number) {
    setPhases(prev => prev.map(p => p._id === _id
      ? { ...p, description_points: p.description_points.filter((_, i) => i !== idx) }
      : p))
  }

  // ── Save ──────────────────────────────────────────────────────────────────────
  async function handleSave() {
    setSaving(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Non authentifié')

      const phasesData = phases.map(({ _id: _, ...rest }) => ({
        ...rest,
        montant_ht: parseFloat(rest.montant_ht) || 0,
      }))

      const payload = {
        user_id: user.id,
        phases: phasesData,
        tva_taux: tvaTaux,
        texte_intro: texteIntro,
        texte_mission_defaut: texteMissionDefaut,
        clauses_speciales: clausesSpeciales,
      }

      const { error } = templateId
        ? await supabase.from('honoraires_templates').update(payload).eq('id', templateId)
        : await supabase.from('honoraires_templates').insert(payload)

      if (error) throw error
      toast.success('Modèle sauvegardé')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erreur')
    } finally {
      setSaving(false)
    }
  }

  if (!loaded) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#8A8880', fontFamily: 'var(--font-dm-sans), sans-serif', fontSize: 14 }}>Chargement…</p>
      </div>
    )
  }

  return (
    <div className="page-enter" style={{ flex: 1, overflowY: 'auto', padding: '40px' }}>
      <div style={{ maxWidth: 760, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>

        {/* Header */}
        <div>
          <Link href="/dashboard/documents" style={{ fontSize: 12, color: '#8A8880', textDecoration: 'none', fontFamily: 'var(--font-dm-sans), sans-serif' }}>
            ← Retour à la comptabilité
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 16 }}>
            <div>
              <h1 style={{ fontFamily: 'var(--font-syne), sans-serif', fontSize: 22, fontWeight: 700, color: '#F0EDE6', margin: 0 }}>
                Modèle de devis d&apos;honoraires
              </h1>
              <p style={{ color: '#8A8880', fontSize: 13, margin: '4px 0 0', fontFamily: 'var(--font-dm-sans), sans-serif' }}>
                Ce modèle pré-remplira les nouveaux devis d&apos;honoraires.
              </p>
            </div>
            <button
              onClick={handleSave}
              disabled={saving}
              style={{ padding: '10px 22px', backgroundColor: '#ea580c', color: '#0D0D0B', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: saving ? 'wait' : 'pointer', fontFamily: 'var(--font-dm-sans), sans-serif' }}
            >
              {saving ? 'Sauvegarde…' : 'Sauvegarder'}
            </button>
          </div>
        </div>

        {/* Texte intro */}
        <div style={cardStyle}>
          <p style={{ fontFamily: 'var(--font-syne), sans-serif', fontSize: 13, fontWeight: 700, color: '#F0EDE6', margin: '0 0 16px' }}>Textes par défaut</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={labelStyle}>Texte d&apos;introduction</label>
              <textarea value={texteIntro} onChange={e => setTexteIntro(e.target.value)} placeholder="Texte d'introduction du devis…" rows={3} style={{ ...inputStyle, resize: 'vertical' }} onFocus={focus} onBlur={blur} />
            </div>
            <div>
              <label style={labelStyle}>Description de mission par défaut</label>
              <textarea value={texteMissionDefaut} onChange={e => setTexteMissionDefaut(e.target.value)} placeholder="Description générique de la mission…" rows={3} style={{ ...inputStyle, resize: 'vertical' }} onFocus={focus} onBlur={blur} />
            </div>
          </div>
        </div>

        {/* TVA */}
        <div style={cardStyle}>
          <label style={labelStyle}>TVA par défaut</label>
          <select value={tvaTaux} onChange={e => setTvaTaux(parseInt(e.target.value))} style={{ ...inputStyle, width: 'auto' }} onFocus={focus} onBlur={blur}>
            <option value={0}>0%</option>
            <option value={10}>10%</option>
            <option value={20}>20%</option>
          </select>
        </div>

        {/* Phases */}
        <div style={cardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <p style={{ fontFamily: 'var(--font-syne), sans-serif', fontSize: 13, fontWeight: 700, color: '#F0EDE6', margin: 0 }}>
              Phases par défaut
            </p>
            <button onClick={addPhase} style={{ padding: '6px 14px', backgroundColor: 'rgba(249,115,22,0.1)', color: '#ea580c', border: '1px solid rgba(249,115,22,0.3)', borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-dm-sans), sans-serif' }}>
              + Phase
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {phases.map((phase, idx) => (
              <div key={phase._id} style={{ backgroundColor: '#0D0D0B', border: '1px solid #1E1E1C', borderRadius: 10, padding: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: '#ea580c', fontFamily: 'var(--font-dm-sans), sans-serif', letterSpacing: '0.08em', textTransform: 'uppercase', flexShrink: 0 }}>
                    Phase {idx + 1}
                  </span>
                  <input value={phase.nom} onChange={e => updatePhase(phase._id, 'nom', e.target.value)} placeholder="Nom de la phase" style={{ ...inputStyle, flex: 1, padding: '7px 12px', fontSize: 13 }} onFocus={focus} onBlur={blur} />
                  {phases.length > 1 && (
                    <button onClick={() => deletePhase(phase._id)} style={{ padding: '6px 10px', backgroundColor: 'rgba(232,84,71,0.1)', color: '#E85447', border: '1px solid rgba(232,84,71,0.2)', borderRadius: 6, fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font-dm-sans), sans-serif', flexShrink: 0 }}>
                      ✕
                    </button>
                  )}
                </div>

                <div style={{ marginBottom: 10 }}>
                  <label style={{ ...labelStyle, marginBottom: 6 }}>Points de description</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                    {phase.description_points.map((pt, i) => (
                      <div key={i} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        <span style={{ color: '#8A8880', fontSize: 11, flexShrink: 0 }}>—</span>
                        <input value={pt} onChange={e => updatePoint(phase._id, i, e.target.value)} placeholder="Point descriptif…" style={{ ...inputStyle, flex: 1, padding: '6px 10px', fontSize: 12 }} onFocus={focus} onBlur={blur} />
                        {phase.description_points.length > 1 && (
                          <button onClick={() => removePoint(phase._id, i)} style={{ padding: '5px 8px', backgroundColor: 'transparent', color: '#7A7870', border: '1px solid #1E1E1C', borderRadius: 5, fontSize: 10, cursor: 'pointer', flexShrink: 0 }}>✕</button>
                        )}
                      </div>
                    ))}
                  </div>
                  <button onClick={() => addPoint(phase._id)} style={{ marginTop: 5, padding: '3px 10px', backgroundColor: 'transparent', color: '#8A8880', border: '1px dashed #1E1E1C', borderRadius: 5, fontSize: 11, cursor: 'pointer', fontFamily: 'var(--font-dm-sans), sans-serif' }}>
                    + Point
                  </button>
                </div>

                <div>
                  <label style={labelStyle}>Condition de règlement</label>
                  <input value={phase.condition_reglement} onChange={e => updatePhase(phase._id, 'condition_reglement', e.target.value)} placeholder="Ex : à la signature du contrat" style={{ ...inputStyle, padding: '7px 12px', fontSize: 13 }} onFocus={focus} onBlur={blur} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Clauses */}
        <div style={cardStyle}>
          <label style={labelStyle}>Clauses spéciales par défaut</label>
          <textarea value={clausesSpeciales} onChange={e => setClausesSpeciales(e.target.value)} placeholder="Dispositions particulières, conditions générales…" rows={4} style={{ ...inputStyle, resize: 'vertical' }} onFocus={focus} onBlur={blur} />
        </div>

        {/* Save */}
        <div style={{ paddingBottom: 40 }}>
          <button onClick={handleSave} disabled={saving} style={{ padding: '12px 28px', backgroundColor: '#ea580c', color: '#0D0D0B', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: saving ? 'wait' : 'pointer', fontFamily: 'var(--font-dm-sans), sans-serif' }}>
            {saving ? 'Sauvegarde…' : 'Sauvegarder le modèle'}
          </button>
        </div>
      </div>
    </div>
  )
}
