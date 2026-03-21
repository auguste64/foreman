import { createClient } from './client'

export type NotificationType = 'relance_devis' | 'relance_facture' | 'rappel_reunion'

export type Notification = {
  id: string
  user_id: string
  type: NotificationType
  titre: string
  message: string
  lien: string | null
  lu: boolean
  created_at: string
}

export async function getUnreadNotifications(): Promise<Notification[]> {
  const supabase = createClient()
  const { data } = await supabase
    .from('notifications')
    .select('*')
    .eq('lu', false)
    .order('created_at', { ascending: false })
    .limit(30)
  return (data ?? []) as Notification[]
}

export async function markNotificationRead(id: string): Promise<void> {
  const supabase = createClient()
  await supabase.from('notifications').update({ lu: true }).eq('id', id)
}

export async function markAllNotificationsRead(userId: string): Promise<void> {
  const supabase = createClient()
  await supabase.from('notifications').update({ lu: true }).eq('user_id', userId).eq('lu', false)
}
