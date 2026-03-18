import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(_req: NextRequest) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new NextResponse('Non authentifié', { status: 401 })

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  await admin
    .from('profiles')
    .update({
      google_access_token: null,
      google_refresh_token: null,
      google_token_expiry: null,
    })
    .eq('id', user.id)

  return NextResponse.json({ success: true })
}
