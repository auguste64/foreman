import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'
import * as pdfParseModule from 'pdf-parse'
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const pdfParse: (buffer: Buffer) => Promise<{ text: string }> = (pdfParseModule as any).default ?? pdfParseModule

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const chantier_id = formData.get('chantier_id') as string | null
    const type = formData.get('type') as 'devis' | 'facture' | null

    if (!file) {
      return NextResponse.json({ error: 'Fichier manquant' }, { status: 400 })
    }
    if (!type || !['devis', 'facture'].includes(type)) {
      return NextResponse.json({ error: 'Type invalide (devis | facture)' }, { status: 400 })
    }

    // Upload PDF to Supabase Storage
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`
    const storagePath = chantier_id ? `${chantier_id}/${fileName}` : `misc/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('documents')
      .upload(storagePath, buffer, { contentType: 'application/pdf', upsert: false })

    if (uploadError) {
      return NextResponse.json({ error: `Erreur upload: ${uploadError.message}` }, { status: 500 })
    }

    const { data: publicUrlData } = supabase.storage.from('documents').getPublicUrl(storagePath)
    const fichier_url = publicUrlData.publicUrl

    // Extract text from PDF
    let pdfText = ''
    try {
      const parsed = await pdfParse(buffer)
      pdfText = parsed.text
    } catch {
      pdfText = ''
    }

    // Send to Claude for extraction
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: `Tu es un assistant qui analyse des devis et factures de construction. Extrais les informations suivantes en JSON strict sans markdown :
{ montant_ht: number, montant_ttc: number, tva_taux: number, description: string, artisan_nom: string, lot: string, date: string }
Si une valeur est absente, mets null. montant_ht et montant_ttc sont des nombres sans symbole.`,
      messages: [
        {
          role: 'user',
          content: `Voici le contenu textuel d'un ${type} de construction. Extrais les informations demandées :\n\n${pdfText.slice(0, 8000)}`,
        },
      ],
    })

    let extracted: Record<string, unknown> = {}
    const content = message.content[0]
    if (content.type === 'text') {
      try {
        // Strip potential markdown code fences
        const raw = content.text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
        extracted = JSON.parse(raw)
      } catch {
        extracted = {}
      }
    }

    return NextResponse.json({ ...extracted, fichier_url })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
