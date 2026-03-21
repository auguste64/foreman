import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Sidebar from './Sidebar'
import MainWrapper from './MainWrapper'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: 'transparent' }}>
      <Sidebar email={user!.email ?? ''} />
      <MainWrapper>{children}</MainWrapper>
    </div>
  )
}
