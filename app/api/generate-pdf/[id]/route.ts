import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generatePdfBuffer } from '@/lib/pdf/compte-rendu'
import type { PdfProfile } from '@/lib/pdf/compte-rendu'

export const runtime = 'nodejs'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { data: cr, error: crError } = await supabase
    .from('comptes_rendus')
    .select('*')
    .eq('id', id)
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

  // Récupérer le profil entreprise pour l'en-tête PDF
  let pdfProfile: PdfProfile | undefined

  const { data: ei } = await supabase
    .from('entreprise_infos')
    .select('raison_sociale, adresse, code_postal, ville, telephone, email, siret, logo_url')
    .eq('user_id', user.id)
    .maybeSingle()

  if (ei) {
    const adresse = [ei.adresse, ei.code_postal, ei.ville].filter(Boolean).join(', ')
    pdfProfile = {
      societe:   ei.raison_sociale || undefined,
      adresse:   adresse || undefined,
      telephone: ei.telephone || undefined,
      email:     ei.email || undefined,
      siret:     ei.siret || undefined,
      logo:      ei.logo_url || undefined,
    }
  } else {
    // Fallback table profiles
    const { data: prof } = await supabase
      .from('profiles')
      .select('entreprise, prenom, nom, adresse')
      .eq('id', user.id)
      .maybeSingle()

    if (prof) {
      pdfProfile = {
        societe: prof.entreprise || undefined,
        nom:     [prof.prenom, prof.nom].filter(Boolean).join(' ') || undefined,
        adresse: prof.adresse || undefined,
      }
    }
  }

  const buffer = await generatePdfBuffer(cr, chantier, pdfProfile)
  const filename = `compte-rendu-${chantier.nom.toLowerCase().replace(/\s+/g, '-')}-${cr.date_visite}.pdf`

  return new NextResponse(buffer as unknown as BodyInit, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
