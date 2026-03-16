import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: NextRequest) {
  const { artisanId, objet, message, date, heure, chantier_id } = await req.json()

  if (!artisanId || !objet || !date || !heure) {
    return NextResponse.json({ error: 'Paramètres manquants' }, { status: 400 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { data: artisan, error: artisanError } = await supabase
    .from('artisans')
    .select('*')
    .eq('id', artisanId)
    .single()

  if (artisanError || !artisan) {
    return NextResponse.json({ error: 'Artisan introuvable' }, { status: 404 })
  }

  let chantierHtml = ''
  if (chantier_id) {
    const { data: chantier } = await supabase
      .from('chantiers')
      .select('nom, adresse, client')
      .eq('id', chantier_id)
      .single()
    if (chantier) {
      chantierHtml = `
        <p style="margin: 0 0 8px;"><strong>Chantier :</strong> ${chantier.nom}</p>
        <p style="margin: 0 0 8px;"><strong>Adresse :</strong> ${chantier.adresse}</p>
      `
    }
  }

  const dateFormatted = new Date(date).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  const { error: sendError } = await resend.emails.send({
    from: 'Foreman <onboarding@resend.dev>',
    to: [artisan.email],
    subject: `Convocation — ${objet} — ${dateFormatted}`,
    html: `
      <div style="font-family: sans-serif; max-width: 520px; margin: 0 auto; color: #2D2D2B;">
        <div style="background: #0D0D0B; padding: 24px 32px; border-radius: 8px 8px 0 0;">
          <span style="font-size: 20px; font-weight: 800; letter-spacing: 3px; color: #E8C547;">FOREMAN</span>
        </div>
        <div style="background: #f9f8f5; padding: 32px; border: 1px solid #e8e4dd; border-top: none; border-radius: 0 0 8px 8px;">
          <h2 style="margin: 0 0 8px; font-size: 18px;">Convocation</h2>
          <p style="color: #8A8880; margin: 0 0 24px;">${objet}</p>
          <p style="margin: 0 0 8px;"><strong>À l'attention de :</strong> ${artisan.nom} (${artisan.metier})</p>
          ${chantierHtml}
          <p style="margin: 0 0 8px;"><strong>Date :</strong> ${dateFormatted}</p>
          <p style="margin: 0 0 24px;"><strong>Heure :</strong> ${heure}</p>
          ${message ? `<div style="background: #fff; border: 1px solid #e8e4dd; border-radius: 6px; padding: 16px; margin-top: 8px;"><p style="margin: 0; white-space: pre-line; font-size: 14px; line-height: 1.6;">${message}</p></div>` : ''}
        </div>
      </div>
    `,
  })

  if (sendError) {
    console.error('[send-convocation] Resend error:', sendError)
    return NextResponse.json({ error: sendError.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
