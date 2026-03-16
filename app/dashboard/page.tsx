import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import DashboardClient from './DashboardClient'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const [
    { count: chantiersCount },
    { count: chantiersActifsCount },
    { count: artisansCount },
    { count: comptesRendusCount },
    { data: derniersCompteRendus },
    { data: prochainsEvenements },
  ] = await Promise.all([
    supabase.from('chantiers').select('*', { count: 'exact', head: true }),
    supabase.from('chantiers').select('*', { count: 'exact', head: true }).eq('statut', 'En cours'),
    supabase.from('artisans').select('*', { count: 'exact', head: true }),
    supabase.from('comptes_rendus').select('*', { count: 'exact', head: true }),
    supabase
      .from('comptes_rendus')
      .select('id, chantier_id, date_visite, progression, chantiers(nom)')
      .order('date_visite', { ascending: false })
      .limit(3),
    supabase
      .from('evenements')
      .select('id, titre, date_debut, chantier_id, chantiers(nom)')
      .gte('date_debut', new Date().toISOString())
      .order('date_debut', { ascending: true })
      .limit(3),
  ])

  return (
    <DashboardClient
      user={user}
      stats={{
        total: chantiersCount ?? 0,
        actifs: chantiersActifsCount ?? 0,
        artisans: artisansCount ?? 0,
        comptesRendus: comptesRendusCount ?? 0,
      }}
      derniersCompteRendus={derniersCompteRendus ?? []}
      prochainsEvenements={prochainsEvenements ?? []}
    />
  )
}
