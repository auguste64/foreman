import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function formatICalDate(str: string): string {
  // If date-only (YYYY-MM-DD) → all-day
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    return str.replace(/-/g, '')
  }
  // Otherwise → UTC datetime
  return new Date(str).toISOString().replace(/[-:.]/g, '').slice(0, 15) + 'Z'
}

function escapeICalText(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n')
}

// Fold long iCal lines at 75 chars
function foldLine(line: string): string {
  if (line.length <= 75) return line
  const chunks: string[] = []
  chunks.push(line.slice(0, 75))
  let i = 75
  while (i < line.length) {
    chunks.push(' ' + line.slice(i, i + 74))
    i += 74
  }
  return chunks.join('\r\n')
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params

  // Use service role to bypass RLS for public calendar feed
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Find user by ical_token
  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('ical_token', token)
    .maybeSingle()

  if (!profile) {
    return new NextResponse('Token invalide', { status: 404 })
  }

  // Fetch user's events
  const { data: events } = await supabase
    .from('evenements')
    .select('id, titre, type, date_debut, date_fin, notes, chantier_id, chantiers(nom)')
    .eq('user_id', profile.id)
    .order('date_debut', { ascending: true })

  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Foreman//FR',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:Foreman Planning',
    'X-WR-TIMEZONE:Europe/Paris',
  ]

  for (const ev of events ?? []) {
    const dtStart = formatICalDate(ev.date_debut)
    const isAllDay = /^\d{8}$/.test(dtStart)
    // If no date_fin, set DTEND = DTSTART + 1h (or next day for all-day)
    const dtEnd = ev.date_fin
      ? formatICalDate(ev.date_fin)
      : isAllDay
        ? (() => {
            const d = new Date(ev.date_debut)
            d.setDate(d.getDate() + 1)
            return d.toISOString().slice(0, 10).replace(/-/g, '')
          })()
        : (() => {
            const d = new Date(ev.date_debut)
            d.setHours(d.getHours() + 1)
            return d.toISOString().replace(/[-:.]/g, '').slice(0, 15) + 'Z'
          })()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const chantierNom = (ev as any).chantiers?.nom ?? null

    lines.push('BEGIN:VEVENT')
    lines.push(foldLine(`UID:${ev.id}@foreman`))
    if (isAllDay) {
      lines.push(foldLine(`DTSTART;VALUE=DATE:${dtStart}`))
      lines.push(foldLine(`DTEND;VALUE=DATE:${dtEnd}`))
    } else {
      lines.push(foldLine(`DTSTART:${dtStart}`))
      lines.push(foldLine(`DTEND:${dtEnd}`))
    }
    lines.push(foldLine(`SUMMARY:${escapeICalText(ev.titre)}`))
    if (ev.notes) lines.push(foldLine(`DESCRIPTION:${escapeICalText(ev.notes)}`))
    if (chantierNom) lines.push(foldLine(`LOCATION:${escapeICalText(chantierNom)}`))
    lines.push('END:VEVENT')
  }

  lines.push('END:VCALENDAR')

  return new NextResponse(lines.join('\r\n'), {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': 'attachment; filename="foreman.ics"',
      'Cache-Control': 'no-cache',
    },
  })
}
