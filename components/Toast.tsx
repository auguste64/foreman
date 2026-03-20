'use client'
import { useEffect, useState } from 'react'

type ToastType = 'success' | 'error' | 'info' | 'loading'
type ToastItem = { id: number; message: string; type: ToastType }

let addToastFn: ((msg: string, type: ToastType) => void) | null = null

export const toast = {
  success: (msg: string) => addToastFn?.(msg, 'success'),
  error: (msg: string) => addToastFn?.(msg, 'error'),
  info: (msg: string) => addToastFn?.(msg, 'info'),
  loading: (msg: string) => addToastFn?.(msg, 'loading'),
}

const ICONS = {
  success: { symbol: '✓', color: '#22c55e', bg: '#0a1f0a' },
  error:   { symbol: '✕', color: '#ef4444', bg: '#1f0a0a' },
  info:    { symbol: 'i', color: '#3b82f6', bg: '#0a0f1f' },
  loading: { symbol: '⟳', color: '#ea580c', bg: '#1f0f0a' },
}

export function ToastProvider() {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  useEffect(() => {
    addToastFn = (message, type) => {
      const id = Date.now()
      setToasts(prev => [...prev, { id, message, type }])
      setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500)
    }
    return () => { addToastFn = null }
  }, [])

  if (toasts.length === 0) return null

  return (
    <div style={{
      position: 'fixed', bottom: '24px', right: '24px',
      display: 'flex', flexDirection: 'column', gap: '8px',
      zIndex: 99999, pointerEvents: 'none'
    }}>
      {toasts.map(t => {
        const icon = ICONS[t.type]
        return (
          <div key={t.id} style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            background: icon.bg,
            border: `1px solid ${icon.color}40`,
            borderRadius: '10px', padding: '10px 16px',
            fontFamily: 'var(--font-dm-sans), sans-serif',
            fontSize: '13px', color: '#F0EDE6',
            animation: 'toast-in 0.3s ease both',
            boxShadow: `0 4px 20px rgba(0,0,0,0.4)`,
            minWidth: '240px', maxWidth: '360px',
          }}>
            <span style={{
              width: '20px', height: '20px', borderRadius: '50%',
              background: icon.color, display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontSize: '11px', fontWeight: 700,
              color: '#fff', flexShrink: 0
            }}>{icon.symbol}</span>
            {t.message}
          </div>
        )
      })}
    </div>
  )
}
