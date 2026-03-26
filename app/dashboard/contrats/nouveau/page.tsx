'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useIsMobile } from '@/lib/useIsMobile'

export default function NouveauContratPage() {
  const router = useRouter()
  const isMobile = useIsMobile()
  const [saving, setSaving] = useState(false)

  const [nomMoe, setNomMoe] = useState('')
  const [nomClient, setNomClient] = useState('')
  const [adresseChantier, setAdresseChantier] = useState('')
  const [budgetEstimatif, setBudgetEstimatif] = useState('')
  const [dateContrat, setDateContrat] = useState(new Date().toISOString().slice(0, 10))

  // Pré-remplir le nom MOE depuis le profil
  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      supabase
        .from('entreprise_infos')
        .select('raison_sociale')
        .eq('user_id', user.id)
        .maybeSingle()
        .then(({ data }) => {
          if (data?.raison_sociale) setNomMoe(data.raison_sociale)
        })
    })
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data, error } = await supabase
      .from('contrats')
      .insert({
        user_id: user.id,
        nom_moe: nomMoe,
        nom_client: nomClient,
        adresse_chantier: adresseChantier,
        budget_estimatif: parseFloat(budgetEstimatif) || 0,
        date_contrat: dateContrat || null,
      })
      .select('id')
      .single()

    if (error || !data) {
      setSaving(false)
      return
    }

    router.push(`/dashboard/contrats/${data.id}`)
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 14px',
    backgroundColor: '#111110',
    border: '1px solid #1E1E1C',
    borderRadius: '8px',
    color: '#F0EDE6',
    fontSize: '14px',
    outline: 'none',
    fontFamily: 'var(--font-dm-sans), sans-serif',
    boxSizing: 'border-box',
  }

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '13px',
    fontWeight: 500,
    color: '#8A8880',
    marginBottom: '6px',
    fontFamily: 'var(--font-dm-sans), sans-serif',
  }

  return (
    <div className="page-enter" style={{ flex: 1, padding: isMobile ? '16px' : '40px', overflowY: 'auto' }}>
      <div style={{ maxWidth: '640px' }}>
        <h1 style={{ fontFamily: 'var(--font-syne), sans-serif', fontSize: '24px', fontWeight: 700, color: '#F0EDE6', margin: '0 0 8px' }}>
          Nouveau contrat MOE
        </h1>
        <p style={{ color: '#8A8880', fontSize: '14px', marginTop: 0, marginBottom: '32px', fontFamily: 'var(--font-dm-sans), sans-serif' }}>
          Remplissez les champs ci-dessous pour générer votre contrat de maîtrise d&apos;oeuvre.
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={labelStyle}>Maître d&apos;Oeuvre (MOE)</label>
            <input
              type="text"
              value={nomMoe}
              onChange={e => setNomMoe(e.target.value)}
              placeholder="Votre nom ou raison sociale"
              required
              style={inputStyle}
              onFocus={e => { e.target.style.borderColor = '#ea580c'; e.target.style.boxShadow = '0 0 0 2px rgba(234,88,12,0.12)' }}
              onBlur={e => { e.target.style.borderColor = '#1E1E1C'; e.target.style.boxShadow = 'none' }}
            />
          </div>

          <div>
            <label style={labelStyle}>Maître d&apos;Ouvrage (Client)</label>
            <input
              type="text"
              value={nomClient}
              onChange={e => setNomClient(e.target.value)}
              placeholder="Nom du client"
              required
              style={inputStyle}
              onFocus={e => { e.target.style.borderColor = '#ea580c'; e.target.style.boxShadow = '0 0 0 2px rgba(234,88,12,0.12)' }}
              onBlur={e => { e.target.style.borderColor = '#1E1E1C'; e.target.style.boxShadow = 'none' }}
            />
          </div>

          <div>
            <label style={labelStyle}>Adresse du chantier</label>
            <input
              type="text"
              value={adresseChantier}
              onChange={e => setAdresseChantier(e.target.value)}
              placeholder="Adresse complète du chantier"
              required
              style={inputStyle}
              onFocus={e => { e.target.style.borderColor = '#ea580c'; e.target.style.boxShadow = '0 0 0 2px rgba(234,88,12,0.12)' }}
              onBlur={e => { e.target.style.borderColor = '#1E1E1C'; e.target.style.boxShadow = 'none' }}
            />
          </div>

          <div>
            <label style={labelStyle}>Budget estimatif (€)</label>
            <input
              type="number"
              value={budgetEstimatif}
              onChange={e => setBudgetEstimatif(e.target.value)}
              placeholder="150000"
              required
              style={inputStyle}
              onFocus={e => { e.target.style.borderColor = '#ea580c'; e.target.style.boxShadow = '0 0 0 2px rgba(234,88,12,0.12)' }}
              onBlur={e => { e.target.style.borderColor = '#1E1E1C'; e.target.style.boxShadow = 'none' }}
            />
          </div>

          <div>
            <label style={labelStyle}>Date du contrat</label>
            <input
              type="date"
              value={dateContrat}
              onChange={e => setDateContrat(e.target.value)}
              style={{ ...inputStyle, colorScheme: 'dark' }}
              onFocus={e => { e.target.style.borderColor = '#ea580c'; e.target.style.boxShadow = '0 0 0 2px rgba(234,88,12,0.12)' }}
              onBlur={e => { e.target.style.borderColor = '#1E1E1C'; e.target.style.boxShadow = 'none' }}
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            onMouseEnter={e => { if (!saving) { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 0 24px rgba(249,115,22,0.5)' } }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}
            style={{
              padding: '12px 24px',
              backgroundColor: saving ? '#7A7870' : '#ea580c',
              color: '#0D0D0B',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 600,
              cursor: saving ? 'not-allowed' : 'pointer',
              fontFamily: 'var(--font-dm-sans), sans-serif',
              transition: 'all 0.2s ease',
              alignSelf: 'flex-start',
            }}
          >
            {saving ? 'Création…' : 'Créer le contrat'}
          </button>
        </form>
      </div>
    </div>
  )
}
