import { createClient } from './client'

export type Client = {
  id: string
  user_id: string
  type: 'particulier' | 'entreprise'
  prenom: string | null
  nom: string | null
  entreprise_nom: string | null
  entreprise_siret: string | null
  entreprise_tva: string | null
  entreprise_forme_juridique: string | null
  contact_nom: string | null
  contact_prenom: string | null
  contact_email: string | null
  contact_telephone: string | null
  email: string | null
  telephone: string | null
  adresse: string | null
  code_postal: string | null
  ville: string | null
  pays: string | null
  notes: string | null
  created_at: string
}

export type CreateClientInput = Omit<Client, 'id' | 'user_id' | 'created_at'>

export function clientDisplayName(c: Pick<Client, 'type' | 'nom' | 'prenom' | 'entreprise_nom'>): string {
  if (c.type === 'entreprise') return c.entreprise_nom || '—'
  return [c.prenom, c.nom].filter(Boolean).join(' ') || '—'
}

export function clientDisplayEmail(c: Pick<Client, 'email' | 'contact_email'>): string {
  return c.email || c.contact_email || ''
}

export function clientDisplayAdresse(c: Pick<Client, 'adresse' | 'code_postal' | 'ville'>): string {
  const parts = [c.adresse, [c.code_postal, c.ville].filter(Boolean).join(' ')].filter(Boolean)
  return parts.join(', ')
}

export async function getClients(): Promise<Client[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function getClient(id: string): Promise<Client> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('id', id)
    .single()
  if (error) throw new Error(error.message)
  return data
}

export async function createClientRecord(input: CreateClientInput): Promise<Client> {
  const supabase = createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) throw new Error('Non authentifié')
  const { data, error } = await supabase
    .from('clients')
    .insert({ ...input, user_id: user.id })
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data
}

export async function updateClient(id: string, input: Partial<CreateClientInput>): Promise<Client> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('clients')
    .update(input)
    .eq('id', id)
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data
}

export async function deleteClient(id: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from('clients')
    .delete()
    .eq('id', id)
  if (error) throw new Error(error.message)
}
