import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import NouveauLivraisonClient from './NouveauLivraisonClient'

export default async function NouveauLivraisonPage({
  searchParams,
}: {
  searchParams: Promise<{ chantier?: string }>
}) {
  const { chantier: chantierId } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: chantiers } = await supabase
    .from('chantiers')
    .select('id, nom, client, adresse')
    .eq('user_id', user.id)
    .order('nom')

  return (
    <NouveauLivraisonClient
      chantiers={(chantiers ?? []) as { id: string; nom: string; client: string | null; adresse: string | null }[]}
      defaultChantierId={chantierId}
    />
  )
}
