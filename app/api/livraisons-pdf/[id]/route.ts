import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateLivraisonPdfBuffer } from '@/lib/pdf/livraison'
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

  const { data: lv, error: lvError } = await supabase
    .from('livraisons')
    .select('*, chantiers(nom, client, adresse), livraisons_reserves(*)')
    .eq('id', id)
    .single()

  if (lvError || !lv) {
    return NextResponse.json({ error: 'Livraison introuvable' }, { status: 404 })
  }

  // Sort reserves by ordre
  lv.livraisons_reserves = (lv.livraisons_reserves ?? []).sort(
    (a: { ordre: number }, b: { ordre: number }) => a.ordre - b.ordre
  )

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
      ville:     ei.ville || undefined,
      telephone: ei.telephone || undefined,
      email:     ei.email || undefined,
      siret:     ei.siret || undefined,
      logo:      ei.logo_url || undefined,
    }
  } else {
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

  const buffer = await generateLivraisonPdfBuffer(lv, pdfProfile)
  const safeNom = lv.chantiers.nom.toLowerCase().replace(/\s+/g, '-')
  const filename = `pv-reception-${safeNom}-${lv.date_reception}.pdf`

  return new NextResponse(buffer as unknown as BodyInit, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
