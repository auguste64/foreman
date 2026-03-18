'use client'

import { createContext, useCallback, useContext, useRef, useState } from 'react'

type ToastItem = { id: number; message: string }
type ToastCtx = { showToast: (message: string) => void }

const ToastContext = createContext<ToastCtx>({ showToast: () => {} })

export function useToast() {
  return useContext(ToastContext)
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const counter = useRef(0)

  const showToast = useCallback((message: string) => {
    const id = ++counter.current
    setToasts(prev => [...prev, { id, message }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500)
  }, [])

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <style>{`
        @keyframes toastLife {
          0%   { transform: translateX(110%); opacity: 0; }
          10%  { transform: translateX(0);    opacity: 1; }
          80%  { transform: translateX(0);    opacity: 1; }
          100% { transform: translateX(0);    opacity: 0; }
        }
      `}</style>
      <div style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        zIndex: 9999,
        pointerEvents: 'none',
      }}>
        {toasts.map(t => (
          <div key={t.id} style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            background: '#1a3a2a',
            border: '1px solid #2d6a4f',
            borderRadius: '8px',
            padding: '12px 16px',
            color: '#F0EDE6',
            fontSize: '14px',
            fontFamily: 'var(--font-dm-sans), DM Sans, sans-serif',
            fontWeight: 500,
            boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
            animation: 'toastLife 3.5s cubic-bezier(0.4,0,0.2,1) both',
            minWidth: '220px',
            maxWidth: '320px',
          }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
              <circle cx="8" cy="8" r="7" fill="rgba(45,106,79,0.35)" stroke="#2d6a4f" strokeWidth="1.5" />
              <path d="M5 8l2 2 4-4" stroke="#52b788" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
