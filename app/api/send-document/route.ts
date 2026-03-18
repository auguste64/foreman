import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createClient } from '@/lib/supabase/server'
import { generateDevisPdfBuffer, generateFacturePdfBuffer } from '@/lib/pdf/documents'
import type { DevisDoc, DevisLigneDoc, FactureDoc, FactureLigneDoc, EntrepriseInfo } from '@/lib/supabase/documents'

export const runtime = 'nodejs'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: NextRequest) {
  const { type, id, to, subject, body } = await req.json()

  if (!type || !id || !to || !subject) {
    return NextResponse.json({ error: 'Paramètres manquants' }, { status: 400 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { data: entrepriseData } = await supabase
    .from('entreprise_infos')
    .select('*')
    .eq('user_id', user.id)
    .single()
  const entreprise = entrepriseData as EntrepriseInfo | null

  let buffer: Buffer
  let filename: string
  let docLabel: string

  if (type === 'devis') {
    const [dr, lr] = await Promise.all([
      supabase.from('devis').select('*').eq('id', id).eq('user_id', user.id).single(),
      supabase.from('devis_lignes').select('*').eq('devis_id', id).order('ordre'),
    ])
    if (dr.error || !dr.data) return NextResponse.json({ error: 'Devis introuvable' }, { status: 404 })
    const doc = dr.data as DevisDoc
    buffer = await generateDevisPdfBuffer(doc, (lr.data ?? []) as DevisLigneDoc[], entreprise)
    filename = `${doc.numero}.pdf`
    docLabel = doc.numero
    await supabase.from('devis').update({ envoye_at: new Date().toISOString() }).eq('id', id)
    if (doc.statut === 'brouillon') {
      await supabase.from('devis').update({ statut: 'envoye' }).eq('id', id)
    }
  } else if (type === 'facture') {
    const [fr, lr] = await Promise.all([
      supabase.from('factures').select('*').eq('id', id).eq('user_id', user.id).single(),
      supabase.from('factures_lignes').select('*').eq('facture_id', id).order('ordre'),
    ])
    if (fr.error || !fr.data) return NextResponse.json({ error: 'Facture introuvable' }, { status: 404 })
    const doc = fr.data as FactureDoc
    buffer = await generateFacturePdfBuffer(doc, (lr.data ?? []) as FactureLigneDoc[], entreprise)
    filename = `${doc.numero}.pdf`
    docLabel = doc.numero
    await supabase.from('factures').update({ envoye_at: new Date().toISOString() }).eq('id', id)
    if (doc.statut === 'brouillon') {
      await supabase.from('factures').update({ statut: 'envoyee' }).eq('id', id)
    }
  } else {
    return NextResponse.json({ error: 'Type invalide' }, { status: 400 })
  }

  const senderName = entreprise?.raison_sociale || 'Foreman'

  const { error: sendError } = await resend.emails.send({
    from: `${senderName} <onboarding@resend.dev>`,
    to: Array.isArray(to) ? to : [to],
    subject,
    html: `
      <div style="font-family: sans-serif; max-width: 520px; margin: 0 auto; color: #2D2D2B;">
        <div style="background: #0D0D0B; padding: 24px 32px; border-radius: 8px 8px 0 0;">
          <span style="font-size: 20px; font-weight: 800; letter-spacing: 3px; color: #ea580c;">FOREMAN</span>
        </div>
        <div style="background: #f9f8f5; padding: 32px; border: 1px solid #e8e4dd; border-top: none; border-radius: 0 0 8px 8px;">
          <p style="margin: 0 0 16px; white-space: pre-wrap;">${body || `Veuillez trouver en pièce jointe le document ${docLabel}.`}</p>
          <p style="color: #8A8880; font-size: 13px; margin: 0;">Le document est disponible en pièce jointe.</p>
        </div>
      </div>
    `,
    attachments: [{ filename, content: buffer }],
  })

  if (sendError) {
    console.error('[send-document] Resend error:', sendError)
    return NextResponse.json({ error: sendError.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
