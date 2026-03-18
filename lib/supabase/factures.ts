import { createClient } from './client'

export type LigneFacture = {
  id: string
  facture_id: string
  ordre: number
  description: string
  quantite: number
  unite: string
  prix_unitaire: number
}

export type Facture = {
  id: string
  user_id: string
  chantier_id: string
  devis_id: string | null
  numero: string
  titre: string
  client_nom: string | null
  statut: 'brouillon' | 'envoyee' | 'partiellement_payee' | 'payee' | 'annulee' | string
  total_ttc: number | string | null
  montant_paye: number | string | null
  date_emission: string
  date_echeance: string | null
  tva_pct: number
  notes: string
  created_at: string
}

export type NewFactureInput = {
  chantier_id: string
  devis_id?: string
  numero: string
  titre: string
  statut: string
  date_emission: string
  date_echeance: string
  tva_pct: number
  notes: string
  lignes: Omit<LigneFacture, 'id' | 'facture_id' | 'ordre'>[]
}

export async function getFacturesByChantier(chantierId: string): Promise<Facture[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('factures')
    .select('*')
    .eq('chantier_id', chantierId)
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return (data ?? []) as Facture[]
}

export async function getFacture(id: string): Promise<Facture & { lignes: LigneFacture[] }> {
  const supabase = createClient()
  const [factureRes, lignesRes] = await Promise.all([
    supabase.from('factures').select('*').eq('id', id).single(),
    supabase.from('factures_lignes').select('*').eq('facture_id', id).order('ordre'),
  ])
  if (factureRes.error) throw new Error(factureRes.error.message)
  return { ...(factureRes.data as Facture), lignes: (lignesRes.data ?? []) as LigneFacture[] }
}

export async function createFacture(input: NewFactureInput): Promise<string> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non authentifié')

  const { lignes, ...factureData } = input
  const { data, error } = await supabase
    .from('factures')
    .insert({ ...factureData, user_id: user.id })
    .select('id')
    .single()
  if (error) throw new Error(error.message)

  if (lignes.length > 0) {
    const rows = lignes.map((l, i) => ({ ...l, facture_id: data.id, ordre: i }))
    const { error: lignesError } = await supabase.from('factures_lignes').insert(rows)
    if (lignesError) throw new Error(lignesError.message)
  }

  return data.id
}

export async function updateFactureStatut(id: string, statut: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from('factures').update({ statut }).eq('id', id)
  if (error) throw new Error(error.message)
}

export async function deleteFacture(id: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from('factures').delete().eq('id', id)
  if (error) throw new Error(error.message)
}
