'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { getClients, clientDisplayName } from '@/lib/supabase/clients'
import type { Client } from '@/lib/supabase/clients'
import GoogleContactsModal from '@/components/GoogleContactsModal'
import SortPills from '@/components/SortPills'
import { useIsMobile } from '@/lib/useIsMobile'

type Filter = 'tous' | 'particulier' | 'entreprise'
type SortClient = 'nom_asc' | 'nom_desc' | 'date_desc' | 'date_asc'

function initials(c: Client): string {
  if (c.type === 'entreprise') return (c.entreprise_nom || '?')[0].toUpperCase()
  const p = (c.prenom || '')[0] || ''
  const n = (c.nom || '')[0] || ''
  return (p + n).toUpperCase() || '?'
}

export default function ClientsPage() {
  const router = useRouter()
  const isMobile = useIsMobile()
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<Filter>('tous')
  const [showGoogleModal, setShowGoogleModal] = useState(false)
  const [sort, setSort] = useState<SortClient>('nom_asc')

  useEffect(() => {
    getClients().then(data => { setClients(data); setLoading(false) })
  }, [])

  const visible = clients.filter(c => {
    if (filter !== 'tous' && c.type !== filter) return false
    if (!search.trim()) return true
    const q = search.toLowerCase()
    const name = clientDisplayName(c).toLowerCase()
    const email = (c.email || c.contact_email || '').toLowerCase()
    const company = (c.entreprise_nom || '').toLowerCase()
    return name.includes(q) || email.includes(q) || company.includes(q)
  }).sort((a, b) => {
    const na = clientDisplayName(a), nb = clientDisplayName(b)
    if (sort === 'nom_asc')  return na.localeCompare(nb, 'fr')
    if (sort === 'nom_desc') return nb.localeCompare(na, 'fr')
    if (sort === 'date_asc') return a.created_at.localeCompare(b.created_at)
    return b.created_at.localeCompare(a.created_at) // date_desc
  })

  return (
    <div className="page-enter" style={{ flex: 1, padding: isMobile ? '16px' : '40px', overflowY: 'auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 32 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-syne), sans-serif', fontSize: 24, fontWeight: 700, color: '#F0EDE6', margin: 0 }}>
            Clients
          </h1>
          <p style={{ color: '#8A8880', fontSize: 14, margin: '6px 0 0', fontFamily: 'var(--font-dm-sans), sans-serif' }}>
            {loading ? '…' : `${clients.length} client${clients.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button
            onClick={() => setShowGoogleModal(true)}
            style={{ padding: '10px 16px', backgroundColor: 'transparent', color: '#ea580c', border: '1px solid #ea580c', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-dm-sans), sans-serif', whiteSpace: 'nowrap' }}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(249,115,22,0.08)' }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent' }}
          >
            ↓ Importer des contacts
          </button>
          <Link
            href="/dashboard/clients/nouveau"
            style={{ padding: '10px 20px', backgroundColor: '#ea580c', color: '#0D0D0B', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, textDecoration: 'none', fontFamily: 'var(--font-dm-sans), sans-serif' }}
          >
            + Nouveau client
          </Link>
        </div>
      </div>

      {/* Search + filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 28, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 220 }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
            <circle cx="7" cy="7" r="4.5" stroke="#8A8880" strokeWidth="1.5"/>
            <path d="M11 11l3 3" stroke="#8A8880" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher par nom, email, société…"
            style={{ width: '100%', padding: '10px 14px 10px 38px', backgroundColor: '#111110', border: '1px solid #1E1E1C', borderRadius: 8, color: '#F0EDE6', fontSize: 14, outline: 'none', fontFamily: 'var(--font-dm-sans), sans-serif', boxSizing: 'border-box' }}
            onFocus={e => { e.target.style.borderColor = '#ea580c'; e.target.style.boxShadow = '0 0 0 2px rgba(234,88,12,0.12)' }}
            onBlur={e => { e.target.style.borderColor = '#1E1E1C'; e.target.style.boxShadow = 'none' }}
          />
        </div>
        <div style={{ display: 'flex', gap: 0, backgroundColor: '#111110', border: '1px solid #1E1E1C', borderRadius: 8, overflow: 'hidden' }}>
          {(['tous', 'particulier', 'entreprise'] as Filter[]).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{ padding: '10px 16px', fontSize: 13, fontFamily: 'var(--font-dm-sans), sans-serif', border: 'none', cursor: 'pointer', backgroundColor: filter === f ? '#ea580c' : 'transparent', color: filter === f ? '#0D0D0B' : '#8A8880', fontWeight: filter === f ? 600 : 400, transition: 'all 0.15s' }}
            >
              {f === 'tous' ? 'Tous' : f === 'particulier' ? 'Particuliers' : 'Entreprises'}
            </button>
          ))}
        </div>
        <SortPills
          value={sort}
          onChange={v => setSort(v as SortClient)}
          options={[
            { key: 'nom', label: 'Nom', hasDirection: true, defaultDir: 'asc' },
            { key: 'date', label: 'Date', hasDirection: true, defaultDir: 'desc' },
          ]}
        />
      </div>

      {/* Grid */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(280px, 1fr))', gap: isMobile ? 12 : 16 }}>
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} style={{ backgroundColor: '#111110', border: '1px solid #1E1E1C', borderRadius: 12, padding: 20, height: 120 }} />
          ))}
        </div>
      ) : visible.length === 0 ? (
        search || filter !== 'tous' ? (
          <div style={{ textAlign: 'center', padding: '60px 40px' }}>
            <p style={{ color: '#8A8880', fontSize: 14, fontFamily: 'var(--font-dm-sans), sans-serif', margin: 0 }}>
              Aucun client ne correspond à votre recherche.
            </p>
          </div>
        ) : (
          <div style={{ backgroundColor: '#111110', border: '1px dashed #1E1E1C', borderRadius: '12px', padding: '80px 24px', textAlign: 'center' }}>
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none" style={{ margin: '0 auto 20px', display: 'block' }}>
              <circle cx="24" cy="18" r="9" stroke="#1E1E1C" strokeWidth="2"/>
              <path d="M8 42c0-8.837 7.163-16 16-16s16 7.163 16 16" stroke="#ea580c" strokeWidth="2" strokeLinecap="round"/>
              <circle cx="24" cy="18" r="5" fill="#ea580c" opacity="0.3"/>
            </svg>
            <h2 style={{ fontFamily: 'var(--font-syne), sans-serif', fontSize: '16px', fontWeight: 600, color: '#8A8880', marginBottom: '8px' }}>
              Aucun client pour l&apos;instant
            </h2>
            <p style={{ color: '#7A7870', fontSize: '13px', fontFamily: 'var(--font-dm-sans), sans-serif', marginBottom: '24px' }}>
              Ajoutez votre premier client pour commencer à gérer vos projets.
            </p>
            <Link
              href="/dashboard/clients/nouveau"
              style={{ display: 'inline-block', padding: '10px 20px', backgroundColor: '#ea580c', color: '#0D0D0B', borderRadius: '8px', fontSize: '14px', fontWeight: 600, textDecoration: 'none', fontFamily: 'var(--font-dm-sans), sans-serif' }}
            >
              + Ajouter mon premier client
            </Link>
          </div>
        )
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(280px, 1fr))', gap: isMobile ? 12 : 16 }}>
          {visible.map(c => {
            const name = clientDisplayName(c)
            const email = c.email || c.contact_email || ''
            const isEntreprise = c.type === 'entreprise'
            return (
              <div
                key={c.id}
                onClick={() => router.push(`/dashboard/clients/${c.id}`)}
                style={{ backgroundColor: '#111110', border: '1px solid #1E1E1C', borderRadius: 12, padding: 20, cursor: 'pointer', transition: 'border-color 0.15s, box-shadow 0.15s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#ea580c'; e.currentTarget.style.boxShadow = '0 0 0 1px rgba(249,115,22,0.2)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#1E1E1C'; e.currentTarget.style.boxShadow = 'none' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
                  {/* Avatar */}
                  <div style={{ width: 44, height: 44, borderRadius: '50%', backgroundColor: isEntreprise ? '#ea580c' : '#1E1E1C', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700, color: isEntreprise ? '#0D0D0B' : '#F0EDE6', fontFamily: 'var(--font-syne), sans-serif', flexShrink: 0, border: isEntreprise ? 'none' : '1px solid #2A2A28' }}>
                    {initials(c)}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontSize: 15, fontWeight: 600, color: '#F0EDE6', fontFamily: 'var(--font-syne), sans-serif', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {name}
                    </p>
                    {/* Type badge */}
                    <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 20, backgroundColor: isEntreprise ? 'rgba(249,115,22,0.12)' : 'rgba(138,136,128,0.15)', color: isEntreprise ? '#ea580c' : '#8A8880', fontFamily: 'var(--font-dm-sans), sans-serif' }}>
                      {isEntreprise ? 'Entreprise' : 'Particulier'}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  {email && (
                    <p style={{ fontSize: 12, color: '#8A8880', fontFamily: 'var(--font-dm-sans), sans-serif', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {email}
                    </p>
                  )}
                  {(c.telephone || c.contact_telephone) && (
                    <p style={{ fontSize: 12, color: '#8A8880', fontFamily: 'var(--font-dm-sans), sans-serif', margin: 0 }}>
                      {c.telephone || c.contact_telephone}
                    </p>
                  )}
                  {c.ville && (
                    <p style={{ fontSize: 12, color: '#7A7870', fontFamily: 'var(--font-dm-sans), sans-serif', margin: 0 }}>
                      {[c.code_postal, c.ville].filter(Boolean).join(' ')}
                    </p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {showGoogleModal && (
        <GoogleContactsModal
          onClose={() => setShowGoogleModal(false)}
          onImported={() => getClients().then(data => setClients(data))}
        />
      )}
    </div>
  )
}
