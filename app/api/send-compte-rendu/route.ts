import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createClient } from '@/lib/supabase/server'
import { generatePdfBuffer } from '@/lib/pdf/compte-rendu'

export const runtime = 'nodejs'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: NextRequest) {
  const { compteRenduId, emails } = await req.json()

  if (!compteRenduId || !emails?.length) {
    return NextResponse.json({ error: 'Paramètres manquants' }, { status: 400 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { data: cr, error: crError } = await supabase
    .from('comptes_rendus')
    .select('*')
    .eq('id', compteRenduId)
    .single()

  if (crError || !cr) {
    return NextResponse.json({ error: 'Compte rendu introuvable' }, { status: 404 })
  }

  const { data: chantier, error: chantierError } = await supabase
    .from('chantiers')
    .select('*')
    .eq('id', cr.chantier_id)
    .single()

  if (chantierError || !chantier) {
    return NextResponse.json({ error: 'Chantier introuvable' }, { status: 404 })
  }

  const buffer = await generatePdfBuffer(cr, chantier)
  const filename = `compte-rendu-${chantier.nom.toLowerCase().replace(/\s+/g, '-')}-${cr.date_visite}.pdf`

  const dateFormatted = new Date(cr.date_visite).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  const { error: sendError } = await resend.emails.send({
    from: 'The Builder <onboarding@resend.dev>',
    to: emails,
    subject: `Compte rendu — ${chantier.nom} — ${dateFormatted}`,
    html: `
      <div style="font-family: sans-serif; max-width: 520px; margin: 0 auto; color: #2D2D2B;">
        <div style="background: #0D0D0B; padding: 24px 32px; border-radius: 8px 8px 0 0;">
          <span style="font-size: 20px; font-weight: 800; letter-spacing: 3px; color: #ea580c;">THE BUILDER</span>
        </div>
        <div style="background: #f9f8f5; padding: 32px; border: 1px solid #e8e4dd; border-top: none; border-radius: 0 0 8px 8px;">
          <h2 style="margin: 0 0 8px; font-size: 18px;">Compte rendu de visite</h2>
          <p style="color: #8A8880; margin: 0 0 24px;">${chantier.nom} · ${dateFormatted}</p>
          <p style="margin: 0 0 8px;"><strong>Client :</strong> ${chantier.client}</p>
          <p style="margin: 0 0 8px;"><strong>Adresse :</strong> ${chantier.adresse}</p>
          <p style="margin: 0 0 24px;"><strong>Avancement :</strong> ${cr.progression}%</p>
          <p style="color: #8A8880; font-size: 13px;">Le compte rendu complet est disponible en pièce jointe.</p>
        </div>
      </div>
    `,
    attachments: [
      {
        filename,
        content: buffer,
      },
    ],
  })

  if (sendError) {
    console.error('[send-compte-rendu] Resend error:', sendError)
    return NextResponse.json({ error: sendError.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
