import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-03-25.dahlia' })

const PRICE_TO_PLAN: Record<string, string> = {
  [process.env.STRIPE_PRICE_ESSENTIEL ?? '']: 'essentiel',
  [process.env.STRIPE_PRICE_COMPLET   ?? '']: 'complet',
}

export async function POST(req: NextRequest) {
  try {
    const { priceId } = await req.json()

    if (!priceId || !PRICE_TO_PLAN[priceId]) {
      return NextResponse.json({ error: 'Price ID invalide' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

    // Récupérer ou créer le customer Stripe
    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single()

    let customerId = profile?.stripe_customer_id

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { supabase_user_id: user.id },
      })
      customerId = customer.id
      await supabase
        .from('profiles')
        .update({ stripe_customer_id: customerId })
        .eq('id', user.id)
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${baseUrl}/dashboard?upgraded=true`,
      cancel_url: `${baseUrl}/tarifs`,
      metadata: { supabase_user_id: user.id, price_id: priceId },
      subscription_data: {
        metadata: { supabase_user_id: user.id, price_id: priceId },
      },
    })

    return NextResponse.json({ url: session.url })
  } catch (err) {
    console.error('[stripe/checkout]', err)
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}
