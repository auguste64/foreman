'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, usePathname } from 'next/navigation'
import { getDevisArtisansByChantier, deleteDevisArtisan, type DevisArtisanWithArtisan } from '@/lib/supabase/devis-artisans'
import { createClient } from '@/lib/supabase/client'
import { usePlan } from '@/lib/usePlan'
import UpgradeGate from '@/components/UpgradeGate'

function formatMontant(val: number | null | undefined) {
  if (val == null || isNaN(val)) return '—'
  return val.toLocaleString('fr-FR', { minimumFractionDigits: 2 }) + ' €'
}

const STATUT_COLORS: Record<string, { bg: string; text: string }> = {
  recu:    { bg: 'rgba(138,136,128,0.15)', text: '#8A8880' },
  accepte: { bg: 'rgba(74,222,128,0.12)',  text: '#4ade80' },
  refuse:  { bg: 'rgba(232,84,71,0.15)',   text: '#E85447' },
}

const STATUT_LABELS: Record<string, string> = {
  recu:    'Reçu',
  accepte: 'Accepté',
  refuse:  'Refusé',
}

function ChantierTabs({ chantierId, isPro }: { chantierId: string; isPro: boolean }) {
  const pathname = usePathname()
  const tabs = [
    { label: 'Infos',           href: `/dashboard/chantiers/${chantierId}`,                pro: false },
    { label: 'Lots & Devis',    href: `/dashboard/chantiers/${chantierId}/lots`,            pro: true },
    { label: 'Devis',           href: `/dashboard/chantiers/${chantierId}/devis`,           pro: true },
    { label: 'Factures',        href: `/dashboard/chantiers/${chantierId}/factures`,        pro: true },
    { label: 'Devis artisans',  href: `/dashboard/chantiers/${chantierId}/devis-artisans`, pro: true },
  ]
  return (
    <div style={{ display: 'flex', gap: '4px', marginBottom: '32px', borderBottom: '1px solid #1E1E1C' }}>
      {tabs.map(tab => {
        const active = pathname === tab.href
        return (
          <Link
            key={tab.href}
            href={tab.href}
            style={{ padding: '10px 20px', fontSize: '13px', fontWeight: 500, fontFamily: 'var(--font-dm-sans), sans-serif', textDecoration: 'none', color: active ? '#ea580c' : '#8A8880', borderBottom: active ? '2px solid #ea580c' : '2px solid transparent', marginBottom: '-1px', transition: 'color 0.15s', display: 'inline-flex', alignItems: 'center', gap: 5 }}
          >
            {tab.label}
            {tab.pro && !isPro && (
              <span style={{ background: '#1E1E1C', color: '#ea580c', fontSize: '9px', fontWeight: 600, padding: '2px 5px', borderRadius: '4px' }}>Pro</span>
            )}
          </Link>
        )
      })}
    </div>
  )
}

export default function DevisArtisansPage() {
  const { isPro } = usePlan()
  const params = useParams()
  const chantierId = params.id as string
  const [devis, setDevis] = useState<DevisArtisanWithArtisan[]>([])
  const [loading, setLoading] = useState(true)
  const [chantierNom, setChantierNom] = useState('')
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const [devisData, chantierRes] = await Promise.all([
        getDevisArtisansByChantier(chantierId).catch(() => []),
        supabase.from('chantiers').select('nom').eq('id', chantierId).single(),
      ])
      setDevis(devisData)
      setChantierNom(chantierRes.data?.nom ?? '')
      setLoading(false)
    }
    load()
  }, [chantierId])

  async function handleDelete(id: string) {
    setDeleting(true)
    try {
      await deleteDevisArtisan(id)
      setDevis(prev => prev.filter(d => d.id !== id))
      setConfirmDeleteId(null)
    } catch {
      // ignore
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="page-enter" style={{ flex: 1, padding: '40px', overflowY: 'auto', maxWidth: '860px' }}>
      <Link
        href="/dashboard/chantiers"
        style={{ display: 'inline-flex', alignItems: 'center', gap: 8, backgroundColor: '#111110', border: '1px solid #1E1E1C', borderRadius: 8, padding: '8px 14px', color: '#F0EDE6', fontSize: 13, fontWeight: 500, cursor: 'pointer', textDecoration: 'none', transition: 'all 0.15s ease', fontFamily: 'var(--font-dm-sans), sans-serif', marginBottom: 28 }}
        onMouseEnter={e => { e.currentTarget.style.background = '#1E1E1C'; e.currentTarget.style.borderColor = '#ea580c'; e.currentTarget.style.color = '#ea580c' }}
        onMouseLeave={e => { e.currentTarget.style.background = '#111110'; e.currentTarget.style.borderColor = '#1E1E1C'; e.currentTarget.style.color = '#F0EDE6' }}
      >
        <span style={{ color: '#ea580c' }}>←</span>
        Retour aux chantiers
      </Link>

      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontFamily: 'var(--font-syne), sans-serif', fontSize: '24px', fontWeight: 700, color: '#F0EDE6', margin: '0 0 4px' }}>
          {chantierNom}
        </h1>
      </div>

      <ChantierTabs chantierId={chantierId} isPro={isPro} />

      {!isPro ? (
        <UpgradeGate feature="Devis artisans" requiredPlan="pro" />
      ) : (
        <>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
            <h2 style={{ fontFamily: 'var(--font-syne), sans-serif', fontSize: '18px', fontWeight: 600, color: '#F0EDE6', margin: 0 }}>
              Devis artisans{!loading && <span style={{ color: '#8A8880', fontSize: '14px', fontWeight: 400 }}> ({devis.length})</span>}
            </h2>
            <Link
              href={`/dashboard/chantiers/${chantierId}/devis-artisans/nouveau`}
              style={{ padding: '9px 18px', backgroundColor: '#ea580c', color: '#0D0D0B', borderRadius: '8px', fontSize: '13px', fontWeight: 600, textDecoration: 'none', fontFamily: 'var(--font-dm-sans), sans-serif' }}
            >
              + Ajouter un devis artisan
            </Link>
          </div>

          {loading && (
            <p style={{ color: '#8A8880', fontSize: '14px', fontFamily: 'var(--font-dm-sans), sans-serif' }}>Chargement…</p>
          )}

          {!loading && devis.length === 0 && (
            <div style={{ backgroundColor: '#111110', border: '1px dashed #1E1E1C', borderRadius: '12px', padding: '60px 24px', textAlign: 'center' }}>
              <p style={{ color: '#8A8880', fontSize: '14px', fontFamily: 'var(--font-dm-sans), sans-serif', marginBottom: '16px' }}>
                Aucun devis artisan reçu pour ce chantier.
              </p>
              <Link
                href={`/dashboard/chantiers/${chantierId}/devis-artisans/nouveau`}
                style={{ display: 'inline-block', padding: '10px 20px', backgroundColor: '#ea580c', color: '#0D0D0B', borderRadius: '8px', fontSize: '13px', fontWeight: 600, textDecoration: 'none', fontFamily: 'var(--font-dm-sans), sans-serif' }}
              >
                + Ajouter un devis artisan
              </Link>
            </div>
          )}

          {!loading && devis.length > 0 && (() => {
            // Grouper par artisan (null → clé '__sans_artisan__')
            const groupes = devis.reduce<Record<string, { label: string; metier: string; items: typeof devis }>>((acc, d) => {
              const key = d.artisan_id ?? '__sans_artisan__'
              if (!acc[key]) {
                acc[key] = {
                  label: d.artisans?.nom ?? 'Artisan inconnu',
                  metier: d.artisans?.metier ?? '',
                  items: [],
                }
              }
              acc[key].items.push(d)
              return acc
            }, {})

            const totalGeneral = devis.reduce((s, d) => s + (d.montant_ttc ?? 0), 0)

            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {Object.entries(groupes).map(([key, groupe]) => {
                  const sousTotalTtc = groupe.items.reduce((s, d) => s + (d.montant_ttc ?? 0), 0)
                  return (
                    <div key={key}>
                      {/* En-tête artisan */}
                      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: '10px' }}>
                        <div>
                          <span style={{ fontFamily: 'var(--font-syne), sans-serif', fontSize: '15px', fontWeight: 700, color: '#F0EDE6' }}>
                            {groupe.label}
                          </span>
                          {groupe.metier && (
                            <span style={{ marginLeft: '8px', fontSize: '12px', color: '#8A8880', fontFamily: 'var(--font-dm-sans), sans-serif' }}>
                              {groupe.metier}
                            </span>
                          )}
                        </div>
                        <span style={{ fontSize: '13px', fontWeight: 600, color: '#ea580c', fontFamily: 'var(--font-dm-sans), sans-serif' }}>
                          Sous-total : {formatMontant(sousTotalTtc)}
                        </span>
                      </div>

                      {/* Cards du groupe */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', paddingLeft: '12px', borderLeft: '2px solid #1E1E1C' }}>
                        {groupe.items.map(d => {
                          const sc = STATUT_COLORS[d.statut] ?? STATUT_COLORS.recu
                          return (
                            <div
                              key={d.id}
                              style={{ backgroundColor: '#111110', border: '1px solid #1E1E1C', borderRadius: '10px', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '16px', transition: 'all 0.15s ease' }}
                              onMouseEnter={e => { e.currentTarget.style.transform = 'translateX(4px)'; e.currentTarget.style.borderColor = 'rgba(249,115,22,0.2)' }}
                              onMouseLeave={e => { e.currentTarget.style.transform = 'translateX(0)'; e.currentTarget.style.borderColor = '#1E1E1C' }}
                            >
                              {/* Lot + description */}
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <p style={{ fontSize: '14px', fontWeight: 600, color: d.lot ? '#ea580c' : '#8A8880', fontFamily: 'var(--font-dm-sans), sans-serif', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  {d.lot ?? '—'}
                                </p>
                                {d.description && (
                                  <p style={{ fontSize: '12px', color: '#7A7870', fontFamily: 'var(--font-dm-sans), sans-serif', margin: '2px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {d.description}
                                  </p>
                                )}
                              </div>

                              {/* Numéro */}
                              {d.numero && (
                                <span style={{ padding: '2px 8px', backgroundColor: 'rgba(249,115,22,0.08)', color: '#ea580c', borderRadius: '4px', fontSize: '11px', fontWeight: 600, fontFamily: 'var(--font-dm-sans), sans-serif', flexShrink: 0 }}>
                                  {d.numero}
                                </span>
                              )}

                              {/* Montant TTC */}
                              <span style={{ fontSize: '15px', fontWeight: 700, color: '#F0EDE6', fontFamily: 'var(--font-dm-sans), sans-serif', flexShrink: 0 }}>
                                {formatMontant(d.montant_ttc)}
                              </span>

                              {/* Statut */}
                              <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 500, fontFamily: 'var(--font-dm-sans), sans-serif', backgroundColor: sc.bg, color: sc.text, flexShrink: 0 }}>
                                {STATUT_LABELS[d.statut] ?? d.statut}
                              </span>

                              {/* PDF */}
                              {d.pdf_url && (
                                <a
                                  href={d.pdf_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={e => e.stopPropagation()}
                                  style={{ fontSize: '12px', color: '#ea580c', fontFamily: 'var(--font-dm-sans), sans-serif', textDecoration: 'none', flexShrink: 0 }}
                                  onMouseEnter={e => { e.currentTarget.style.textDecoration = 'underline' }}
                                  onMouseLeave={e => { e.currentTarget.style.textDecoration = 'none' }}
                                >
                                  PDF ↗
                                </a>
                              )}

                              {/* Actions */}
                              <Link
                                href={`/dashboard/chantiers/${chantierId}/devis-artisans/${d.id}/modifier`}
                                onClick={e => e.stopPropagation()}
                                style={{ padding: '4px 10px', backgroundColor: 'transparent', border: '1px solid #2a2a27', borderRadius: '6px', fontSize: '11px', fontWeight: 500, color: '#8A8880', textDecoration: 'none', fontFamily: 'var(--font-dm-sans), sans-serif', flexShrink: 0, transition: 'all 0.15s' }}
                                onMouseEnter={e => { e.currentTarget.style.borderColor = '#ea580c'; e.currentTarget.style.color = '#ea580c' }}
                                onMouseLeave={e => { e.currentTarget.style.borderColor = '#2a2a27'; e.currentTarget.style.color = '#8A8880' }}
                              >
                                Modifier
                              </Link>
                              <button
                                onClick={e => { e.stopPropagation(); setConfirmDeleteId(d.id) }}
                                style={{ padding: '4px 10px', backgroundColor: 'transparent', border: '1px solid #2a2a27', borderRadius: '6px', fontSize: '11px', fontWeight: 500, color: '#8A8880', cursor: 'pointer', fontFamily: 'var(--font-dm-sans), sans-serif', flexShrink: 0, transition: 'all 0.15s' }}
                                onMouseEnter={e => { e.currentTarget.style.borderColor = '#E85447'; e.currentTarget.style.color = '#E85447' }}
                                onMouseLeave={e => { e.currentTarget.style.borderColor = '#2a2a27'; e.currentTarget.style.color = '#8A8880' }}
                              >
                                Supprimer
                              </button>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}

                {/* Total général */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '12px', paddingTop: '16px', borderTop: '1px solid #1E1E1C' }}>
                  <span style={{ fontSize: '13px', color: '#8A8880', fontFamily: 'var(--font-dm-sans), sans-serif' }}>
                    Total général TTC
                  </span>
                  <span style={{ fontSize: '18px', fontWeight: 700, color: '#ea580c', fontFamily: 'var(--font-syne), sans-serif' }}>
                    {formatMontant(totalGeneral)}
                  </span>
                </div>
              </div>
            )
          })()}
        </>
      )}

      {/* Modal: confirmation suppression */}
      {confirmDeleteId && (
        <div
          style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}
          onClick={() => setConfirmDeleteId(null)}
        >
          <div
            style={{ backgroundColor: '#111110', border: '1px solid #1E1E1C', borderRadius: '14px', padding: '28px', maxWidth: '380px', width: '90%' }}
            onClick={e => e.stopPropagation()}
          >
            <h3 style={{ fontFamily: 'var(--font-syne), sans-serif', fontSize: '17px', fontWeight: 700, color: '#F0EDE6', margin: '0 0 10px' }}>
              Supprimer ce devis ?
            </h3>
            <p style={{ fontSize: '13px', color: '#8A8880', fontFamily: 'var(--font-dm-sans), sans-serif', margin: '0 0 24px', lineHeight: '1.5' }}>
              Cette action est irréversible. Le devis sera définitivement supprimé.
            </p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => handleDelete(confirmDeleteId)}
                disabled={deleting}
                style={{ padding: '9px 20px', backgroundColor: '#E85447', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: deleting ? 'not-allowed' : 'pointer', fontFamily: 'var(--font-dm-sans), sans-serif', opacity: deleting ? 0.7 : 1 }}
              >
                {deleting ? 'Suppression…' : 'Supprimer'}
              </button>
              <button
                onClick={() => setConfirmDeleteId(null)}
                style={{ padding: '9px 20px', backgroundColor: 'transparent', color: '#8A8880', border: '1px solid #1E1E1C', borderRadius: '8px', fontSize: '13px', fontWeight: 500, cursor: 'pointer', fontFamily: 'var(--font-dm-sans), sans-serif' }}
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
