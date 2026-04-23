import { createClient } from './client'
import type { Chantier } from './chantiers'

// Colonnes confirmées dans la table Supabase (HTTP 200) :
// id, chantier_id, user_id, date_visite, date_prochaine_visite, progression,
// observations (TEXT — stocke un JSON structuré), travaux_a_faire, artisans_presents (text[]), photos (text[]), created_at
//
// Colonnes ABSENTES du schéma DB : presences, reserves, decisions, lots, lotSuivi
// → Ces données sont sérialisées dans observations sous la forme :
//   { texte, presences, reserves, decisions, lots, lotSuivi }

export type LotSuiviEntry = {
  observations: string
  photos: string[]
}

export type ObservationsData = {
  texte: string
  presences: PresenceRow[]
  reserves: Reserve[]
  decisions: Decision[]
  lots: Lot[]
  lotSuivi: Record<string, LotSuiviEntry>
}

export type PresenceRow = {
  artisanId: string
  nom: string
  societe: string
  statut: 'P' | 'A' | 'E'
  convoque: boolean
}

export type Reserve = {
  id: string
  lot: string
  description: string
  statut: 'ouverte' | 'levee'
  photos: string[]
}

export type Decision = {
  id: string
  texte: string
  responsable: string
  echeance: string
}

export type Lot = {
  id: string
  nom: string
  intervenant?: string
  avancement: number
  notes: string
}

export type CompteRendu = {
  id: string
  chantier_id: string
  user_id: string
  date_visite: string
  date_prochaine_visite: string | null
  progression: number
  observations: string | null   // JSON stringifié de ObservationsData
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
    console.error('[createCompteRendu] error.message:', error.message)
    console.error('[createCompteRendu] error.code:', error.code)
    console.error('[createCompteRendu] error.details:', error.details)
    console.error('[createCompteRendu] error.hint:', error.hint)
    console.error('[createCompteRendu] full:', JSON.stringify(error))
    console.error('[createCompteRendu] input was:', JSON.stringify({ ...input, user_id: user.id }))
    throw new Error(`[${error.code}] ${error.message} — ${error.details ?? ''} ${error.hint ?? ''}`.trim())
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
