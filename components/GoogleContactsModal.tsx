'use client'

import { useEffect, useState, useMemo } from 'react'
import { useToast } from '@/components/ToastProvider'
import type { GoogleContact } from '@/app/api/contacts/google/route'

const lbl: React.CSSProperties = {
  fontSize: '11px', color: '#8A8880', textTransform: 'uppercase',
  letterSpacing: '0.06em', fontFamily: 'var(--font-dm-sans), sans-serif',
}

export default function GoogleContactsModal({ onClose, onImported }: {
  onClose: () => void
  onImported?: () => void
}) {
  const { showToast } = useToast()
  const [contacts, setContacts] = useState<GoogleContact[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [importing, setImporting] = useState(false)

  useEffect(() => {
    fetch('/api/contacts/google')
      .then(async (res) => {
        const json = await res.json()
        if (!res.ok) throw new Error(json?.error || 'Erreur lors du chargement')
        return json
      })
      .then((data: GoogleContact[]) => { setContacts(data); setLoading(false) })
      .catch(err => { setError(err.message); setLoading(false) })
  }, [])

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    if (!q) return contacts
    return contacts.filter(c =>
      c.nom.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      c.entreprise.toLowerCase().includes(q)
    )
  }, [contacts, search])

  const allSelected = filtered.length > 0 && filtered.every(c => selected.has(c.id))

  function toggleAll() {
    if (allSelected) {
      setSelected(prev => { const s = new Set(prev); filtered.forEach(c => s.delete(c.id)); return s })
    } else {
      setSelected(prev => { const s = new Set(prev); filtered.forEach(c => s.add(c.id)); return s })
    }
  }

  function toggle(id: string) {
    setSelected(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s })
  }

  async function handleImport(type: 'client' | 'artisan') {
    const chosen = contacts.filter(c => selected.has(c.id))
    if (!chosen.length) return
    setImporting(true)
    try {
      const res = await fetch('/api/contacts/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contacts: chosen, type }),
      })
      if (!res.ok) throw new Error('Erreur lors de l\'import')
      const { created } = await res.json()
      showToast(`${created} ${type === 'client' ? 'client' : 'artisan'}${created !== 1 ? 's' : ''} créé${created !== 1 ? 's' : ''}`)
      onImported?.()
      onClose()
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Erreur')
    } finally {
      setImporting(false)
    }
  }

  return (
    <div
      style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}
      onClick={onClose}
    >
      <div
        style={{ backgroundColor: '#0D0D0B', border: '1px solid #1E1E1C', borderRadius: '12px', width: '100%', maxWidth: '560px', margin: '0 24px', maxHeight: '85vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ padding: '24px 24px 16px', borderBottom: '1px solid #1E1E1C', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h2 style={{ fontFamily: 'var(--font-syne), sans-serif', fontSize: '18px', fontWeight: 700, color: '#F0EDE6', margin: 0 }}>
              Importer des contacts
            </h2>
            <button
              onClick={onClose}
              style={{ background: 'transparent', border: 'none', color: '#8A8880', cursor: 'pointer', fontSize: '20px', lineHeight: 1, padding: '0 4px' }}
            >
              ×
            </button>
          </div>
          {/* Search */}
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher par nom, email…"
            style={{ width: '100%', padding: '10px 14px', backgroundColor: '#111110', border: '1px solid #1E1E1C', borderRadius: '8px', color: '#F0EDE6', fontSize: '13px', outline: 'none', fontFamily: 'var(--font-dm-sans), sans-serif', boxSizing: 'border-box' }}
            onFocus={e => { e.currentTarget.style.borderColor = '#ea580c' }}
            onBlur={e => { e.currentTarget.style.borderColor = '#1E1E1C' }}
          />
        </div>

        {/* List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
          {loading && (
            <p style={{ textAlign: 'center', color: '#8A8880', fontSize: '13px', padding: '40px', fontFamily: 'var(--font-dm-sans), sans-serif' }}>
              Chargement des contacts…
            </p>
          )}
          {error && (
            <div style={{ padding: '24px', textAlign: 'center' }}>
              <p style={{ color: '#E85447', fontSize: '13px', fontFamily: 'var(--font-dm-sans), sans-serif', marginBottom: '12px' }}>{error}</p>
              {(error.includes('non connecté') || error.includes('invalide') || error.includes('expiré')) && (
                <a
                  href="/api/calendar/google/auth"
                  style={{ padding: '8px 16px', backgroundColor: 'rgba(249,115,22,0.12)', color: '#ea580c', border: '1px solid #ea580c', borderRadius: '8px', fontSize: '12px', fontWeight: 600, textDecoration: 'none', display: 'inline-block' }}
                >
                  Connecter Google
                </a>
              )}
            </div>
          )}
          {!loading && !error && filtered.length === 0 && (
            <p style={{ textAlign: 'center', color: '#8A8880', fontSize: '13px', padding: '40px', fontFamily: 'var(--font-dm-sans), sans-serif' }}>
              {search ? 'Aucun contact trouvé' : 'Aucun contact dans votre Google Contacts'}
            </p>
          )}
          {!loading && !error && filtered.length > 0 && (
            <>
              {/* Select all row */}
              <div
                style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 24px', borderBottom: '1px solid #1E1E1C', cursor: 'pointer' }}
                onClick={toggleAll}
              >
                <div style={{
                  width: '16px', height: '16px', borderRadius: '4px', border: `2px solid ${allSelected ? '#ea580c' : '#1E1E1C'}`,
                  backgroundColor: allSelected ? '#ea580c' : 'transparent', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s',
                }}>
                  {allSelected && <span style={{ color: '#0D0D0B', fontSize: '10px', fontWeight: 700, lineHeight: 1 }}>✓</span>}
                </div>
                <span style={{ ...lbl, color: '#F0EDE6', textTransform: 'none', letterSpacing: 0, fontSize: '13px' }}>
                  Tout sélectionner
                  <span style={{ marginLeft: '8px', color: '#8A8880', fontSize: '12px' }}>
                    ({filtered.length} contact{filtered.length !== 1 ? 's' : ''})
                  </span>
                </span>
                {selected.size > 0 && (
                  <span style={{ marginLeft: 'auto', padding: '2px 8px', backgroundColor: 'rgba(249,115,22,0.12)', color: '#ea580c', borderRadius: '20px', fontSize: '11px', fontWeight: 600 }}>
                    {selected.size} sélectionné{selected.size !== 1 ? 's' : ''}
                  </span>
                )}
              </div>

              {filtered.map(c => {
                const isSel = selected.has(c.id)
                return (
                  <div
                    key={c.id}
                    onClick={() => toggle(c.id)}
                    style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 24px', cursor: 'pointer', borderBottom: '1px solid rgba(30,30,28,0.5)', transition: 'background 0.1s', backgroundColor: isSel ? 'rgba(249,115,22,0.04)' : 'transparent' }}
                    onMouseEnter={e => { if (!isSel) e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.02)' }}
                    onMouseLeave={e => { e.currentTarget.style.backgroundColor = isSel ? 'rgba(249,115,22,0.04)' : 'transparent' }}
                  >
                    <div style={{
                      width: '16px', height: '16px', borderRadius: '4px', border: `2px solid ${isSel ? '#ea580c' : '#1E1E1C'}`,
                      backgroundColor: isSel ? '#ea580c' : 'transparent', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s',
                    }}>
                      {isSel && <span style={{ color: '#0D0D0B', fontSize: '10px', fontWeight: 700, lineHeight: 1 }}>✓</span>}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: '#F0EDE6', fontFamily: 'var(--font-dm-sans), sans-serif', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {c.nom}
                        {c.entreprise && <span style={{ marginLeft: '6px', fontSize: '11px', color: '#8A8880', fontWeight: 400 }}>· {c.entreprise}</span>}
                      </div>
                      <div style={{ fontSize: '12px', color: '#8A8880', fontFamily: 'var(--font-dm-sans), sans-serif', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {[c.email, c.telephone].filter(Boolean).join(' · ') || 'Pas de coordonnées'}
                      </div>
                    </div>
                  </div>
                )
              })}
            </>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '16px 24px', borderTop: '1px solid #1E1E1C', flexShrink: 0, display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            onClick={() => handleImport('client')}
            disabled={importing || selected.size === 0}
            style={{ flex: 1, padding: '10px 16px', backgroundColor: selected.size > 0 && !importing ? '#ea580c' : 'rgba(249,115,22,0.2)', color: selected.size > 0 && !importing ? '#0D0D0B' : '#8A8880', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: selected.size > 0 && !importing ? 'pointer' : 'not-allowed', fontFamily: 'var(--font-dm-sans), sans-serif', transition: 'all 0.2s', whiteSpace: 'nowrap' }}
          >
            {importing ? 'Import…' : `Ajouter comme Clients${selected.size > 0 ? ` (${selected.size})` : ''}`}
          </button>
          <button
            onClick={() => handleImport('artisan')}
            disabled={importing || selected.size === 0}
            style={{ flex: 1, padding: '10px 16px', backgroundColor: 'transparent', color: selected.size > 0 && !importing ? '#ea580c' : '#8A8880', border: `1px solid ${selected.size > 0 && !importing ? '#ea580c' : '#1E1E1C'}`, borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: selected.size > 0 && !importing ? 'pointer' : 'not-allowed', fontFamily: 'var(--font-dm-sans), sans-serif', transition: 'all 0.2s', whiteSpace: 'nowrap' }}
          >
            {importing ? 'Import…' : `Ajouter comme Artisans${selected.size > 0 ? ` (${selected.size})` : ''}`}
          </button>
          <button
            onClick={onClose}
            style={{ padding: '10px 16px', backgroundColor: 'transparent', color: '#8A8880', border: '1px solid #1E1E1C', borderRadius: '8px', fontSize: '13px', cursor: 'pointer', fontFamily: 'var(--font-dm-sans), sans-serif' }}
          >
            Annuler
          </button>
        </div>
      </div>
    </div>
  )
}
