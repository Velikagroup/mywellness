import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import Stripe from 'npm:stripe';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Carica affiliate link
    const affiliateLinks = await base44.entities.AffiliateLink.filter({ user_id: user.id });
    
    if (affiliateLinks.length === 0) {
      return Response.json({ error: 'No affiliate link found' }, { status: 404 });
    }

    const affiliateLink = affiliateLinks[0];

    // Se ha già un account, genera onboarding link
    if (affiliateLink.stripe_connect_account_id) {
      const accountLink = await stripe.accountLinks.create({
        account: affiliateLink.stripe_connect_account_id,
        refresh_url: `${req.headers.get('origin')}/settings?tab=affiliate`,
        return_url: `${req.headers.get('origin')}/settings?tab=affiliate&onboarding=success`,
        type: 'account_onboarding',
      });

      return Response.json({ 
        success: true, 
        onboarding_url: accountLink.url 
      });
    }

    // Crea nuovo Stripe Connect Account
    const account = await stripe.accounts.create({
      type: 'express',
      country: 'IT',
      email: user.email,
      capabilities: {
        transfers: { requested: true },
      },
      metadata: {
        user_id: user.id,
        affiliate_code: affiliateLink.affiliate_code
      }
    });

    // Aggiorna affiliate link con account ID
    await base44.entities.AffiliateLink.update(affiliateLink.id, {
      stripe_connect_account_id: account.id
    });

    // Crea onboarding link
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: `${req.headers.get('origin')}/settings?tab=affiliate`,
      return_url: `${req.headers.get('origin')}/settings?tab=affiliate&onboarding=success`,
      type: 'account_onboarding',
    });

    return Response.json({ 
      success: true, 
      onboarding_url: accountLink.url 
    });

  } catch (error) {
    console.error('Error creating Connect account:', error);
    return Response.json({ 
      error: 'Internal server error',
      details: error.message 
    }, { status: 500 });
  }
});