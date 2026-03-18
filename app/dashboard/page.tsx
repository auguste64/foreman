import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import DashboardClient from './DashboardClient'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const [{ data: entreprise }, { data: profile }] = await Promise.all([
    supabase.from('entreprise_infos').select('raison_sociale').eq('user_id', user.id).single(),
    supabase.from('profiles').select('prenom, nom').eq('id', user.id).single(),
  ])

  const emailFallback = (user.email?.split('@')[0] ?? '').replace(/[0-9]/g, '')
  const emailFormate = emailFallback.charAt(0).toUpperCase() + emailFallback.slice(1)
  const displayName = entreprise?.raison_sociale?.trim() || profile?.prenom?.trim() || emailFormate

  const [
    { count: chantiersCount },
    { count: chantiersActifsCount },
    { data: chantiersEnCours },
    { data: prochainsEvenements },
  ] = await Promise.all([
    supabase.from('chantiers').select('*', { count: 'exact', head: true }),
    supabase.from('chantiers').select('*', { count: 'exact', head: true }).eq('statut', 'En cours'),
    supabase
      .from('chantiers')
      .select('*')
      .eq('statut', 'En cours')
      .order('created_at', { ascending: false })
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
      displayName={displayName}
      stats={{
        total: chantiersCount ?? 0,
        actifs: chantiersActifsCount ?? 0,
      }}
      chantiersEnCours={chantiersEnCours ?? []}
      prochainsEvenements={prochainsEvenements ?? []}
    />
  )
}
