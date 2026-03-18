import { NextRequest, NextResponse } from 'next/server'
import { google } from 'googleapis'
import { createClient } from '@supabase/supabase-js'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const code = searchParams.get('code')
  const userId = searchParams.get('state')

  if (!code || !userId) {
    return new NextResponse('Paramètres manquants', { status: 400 })
  }

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  )

  const { tokens } = await oauth2Client.getToken(code)

  console.log('[google/callback] tokens received:', {
    hasAccessToken: !!tokens.access_token,
    hasRefreshToken: !!tokens.refresh_token,
    expiryDate: tokens.expiry_date,
    userId,
  })

  // Store tokens with service role (bypasses RLS)
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { error: updateError } = await supabase
    .from('profiles')
    .update({
      google_access_token: tokens.access_token,
      google_refresh_token: tokens.refresh_token ?? null,
      google_token_expiry: tokens.expiry_date
        ? new Date(tokens.expiry_date).toISOString()
        : null,
    })
    .eq('id', userId)

  if (updateError) {
    console.error('[google/callback] Supabase update error:', updateError)
  } else {
    console.log('[google/callback] Token saved successfully for user:', userId)
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  return NextResponse.redirect(`${appUrl}/dashboard/planning?google=connected`)
}
