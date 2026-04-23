import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import LivraisonDetail from './LivraisonDetail'
import type { LivraisonWithReserves } from '@/lib/supabase/livraisons'

export default async function LivraisonPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data, error } = await supabase
    .from('livraisons')
    .select('*, chantiers(nom, client, adresse), livraisons_reserves(*)')
    .eq('id', id)
    .single()

  if (error || !data) notFound()

  const livraison = {
    ...data,
    livraisons_reserves: ((data.livraisons_reserves ?? []) as LivraisonWithReserves['livraisons_reserves'])
      .sort((a, b) => a.ordre - b.ordre),
  } as LivraisonWithReserves

  return <LivraisonDetail livraison={livraison} />
}
