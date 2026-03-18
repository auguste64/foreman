import { createClient } from './client'

// ── Types ─────────────────────────────────────────────────────────────

export type EntrepriseInfo = {
  user_id: string
  raison_sociale: string
  forme_juridique: string
  siret: string
  tva_intracommunautaire: string
  capital: string
  rcs: string
  adresse: string
  code_postal: string
  ville: string
  pays: string
  telephone: string
  email: string
  site_web: string
  iban: string
  bic: string
  banque: string
  logo_url: string
  mention_legale: string
  conditions_paiement: string
  penalites_retard: string
  escompte: string
}

export type DevisDoc = {
  id: string
  user_id: string
  chantier_id: string | null
  numero: string
  statut: 'brouillon' | 'envoye' | 'accepte' | 'refuse' | 'expire'
  client_nom: string
  client_email: string
  client_adresse: string
  objet: string
  date_emission: string
  date_validite: string
  tva_taux: number
  remise_pct: number
  notes: string
  conditions: string
  total_ht: number
  total_tva: number
  total_ttc: number
  envoye_at: string | null
  accepte_at: string | null
  created_at: string
}

export type DevisLigneDoc = {
  id: string
  devis_id: string
  ordre: number
  libelle: string
  quantite: number
  unite: string
  prix_unitaire: number
  tva_taux: number
  total_ht: number
}

export type FactureDoc = {
  id: string
  user_id: string
  devis_id: string | null
  chantier_id: string | null
  numero: string
  statut: 'brouillon' | 'envoyee' | 'partiellement_payee' | 'payee' | 'annulee'
  client_nom: string
  client_email: string
  client_adresse: string
  objet: string
  date_emission: string
  date_echeance: string
  tva_taux: number
  remise_pct: number
  notes: string
  conditions: string
  total_ht: number
  total_tva: number
  total_ttc: number
  montant_paye: number
  date_paiement: string | null
  mode_paiement: string | null
  envoye_at: string | null
  created_at: string
}

export type FactureLigneDoc = {
  id: string
  facture_id: string
  ordre: number
  libelle: string
  quantite: number
  unite: string
  prix_unitaire: number
  tva_taux: number
  total_ht: number
}

export type AvoirDoc = {
  id: string
  user_id: string
  facture_id: string
  numero: string
  statut: 'brouillon' | 'emis' | 'annule'
  motif: string
  date_emission: string
  total_ht: number
  total_tva: number
  total_ttc: number
  created_at: string
}

export type AvoirLigneDoc = {
  id: string
  avoir_id: string
  ordre: number
  libelle: string
  quantite: number
  unite: string
  prix_unitaire: number
  total_ht: number
}

// ── Helpers ───────────────────────────────────────────────────────────

export function calcTotauxDoc(
  lignes: { quantite: number; prix_unitaire: number }[],
  tvaTaux: number,
  remisePct: number
) {
  const sousTotal = lignes.reduce((s, l) => s + l.quantite * l.prix_unitaire, 0)
  const ht = sousTotal * (1 - remisePct / 100)
  const tva = ht * tvaTaux / 100
  return { sousTotal, ht, tva, ttc: ht + tva }
}

export function formatEurDoc(n: number) {
  return n.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })
}

export function fmtDate(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

// ── Entreprise infos ──────────────────────────────────────────────────

export async function getEntrepriseInfo(): Promise<EntrepriseInfo | null> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase
    .from('entreprise_infos')
    .select('*')
    .eq('user_id', user.id)
    .single()
  return data as EntrepriseInfo | null
}

export async function upsertEntrepriseInfo(info: Partial<EntrepriseInfo>): Promise<void> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non authentifié')
  const { error } = await supabase
    .from('entreprise_infos')
    .upsert({ ...info, user_id: user.id }, { onConflict: 'user_id' })
  if (error) throw new Error(error.message)
}

// ── Devis ─────────────────────────────────────────────────────────────

export async function getAllDevis(): Promise<DevisDoc[]> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []
  const { data } = await supabase
    .from('devis')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
  return (data ?? []) as DevisDoc[]
}

export async function getDevisDoc(id: string): Promise<DevisDoc & { lignes: DevisLigneDoc[] }> {
  const supabase = createClient()
  const [dr, lr] = await Promise.all([
    supabase.from('devis').select('*').eq('id', id).single(),
    supabase.from('devis_lignes').select('*').eq('devis_id', id).order('ordre'),
  ])
  if (dr.error) throw new Error(dr.error.message)
  return { ...(dr.data as DevisDoc), lignes: (lr.data ?? []) as DevisLigneDoc[] }
}

export async function createDevisDoc(
  input: Omit<DevisDoc, 'id' | 'user_id' | 'created_at'> & {
    lignes: Omit<DevisLigneDoc, 'id' | 'devis_id' | 'ordre' | 'total_ht'>[]
  }
): Promise<string> {
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
    const { error: le } = await supabase.from('devis_lignes').insert(rows)
    if (le) throw new Error(le.message)
  }
  return data.id
}

export async function updateDevisDoc(
  id: string,
  input: Partial<Omit<DevisDoc, 'id' | 'user_id' | 'created_at'>> & {
    lignes?: Omit<DevisLigneDoc, 'id' | 'devis_id' | 'ordre' | 'total_ht'>[]
  }
): Promise<void> {
  const supabase = createClient()
  const { lignes, ...devisData } = input
  if (Object.keys(devisData).length > 0) {
    const { error } = await supabase.from('devis').update(devisData).eq('id', id)
    if (error) throw new Error(error.message)
  }
  if (lignes !== undefined) {
    await supabase.from('devis_lignes').delete().eq('devis_id', id)
    if (lignes.length > 0) {
      const rows = lignes.map((l, i) => ({ ...l, devis_id: id, ordre: i }))
      const { error: le } = await supabase.from('devis_lignes').insert(rows)
      if (le) throw new Error(le.message)
    }
  }
}

// ── Factures ──────────────────────────────────────────────────────────

export async function getAllFactures(): Promise<FactureDoc[]> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []
  const { data } = await supabase
    .from('factures')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
  return (data ?? []) as FactureDoc[]
}

export async function getFactureDoc(id: string): Promise<FactureDoc & { lignes: FactureLigneDoc[] }> {
  const supabase = createClient()
  const [fr, lr] = await Promise.all([
    supabase.from('factures').select('*').eq('id', id).single(),
    supabase.from('factures_lignes').select('*').eq('facture_id', id).order('ordre'),
  ])
  if (fr.error) throw new Error(fr.error.message)
  return { ...(fr.data as FactureDoc), lignes: (lr.data ?? []) as FactureLigneDoc[] }
}

export async function createFactureDoc(
  input: Omit<FactureDoc, 'id' | 'user_id' | 'created_at'> & {
    lignes: Omit<FactureLigneDoc, 'id' | 'facture_id' | 'ordre' | 'total_ht'>[]
  }
): Promise<string> {
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
    const { error: le } = await supabase.from('factures_lignes').insert(rows)
    if (le) throw new Error(le.message)
  }
  return data.id
}

export async function updateFactureDoc(
  id: string,
  input: Partial<Omit<FactureDoc, 'id' | 'user_id' | 'created_at'>> & {
    lignes?: Omit<FactureLigneDoc, 'id' | 'facture_id' | 'ordre' | 'total_ht'>[]
  }
): Promise<void> {
  const supabase = createClient()
  const { lignes, ...factureData } = input
  if (Object.keys(factureData).length > 0) {
    const { error } = await supabase.from('factures').update(factureData).eq('id', id)
    if (error) throw new Error(error.message)
  }
  if (lignes !== undefined) {
    await supabase.from('factures_lignes').delete().eq('facture_id', id)
    if (lignes.length > 0) {
      const rows = lignes.map((l, i) => ({ ...l, facture_id: id, ordre: i }))
      const { error: le } = await supabase.from('factures_lignes').insert(rows)
      if (le) throw new Error(le.message)
    }
  }
}

// ── Avoirs ────────────────────────────────────────────────────────────

export async function getAllAvoirs(): Promise<AvoirDoc[]> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []
  const { data } = await supabase
    .from('avoirs')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
  return (data ?? []) as AvoirDoc[]
}

export async function getAvoirDoc(id: string): Promise<AvoirDoc & { lignes: AvoirLigneDoc[] }> {
  const supabase = createClient()
  const [ar, lr] = await Promise.all([
    supabase.from('avoirs').select('*').eq('id', id).single(),
    supabase.from('avoirs_lignes').select('*').eq('avoir_id', id).order('ordre'),
  ])
  if (ar.error) throw new Error(ar.error.message)
  return { ...(ar.data as AvoirDoc), lignes: (lr.data ?? []) as AvoirLigneDoc[] }
}

export async function createAvoirDoc(
  input: Omit<AvoirDoc, 'id' | 'user_id' | 'created_at'> & {
    lignes: Omit<AvoirLigneDoc, 'id' | 'avoir_id' | 'ordre' | 'total_ht'>[]
  }
): Promise<string> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non authentifié')
  const { lignes, ...avoirData } = input
  const { data, error } = await supabase
    .from('avoirs')
    .insert({ ...avoirData, user_id: user.id })
    .select('id')
    .single()
  if (error) throw new Error(error.message)
  if (lignes.length > 0) {
    const rows = lignes.map((l, i) => ({ ...l, avoir_id: data.id, ordre: i }))
    const { error: le } = await supabase.from('avoirs_lignes').insert(rows)
    if (le) throw new Error(le.message)
  }
  return data.id
}
