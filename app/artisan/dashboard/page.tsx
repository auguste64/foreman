'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Chantier } from '@/lib/supabase/chantiers'

type CompteRendu = {
  id: string
  chantier_id: string
  date_visite: string
  progression: number
  observations: string | null
  travaux_a_faire: string | null
}

export default function ArtisanDashboard() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [artisanNom, setArtisanNom] = useState('')
  const [chantiers, setChantiers] = useState<Chantier[]>([])
  const [compteRendus, setCompteRendus] = useState<Record<string, CompteRendu[]>>({})

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/artisan')
        return
      }

      const { data: artisan } = await supabase
        .from('artisans')
        .select('*')
        .eq('email', user.email)
        .single()

      if (!artisan) {
        setNotFound(true)
        setLoading(false)
        return
      }

      setArtisanNom(artisan.nom)

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: assignments } = await supabase
        .from('chantiers_artisans')
        .select('chantiers(*)')
        .eq('artisan_id', artisan.id)

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const chantiersList = (assignments ?? []).map((a: any) => a.chantiers).filter(Boolean) as Chantier[]
      setChantiers(chantiersList)

      if (chantiersList.length > 0) {
        const chantierIds = chantiersList.map((c) => c.id)
        const { data: crs } = await supabase
          .from('comptes_rendus')
          .select('id, chantier_id, date_visite, progression, observations, travaux_a_faire')
          .in('chantier_id', chantierIds)
          .order('date_visite', { ascending: false })

        const grouped: Record<string, CompteRendu[]> = {}
        for (const cr of crs ?? []) {
          if (!grouped[cr.chantier_id]) grouped[cr.chantier_id] = []
          grouped[cr.chantier_id].push(cr)
        }
        setCompteRendus(grouped)
      }

      setLoading(false)
    }

    load()
  }, [router])

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/artisan')
  }

  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          backgroundColor: '#0D0D0B',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <p style={{ color: '#8A8880', fontFamily: 'var(--font-dm-sans), sans-serif', fontSize: '14px' }}>
          Chargement…
        </p>
      </div>
    )
  }

  if (notFound) {
    return (
      <div
        style={{
          minHeight: '100vh',
          backgroundColor: '#0D0D0B',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
        }}
      >
        <div style={{ textAlign: 'center', maxWidth: '400px' }}>
          <span
            style={{
              fontFamily: 'var(--font-syne), sans-serif',
              fontSize: '20px',
              fontWeight: 800,
              letterSpacing: '0.15em',
              color: '#E8C547',
              display: 'block',
              marginBottom: '32px',
            }}
          >
            FOREMAN
          </span>
          <p style={{ color: '#8A8880', fontSize: '14px', fontFamily: 'var(--font-dm-sans), sans-serif', lineHeight: '1.6' }}>
            Aucun compte artisan trouvé pour cet email. Contactez votre chef de chantier.
          </p>
          <button
            onClick={handleSignOut}
            style={{
              marginTop: '24px',
              padding: '10px 20px',
              backgroundColor: 'transparent',
              color: '#8A8880',
              border: '1px solid #1E1E1C',
              borderRadius: '8px',
              fontSize: '13px',
              cursor: 'pointer',
              fontFamily: 'var(--font-dm-sans), sans-serif',
            }}
          >
            Déconnexion
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0D0D0B', padding: '40px 24px' }}>
      <div style={{ maxWidth: '720px', margin: '0 auto' }}>
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: '16px',
            marginBottom: '40px',
          }}
        >
          <div>
            <span
              style={{
                fontFamily: 'var(--font-syne), sans-serif',
                fontSize: '18px',
                fontWeight: 800,
                letterSpacing: '0.15em',
                color: '#E8C547',
                display: 'block',
                marginBottom: '12px',
              }}
            >
              FOREMAN
            </span>
            <h1
              style={{
                fontFamily: 'var(--font-syne), sans-serif',
                fontSize: '22px',
                fontWeight: 700,
                color: '#F0EDE6',
                margin: '0 0 4px',
              }}
            >
              Bonjour, {artisanNom}
            </h1>
            <p style={{ color: '#8A8880', fontSize: '14px', fontFamily: 'var(--font-dm-sans), sans-serif', margin: 0 }}>
              Vos chantiers et comptes rendus
            </p>
          </div>
          <button
            onClick={handleSignOut}
            style={{
              padding: '8px 14px',
              backgroundColor: 'transparent',
              color: '#8A8880',
              border: '1px solid #1E1E1C',
              borderRadius: '8px',
              fontSize: '13px',
              cursor: 'pointer',
              fontFamily: 'var(--font-dm-sans), sans-serif',
              flexShrink: 0,
            }}
          >
            Déconnexion
          </button>
        </div>

        {chantiers.length === 0 && (
          <div
            style={{
              backgroundColor: '#111110',
              border: '1px dashed #1E1E1C',
              borderRadius: '12px',
              padding: '60px 24px',
              textAlign: 'center',
            }}
          >
            <p style={{ color: '#8A8880', fontSize: '14px', fontFamily: 'var(--font-dm-sans), sans-serif' }}>
              Aucun chantier assigné pour le moment.
            </p>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {chantiers.map((c) => (
            <div
              key={c.id}
              style={{
                backgroundColor: '#111110',
                border: '1px solid #1E1E1C',
                borderRadius: '12px',
                overflow: 'hidden',
              }}
            >
              {/* Chantier header */}
              <div style={{ padding: '24px', borderBottom: '1px solid #1E1E1C' }}>
                <h2
                  style={{
                    fontFamily: 'var(--font-syne), sans-serif',
                    fontSize: '17px',
                    fontWeight: 600,
                    color: '#F0EDE6',
                    margin: '0 0 4px',
                  }}
                >
                  {c.nom}
                </h2>
                <p style={{ fontSize: '13px', color: '#8A8880', fontFamily: 'var(--font-dm-sans), sans-serif', margin: 0 }}>
                  {c.client} · {c.adresse}
                </p>
              </div>

              {/* Comptes rendus */}
              <div style={{ padding: '20px 24px' }}>
                <p
                  style={{
                    fontSize: '11px',
                    color: '#8A8880',
                    fontFamily: 'var(--font-dm-sans), sans-serif',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    marginBottom: '12px',
                  }}
                >
                  Comptes rendus
                </p>

                {!compteRendus[c.id] || compteRendus[c.id].length === 0 ? (
                  <p style={{ fontSize: '13px', color: '#8A8880', fontFamily: 'var(--font-dm-sans), sans-serif', fontStyle: 'italic' }}>
                    Aucun compte rendu disponible.
                  </p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {compteRendus[c.id].map((cr) => (
                      <div
                        key={cr.id}
                        style={{
                          padding: '16px',
                          backgroundColor: '#0D0D0B',
                          border: '1px solid #1E1E1C',
                          borderRadius: '8px',
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            marginBottom: cr.observations || cr.travaux_a_faire ? '12px' : 0,
                          }}
                        >
                          <span
                            style={{
                              fontSize: '13px',
                              fontWeight: 500,
                              color: '#F0EDE6',
                              fontFamily: 'var(--font-dm-sans), sans-serif',
                            }}
                          >
                            {new Date(cr.date_visite).toLocaleDateString('fr-FR', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric',
                            })}
                          </span>
                          <span
                            style={{
                              fontSize: '13px',
                              color: '#E8C547',
                              fontFamily: 'var(--font-dm-sans), sans-serif',
                              fontWeight: 600,
                            }}
                          >
                            {cr.progression}%
                          </span>
                        </div>

                        {cr.observations && (
                          <p
                            style={{
                              fontSize: '13px',
                              color: '#8A8880',
                              fontFamily: 'var(--font-dm-sans), sans-serif',
                              margin: '0 0 6px',
                              lineHeight: '1.5',
                            }}
                          >
                            <strong style={{ color: '#F0EDE6' }}>Observations :</strong> {cr.observations}
                          </p>
                        )}

                        {cr.travaux_a_faire && (
                          <p
                            style={{
                              fontSize: '13px',
                              color: '#8A8880',
                              fontFamily: 'var(--font-dm-sans), sans-serif',
                              margin: 0,
                              lineHeight: '1.5',
                            }}
                          >
                            <strong style={{ color: '#F0EDE6' }}>Travaux à faire :</strong> {cr.travaux_a_faire}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
