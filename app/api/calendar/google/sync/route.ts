import { NextRequest, NextResponse } from 'next/server'
import { google } from 'googleapis'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'

function toGoogleDateTime(str: string) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    return { date: str }
  }
  return { dateTime: new Date(str).toISOString(), timeZone: 'Europe/Paris' }
}

export async function POST(_req: NextRequest) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new NextResponse('Non authentifié', { status: 401 })

  // Fetch tokens with service role
  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: profile } = await admin
    .from('profiles')
    .select('google_access_token, google_refresh_token, google_token_expiry')
    .eq('id', user.id)
    .maybeSingle()

  if (!profile?.google_access_token) {
    return new NextResponse('Google Calendar non connecté', { status: 400 })
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

  // Persist refreshed tokens if they change
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

  const calendar = google.calendar({ version: 'v3', auth: oauth2Client })

  // Fetch events
  const { data: events } = await admin
    .from('evenements')
    .select('id, titre, type, date_debut, date_fin, notes, chantier_id, chantiers(nom), google_event_id')
    .eq('user_id', user.id)
    .order('date_debut', { ascending: true })

  let synced = 0
  let errors = 0

  for (const ev of events ?? []) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const chantierNom = (ev as any).chantiers?.nom ?? null
    const start = toGoogleDateTime(ev.date_debut)
    const end = ev.date_fin
      ? toGoogleDateTime(ev.date_fin)
      : 'date' in start
        ? { date: (() => { const d = new Date(ev.date_debut); d.setDate(d.getDate() + 1); return d.toISOString().slice(0, 10) })() }
        : { dateTime: (() => { const d = new Date(ev.date_debut); d.setHours(d.getHours() + 1); return d.toISOString() })(), timeZone: 'Europe/Paris' }

    const resource = {
      summary: ev.titre,
      description: ev.notes ?? undefined,
      location: chantierNom ?? undefined,
      start,
      end,
    }

    try {
      if (ev.google_event_id) {
        // Update existing event
        await calendar.events.update({
          calendarId: 'primary',
          eventId: ev.google_event_id,
          requestBody: resource,
        })
      } else {
        // Create new event
        const res = await calendar.events.insert({
          calendarId: 'primary',
          requestBody: resource,
        })
        // Save google_event_id
        await admin
          .from('evenements')
          .update({ google_event_id: res.data.id })
          .eq('id', ev.id)
      }
      synced++
    } catch {
      errors++
    }
  }

  return NextResponse.json({ synced, errors })
}
