'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export type Plan = 'free' | 'essentiel' | 'complet'

export function usePlan() {
  // Default 'complet' pendant le dev — aucun blocage tant que la colonne n'est pas en prod
  const [plan, setPlan] = useState<Plan>('complet')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchPlan() {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user?.id) { setLoading(false); return }

      const { data } = await supabase
        .from('profiles')
        .select('plan')
        .eq('id', session.user.id)
        .single()

      if (data?.plan) setPlan(data.plan as Plan)
      // Si plan null/absent → on garde 'complet' (défaut dev)
      setLoading(false)
    }
    fetchPlan()
  }, [])

  return {
    plan,
    loading,
    isFree:      plan === 'free',
    isEssentiel: plan === 'essentiel' || plan === 'complet',
    isComplet:   plan === 'complet',
  }
}
