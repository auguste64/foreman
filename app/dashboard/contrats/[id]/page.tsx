'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Contrat } from '@/lib/supabase/contrats'
import { useIsMobile } from '@/lib/useIsMobile'

function fmtDate(d: string | null) {
  if (!d) return '—'
  const s = d.includes('T') ? d : d + 'T12:00:00'
  return new Date(s).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}

function fmtEur(n: number) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n)
}

export default function ContratDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const isMobile = useIsMobile()
  const [contrat, setContrat] = useState<Contrat | null>(null)
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('contrats')
      .select('*')
      .eq('id', id)
      .single()
      .then(({ data }) => {
        setContrat(data)
        setLoading(false)
      })
  }, [id])

  async function handleDownload() {
    setDownloading(true)
    try {
      const res = await fetch(`/api/generate-contrat-pdf/${id}`)
      if (!res.ok) throw new Error()
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `contrat-moe-${contrat?.nom_client?.toLowerCase().replace(/\s+/g, '-') || 'draft'}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } finally {
      setDownloading(false)
    }
  }

  async function handleDelete() {
    if (!confirm('Supprimer ce contrat ?')) return
    setDeleting(true)
    const supabase = createClient()
    await supabase.from('contrats').delete().eq('id', id)
    router.push('/dashboard/contrats')
  }

  if (loading) {
    return (
      <div style={{ flex: 1, padding: '40px' }}>
        <p style={{ color: '#8A8880', fontSize: '14px', fontFamily: 'var(--font-dm-sans), sans-serif' }}>Chargement…</p>
      </div>
    )
  }

  if (!contrat) {
    return (
      <div style={{ flex: 1, padding: '40px' }}>
        <p style={{ color: '#8A8880', fontSize: '14px', fontFamily: 'var(--font-dm-sans), sans-serif' }}>Contrat introuvable.</p>
        <Link href="/dashboard/contrats" style={{ color: '#ea580c', fontSize: '14px', textDecoration: 'none' }}>
          ← Retour aux contrats
        </Link>
      </div>
    )
  }

  const infoRows = [
    { label: "Maître d'Oeuvre", value: contrat.nom_moe },
    { label: "Maître d'Ouvrage", value: contrat.nom_client },
    { label: 'Adresse du chantier', value: contrat.adresse_chantier },
    { label: 'Budget estimatif', value: fmtEur(contrat.budget_estimatif) },
    { label: 'Date du contrat', value: fmtDate(contrat.date_contrat) },
  ]

  return (
    <div className="page-enter" style={{ flex: 1, padding: isMobile ? '16px' : '40px', overflowY: 'auto' }}>
      <div style={{ maxWidth: '720px' }}>

        {/* Breadcrumb */}
        <Link href="/dashboard/contrats" style={{ color: '#8A8880', fontSize: '13px', textDecoration: 'none', fontFamily: 'var(--font-dm-sans), sans-serif' }}>
          ← Contrats
        </Link>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '16px', marginBottom: '32px', flexWrap: 'wrap', gap: '12px' }}>
          <h1 style={{ fontFamily: 'var(--font-syne), sans-serif', fontSize: '24px', fontWeight: 700, color: '#F0EDE6', margin: 0 }}>
            Contrat — {contrat.nom_client}
          </h1>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={handleDownload}
              disabled={downloading}
              onMouseEnter={e => { if (!downloading) { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 0 24px rgba(249,115,22,0.5)' } }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}
              style={{
                padding: '10px 20px',
                backgroundColor: '#ea580c',
                color: '#0D0D0B',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: downloading ? 'not-allowed' : 'pointer',
                fontFamily: 'var(--font-dm-sans), sans-serif',
                transition: 'all 0.2s ease',
              }}
            >
              {downloading ? 'Génération…' : 'Télécharger PDF'}
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              style={{
                padding: '10px 16px',
                backgroundColor: 'transparent',
                color: '#8A8880',
                border: '1px solid #1E1E1C',
                borderRadius: '8px',
                fontSize: '14px',
                cursor: deleting ? 'not-allowed' : 'pointer',
                fontFamily: 'var(--font-dm-sans), sans-serif',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#E85447'; e.currentTarget.style.color = '#E85447' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#1E1E1C'; e.currentTarget.style.color = '#8A8880' }}
            >
              Supprimer
            </button>
          </div>
        </div>

        {/* Info card */}
        <div style={{ backgroundColor: '#111110', border: '1px solid #1E1E1C', borderRadius: '12px', padding: '28px' }}>
          {infoRows.map((row) => (
            <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #1E1E1C' }}>
              <span style={{ fontSize: '13px', color: '#8A8880', fontFamily: 'var(--font-dm-sans), sans-serif' }}>
                {row.label}
              </span>
              <span style={{ fontSize: '14px', color: '#F0EDE6', fontFamily: 'var(--font-dm-sans), sans-serif', fontWeight: 500, textAlign: 'right' }}>
                {row.value}
              </span>
            </div>
          ))}
        </div>

        {/* Aperçu sections */}
        <div style={{ marginTop: '24px', backgroundColor: '#111110', border: '1px solid #1E1E1C', borderRadius: '12px', padding: '28px' }}>
          <h3 style={{ fontFamily: 'var(--font-syne), sans-serif', fontSize: '14px', fontWeight: 700, color: '#F0EDE6', margin: '0 0 16px', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
            Contenu du contrat
          </h3>
          {[
            'Article 1 — Estimatif des travaux',
            'Article 2 — Permis de construire',
            'Article 3 — Marchés entreprises',
            'Article 4 — Maîtrise d\'oeuvre d\'exécution',
            '   4.1 — Ordonnancement',
            '   4.2 — Pilotage',
            '   4.3 — Coordination',
            '   4.4 — Réception des travaux',
            'Article 5 — Contenu du compte rendu',
          ].map((s) => (
            <p key={s} style={{ fontSize: '13px', color: s.startsWith('   ') ? '#7A7870' : '#8A8880', fontFamily: 'var(--font-dm-sans), sans-serif', margin: '6px 0', paddingLeft: s.startsWith('   ') ? '16px' : 0 }}>
              {s.trim()}
            </p>
          ))}
          <p style={{ fontSize: '12px', color: '#5A5850', fontFamily: 'var(--font-dm-sans), sans-serif', marginTop: '16px', fontStyle: 'italic' }}>
            Ces sections sont incluses automatiquement dans le PDF généré.
          </p>
        </div>

      </div>
    </div>
  )
}
