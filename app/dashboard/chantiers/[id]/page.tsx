import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ChantierDetail from './ChantierDetail'

export default async function ChantierPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: chantier, error } = await supabase
    .from('chantiers')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !chantier) notFound()

  return <ChantierDetail chantier={chantier} />
}
