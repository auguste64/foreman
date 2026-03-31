import { createClient } from './client'

export type Chantier = {
  id: string
  user_id: string
  nom: string
  adresse: string
  client: string
  date_debut: string
  statut: 'En cours' | 'Terminé' | 'En pause'
  budget_estimatif: number | null
  description: string | null
  created_at: string
}

export type CreateChantierInput = Omit<Chantier, 'id' | 'user_id' | 'created_at'>

export async function getChantier(id: string): Promise<Chantier> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('chantiers')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('[getChantier] Supabase error:', error)
    throw new Error(error.message)
  }
  return data
}

export async function updateChantier(id: string, input: Partial<CreateChantierInput>): Promise<Chantier> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('chantiers')
    .update(input)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('[updateChantier] Supabase error:', error)
    throw new Error(error.message)
  }
  return data
}

export async function deleteChantier(id: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from('chantiers')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('[deleteChantier] Supabase error:', error)
    throw new Error(error.message)
  }
}

export async function getChantiers(): Promise<Chantier[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('chantiers')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw error
  return data ?? []
}

export async function createChantier(input: CreateChantierInput): Promise<Chantier> {
  const supabase = createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) throw new Error('Non authentifié')

  const { data, error } = await supabase
    .from('chantiers')
    .insert({ ...input, user_id: user.id })
    .select()
    .single()

  if (error) {
    console.error('[createChantier] Supabase error:', error)
    throw new Error(error.message)
  }
  return data
}
