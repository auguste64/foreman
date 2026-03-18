import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ModifierCompteRendu from './ModifierCompteRendu'
import type { CompteRenduWithChantier } from '@/lib/supabase/comptes-rendus'

export default async function ModifierPage({ params }: { params: Promise<{ id: string }> }) {
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

  return <ModifierCompteRendu compteRendu={data as CompteRenduWithChantier} />
}
