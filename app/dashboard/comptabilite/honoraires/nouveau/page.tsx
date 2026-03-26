'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { formatEurDoc } from '@/lib/supabase/documents'
import { toast } from '@/components/Toast'

// ── Types ──────────────────────────────────────────────────────────────────────
type Phase = {
  _id: string
  nom: string
  description_points: string[]
  condition_reglement: string
  montant_ht: string
}

type EntrepriseInfo = {
  raison_sociale: string
  adresse: string
  code_postal: string
  ville: string
  telephone: string
  email: string
  logo_url: string
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

function defaultPhases(): Phase[] {
  return [
    {
      _id: uid(),
      nom: 'Avant-Projet',
      description_points: [
        'Analyse du programme et des contraintes réglementaires',
        'Visite du site et relevé de l\'existant',
        'Esquisse et études de faisabilité',
        'Estimation préliminaire du coût des travaux',
      ],
      condition_reglement: 'À la signature du contrat',
      montant_ht: '',
    },
    {
      _id: uid(),
      nom: 'Études de Conception (PC)',
      description_points: [
        'Avant-Projet Sommaire (APS)',
        'Avant-Projet Définitif (APD)',
        'Dépôt et suivi du permis de construire',
      ],
      condition_reglement: 'À l\'obtention du permis de construire',
      montant_ht: '',
    },
    {
      _id: uid(),
      nom: 'Études de Réalisation (EXE)',
      description_points: [
        'Plans d\'exécution et détails techniques',
        'Cahier des Clauses Techniques Particulières (CCTP)',
        'Consultation des entreprises et analyse des offres',
        'Rapport de synthèse des offres reçues',
      ],
      condition_reglement: 'À l\'attribution des marchés de travaux',
      montant_ht: '',
    },
    {
      _id: uid(),
      nom: 'Direction des Travaux (DT)',
      description_points: [
        'Visa des plans d\'exécution des entreprises',
        'Direction et coordination des travaux',
        'Comptes rendus hebdomadaires de chantier',
        'Réception des travaux et levée des réserves',
        'Établissement du décompte général définitif',
      ],
      condition_reglement: 'Par acomptes mensuels proportionnels à l\'avancement',
      montant_ht: '',
    },
  ]
}

// ── Component ──────────────────────────────────────────────────────────────────
export default function NouveauDevisHonorairesPage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [numero, setNumero] = useState('HON-…')
  const [entreprise, setEntreprise] = useState<EntrepriseInfo | null>(null)

  // Form
  const [clientNom, setClientNom] = useState('')
  const [clientAdresse, setClientAdresse] = useState('')
  const [dateDevis, setDateDevis] = useState(new Date().toISOString().split('T')[0])
  const [descriptionMission, setDescriptionMission] = useState('')
  const [budgetTravaux, setBudgetTravaux] = useState('')
  const [phases, setPhases] = useState<Phase[]>([])
  const [tvaTaux, setTvaTaux] = useState(10)
  const [clausesSpeciales, setClausesSpeciales] = useState('')

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const year = new Date().getFullYear()
      const { count } = await supabase
        .from('devis_honoraires')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
      setNumero(`HON-${year}-${String((count ?? 0) + 1).padStart(3, '0')}`)

      const [eiRes, tmplRes] = await Promise.all([
        supabase.from('entreprise_infos')
          .select('raison_sociale, adresse, code_postal, ville, telephone, email, logo_url')
          .eq('user_id', user.id).maybeSingle(),
        supabase.from('honoraires_templates')
          .select('*').eq('user_id', user.id).maybeSingle(),
      ])

      if (eiRes.data) setEntreprise(eiRes.data as EntrepriseInfo)

      if (tmplRes.data) {
        const t = tmplRes.data
        if (t.texte_mission_defaut) setDescriptionMission(t.texte_mission_defaut)
        if (t.tva_taux) setTvaTaux(t.tva_taux)
        if (t.clauses_speciales) setClausesSpeciales(t.clauses_speciales)
        if (Array.isArray(t.phases) && t.phases.length > 0) {
          setPhases(t.phases.map((p: { nom: string; description_points: string[]; condition_reglement: string; montant_ht: number }) => ({
            _id: uid(),
            nom: p.nom ?? '',
            description_points: Array.isArray(p.description_points) ? p.description_points : [],
            condition_reglement: p.condition_reglement ?? '',
            montant_ht: p.montant_ht?.toString() ?? '',
          })))
          return
        }
      }
      setPhases(defaultPhases())
    }
    load()
  }, [])

  // ── Calculations ─────────────────────────────────────────────────────────────
  const totalHT = phases.reduce((s, p) => s + (parseFloat(p.montant_ht) || 0), 0)
  const totalTVA = totalHT * tvaTaux / 100
  const totalTTC = totalHT + totalTVA

  // ── Phase operations ──────────────────────────────────────────────────────────
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
    if (!clientNom.trim()) { toast.error('Le nom du client est requis'); return }
    setSaving(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Non authentifié')

      const phasesData = phases.map(({ _id: _, ...rest }) => ({
        ...rest,
        montant_ht: parseFloat(rest.montant_ht) || 0,
      }))

      const { data, error } = await supabase.from('devis_honoraires').insert({
        user_id: user.id,
        numero,
        statut: 'Brouillon',
        client_nom: clientNom,
        client_adresse: clientAdresse,
        date_devis: dateDevis || null,
        description_mission: descriptionMission,
        budget_travaux: budgetTravaux ? parseFloat(budgetTravaux) : null,
        phases: phasesData,
        tva_taux: tvaTaux,
        total_ht: totalHT,
        clauses_speciales: clausesSpeciales,
      }).select('id').single()

      if (error) throw error
      toast.success('Devis d\'honoraires créé')
      router.push(`/dashboard/comptabilite/honoraires/${data.id}`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erreur lors de la sauvegarde')
      setSaving(false)
    }
  }

  const fmtDate = (iso: string) =>
    new Date(iso + 'T12:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div className="page-enter" style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

      {/* ── Left: Form ── */}
      <div style={{ flex: '0 0 55%', overflowY: 'auto', padding: '40px 32px', display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* Header */}
        <div>
          <Link href="/dashboard/comptabilite?tab=honoraires" style={{ fontSize: 12, color: '#8A8880', textDecoration: 'none', fontFamily: 'var(--font-dm-sans), sans-serif' }}>
            ← Retour
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 16 }}>
            <div>
              <h1 style={{ fontFamily: 'var(--font-syne), sans-serif', fontSize: 22, fontWeight: 700, color: '#F0EDE6', margin: 0 }}>
                Nouveau devis d&apos;honoraires
              </h1>
              <p style={{ color: '#8A8880', fontSize: 13, margin: '4px 0 0', fontFamily: 'var(--font-dm-sans), sans-serif' }}>
                {numero}
              </p>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <Link href="/dashboard/comptabilite/honoraires/template" style={{ padding: '9px 14px', backgroundColor: '#ea580c', color: '#fff', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 600, textDecoration: 'none', fontFamily: 'var(--font-dm-sans), sans-serif' }}>
                Configurer modèle
              </Link>
              <button
                onClick={handleSave}
                disabled={saving}
                style={{ padding: '9px 20px', backgroundColor: '#ea580c', color: '#0D0D0B', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: saving ? 'wait' : 'pointer', fontFamily: 'var(--font-dm-sans), sans-serif' }}
              >
                {saving ? 'Enregistrement…' : 'Enregistrer'}
              </button>
            </div>
          </div>
        </div>

        {/* Client & Mission */}
        <div style={cardStyle}>
          <p style={{ fontFamily: 'var(--font-syne), sans-serif', fontSize: 13, fontWeight: 700, color: '#F0EDE6', margin: '0 0 20px' }}>
            Client & Mission
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={labelStyle}>Nom du client *</label>
              <input value={clientNom} onChange={e => setClientNom(e.target.value)} placeholder="Nom du maître d'ouvrage" style={inputStyle} onFocus={focus} onBlur={blur} />
            </div>
            <div>
              <label style={labelStyle}>Adresse du client</label>
              <textarea value={clientAdresse} onChange={e => setClientAdresse(e.target.value)} placeholder="Adresse complète" rows={2} style={{ ...inputStyle, resize: 'vertical' }} onFocus={focus} onBlur={blur} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={labelStyle}>Date du devis</label>
                <input type="date" value={dateDevis} onChange={e => setDateDevis(e.target.value)} style={inputStyle} onFocus={focus} onBlur={blur} />
              </div>
              <div>
                <label style={labelStyle}>Budget travaux estimé HT (€)</label>
                <input type="number" value={budgetTravaux} onChange={e => setBudgetTravaux(e.target.value)} placeholder="Optionnel" min="0" step="1000" style={inputStyle} onFocus={focus} onBlur={blur} />
              </div>
            </div>
            <div>
              <label style={labelStyle}>Description de la mission</label>
              <textarea value={descriptionMission} onChange={e => setDescriptionMission(e.target.value)} placeholder="Objet du contrat, nature des travaux…" rows={3} style={{ ...inputStyle, resize: 'vertical' }} onFocus={focus} onBlur={blur} />
            </div>
          </div>
        </div>

        {/* Phases */}
        <div style={cardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <p style={{ fontFamily: 'var(--font-syne), sans-serif', fontSize: 13, fontWeight: 700, color: '#F0EDE6', margin: 0 }}>
              Phases & Honoraires
            </p>
            <button onClick={addPhase} style={{ padding: '6px 14px', backgroundColor: 'rgba(249,115,22,0.1)', color: '#ea580c', border: '1px solid rgba(249,115,22,0.3)', borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-dm-sans), sans-serif' }}>
              + Ajouter une phase
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {phases.map((phase, idx) => (
              <div key={phase._id} style={{ backgroundColor: '#0D0D0B', border: '1px solid #1E1E1C', borderRadius: 10, padding: 16 }}>
                {/* Phase header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: '#ea580c', fontFamily: 'var(--font-dm-sans), sans-serif', letterSpacing: '0.08em', textTransform: 'uppercase', flexShrink: 0 }}>
                    Phase {idx + 1}
                  </span>
                  <input
                    value={phase.nom}
                    onChange={e => updatePhase(phase._id, 'nom', e.target.value)}
                    placeholder="Nom de la phase"
                    style={{ ...inputStyle, flex: 1, padding: '8px 12px', fontSize: 13 }}
                    onFocus={focus} onBlur={blur}
                  />
                  {phases.length > 1 && (
                    <button onClick={() => deletePhase(phase._id)} style={{ padding: '6px 10px', backgroundColor: 'rgba(232,84,71,0.1)', color: '#E85447', border: '1px solid rgba(232,84,71,0.2)', borderRadius: 6, fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font-dm-sans), sans-serif', flexShrink: 0 }}>
                      ✕
                    </button>
                  )}
                </div>

                {/* Points */}
                <div style={{ marginBottom: 12 }}>
                  <label style={{ ...labelStyle, marginBottom: 8 }}>Points de description</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {phase.description_points.map((pt, i) => (
                      <div key={i} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        <span style={{ color: '#8A8880', fontSize: 12, fontFamily: 'var(--font-dm-sans), sans-serif', flexShrink: 0 }}>—</span>
                        <input
                          value={pt}
                          onChange={e => updatePoint(phase._id, i, e.target.value)}
                          placeholder="Point descriptif…"
                          style={{ ...inputStyle, flex: 1, padding: '7px 10px', fontSize: 13 }}
                          onFocus={focus} onBlur={blur}
                        />
                        {phase.description_points.length > 1 && (
                          <button onClick={() => removePoint(phase._id, i)} style={{ padding: '6px 8px', backgroundColor: 'transparent', color: '#7A7870', border: '1px solid #1E1E1C', borderRadius: 6, fontSize: 11, cursor: 'pointer', flexShrink: 0 }}>
                            ✕
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  <button onClick={() => addPoint(phase._id)} style={{ marginTop: 6, padding: '4px 10px', backgroundColor: 'transparent', color: '#8A8880', border: '1px dashed #1E1E1C', borderRadius: 6, fontSize: 11, cursor: 'pointer', fontFamily: 'var(--font-dm-sans), sans-serif' }}>
                    + Point
                  </button>
                </div>

                {/* Condition + montant */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 140px', gap: 10 }}>
                  <div>
                    <label style={labelStyle}>Condition de règlement</label>
                    <input
                      value={phase.condition_reglement}
                      onChange={e => updatePhase(phase._id, 'condition_reglement', e.target.value)}
                      placeholder="Ex : à la signature du contrat"
                      style={{ ...inputStyle, padding: '8px 12px', fontSize: 13 }}
                      onFocus={focus} onBlur={blur}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Montant HT (€)</label>
                    <input
                      type="number"
                      value={phase.montant_ht}
                      onChange={e => updatePhase(phase._id, 'montant_ht', e.target.value)}
                      placeholder="0"
                      min="0"
                      step="100"
                      style={{ ...inputStyle, padding: '8px 12px', fontSize: 13, textAlign: 'right' }}
                      onFocus={focus} onBlur={blur}
                    />
                    {budgetTravaux && parseFloat(budgetTravaux) > 0 && phase.montant_ht && (
                      <p style={{ fontSize: 10, color: '#8A8880', fontFamily: 'var(--font-dm-sans), sans-serif', margin: '3px 0 0', textAlign: 'right' }}>
                        {((parseFloat(phase.montant_ht) / parseFloat(budgetTravaux)) * 100).toFixed(1)}% du budget
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Récapitulatif */}
        <div style={cardStyle}>
          <p style={{ fontFamily: 'var(--font-syne), sans-serif', fontSize: 13, fontWeight: 700, color: '#F0EDE6', margin: '0 0 16px' }}>
            Récapitulatif
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, fontFamily: 'var(--font-dm-sans), sans-serif' }}>
              <span style={{ color: '#8A8880' }}>Total HT</span>
              <span style={{ color: '#F0EDE6', fontWeight: 600 }}>{formatEurDoc(totalHT)}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <span style={{ fontSize: 14, color: '#8A8880', fontFamily: 'var(--font-dm-sans), sans-serif' }}>TVA</span>
              <select value={tvaTaux} onChange={e => setTvaTaux(parseInt(e.target.value))} style={{ ...inputStyle, width: 'auto', padding: '6px 12px', fontSize: 13 }} onFocus={focus} onBlur={blur}>
                <option value={0}>0%</option>
                <option value={10}>10%</option>
                <option value={20}>20%</option>
              </select>
              <span style={{ fontSize: 14, color: '#F0EDE6', fontFamily: 'var(--font-dm-sans), sans-serif', fontWeight: 500 }}>{formatEurDoc(totalTVA)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 16, fontFamily: 'var(--font-dm-sans), sans-serif', paddingTop: 10, borderTop: '1px solid #1E1E1C' }}>
              <span style={{ color: '#F0EDE6', fontWeight: 700 }}>Total TTC</span>
              <span style={{ color: '#ea580c', fontWeight: 700 }}>{formatEurDoc(totalTTC)}</span>
            </div>
          </div>
        </div>

        {/* Clauses */}
        <div style={cardStyle}>
          <label style={labelStyle}>Clauses spéciales (optionnel)</label>
          <textarea value={clausesSpeciales} onChange={e => setClausesSpeciales(e.target.value)} placeholder="Dispositions particulières, notes…" rows={3} style={{ ...inputStyle, resize: 'vertical' }} onFocus={focus} onBlur={blur} />
        </div>

        {/* Bottom actions */}
        <div style={{ display: 'flex', gap: 10, paddingBottom: 40 }}>
          <button onClick={handleSave} disabled={saving} style={{ padding: '12px 28px', backgroundColor: '#ea580c', color: '#0D0D0B', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: saving ? 'wait' : 'pointer', fontFamily: 'var(--font-dm-sans), sans-serif' }}>
            {saving ? 'Enregistrement…' : 'Enregistrer le devis'}
          </button>
          <Link href="/dashboard/comptabilite" style={{ padding: '12px 20px', backgroundColor: 'transparent', color: '#8A8880', border: '1px solid #1E1E1C', borderRadius: 8, fontSize: 14, textDecoration: 'none', fontFamily: 'var(--font-dm-sans), sans-serif', display: 'inline-flex', alignItems: 'center' }}>
            Annuler
          </Link>
        </div>
      </div>

      {/* ── Right: PDF Preview ── */}
      <div style={{ flex: '0 0 45%', overflowY: 'auto', borderLeft: '1px solid #1E1E1C', backgroundColor: '#1A1917', padding: '32px 24px' }}>
        <p style={{ fontSize: 10, fontWeight: 600, color: '#7A7870', fontFamily: 'var(--font-dm-sans), sans-serif', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 16 }}>
          Aperçu document
        </p>

        {/* Paper */}
        <div style={{ backgroundColor: '#fff', borderRadius: 4, boxShadow: '0 8px 32px rgba(0,0,0,0.5)', padding: '28px 28px 32px', color: '#1a1a1a', lineHeight: 1.5, minHeight: 600 }}>

          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, paddingBottom: 14, borderBottom: '2px solid #ea580c' }}>
            <div>
              {entreprise?.logo_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={entreprise.logo_url} alt="logo" style={{ height: 36, marginBottom: 6, display: 'block' }} />
              )}
              <div style={{ fontFamily: 'var(--font-syne), sans-serif', fontWeight: 700, fontSize: 13, color: '#111' }}>
                {entreprise?.raison_sociale || 'Cabinet d\'Architecture'}
              </div>
              <div style={{ fontSize: 9, color: '#777', fontFamily: 'var(--font-dm-sans), sans-serif' }}>Architecture</div>
            </div>
            <div style={{ textAlign: 'right', fontSize: 8, color: '#666', fontFamily: 'var(--font-dm-sans), sans-serif' }}>
              {entreprise && (
                <>
                  <div>{entreprise.adresse}</div>
                  <div>{entreprise.code_postal} {entreprise.ville}</div>
                  {entreprise.telephone && <div>{entreprise.telephone}</div>}
                  {entreprise.email && <div>{entreprise.email}</div>}
                </>
              )}
            </div>
          </div>

          {/* Date + title | Client */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
            <div style={{ flex: 1, paddingRight: 16 }}>
              <div style={{ fontSize: 8, color: '#888', fontFamily: 'var(--font-dm-sans), sans-serif', marginBottom: 4 }}>
                {dateDevis ? fmtDate(dateDevis) : new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, fontFamily: 'var(--font-syne), sans-serif', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#111', marginBottom: 2 }}>
                Devis d&apos;honoraires
              </div>
              <div style={{ fontSize: 9, color: '#ea580c', fontWeight: 600, fontFamily: 'var(--font-dm-sans), sans-serif', marginBottom: 8 }}>
                {numero}
              </div>
              {descriptionMission && (
                <div style={{ fontSize: 8.5, color: '#444', fontFamily: 'var(--font-dm-sans), sans-serif', maxWidth: 160, lineHeight: 1.4 }}>
                  {descriptionMission}
                </div>
              )}
              {budgetTravaux && parseFloat(budgetTravaux) > 0 && (
                <div style={{ fontSize: 8, color: '#888', fontFamily: 'var(--font-dm-sans), sans-serif', marginTop: 4 }}>
                  Budget travaux estimé : {formatEurDoc(parseFloat(budgetTravaux))} HT
                </div>
              )}
            </div>
            <div style={{ textAlign: 'right', minWidth: 120 }}>
              <div style={{ fontFamily: 'var(--font-syne), sans-serif', fontWeight: 700, fontSize: 11, color: '#111', marginBottom: 2 }}>
                {clientNom || 'Nom du client'}
              </div>
              <div style={{ fontSize: 8.5, color: '#555', fontFamily: 'var(--font-dm-sans), sans-serif', whiteSpace: 'pre-wrap', lineHeight: 1.4 }}>
                {clientAdresse}
              </div>
            </div>
          </div>

          {/* Phases */}
          {phases.map((phase, idx) => (
            <div key={phase._id} style={{ marginBottom: 14, paddingBottom: 12, borderBottom: '1px solid #e8e8e8' }}>
              <div style={{ fontFamily: 'var(--font-syne), sans-serif', fontSize: 10, fontWeight: 700, color: '#ea580c', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>
                Phase {idx + 1}{phase.nom ? ` — ${phase.nom}` : ''}
              </div>
              {phase.description_points.map((pt, i) => pt && (
                <div key={i} style={{ fontSize: 8.5, color: '#333', marginBottom: 2.5, paddingLeft: 10, fontFamily: 'var(--font-dm-sans), sans-serif' }}>
                  — {pt}
                </div>
              ))}
              {phase.condition_reglement && (
                <div style={{ fontSize: 8, color: '#555', marginTop: 5, textDecoration: 'underline', fontStyle: 'italic', fontFamily: 'var(--font-dm-sans), sans-serif' }}>
                  {phase.condition_reglement}
                </div>
              )}
              {parseFloat(phase.montant_ht) > 0 && (
                <div style={{ textAlign: 'right', fontWeight: 700, fontSize: 10, color: '#111', marginTop: 4, fontFamily: 'var(--font-syne), sans-serif' }}>
                  {formatEurDoc(parseFloat(phase.montant_ht))} HT
                </div>
              )}
            </div>
          ))}

          {/* Summary */}
          <div style={{ marginTop: 16 }}>
            {phases.filter(p => parseFloat(p.montant_ht) > 0).map((phase, idx) => (
              <div key={phase._id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 8.5, marginBottom: 2.5, fontFamily: 'var(--font-dm-sans), sans-serif' }}>
                <span style={{ color: '#555' }}>Phase {phases.indexOf(phase) + 1}{phase.nom ? ` — ${phase.nom}` : ''}</span>
                <span style={{ color: '#111' }}>{formatEurDoc(parseFloat(phase.montant_ht))}</span>
              </div>
            ))}
            <div style={{ borderTop: '1px solid #ccc', marginTop: 8, paddingTop: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, marginBottom: 2.5, fontFamily: 'var(--font-dm-sans), sans-serif' }}>
                <span style={{ color: '#555' }}>Total HT</span>
                <span style={{ fontWeight: 600 }}>{formatEurDoc(totalHT)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, marginBottom: 2.5, fontFamily: 'var(--font-dm-sans), sans-serif' }}>
                <span style={{ color: '#555' }}>TVA ({tvaTaux}%)</span>
                <span>{formatEurDoc(totalTVA)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, fontWeight: 700, borderTop: '1.5px solid #111', paddingTop: 5, marginTop: 5, fontFamily: 'var(--font-syne), sans-serif' }}>
                <span>Total TTC</span>
                <span style={{ color: '#ea580c' }}>{formatEurDoc(totalTTC)}</span>
              </div>
            </div>
          </div>

          {/* Clauses */}
          {clausesSpeciales && (
            <div style={{ marginTop: 16, paddingTop: 12, borderTop: '1px solid #e8e8e8' }}>
              <div style={{ fontSize: 8.5, color: '#555', fontFamily: 'var(--font-dm-sans), sans-serif', lineHeight: 1.5 }}>
                {clausesSpeciales}
              </div>
            </div>
          )}

          {/* Footer */}
          {entreprise && (
            <div style={{ marginTop: 28, paddingTop: 10, borderTop: '1px solid #ddd', fontSize: 7.5, color: '#999', textAlign: 'center', fontFamily: 'var(--font-dm-sans), sans-serif', lineHeight: 1.6 }}>
              {entreprise.raison_sociale}
              {entreprise.adresse && ` — ${entreprise.adresse} ${entreprise.code_postal} ${entreprise.ville}`}
              {entreprise.telephone && ` — ${entreprise.telephone}`}
              {entreprise.email && ` — ${entreprise.email}`}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
