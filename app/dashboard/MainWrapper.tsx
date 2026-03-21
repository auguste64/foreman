'use client'

import { useEffect } from 'react'
import { useIsMobile } from '@/lib/useIsMobile'

export default function MainWrapper({ children }: { children: React.ReactNode }) {
  const isMobile = useIsMobile()

  useEffect(() => {
    // Génère les notifications en arrière-plan, sans bloquer le rendu
    fetch('/api/notifications/generate', { method: 'POST' }).catch(() => {})
  }, [])

  return (
    <main
      style={{
        flex: 1,
        overflowY: 'auto',
        background: 'transparent',
        paddingTop: isMobile ? 56 : 0,
      }}
    >
      {children}
    </main>
  )
}
