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

type Reserve = {
  id: string
  lot: string
  description: string
  statut: 'ouverte' | 'levee'
}

type ObservationsData = {
  reserves?: Reserve[]
  [key: string]: unknown
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
    const lien = `/dashboard/documents?tab=devis&id=${d.id}`
    if (!isDupe('relance_devis', lien)) {
      const jours = Math.floor(
        (Date.now() - new Date(d.date_emission).getTime()) / 86400000
      )
      toInsert.push({
        user_id: userId,
        type: 'relance_devis',
        titre: `Relancer ${d.client_nom} — Devis ${d.numero}`,
        message: `Le devis ${d.numero} envoyé à ${d.client_nom} est sans réponse depuis ${jours} jours.`,
        lien,
      })
    }
  }

  // ── 2. Factures impayées depuis >15 jours ─────────────────────────────
  const fifteenDaysAgo = new Date(Date.now() - 15 * 24 * 60 * 60 * 1000)
    .toISOString().split('T')[0]

  const { data: facturesImpayes } = await supabase
    .from('factures')
    .select('id, numero, client_nom, date_emission')
    .eq('user_id', userId)
    .in('statut', ['envoyee', 'partiellement_payee'])
    .lte('date_emission', fifteenDaysAgo)

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

  // ── 3. RDV dans les 24h à venir (tous types d'événements) ────────────
  const now = new Date()
  const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000)

  const { data: rdvProches } = await supabase
    .from('evenements')
    .select('id, titre, type, date_debut, chantiers(nom)')
    .eq('user_id', userId)
    .gte('date_debut', now.toISOString())
    .lte('date_debut', in24h.toISOString())

  for (const ev of rdvProches ?? []) {
    const lien = `/dashboard/planning`
    const dedupKey = `rappel_rdv::${lien}::${ev.id}`
    if (!existingKeys.has(dedupKey)) {
      const chantierNom = (ev.chantiers as { nom?: string } | null)?.nom ?? null
      const heure = new Date(ev.date_debut).toLocaleTimeString('fr-FR', {
        hour: '2-digit', minute: '2-digit',
      })
      toInsert.push({
        user_id: userId,
        type: 'rappel_rdv',
        titre: `RDV dans moins de 24h : ${ev.titre}`,
        message: `"${ev.titre}" prévu aujourd'hui à ${heure}${chantierNom ? ` — ${chantierNom}` : ''}.`,
        lien,
      })
    }
  }

  // ── 4. Réunions planifiées demain (relance spécifique réunion) ─────────
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
    const dedupKey = `rappel_reunion::${lien}::${ev.id}`
    if (!existingKeys.has(dedupKey)) {
      const chantierNom = (ev.chantiers as { nom?: string } | null)?.nom ?? null
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

  // ── 5. Réserves non levées depuis >14 jours ───────────────────────────
  const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)
    .toISOString().split('T')[0]

  const { data: compteRendus } = await supabase
    .from('comptes_rendus')
    .select('id, date_visite, observations, chantier_id, chantiers(nom)')
    .eq('user_id', userId)
    .lte('date_visite', fourteenDaysAgo)
    .not('observations', 'is', null)

  for (const cr of compteRendus ?? []) {
    let obs: ObservationsData | null = null
    try {
      obs = typeof cr.observations === 'string'
        ? JSON.parse(cr.observations) as ObservationsData
        : cr.observations as ObservationsData
    } catch { continue }

    const reservesOuvertes = (obs?.reserves ?? []).filter(r => r.statut === 'ouverte')
    if (reservesOuvertes.length === 0) continue

    const lien = `/dashboard/comptes-rendus/${cr.id}`
    if (!isDupe('relance_reserve', lien)) {
      const chantierNom = (cr.chantiers as { nom?: string } | null)?.nom ?? 'chantier inconnu'
      const jours = Math.floor(
        (Date.now() - new Date(cr.date_visite).getTime()) / 86400000
      )
      toInsert.push({
        user_id: userId,
        type: 'relance_reserve',
        titre: `${reservesOuvertes.length} réserve${reservesOuvertes.length > 1 ? 's' : ''} non levée${reservesOuvertes.length > 1 ? 's' : ''} — ${chantierNom}`,
        message: `${reservesOuvertes.length} réserve${reservesOuvertes.length > 1 ? 's' : ''} ouverte${reservesOuvertes.length > 1 ? 's' : ''} depuis ${jours} jours sur le chantier ${chantierNom}.`,
        lien,
      })
    }
  }

  if (toInsert.length > 0) {
    await supabase.from('notifications').insert(toInsert)
  }

  return NextResponse.json({ generated: toInsert.length })
}
