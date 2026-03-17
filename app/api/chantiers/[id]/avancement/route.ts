import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { avancement } = await request.json()
  if (typeof avancement !== 'number' || avancement < 0 || avancement > 100) {
    return NextResponse.json({ error: 'Valeur invalide' }, { status: 400 })
  }

  const { error } = await supabase
    .from('chantiers')
    .update({ avancement })
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
