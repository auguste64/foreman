import { NextRequest, NextResponse } from 'next/server'
import { google } from 'googleapis'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'

export type GoogleContact = {
  id: string
  nom: string
  email: string
  telephone: string
  entreprise: string
}

export async function GET(_req: NextRequest) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new NextResponse('Non authentifié', { status: 401 })

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: profile } = await admin
    .from('profiles')
    .select('google_access_token, google_refresh_token, google_token_expiry')
    .eq('id', user.id)
    .maybeSingle()

  console.log('[contacts/google] profile:', { hasToken: !!profile?.google_access_token, tokenLength: profile?.google_access_token?.length })

  if (!profile?.google_access_token) {
    return new NextResponse('Google non connecté', { status: 400 })
  }

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  )

  oauth2Client.setCredentials({
    access_token: profile.google_access_token,
    refresh_token: profile.google_refresh_token,
    expiry_date: profile.google_token_expiry
      ? new Date(profile.google_token_expiry).getTime()
      : undefined,
  })

  oauth2Client.on('tokens', async (tokens) => {
    await admin
      .from('profiles')
      .update({
        google_access_token: tokens.access_token,
        ...(tokens.refresh_token ? { google_refresh_token: tokens.refresh_token } : {}),
        google_token_expiry: tokens.expiry_date
          ? new Date(tokens.expiry_date).toISOString()
          : null,
      })
      .eq('id', user.id)
  })

  const people = google.people({ version: 'v1', auth: oauth2Client })

  const contacts: GoogleContact[] = []
  let pageToken: string | undefined

  try {
    do {
      const res = await people.people.connections.list({
        resourceName: 'people/me',
        personFields: 'names,emailAddresses,phoneNumbers,organizations',
        pageSize: 1000,
        pageToken,
      })

      for (const person of res.data.connections ?? []) {
        const name = person.names?.[0]
        const email = person.emailAddresses?.[0]?.value ?? ''
        const phone = person.phoneNumbers?.[0]?.value ?? ''
        const org = person.organizations?.[0]?.name ?? ''
        const displayName = name
          ? [name.givenName, name.familyName].filter(Boolean).join(' ')
          : email || 'Sans nom'

        if (!displayName.trim()) continue

        contacts.push({
          id: person.resourceName ?? crypto.randomUUID(),
          nom: displayName,
          email,
          telephone: phone,
          entreprise: org,
        })
      }

      pageToken = res.data.nextPageToken ?? undefined
    } while (pageToken)
  } catch (err: unknown) {
    // Log the full error for debugging
    const gErr = err as { code?: number; message?: string; errors?: unknown }
    console.error('[contacts/google] Google People API error:', {
      code: gErr?.code,
      message: gErr?.message,
      errors: gErr?.errors,
      raw: err,
    })

    // Token expired / invalid — suggest reconnect
    if (gErr?.code === 401 || gErr?.code === 403) {
      return new NextResponse(
        JSON.stringify({ error: 'Token Google invalide ou expiré. Reconnectez Google Calendar depuis la page Planning.' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      )
    }

    return new NextResponse(
      JSON.stringify({ error: gErr?.message ?? 'Erreur API Google' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }

  contacts.sort((a, b) => a.nom.localeCompare(b.nom, 'fr'))

  return NextResponse.json(contacts)
}
