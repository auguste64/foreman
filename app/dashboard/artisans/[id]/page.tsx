import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ArtisanDetail from './ArtisanDetail'

export default async function ArtisanPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: artisan, error } = await supabase
    .from('artisans')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !artisan) notFound()

  return <ArtisanDetail artisan={artisan} />
}
