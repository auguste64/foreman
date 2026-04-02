import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

export const runtime = 'nodejs'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  try {
    const { pdf_url } = await req.json() as { pdf_url: string }
    if (!pdf_url) {
      return NextResponse.json({ error: 'pdf_url manquante' }, { status: 400 })
    }

    // Fetch the PDF and convert to base64
    const pdfRes = await fetch(pdf_url)
    if (!pdfRes.ok) {
      return NextResponse.json({ error: 'Impossible de télécharger le PDF' }, { status: 400 })
    }
    const arrayBuffer = await pdfRes.arrayBuffer()
    const base64 = Buffer.from(arrayBuffer).toString('base64')

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'document',
              source: {
                type: 'base64',
                media_type: 'application/pdf',
                data: base64,
              },
            },
            {
              type: 'text',
              text: `Tu es un assistant spécialisé en lecture de devis artisans dans le BTP français.

Analyse ce devis et extrais les informations suivantes au format JSON strict (sans markdown, sans explication) :

{
  "numero": "numéro du devis ou null",
  "montant_ht": nombre ou null,
  "montant_ttc": nombre ou null,
  "tva": pourcentage TVA (ex: 10, 20) ou null,
  "lot": "lot concerné (ex: Gros œuvre, Électricité, Plomberie, Menuiserie, Peinture...) ou null",
  "description": "courte description des travaux (1-2 phrases max) ou null",
  "date_reception": "date au format YYYY-MM-DD ou null"
}

Réponds uniquement avec le JSON, sans texte avant ni après.`,
            },
          ],
        },
      ],
    })

    const raw = message.content[0].type === 'text' ? message.content[0].text.trim() : ''

    let extracted: Record<string, unknown> = {}
    try {
      // Strip markdown code blocks if present
      const cleaned = raw.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim()
      extracted = JSON.parse(cleaned)
    } catch {
      return NextResponse.json({ error: 'Réponse IA non parseable', raw }, { status: 500 })
    }

    return NextResponse.json(extracted)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur interne'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
