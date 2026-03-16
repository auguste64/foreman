import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generatePdfBuffer } from '@/lib/pdf/compte-rendu'

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

  const buffer = await generatePdfBuffer(cr, chantier)
  const filename = `compte-rendu-${chantier.nom.toLowerCase().replace(/\s+/g, '-')}-${cr.date_visite}.pdf`

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
