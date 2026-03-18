'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { getClients, clientDisplayName } from '@/lib/supabase/clients'
import type { Client } from '@/lib/supabase/clients'

type Filter = 'tous' | 'particulier' | 'entreprise'

function initials(c: Client): string {
  if (c.type === 'entreprise') return (c.entreprise_nom || '?')[0].toUpperCase()
  const p = (c.prenom || '')[0] || ''
  const n = (c.nom || '')[0] || ''
  return (p + n).toUpperCase() || '?'
}

export default function ClientsPage() {
  const router = useRouter()
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<Filter>('tous')

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
  })

  return (
    <div className="page-enter" style={{ flex: 1, padding: '40px', overflowY: 'auto' }}>
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
        <Link
          href="/dashboard/clients/nouveau"
          style={{ padding: '10px 20px', backgroundColor: '#F97316', color: '#0D0D0B', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, textDecoration: 'none', fontFamily: 'var(--font-dm-sans), sans-serif' }}
        >
          + Nouveau client
        </Link>
      </div>

      {/* Search + filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 28, flexWrap: 'wrap' }}>
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Rechercher par nom, email, société…"
          style={{ flex: 1, minWidth: 220, padding: '10px 14px', backgroundColor: '#111110', border: '1px solid #1E1E1C', borderRadius: 8, color: '#F0EDE6', fontSize: 14, outline: 'none', fontFamily: 'var(--font-dm-sans), sans-serif' }}
          onFocus={e => { e.target.style.borderColor = '#F97316'; e.target.style.boxShadow = '0 0 0 2px rgba(249,115,22,0.12)' }}
          onBlur={e => { e.target.style.borderColor = '#1E1E1C'; e.target.style.boxShadow = 'none' }}
        />
        <div style={{ display: 'flex', gap: 0, backgroundColor: '#111110', border: '1px solid #1E1E1C', borderRadius: 8, overflow: 'hidden' }}>
          {(['tous', 'particulier', 'entreprise'] as Filter[]).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{ padding: '10px 16px', fontSize: 13, fontFamily: 'var(--font-dm-sans), sans-serif', border: 'none', cursor: 'pointer', backgroundColor: filter === f ? '#F97316' : 'transparent', color: filter === f ? '#0D0D0B' : '#8A8880', fontWeight: filter === f ? 600 : 400, transition: 'all 0.15s' }}
            >
              {f === 'tous' ? 'Tous' : f === 'particulier' ? 'Particuliers' : 'Entreprises'}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} style={{ backgroundColor: '#111110', border: '1px solid #1E1E1C', borderRadius: 12, padding: 20, height: 120 }} />
          ))}
        </div>
      ) : visible.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 40px' }}>
          <p style={{ color: '#8A8880', fontSize: 14, fontFamily: 'var(--font-dm-sans), sans-serif', margin: 0 }}>
            {search || filter !== 'tous' ? 'Aucun client ne correspond à votre recherche.' : 'Aucun client pour l\'instant.'}{' '}
            {!search && filter === 'tous' && (
              <Link href="/dashboard/clients/nouveau" style={{ color: '#F97316' }}>Créer le premier</Link>
            )}
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {visible.map(c => {
            const name = clientDisplayName(c)
            const email = c.email || c.contact_email || ''
            const isEntreprise = c.type === 'entreprise'
            return (
              <div
                key={c.id}
                onClick={() => router.push(`/dashboard/clients/${c.id}`)}
                style={{ backgroundColor: '#111110', border: '1px solid #1E1E1C', borderRadius: 12, padding: 20, cursor: 'pointer', transition: 'border-color 0.15s, box-shadow 0.15s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#F97316'; e.currentTarget.style.boxShadow = '0 0 0 1px rgba(249,115,22,0.2)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#1E1E1C'; e.currentTarget.style.boxShadow = 'none' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
                  {/* Avatar */}
                  <div style={{ width: 44, height: 44, borderRadius: '50%', backgroundColor: isEntreprise ? '#F97316' : '#1E1E1C', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700, color: isEntreprise ? '#0D0D0B' : '#F0EDE6', fontFamily: 'var(--font-syne), sans-serif', flexShrink: 0, border: isEntreprise ? 'none' : '1px solid #2A2A28' }}>
                    {initials(c)}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontSize: 15, fontWeight: 600, color: '#F0EDE6', fontFamily: 'var(--font-syne), sans-serif', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {name}
                    </p>
                    {/* Type badge */}
                    <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 20, backgroundColor: isEntreprise ? 'rgba(249,115,22,0.12)' : 'rgba(138,136,128,0.15)', color: isEntreprise ? '#F97316' : '#8A8880', fontFamily: 'var(--font-dm-sans), sans-serif' }}>
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
    </div>
  )
}
