import { createClient } from './client'

export type DevisArtisan = {
  id: string
  user_id: string
  chantier_id: string | null
  artisan_id: string | null
  numero: string | null
  montant_ht: number | null
  montant_ttc: number | null
  tva: number | null
  statut: 'recu' | 'accepte' | 'refuse'
  date_reception: string | null
  lot: string | null
  description: string | null
  pdf_url: string | null
  created_at: string
}

export type DevisArtisanWithArtisan = DevisArtisan & {
  artisans: { nom: string; metier: string } | null
}

export type CreateDevisArtisanInput = {
  chantier_id?: string | null
  artisan_id?: string | null
  numero?: string | null
  montant_ht?: number | null
  montant_ttc?: number | null
  tva?: number | null
  statut?: 'recu' | 'accepte' | 'refuse'
  date_reception?: string | null
  lot?: string | null
  description?: string | null
  pdf_url?: string | null
}

export async function getDevisArtisansByChantier(chantierId: string): Promise<DevisArtisanWithArtisan[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('devis_artisans')
    .select('*, artisans(nom, metier)')
    .eq('chantier_id', chantierId)
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return (data ?? []) as DevisArtisanWithArtisan[]
}

export async function createDevisArtisan(input: CreateDevisArtisanInput): Promise<DevisArtisan> {
  const supabase = createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) throw new Error('Non authentifié')
  const { data, error } = await supabase
    .from('devis_artisans')
    .insert({ ...input, user_id: user.id })
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data
}

export async function updateDevisArtisan(id: string, input: Partial<CreateDevisArtisanInput>): Promise<DevisArtisan> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('devis_artisans')
    .update(input)
    .eq('id', id)
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data
}

export async function deleteDevisArtisan(id: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from('devis_artisans')
    .delete()
    .eq('id', id)
  if (error) throw new Error(error.message)
}
