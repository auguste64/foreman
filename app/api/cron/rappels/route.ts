import { NextResponse } from 'next/server'
import { createClient as createSupabaseAdmin } from '@supabase/supabase-js'
import { Resend } from 'resend'

export const runtime = 'nodejs'

const resend = new Resend(process.env.RESEND_API_KEY)

// Délais en millisecondes
const DELAI_MS: Record<string, number> = {
  '15min': 15 * 60 * 1000,
  '1h':    60 * 60 * 1000,
  '2h':    2 * 60 * 60 * 1000,
  '1j':    24 * 60 * 60 * 1000,
  '2j':    2 * 24 * 60 * 60 * 1000,
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long',
    year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

function emailHtml(titre: string, dateDebut: string, chantierNom: string | null): string {
  const dateFormatee = formatDate(dateDebut)
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body style="margin:0;padding:0;background:#0D0D0B;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0D0D0B;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#111110;border:1px solid #1E1E1C;border-radius:12px;overflow:hidden;">

          <!-- Header -->
          <tr>
            <td style="background:#111110;padding:28px 32px 20px;border-bottom:1px solid #1E1E1C;">
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding-right:12px;">
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding-right:3px;"><div style="width:18px;height:8px;border-radius:2px;background:#ea580c;"></div></td>
                        <td><div style="width:12px;height:8px;border-radius:2px;background:#ea580c;opacity:0.6;"></div></td>
                      </tr>
                      <tr>
                        <td style="padding-right:3px;padding-top:3px;"><div style="width:12px;height:8px;border-radius:2px;background:#ea580c;opacity:0.6;"></div></td>
                        <td style="padding-top:3px;"><div style="width:18px;height:8px;border-radius:2px;background:#ea580c;"></div></td>
                      </tr>
                    </table>
                  </td>
                  <td>
                    <div style="font-size:10px;letter-spacing:3px;color:#8A8880;text-transform:uppercase;line-height:1;">THE</div>
                    <div style="font-size:18px;letter-spacing:1px;font-weight:800;color:#F0EDE6;line-height:1.1;">BUILDER</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Badge rappel -->
          <tr>
            <td style="padding:28px 32px 0;">
              <span style="display:inline-block;background:#1a0c04;border:1px solid #ea580c;color:#ea580c;font-size:11px;font-weight:600;letter-spacing:1px;text-transform:uppercase;padding:4px 12px;border-radius:20px;">
                🔔 Rappel d'événement
              </span>
            </td>
          </tr>

          <!-- Titre -->
          <tr>
            <td style="padding:16px 32px 0;">
              <h1 style="margin:0;font-size:22px;font-weight:700;color:#F0EDE6;line-height:1.3;">
                ${titre}
              </h1>
            </td>
          </tr>

          <!-- Détails -->
          <tr>
            <td style="padding:20px 32px 0;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#1a1917;border:1px solid #1E1E1C;border-radius:8px;overflow:hidden;">
                <tr>
                  <td style="padding:16px 20px;border-bottom:1px solid #1E1E1C;">
                    <div style="font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#8A8880;margin-bottom:4px;">Date &amp; heure</div>
                    <div style="font-size:15px;color:#F0EDE6;font-weight:500;">${dateFormatee}</div>
                  </td>
                </tr>
                ${chantierNom ? `
                <tr>
                  <td style="padding:16px 20px;">
                    <div style="font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#8A8880;margin-bottom:4px;">Chantier</div>
                    <div style="font-size:15px;color:#F0EDE6;font-weight:500;">${chantierNom}</div>
                  </td>
                </tr>
                ` : ''}
              </table>
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td style="padding:24px 32px 0;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL ?? 'https://thebuilder.app'}/dashboard/planning"
                style="display:inline-block;background:#ea580c;color:#fff;font-size:14px;font-weight:600;text-decoration:none;padding:12px 24px;border-radius:8px;letter-spacing:0.3px;">
                Voir le planning →
              </a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:28px 32px;margin-top:8px;">
              <p style="margin:0;font-size:12px;color:#5A5A58;line-height:1.5;">
                Ce rappel a été configuré sur The Builder. Pour modifier vos préférences, rendez-vous dans votre planning.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

export async function GET(req: Request) {
  // Vérification du secret cron Vercel
  const authHeader = req.headers.get('authorization')
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  // Client admin (service role) — contourne RLS pour lire tous les événements
  const supabase = createSupabaseAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  const now = new Date()

  // Récupère tous les événements avec rappel configuré et pas encore envoyé
  const { data: evenements, error } = await supabase
    .from('evenements')
    .select('id, user_id, titre, date_debut, chantier_id, rappel')
    .not('rappel', 'is', null)
    .or('rappel_envoye.is.null,rappel_envoye.eq.false')

  if (error) {
    console.error('[cron/rappels] Erreur lecture événements:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  let envoyes = 0
  const erreurs: string[] = []

  for (const ev of evenements ?? []) {
    const delaiMs = DELAI_MS[ev.rappel as string]
    if (!delaiMs) continue

    const dateDebut = new Date(ev.date_debut)
    const heureRappel = new Date(dateDebut.getTime() - delaiMs)

    // Le rappel doit être dans le passé (heure atteinte) et l'événement pas encore passé
    if (now < heureRappel || now > dateDebut) continue

    try {
      // Récupère l'email de l'utilisateur via auth admin
      const { data: { user }, error: userError } = await supabase.auth.admin.getUserById(ev.user_id)
      if (userError || !user?.email) continue

      // Récupère le nom du chantier si présent
      let chantierNom: string | null = null
      if (ev.chantier_id) {
        const { data: chantier } = await supabase
          .from('chantiers')
          .select('nom')
          .eq('id', ev.chantier_id)
          .single()
        chantierNom = chantier?.nom ?? null
      }

      // Envoi email
      await resend.emails.send({
        from: 'The Builder <onboarding@resend.dev>',
        to: user.email,
        subject: `🔔 Rappel : ${ev.titre}`,
        html: emailHtml(ev.titre, ev.date_debut, chantierNom),
      })

      // Marque comme envoyé
      await supabase
        .from('evenements')
        .update({ rappel_envoye: true })
        .eq('id', ev.id)

      envoyes++
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      console.error(`[cron/rappels] Erreur événement ${ev.id}:`, msg)
      erreurs.push(`${ev.id}: ${msg}`)
    }
  }

  return NextResponse.json({ envoyes, erreurs: erreurs.length > 0 ? erreurs : undefined })
}
