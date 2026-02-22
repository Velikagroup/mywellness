import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe@14.21.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Prendi tutti i subscription in stato "trialing" da Stripe
    const trialingSubs = await stripe.subscriptions.list({
      status: 'trialing',
      limit: 100,
      expand: ['data.customer']
    });

    const trialUsers = trialingSubs.data.map(sub => ({
      email: sub.customer?.email || 'N/A',
      name: sub.customer?.name || 'N/A',
      trial_end: new Date(sub.trial_end * 1000).toISOString(),
      customer_id: sub.customer?.id,
      subscription_id: sub.id
    }));

    return Response.json({
      success: true,
      count: trialUsers.length,
      trial_users: trialUsers
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});