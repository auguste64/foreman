import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { renderToBuffer } from '@react-pdf/renderer'
import { createClient } from '@/lib/supabase/server'
import { CgvDocument } from '@/lib/pdf/cgv'
import type { CgvProfile } from '@/lib/pdf/cgv'
import React from 'react'

export const runtime = 'nodejs'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { to } = await req.json()
  if (!to) return NextResponse.json({ error: 'Destinataire manquant' }, { status: 400 })

  const { data: profileData } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profileData) return NextResponse.json({ error: 'Profil introuvable' }, { status: 404 })

  const profile: CgvProfile = {
    societe: profileData.societe || profileData.entreprise || 'Le Prestataire',
    prenom: profileData.prenom,
    nom: profileData.nom,
    adresse: profileData.adresse,
    ville: profileData.ville,
    code_postal: profileData.code_postal,
    telephone: profileData.telephone,
    email: profileData.email || user.email,
    siret: profileData.siret,
    code_ape: profileData.code_ape,
    tva_intracom: profileData.tva_intracom,
    assurance_nom: profileData.assurance_nom,
    assurance_contrat: profileData.assurance_contrat,
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const buffer = await renderToBuffer(React.createElement(CgvDocument, { profile }) as any)
  const societe = profile.societe

  const { error: sendError } = await resend.emails.send({
    from: `${societe} <onboarding@resend.dev>`,
    to: Array.isArray(to) ? to : [to],
    subject: `Conditions Générales de Prestation — ${societe}`,
    html: `
      <div style="font-family: sans-serif; max-width: 520px; margin: 0 auto; color: #2D2D2B;">
        <div style="background: #0D0D0B; padding: 24px 32px; border-radius: 8px 8px 0 0;">
          <span style="font-size: 20px; font-weight: 800; letter-spacing: 3px; color: #ea580c;">THE BUILDER</span>
        </div>
        <div style="background: #f9f8f5; padding: 32px; border: 1px solid #e8e4dd; border-top: none; border-radius: 0 0 8px 8px;">
          <p style="margin: 0 0 16px;">Veuillez trouver en pièce jointe les Conditions Générales de Prestation de service de <strong>${societe}</strong>.</p>
          <p style="color: #8A8880; font-size: 13px; margin: 0;">Le document est disponible en pièce jointe au format PDF.</p>
        </div>
      </div>
    `,
    attachments: [{ filename: `CGV_${societe.replace(/\s+/g, '_')}.pdf`, content: buffer }],
  })

  if (sendError) {
    return NextResponse.json({ error: sendError.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
