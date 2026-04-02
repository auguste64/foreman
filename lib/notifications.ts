/**
 * Déclenche la génération des notifications de relance côté serveur.
 * À appeler au montage de l'application (MainWrapper) ou manuellement.
 */
export async function generateRelanceNotifications(): Promise<void> {
  try {
    await fetch('/api/notifications/generate', { method: 'POST' })
  } catch { /* ignore — non-critique */ }
}
