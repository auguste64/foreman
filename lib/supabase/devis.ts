import { createClient } from './client'

export type LigneDevis = {
  id: string
  devis_id: string
  ordre: number
  description: string
  quantite: number
  unite: string
  prix_unitaire: number
}

export type Devis = {
  id: string
  user_id: string
  chantier_id: string
  numero: string
  titre: string
  client_nom: string
  statut: 'brouillon' | 'envoye' | 'accepte' | 'refuse'
  date_emission: string
  date_validite: string | null
  tva_pct: number
  notes: string
  created_at: string
}

export type NewDevisInput = {
  chantier_id: string
  numero: string
  titre: string
  client_nom: string
  statut: string
  date_emission: string
  date_validite: string
  tva_pct: number
  notes: string
  lignes: Omit<LigneDevis, 'id' | 'devis_id' | 'ordre'>[]
}

export type UpdateDevisInput = Omit<NewDevisInput, 'chantier_id'>

export async function getDevisByChantier(chantierId: string): Promise<Devis[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('devis')
    .select('*')
    .eq('chantier_id', chantierId)
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return (data ?? []) as Devis[]
}

export async function getDevis(id: string): Promise<Devis & { lignes: LigneDevis[] }> {
  const supabase = createClient()
  const [devisRes, lignesRes] = await Promise.all([
    supabase.from('devis').select('*').eq('id', id).single(),
    supabase.from('devis_lignes').select('*').eq('devis_id', id).order('ordre'),
  ])
  if (devisRes.error) throw new Error(devisRes.error.message)
  return { ...(devisRes.data as Devis), lignes: (lignesRes.data ?? []) as LigneDevis[] }
}

export async function createDevis(input: NewDevisInput): Promise<string> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non authentifié')

  const { lignes, ...devisData } = input
  const { data, error } = await supabase
    .from('devis')
    .insert({ ...devisData, user_id: user.id })
    .select('id')
    .single()
  if (error) throw new Error(error.message)

  if (lignes.length > 0) {
    const rows = lignes.map((l, i) => ({ ...l, devis_id: data.id, ordre: i }))
    const { error: lignesError } = await supabase.from('devis_lignes').insert(rows)
    if (lignesError) throw new Error(lignesError.message)
  }

  return data.id
}

export async function updateDevis(id: string, input: UpdateDevisInput): Promise<void> {
  const supabase = createClient()
  const { lignes, ...devisData } = input
  const { error } = await supabase.from('devis').update(devisData).eq('id', id)
  if (error) throw new Error(error.message)
  const { error: delErr } = await supabase.from('devis_lignes').delete().eq('devis_id', id)
  if (delErr) throw new Error(delErr.message)
  if (lignes.length > 0) {
    const rows = lignes.map((l, i) => ({ ...l, devis_id: id, ordre: i }))
    const { error: insErr } = await supabase.from('devis_lignes').insert(rows)
    if (insErr) throw new Error(insErr.message)
  }
}

export async function updateDevisStatut(id: string, statut: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from('devis').update({ statut }).eq('id', id)
  if (error) throw new Error(error.message)
}

export async function deleteDevis(id: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from('devis').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

export function calcTotaux(lignes: Pick<LigneDevis, 'quantite' | 'prix_unitaire'>[], tvaPct: number) {
  const ht = lignes.reduce((sum, l) => sum + (Number(l.quantite) || 0) * (Number(l.prix_unitaire) || 0), 0)
  const tva = ht * (Number(tvaPct) || 0) / 100
  return { ht, tva, ttc: ht + tva }
}

export function formatEur(n: number) {
  return n.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })
}
