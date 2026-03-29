import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

type NotifInsert = {
  user_id: string
  type: string
  titre: string
  message: string
  lien: string | null
}

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const userId = user.id

  // Fetch existing unread notifications for dedup (type + lien)
  const { data: existing } = await supabase
    .from('notifications')
    .select('type, lien')
    .eq('user_id', userId)
    .eq('lu', false)

  const existingKeys = new Set(
    (existing ?? []).map(n => `${n.type}::${n.lien ?? ''}`)
  )

  const toInsert: NotifInsert[] = []

  function isDupe(type: string, lien: string | null) {
    return existingKeys.has(`${type}::${lien ?? ''}`)
  }

  // ── 1. Devis envoyé depuis >7 jours sans réponse ──────────────────────
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    .toISOString().split('T')[0]

  const { data: devisEnvoyes } = await supabase
    .from('devis')
    .select('id, numero, client_nom, date_emission')
    .eq('user_id', userId)
    .eq('statut', 'envoye')
    .lte('date_emission', sevenDaysAgo)

  for (const d of devisEnvoyes ?? []) {
    const lien = `/dashboard/documents?tab=devis`
    if (!isDupe('relance_devis', lien + `&id=${d.id}`)) {
      const jours = Math.floor(
        (Date.now() - new Date(d.date_emission).getTime()) / 86400000
      )
      toInsert.push({
        user_id: userId,
        type: 'relance_devis',
        titre: `Relancer ${d.client_nom} — Devis ${d.numero}`,
        message: `Le devis ${d.numero} envoyé à ${d.client_nom} est sans réponse depuis ${jours} jours.`,
        lien: `/dashboard/documents?tab=devis&id=${d.id}`,
      })
    }
  }

  // ── 2. Factures impayées depuis >30 jours ─────────────────────────────
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    .toISOString().split('T')[0]

  const { data: facturesImpayes } = await supabase
    .from('factures')
    .select('id, numero, client_nom, date_emission')
    .eq('user_id', userId)
    .in('statut', ['envoyee', 'partiellement_payee'])
    .lte('date_emission', thirtyDaysAgo)

  for (const f of facturesImpayes ?? []) {
    const lien = `/dashboard/documents?tab=factures&id=${f.id}`
    if (!isDupe('relance_facture', lien)) {
      const jours = Math.floor(
        (Date.now() - new Date(f.date_emission).getTime()) / 86400000
      )
      toInsert.push({
        user_id: userId,
        type: 'relance_facture',
        titre: `Facture ${f.numero} impayée`,
        message: `La facture ${f.numero}${f.client_nom ? ` (${f.client_nom})` : ''} est impayée depuis ${jours} jours.`,
        lien,
      })
    }
  }

  // ── 3. Réunions planifiées demain ─────────────────────────────────────
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const tomorrowDate = tomorrow.toISOString().split('T')[0]

  const { data: reunions } = await supabase
    .from('evenements')
    .select('id, titre, date_debut, chantiers(nom)')
    .eq('user_id', userId)
    .eq('type', 'reunion')
    .gte('date_debut', `${tomorrowDate}T00:00:00`)
    .lte('date_debut', `${tomorrowDate}T23:59:59`)

  for (const ev of reunions ?? []) {
    const lien = `/dashboard/planning`
    const chantierNom = (ev.chantiers as { nom?: string } | null)?.nom ?? null
    const key = `rappel_reunion::${lien}::${ev.id}`
    if (!existingKeys.has(key)) {
      const heure = new Date(ev.date_debut).toLocaleTimeString('fr-FR', {
        hour: '2-digit', minute: '2-digit',
      })
      toInsert.push({
        user_id: userId,
        type: 'rappel_reunion',
        titre: `Réunion demain : ${ev.titre}`,
        message: `Réunion "${ev.titre}" demain à ${heure}${chantierNom ? ` — chantier ${chantierNom}` : ''}.`,
        lien,
      })
    }
  }

  if (toInsert.length > 0) {
    await supabase.from('notifications').insert(toInsert)
  }

  return NextResponse.json({ generated: toInsert.length })
}
