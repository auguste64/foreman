import { createClient } from './client'
import type { Chantier } from './chantiers'

export type CompteRendu = {
  id: string
  chantier_id: string
  user_id: string
  date_visite: string
  date_prochaine_visite: string | null
  progression: number
  observations: string | null
  travaux_a_faire: string | null
  artisans_presents: string[]
  photos: string[]
  created_at: string
}

export type CompteRenduWithChantier = CompteRendu & {
  chantiers: Pick<Chantier, 'nom' | 'client' | 'adresse'>
}

export type CreateCompteRenduInput = Omit<CompteRendu, 'id' | 'user_id' | 'created_at'>

export async function getComptesRendus(chantierId?: string): Promise<CompteRenduWithChantier[]> {
  const supabase = createClient()
  let query = supabase
    .from('comptes_rendus')
    .select('*, chantiers(nom, client, adresse)')
    .order('date_visite', { ascending: false })

  if (chantierId) query = query.eq('chantier_id', chantierId)

  const { data, error } = await query
  if (error) throw error
  return (data ?? []) as CompteRenduWithChantier[]
}

export async function getCompteRendu(id: string): Promise<CompteRenduWithChantier> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('comptes_rendus')
    .select('*, chantiers(nom, client, adresse)')
    .eq('id', id)
    .single()

  if (error) {
    console.error('[getCompteRendu] Supabase error:', error)
    throw new Error(error.message)
  }
  return data as CompteRenduWithChantier
}

export async function createCompteRendu(input: CreateCompteRenduInput): Promise<CompteRendu> {
  const supabase = createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) throw new Error('Non authentifié')

  const { data, error } = await supabase
    .from('comptes_rendus')
    .insert({ ...input, user_id: user.id })
    .select()
    .single()

  if (error) {
    console.error('[createCompteRendu] Supabase error:', error)
    throw new Error(error.message)
  }
  return data
}

export async function updateCompteRendu(id: string, input: Partial<CreateCompteRenduInput>): Promise<CompteRendu> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('comptes_rendus')
    .update(input)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('[updateCompteRendu] Supabase error:', error)
    throw new Error(error.message)
  }
  return data
}

export async function deleteCompteRendu(id: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from('comptes_rendus')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('[deleteCompteRendu] Supabase error:', error)
    throw new Error(error.message)
  }
}
