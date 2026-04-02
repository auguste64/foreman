'use client'

import { useRouter } from 'next/navigation'
import type { Notification } from '@/lib/supabase/notifications'

const NOTIF_ICONS: Record<string, string> = {
  relance_devis:   '📄',
  relance_facture: '💶',
  rappel_reunion:  '📅',
  rappel_rdv:      '🗓️',
  relance_reserve: '⚠️',
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "à l'instant"
  if (mins < 60) return `il y a ${mins} min`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `il y a ${hrs}h`
  return `il y a ${Math.floor(hrs / 24)}j`
}

interface NotificationPanelProps {
  notifications: Notification[]
  isMobile?: boolean
  top?: number
  left?: number | string
  width?: string
  panelRef: React.RefObject<HTMLDivElement | null>
  onClose: () => void
  onMarquerTousCommeLus: () => void
  onMarquerCommeLu: (id: string) => void
}

export default function NotificationPanel({
  notifications,
  isMobile = false,
  top = 0,
  left = 240,
  width = '360px',
  panelRef,
  onClose,
  onMarquerTousCommeLus,
  onMarquerCommeLu,
}: NotificationPanelProps) {
  const router = useRouter()

  function handleClickNotif(n: Notification) {
    onMarquerCommeLu(n.id)
    onClose()
    if (n.lien) router.push(n.lien)
  }

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, zIndex: 44 }}
      />

      {/* Panel */}
      <div
        ref={panelRef}
        style={{
          position: 'fixed',
          top,
          left,
          width,
          maxWidth: isMobile ? '100vw' : 360,
          height: isMobile ? `calc(100vh - ${top}px)` : '100vh',
          backgroundColor: '#111110',
          borderRight: '1px solid #1E1E1C',
          borderLeft: isMobile ? 'none' : '1px solid #1E1E1C',
          zIndex: 45,
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '4px 0 24px rgba(0,0,0,0.4)',
        }}
      >
        {/* Header */}
        <div style={{
          padding: '20px 20px 16px',
          borderBottom: '1px solid #1E1E1C',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontFamily: 'var(--font-syne)', fontWeight: 700, fontSize: 15, color: '#F0EDE6' }}>
              Notifications
            </span>
            {notifications.length > 0 && (
              <span style={{
                backgroundColor: '#dc2626', color: '#fff',
                fontSize: 10, fontWeight: 700, padding: '1px 6px',
                borderRadius: 10, fontFamily: 'var(--font-dm-sans), sans-serif',
              }}>
                {notifications.length}
              </span>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {notifications.length > 0 && (
              <button
                onClick={onMarquerTousCommeLus}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  fontSize: 11, color: '#8A8880',
                  fontFamily: 'var(--font-dm-sans), sans-serif',
                  padding: '4px 8px', borderRadius: 4, transition: 'color 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.color = '#ea580c' }}
                onMouseLeave={e => { e.currentTarget.style.color = '#8A8880' }}
              >
                Tout marquer comme lu
              </button>
            )}
            <button
              onClick={onClose}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8A8880', fontSize: 18, lineHeight: 1, padding: 4 }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* List */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {notifications.length === 0 ? (
            <div style={{ padding: '60px 24px', textAlign: 'center' }}>
              <svg width="40" height="40" viewBox="0 0 20 20" fill="none" style={{ margin: '0 auto 12px', display: 'block', opacity: 0.3 }}>
                <path d="M10 2a6 6 0 00-6 6v3l-1.5 2.5A1 1 0 003.5 15h13a1 1 0 00.86-1.5L16 11V8a6 6 0 00-6-6z" stroke="#F0EDE6" strokeWidth="1.5" strokeLinejoin="round"/>
                <path d="M8 15a2 2 0 004 0" stroke="#F0EDE6" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              <p style={{ color: '#8A8880', fontSize: 13, fontFamily: 'var(--font-dm-sans), sans-serif', margin: 0 }}>
                Aucune notification
              </p>
            </div>
          ) : (
            <div>
              {notifications.map(n => (
                <button
                  key={n.id}
                  onClick={() => handleClickNotif(n)}
                  style={{
                    width: '100%', background: 'none', border: 'none',
                    borderBottom: '1px solid #1E1E1C', padding: '14px 20px',
                    cursor: 'pointer', textAlign: 'left',
                    display: 'flex', alignItems: 'flex-start', gap: 12,
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(249,115,22,0.05)' }}
                  onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent' }}
                >
                  <span style={{ fontSize: 20, flexShrink: 0, marginTop: 1 }}>
                    {NOTIF_ICONS[n.type] ?? '🔔'}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{
                      fontSize: 13, fontWeight: 600, color: '#F0EDE6',
                      fontFamily: 'var(--font-dm-sans), sans-serif',
                      margin: '0 0 3px', lineHeight: 1.4,
                    }}>
                      {n.titre}
                    </p>
                    <p style={{
                      fontSize: 12, color: '#8A8880',
                      fontFamily: 'var(--font-dm-sans), sans-serif',
                      margin: '0 0 4px', lineHeight: 1.4,
                    }}>
                      {n.message}
                    </p>
                    <p style={{
                      fontSize: 10, color: '#5A5A58',
                      fontFamily: 'var(--font-dm-sans), sans-serif', margin: 0,
                    }}>
                      {timeAgo(n.created_at)}
                    </p>
                  </div>
                  {/* Dot non-lu */}
                  <div style={{
                    width: 8, height: 8, borderRadius: '50%',
                    backgroundColor: '#dc2626', flexShrink: 0, marginTop: 4,
                  }} />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
