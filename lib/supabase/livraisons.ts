import { createClient } from './client'

// ─── Types ───────────────────────────────────────────────────────────────────

export type LivraisonStatut = 'accepte' | 'accepte_reserves' | 'refuse'
export type ReserveStatut   = 'a_lever' | 'levee'

export type PresenceLivraison = {
  nom:    string
  societe: string
  statut: 'P' | 'A' | 'E'
}

export type Livraison = {
  id:                   string
  chantier_id:          string
  user_id:              string
  numero:               string | null
  date_reception:       string          // 'YYYY-MM-DD'
  statut:               LivraisonStatut
  delai_levee_reserves: string | null   // 'YYYY-MM-DD'
  observations:         string | null
  presences:            PresenceLivraison[]
  created_at:           string
  updated_at:           string
}

export type LivraisonReserve = {
  id:           string
  livraison_id: string
  lot_id:       string | null
  lot_nom:      string | null
  description:  string
  statut:       ReserveStatut
  date_levee:   string | null
  ordre:        number
  artisan_id:   string | null
  artisan_nom:  string | null
  created_at:   string
}

export type LivraisonWithChantier = Livraison & {
  chantiers: { nom: string; client: string; adresse: string }
}

export type LivraisonWithReserves = LivraisonWithChantier & {
  livraisons_reserves: LivraisonReserve[]
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

export const LIVRAISON_STATUT: Record<LivraisonStatut, { label: string; bg: string; color: string }> = {
  accepte:          { label: 'Accepté',              bg: 'rgba(74,222,128,0.15)',  color: '#4ade80' },
  accepte_reserves: { label: 'Accepté avec réserves', bg: 'rgba(249,115,22,0.15)', color: '#ea580c' },
  refuse:           { label: 'Refusé',               bg: 'rgba(232,84,71,0.15)',   color: '#E85447' },
}

export const RESERVE_STATUT: Record<ReserveStatut, { label: string; bg: string; color: string }> = {
  a_lever: { label: 'À lever', bg: 'rgba(249,115,22,0.15)', color: '#ea580c' },
  levee:   { label: 'Levée',   bg: 'rgba(74,222,128,0.15)', color: '#4ade80' },
}

async function generateNumero(): Promise<string> {
  const supabase = createClient()
  const year = new Date().getFullYear()
  const { count } = await supabase
    .from('livraisons')
    .select('*', { count: 'exact', head: true })
    .like('numero', `LIV-${year}-%`)
  return `LIV-${year}-${(count ?? 0) + 1}`
}

// ─── CRUD ────────────────────────────────────────────────────────────────────

export async function getLivraisons(chantierId?: string): Promise<LivraisonWithChantier[]> {
  const supabase = createClient()
  let query = supabase
    .from('livraisons')
    .select('*, chantiers(nom, client, adresse)')
    .order('date_reception', { ascending: false })
  if (chantierId) query = query.eq('chantier_id', chantierId)
  const { data, error } = await query
  if (error) throw error
  return (data ?? []) as LivraisonWithChantier[]
}

export async function getLivraison(id: string): Promise<LivraisonWithReserves> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('livraisons')
    .select('*, chantiers(nom, client, adresse), livraisons_reserves(*)')
    .eq('id', id)
    .single()
  if (error) throw new Error(error.message)
  const lv = data as LivraisonWithReserves
  lv.livraisons_reserves = (lv.livraisons_reserves ?? []).sort((a, b) => a.ordre - b.ordre)
  return lv
}

export async function createLivraison(
  input: Omit<Livraison, 'id' | 'user_id' | 'numero' | 'created_at' | 'updated_at'>,
  reserves: Omit<LivraisonReserve, 'id' | 'livraison_id' | 'created_at'>[]
): Promise<Livraison> {
  const supabase = createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) throw new Error('Non authentifié')

  const numero = await generateNumero()
  const { data: lv, error } = await supabase
    .from('livraisons')
    .insert({ ...input, numero, user_id: user.id })
    .select()
    .single()
  if (error) throw new Error(error.message)

  if (reserves.length > 0) {
    const { error: resError } = await supabase
      .from('livraisons_reserves')
      .insert(reserves.map((r, i) => ({ ...r, livraison_id: lv.id, ordre: r.ordre ?? i })))
    if (resError) throw new Error(resError.message)
  }
  return lv
}

export async function updateLivraison(
  id: string,
  input: Partial<Omit<Livraison, 'id' | 'user_id' | 'created_at' | 'updated_at'>>
): Promise<Livraison> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('livraisons')
    .update(input)
    .eq('id', id)
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data
}

export async function deleteLivraison(id: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from('livraisons').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

// ─── Réserves ────────────────────────────────────────────────────────────────

export async function createReserve(
  input: Omit<LivraisonReserve, 'id' | 'created_at'>
): Promise<LivraisonReserve> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('livraisons_reserves')
    .insert(input)
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data
}

export async function updateReserve(
  id: string,
  input: Partial<Omit<LivraisonReserve, 'id' | 'livraison_id' | 'created_at'>>
): Promise<LivraisonReserve> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('livraisons_reserves')
    .update(input)
    .eq('id', id)
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data
}

export async function deleteReserve(id: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from('livraisons_reserves').delete().eq('id', id)
  if (error) throw new Error(error.message)
}
