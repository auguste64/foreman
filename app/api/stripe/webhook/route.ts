import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-03-25.dahlia' })
}

function supabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

const PRICE_TO_PLAN: Record<string, string> = {
  [process.env.STRIPE_PRICE_ESSENTIEL ?? '']: 'essentiel',
  [process.env.STRIPE_PRICE_PRO   ?? '']: 'pro',
}

export async function POST(req: NextRequest) {
  const stripe = getStripe()
  const body = await req.text()
  const sig  = req.headers.get('stripe-signature') ?? ''

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err) {
    console.error('[stripe/webhook] Signature invalide:', err)
    return NextResponse.json({ error: 'Signature invalide' }, { status: 400 })
  }

  const supabase = supabaseAdmin()

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const userId  = session.metadata?.supabase_user_id
    const priceId = session.metadata?.price_id
    const plan    = priceId ? (PRICE_TO_PLAN[priceId] ?? null) : null

    if (userId && plan) {
      await supabase
        .from('profiles')
        .update({
          plan,
          stripe_customer_id: session.customer as string,
          stripe_subscription_id: session.subscription as string,
        })
        .eq('id', userId)
    }
  }

  if (event.type === 'customer.subscription.deleted') {
    const sub    = event.data.object as Stripe.Subscription
    const userId = sub.metadata?.supabase_user_id

    if (userId) {
      await supabase
        .from('profiles')
        .update({ plan: 'gratuit', stripe_subscription_id: null })
        .eq('id', userId)
    }
  }

  return NextResponse.json({ received: true })
}