import { createClient } from './client'
import type { Chantier } from './chantiers'

export type Artisan = {
  id: string
  user_id: string
  nom: string
  email: string
  telephone: string
  metier: string
  created_at: string
}

export type ChantierArtisan = {
  id: string
  chantier_id: string
  artisan_id: string
  created_at: string
}

export type CreateArtisanInput = Omit<Artisan, 'id' | 'user_id' | 'created_at'>

export async function getArtisans(): Promise<Artisan[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('artisans')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function getArtisan(id: string): Promise<Artisan> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('artisans')
    .select('*')
    .eq('id', id)
    .single()
  if (error) throw new Error(error.message)
  return data
}

export async function createArtisan(input: CreateArtisanInput): Promise<Artisan> {
  const supabase = createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) throw new Error('Non authentifié')
  const { data, error } = await supabase
    .from('artisans')
    .insert({ ...input, user_id: user.id })
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data
}

export async function updateArtisan(id: string, input: Partial<CreateArtisanInput>): Promise<Artisan> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('artisans')
    .update(input)
    .eq('id', id)
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data
}

export async function deleteArtisan(id: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from('artisans')
    .delete()
    .eq('id', id)
  if (error) throw new Error(error.message)
}

export async function assignerArtisan(chantierId: string, artisanId: string): Promise<ChantierArtisan> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('chantiers_artisans')
    .insert({ chantier_id: chantierId, artisan_id: artisanId })
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data
}

export async function retirerArtisan(chantierId: string, artisanId: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from('chantiers_artisans')
    .delete()
    .eq('chantier_id', chantierId)
    .eq('artisan_id', artisanId)
  if (error) throw new Error(error.message)
}

export async function getArtisansChantier(chantierId: string): Promise<Artisan[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('chantiers_artisans')
    .select('artisans(*)')
    .eq('chantier_id', chantierId)
  if (error) throw new Error(error.message)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data ?? []).map((row: any) => row.artisans).filter(Boolean)
}

export async function getChantiersArtisan(artisanId: string): Promise<Chantier[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('chantiers_artisans')
    .select('chantiers(*)')
    .eq('artisan_id', artisanId)
  if (error) throw new Error(error.message)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data ?? []).map((row: any) => row.chantiers).filter(Boolean)
}
