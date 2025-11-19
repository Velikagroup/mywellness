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

    const affiliateLinks = await base44.entities.AffiliateLink.filter({ user_id: user.id });
    
    if (affiliateLinks.length === 0 || !affiliateLinks[0].stripe_connect_account_id) {
      return Response.json({ 
        success: true,
        onboarding_completed: false 
      });
    }

    const affiliateLink = affiliateLinks[0];
    
    // Verifica stato account Stripe
    const account = await stripe.accounts.retrieve(affiliateLink.stripe_connect_account_id);

    const onboardingCompleted = account.charges_enabled && account.payouts_enabled;

    // Aggiorna stato
    if (onboardingCompleted && !affiliateLink.onboarding_completed) {
      await base44.entities.AffiliateLink.update(affiliateLink.id, {
        onboarding_completed: true
      });
    }

    return Response.json({ 
      success: true,
      onboarding_completed: onboardingCompleted,
      account_status: {
        charges_enabled: account.charges_enabled,
        payouts_enabled: account.payouts_enabled,
        details_submitted: account.details_submitted
      }
    });

  } catch (error) {
    console.error('Error checking Connect status:', error);
    return Response.json({ 
      error: 'Internal server error',
      details: error.message 
    }, { status: 500 });
  }
});