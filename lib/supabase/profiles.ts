import { createClient } from './client'

export type Profile = {
  id: string
  nom: string
  prenom: string
  telephone: string
  adresse: string
  entreprise: string
  acompte_default_percent?: number | null
}

export type UpsertProfileInput = Omit<Profile, 'id'>

export async function getProfile(userId: string): Promise<Profile | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (error) return null
  return data as Profile
}

export async function upsertProfile(userId: string, input: UpsertProfileInput): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from('profiles')
    .upsert({ id: userId, ...input }, { onConflict: 'id' })

  if (error) {
    console.error('profiles upsert error:', JSON.stringify(error))
    throw new Error(`${error.code} - ${error.message} - ${error.hint}`)
  }
}
