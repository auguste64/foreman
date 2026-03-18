import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Sidebar from './Sidebar'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'transparent' }}>
      <Sidebar email={user!.email ?? ''} />
      <main className="flex-1 overflow-y-auto p-8" style={{ background: 'transparent' }}>{children}</main>
    </div>
  )
}
