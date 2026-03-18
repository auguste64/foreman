import { createClient } from './client'

export type TypeEvenement = 'visite_architecte' | 'reunion' | 'presence_artisan' | 'prochaine_visite'

export type Evenement = {
  id: string
  user_id: string
  chantier_id: string | null
  titre: string
  type: TypeEvenement
  date_debut: string
  date_fin: string | null
  artisan_id: string | null
  notes: string | null
  created_at: string
}

export type CreateEvenementInput = Omit<Evenement, 'id' | 'user_id' | 'created_at'>

export const TYPE_COLORS: Record<TypeEvenement, { bg: string; text: string }> = {
  visite_architecte: { bg: '#2a240a', text: '#ea580c' },
  reunion:           { bg: '#0a1628', text: '#3B82F6' },
  presence_artisan:  { bg: '#0a2814', text: '#4ADE80' },
  prochaine_visite:  { bg: '#1a0a2a', text: '#A855F7' },
}

export const TYPE_LABELS: Record<TypeEvenement, string> = {
  visite_architecte: 'Visite architecte',
  reunion:           'Réunion',
  presence_artisan:  'Présence artisan',
  prochaine_visite:  'Prochaine visite',
}

export const TYPES: TypeEvenement[] = ['visite_architecte', 'reunion', 'presence_artisan', 'prochaine_visite']

export async function getEvenements(filters?: {
  chantierId?: string
  dateStart?: string
  dateEnd?: string
}): Promise<Evenement[]> {
  const supabase = createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query: any = supabase
    .from('evenements')
    .select('*')
    .order('date_debut', { ascending: true })

  if (filters?.chantierId) query = query.eq('chantier_id', filters.chantierId)
  if (filters?.dateStart)  query = query.gte('date_debut', filters.dateStart)
  if (filters?.dateEnd)    query = query.lte('date_debut', filters.dateEnd)

  const { data, error } = await query
  if (error) throw error
  return data ?? []
}

export async function createEvenement(input: CreateEvenementInput): Promise<Evenement> {
  const supabase = createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) throw new Error('Non authentifié')
  const { data, error } = await supabase
    .from('evenements')
    .insert({ ...input, user_id: user.id })
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data
}

export async function updateEvenement(id: string, input: Partial<CreateEvenementInput>): Promise<Evenement> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('evenements')
    .update(input)
    .eq('id', id)
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data
}

export async function deleteEvenement(id: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from('evenements').delete().eq('id', id)
  if (error) throw new Error(error.message)
}
