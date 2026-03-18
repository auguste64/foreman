import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateDevisPdfBuffer, generateFacturePdfBuffer } from '@/lib/pdf/documents'
import type { DevisDoc, DevisLigneDoc, FactureDoc, FactureLigneDoc, EntrepriseInfo } from '@/lib/supabase/documents'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const type = searchParams.get('type') // 'devis' | 'facture'
  const id = searchParams.get('id')

  if (!type || !id) {
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

  if (type === 'devis') {
    const [dr, lr] = await Promise.all([
      supabase.from('devis').select('*').eq('id', id).eq('user_id', user.id).single(),
      supabase.from('devis_lignes').select('*').eq('devis_id', id).order('ordre'),
    ])
    if (dr.error || !dr.data) return NextResponse.json({ error: 'Devis introuvable' }, { status: 404 })
    const buffer = await generateDevisPdfBuffer(dr.data as DevisDoc, (lr.data ?? []) as DevisLigneDoc[], entreprise)
    const filename = `${(dr.data as DevisDoc).numero}.pdf`
    return new NextResponse(buffer as unknown as BodyInit, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  }

  if (type === 'facture') {
    const [fr, lr] = await Promise.all([
      supabase.from('factures').select('*').eq('id', id).eq('user_id', user.id).single(),
      supabase.from('factures_lignes').select('*').eq('facture_id', id).order('ordre'),
    ])
    if (fr.error || !fr.data) return NextResponse.json({ error: 'Facture introuvable' }, { status: 404 })
    const buffer = await generateFacturePdfBuffer(fr.data as FactureDoc, (lr.data ?? []) as FactureLigneDoc[], entreprise)
    const filename = `${(fr.data as FactureDoc).numero}.pdf`
    return new NextResponse(buffer as unknown as BodyInit, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  }

  return NextResponse.json({ error: 'Type invalide' }, { status: 400 })
}
