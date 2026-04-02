'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import UpgradeGate from '@/components/UpgradeGate'
import { usePlan } from '@/lib/usePlan'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'

const MOIS_FR = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc']

function getLast6Months(): { key: string; label: string }[] {
  const result = []
  const now = new Date()
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    result.push({
      key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
      label: MOIS_FR[d.getMonth()],
    })
  }
  return result
}

type Stats = {
  crCeMois: number
  crTotal: number
  chantiersActifs: number
  artisans: number
}

type ChartPoint = { label: string; cr: number }

function Spinner() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#0D0D0B' }}>
      <div style={{ width: 28, height: 28, border: '2px solid #1E1E1C', borderTopColor: '#ea580c', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}

export default function StatsPage() {
  const [stats, setStats] = useState<Stats>({ crCeMois: 0, crTotal: 0, chantiersActifs: 0, artisans: 0 })
  const [chartData, setChartData] = useState<ChartPoint[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const { plan, loading: planLoading } = usePlan()

  useEffect(() => {
    if (!planLoading && plan !== 'pro') router.replace('/dashboard/upgrade')
  }, [planLoading, plan, router])

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const months = getLast6Months()
      const nowKey = months[5].key

      const [crRes, chantiersRes, artisansRes] = await Promise.all([
        supabase.from('comptes_rendus').select('date_visite'),
        supabase.from('chantiers').select('statut'),
        supabase.from('artisans').select('id'),
      ])

      const allCR = crRes.data ?? []
      const crCeMois = allCR.filter((cr: { date_visite: string }) => {
        const d = new Date(cr.date_visite)
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
        return key === nowKey
      }).length

      const chart = months.map(m => ({
        label: m.label,
        cr: allCR.filter((cr: { date_visite: string }) => {
          const d = new Date(cr.date_visite)
          const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
          return key === m.key
        }).length,
      }))

      setChartData(chart)
      setStats({
        crCeMois,
        crTotal: allCR.length,
        chantiersActifs: (chantiersRes.data ?? []).filter((c: { statut: string }) => c.statut === 'En cours').length,
        artisans: (artisansRes.data ?? []).length,
      })
      setLoading(false)
    }
    load()
  }, [])

  const metricCards = [
    { label: 'CR CE MOIS', value: stats.crCeMois, color: '#ea580c' },
    { label: 'CR TOTAL', value: stats.crTotal, color: '#60a5fa' },
    { label: 'CHANTIERS ACTIFS', value: stats.chantiersActifs, color: '#4ade80' },
    { label: 'ARTISANS', value: stats.artisans, color: '#a78bfa' },
  ]

  if (planLoading) return <Spinner />
  if (plan !== 'pro') return null

  return (
    <div className="page-enter" style={{ flex: 1, padding: '40px', overflowY: 'auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '40px' }}>
        <h1 style={{ fontFamily: 'var(--font-syne), sans-serif', fontSize: '24px', fontWeight: 700, color: '#F0EDE6', margin: 0 }}>
          Statistiques
        </h1>
        <p style={{ color: '#8A8880', fontSize: '14px', marginTop: '6px', fontFamily: 'var(--font-dm-sans), sans-serif' }}>
          Vue d&apos;ensemble de votre activité
        </p>
      </div>

      {loading ? (
        <p style={{ color: '#8A8880', fontSize: '14px', fontFamily: 'var(--font-dm-sans), sans-serif' }}>Chargement…</p>
      ) : (
        <>
          {/* Metric cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '40px' }}>
            {metricCards.map(card => (
              <div key={card.label} style={{ backgroundColor: '#111110', border: '1px solid #1E1E1C', borderTop: `2px solid ${card.color}`, borderRadius: '10px', padding: '24px' }}>
                <p style={{ fontFamily: 'var(--font-syne), sans-serif', fontWeight: 600, fontSize: '11px', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#7A7870', margin: 0 }}>
                  {card.label}
                </p>
                <p style={{ fontFamily: 'var(--font-syne), sans-serif', fontWeight: 800, fontSize: '36px', letterSpacing: '-0.04em', color: card.color, lineHeight: 1, marginTop: '12px', marginBottom: 0 }}>
                  {card.value}
                </p>
              </div>
            ))}
          </div>

          {/* Bar chart */}
          <div style={{ backgroundColor: '#111110', border: '1px solid #1E1E1C', borderRadius: '12px', padding: '28px' }}>
            <h2 style={{ fontFamily: 'var(--font-syne), sans-serif', fontSize: '16px', fontWeight: 600, color: '#F0EDE6', margin: '0 0 24px' }}>
              Comptes rendus — 6 derniers mois
            </h2>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={chartData} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E1E1C" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fill: '#8A8880', fontSize: 12, fontFamily: 'var(--font-dm-sans), sans-serif' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fill: '#8A8880', fontSize: 12, fontFamily: 'var(--font-dm-sans), sans-serif' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: '#111110', border: '1px solid #1E1E1C', borderRadius: '6px', fontFamily: 'var(--font-dm-sans), sans-serif', fontSize: '13px', color: '#F0EDE6' }}
                  cursor={{ fill: 'rgba(249,115,22,0.06)' }}
                  labelStyle={{ color: '#ea580c', fontWeight: 600 }}
                />
                <Bar dataKey="cr" fill="#ea580c" radius={[4, 4, 0, 0]} name="CR" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  )
}
