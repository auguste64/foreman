import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import CompteRenduDetail from './CompteRenduDetail'
import type { CompteRenduWithChantier } from '@/lib/supabase/comptes-rendus'

export default async function CompteRenduPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data, error } = await supabase
    .from('comptes_rendus')
    .select('*, chantiers(nom, client, adresse)')
    .eq('id', id)
    .single()

  if (error || !data) notFound()

  return <CompteRenduDetail compteRendu={data as CompteRenduWithChantier} />
}
