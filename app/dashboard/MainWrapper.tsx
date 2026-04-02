'use client'

import { useEffect } from 'react'
import { useIsMobile } from '@/lib/useIsMobile'
import { generateRelanceNotifications } from '@/lib/notifications'

export default function MainWrapper({ children }: { children: React.ReactNode }) {
  const isMobile = useIsMobile()

  useEffect(() => {
    generateRelanceNotifications()
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
