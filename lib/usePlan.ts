'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export type Plan = 'essentiel' | 'pro'

interface PlanState {
  plan: Plan | null
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  loading: boolean
  isEssentiel: boolean
  isPro: boolean
  /** @deprecated alias pour isPro */
  isComplet: boolean
}

export function usePlan(): PlanState {
  const [plan, setPlan] = useState<Plan | null>(null)
  const [stripeCustomerId, setStripeCustomerId] = useState<string | null>(null)
  const [stripeSubscriptionId, setStripeSubscriptionId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchPlan() {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user?.id) { setLoading(false); return }

      const { data } = await supabase
        .from('profiles')
        .select('plan, stripe_customer_id, stripe_subscription_id')
        .eq('id', session.user.id)
        .single()

      const resolvedPlan: Plan = (data?.plan === 'pro') ? 'pro' : 'essentiel'
      setPlan(resolvedPlan)
      setStripeCustomerId(data?.stripe_customer_id ?? null)
      setStripeSubscriptionId(data?.stripe_subscription_id ?? null)
      setLoading(false)
    }
    fetchPlan()
  }, [])

  const isPro = plan === 'pro'
  const isEssentiel = plan === 'essentiel' || plan === 'pro'

  return {
    plan,
    stripe_customer_id: stripeCustomerId,
    stripe_subscription_id: stripeSubscriptionId,
    loading,
    isEssentiel,
    isPro,
    isComplet: isPro,
  }
}
