import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import type { GoogleContact } from '../google/route'

type ImportBody = {
  contacts: GoogleContact[]
  type: 'client' | 'artisan'
}

export async function POST(req: NextRequest) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new NextResponse('Non authentifié', { status: 401 })

  const body: ImportBody = await req.json()
  const { contacts, type } = body

  if (!contacts?.length || !['client', 'artisan'].includes(type)) {
    return new NextResponse('Paramètres invalides', { status: 400 })
  }

  let created = 0

  if (type === 'artisan') {
    const rows = contacts.map(c => ({
      user_id: user.id,
      nom: c.nom,
      email: c.email || '',
      telephone: c.telephone || '',
      metier: c.entreprise || '',
    }))
    const { data } = await supabase.from('artisans').insert(rows).select('id')
    created = data?.length ?? 0
  } else {
    const rows = contacts.map(c => {
      const hasOrg = !!c.entreprise
      const parts = c.nom.split(' ')
      return {
        user_id: user.id,
        type: hasOrg ? 'entreprise' : 'particulier',
        prenom: hasOrg ? null : (parts[0] ?? null),
        nom: hasOrg ? null : (parts.slice(1).join(' ') || parts[0] || null),
        entreprise_nom: hasOrg ? c.entreprise : null,
        contact_nom: hasOrg ? c.nom : null,
        email: c.email || null,
        telephone: c.telephone || null,
      }
    })
    const { data } = await supabase.from('clients').insert(rows).select('id')
    created = data?.length ?? 0
  }

  return NextResponse.json({ created })
}
