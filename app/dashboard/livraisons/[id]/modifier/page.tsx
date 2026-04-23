import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ModifierLivraisonClient from './ModifierLivraisonClient'
import type { LivraisonWithReserves } from '@/lib/supabase/livraisons'

export default async function ModifierLivraisonPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data, error }, { data: chantiers }] = await Promise.all([
    supabase
      .from('livraisons')
      .select('*, chantiers(nom, client, adresse), livraisons_reserves(*)')
      .eq('id', id)
      .single(),
    supabase
      .from('chantiers')
      .select('id, nom, client, adresse')
      .eq('user_id', user.id)
      .order('nom'),
  ])

  if (error || !data) notFound()

  const livraison = {
    ...data,
    livraisons_reserves: ((data.livraisons_reserves ?? []) as LivraisonWithReserves['livraisons_reserves'])
      .sort((a, b) => a.ordre - b.ordre),
  } as LivraisonWithReserves

  return (
    <ModifierLivraisonClient
      livraison={livraison}
      chantiers={(chantiers ?? []) as { id: string; nom: string; client: string | null; adresse: string | null }[]}
    />
  )
}
