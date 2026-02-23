import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe@14.21.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

async function getAllSubscriptions(status) {
  const subs = [];
  let hasMore = true;
  let startingAfter = undefined;

  while (hasMore) {
    const params = {
      status,
      limit: 100,
      expand: ['data.customer']
    };
    if (startingAfter) params.starting_after = startingAfter;

    const batch = await stripe.subscriptions.list(params);
    subs.push(...batch.data);
    hasMore = batch.has_more;
    if (hasMore) startingAfter = batch.data[batch.data.length - 1].id;
  }
  return subs;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Prendi tutte le subscription attive e trialing in parallelo
    const [activeSubs, trialingSubs] = await Promise.all([
      getAllSubscriptions('active'),
      getAllSubscriptions('trialing')
    ]);

    // Determina mensile vs annuale guardando l'intervallo del price
    const monthlyActive = activeSubs.filter(sub => {
      const interval = sub.items?.data?.[0]?.price?.recurring?.interval;
      return interval === 'month';
    });

    const yearlyActive = activeSubs.filter(sub => {
      const interval = sub.items?.data?.[0]?.price?.recurring?.interval;
      return interval === 'year';
    });

    return Response.json({
      success: true,
      monthly: {
        count: monthlyActive.length,
        users: monthlyActive.map(s => ({
          email: s.customer?.email || 'N/A',
          customer_id: s.customer?.id,
          subscription_id: s.id,
          current_period_end: new Date(s.current_period_end * 1000).toISOString()
        }))
      },
      yearly: {
        count: yearlyActive.length,
        users: yearlyActive.map(s => ({
          email: s.customer?.email || 'N/A',
          customer_id: s.customer?.id,
          subscription_id: s.id,
          current_period_end: new Date(s.current_period_end * 1000).toISOString()
        }))
      },
      trialing: {
        count: trialingSubs.length,
        users: trialingSubs.map(s => ({
          email: s.customer?.email || 'N/A',
          customer_id: s.customer?.id,
          subscription_id: s.id,
          trial_end: new Date(s.trial_end * 1000).toISOString()
        }))
      }
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});