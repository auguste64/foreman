'use client'

import { useCallback, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  getUnreadNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from '@/lib/supabase/notifications'
import type { Notification } from '@/lib/supabase/notifications'

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      console.log('[useNotifications] user_id:', session?.user?.id ?? 'non connecté')

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('lu', false)
        .order('created_at', { ascending: false })
        .limit(30)
      console.log('[useNotifications] résultat brut:', { data, error })
      console.log('[useNotifications] nombre de notifications:', data?.length ?? 0)

      setNotifications((data ?? []) as Notification[])
    } catch { /* table may not exist yet */ }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const marquerCommeLu = useCallback(async (id: string) => {
    try { await markNotificationRead(id) } catch { /* ignore */ }
    setNotifications(prev => prev.filter(n => n.id !== id))
  }, [])

  const marquerTousCommeLus = useCallback(async () => {
    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user?.id) {
        await markAllNotificationsRead(session.user.id)
      }
    } catch { /* ignore */ }
    setNotifications([])
  }, [])

  return {
    notifications,
    nonLuCount: notifications.length,
    marquerCommeLu,
    marquerTousCommeLus,
    loading,
    reload: load,
  }
}
