import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateContratPdfBuffer } from '@/lib/pdf/contrat-moe'
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

  const { data: contrat, error } = await supabase
    .from('contrats')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !contrat) {
    return NextResponse.json({ error: 'Contrat introuvable' }, { status: 404 })
  }

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
  }

  const buffer = await generateContratPdfBuffer(contrat, pdfProfile)
  const filename = `contrat-moe-${contrat.nom_client.toLowerCase().replace(/\s+/g, '-')}-${contrat.date_contrat || 'draft'}.pdf`

  return new NextResponse(buffer as unknown as BodyInit, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
