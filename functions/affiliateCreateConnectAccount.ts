import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import Stripe from 'npm:stripe';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

Deno.serve(async (req) => {
  console.log('🚀 affiliateCreateConnectAccount - Start');
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      console.error('❌ No user authenticated');
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('✅ User authenticated:', user.id, user.email);

    // Carica affiliate link - usa asServiceRole per bypassare RLS
    console.log('🔍 Fetching affiliate links for user:', user.id);
    const affiliateLinks = await base44.asServiceRole.entities.AffiliateLink.filter({ user_id: user.id });
    
    if (affiliateLinks.length === 0) {
      console.error('❌ No affiliate link found for user:', user.id);
      return Response.json({ error: 'No affiliate link found' }, { status: 404 });
    }

    const affiliateLink = affiliateLinks[0];
    console.log('✅ Affiliate link found:', affiliateLink.id, affiliateLink.affiliate_code);

    // Se ha già un account, genera onboarding link
    if (affiliateLink.stripe_connect_account_id) {
      console.log('🔄 Account esistente, generando nuovo link onboarding:', affiliateLink.stripe_connect_account_id);
      const accountLink = await stripe.accountLinks.create({
        account: affiliateLink.stripe_connect_account_id,
        refresh_url: `${req.headers.get('origin')}/settings?tab=affiliate`,
        return_url: `${req.headers.get('origin')}/settings?tab=affiliate&onboarding=success`,
        type: 'account_onboarding',
      });

      console.log('✅ Account link creato:', accountLink.url);
      return Response.json({ 
        success: true, 
        onboarding_url: accountLink.url 
      });
    }

    // Crea nuovo Stripe Connect Account
    console.log('🆕 Creazione nuovo account Stripe Connect per:', user.email);
    
    try {
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
      console.log('✅ Account Stripe Connect creato:', account.id);
    } catch (stripeError) {
      console.error('❌ Stripe account creation failed:', stripeError.message);
      console.error('❌ Stripe error type:', stripeError.type);
      console.error('❌ Stripe error code:', stripeError.code);
      throw stripeError;
    }
    
    const account = { id: affiliateLink.stripe_connect_account_id };

    console.log('✅ Account Stripe Connect creato:', account.id);

    // Aggiorna affiliate link con account ID
    await base44.asServiceRole.entities.AffiliateLink.update(affiliateLink.id, {
      stripe_connect_account_id: account.id
    });

    console.log('✅ Affiliate link aggiornato con account ID');

    // Crea onboarding link
    console.log('🔗 Generazione account link per onboarding...');
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: `${req.headers.get('origin')}/settings?tab=affiliate`,
      return_url: `${req.headers.get('origin')}/settings?tab=affiliate&onboarding=success`,
      type: 'account_onboarding',
    });

    console.log('✅ Onboarding URL generato:', accountLink.url);
    return Response.json({ 
      success: true, 
      onboarding_url: accountLink.url 
    });

  } catch (error) {
    console.error('❌ Error creating Connect account:', error);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    // Dettaglio errore specifico per Stripe
    if (error.type) {
      console.error('Stripe error type:', error.type);
      console.error('Stripe error code:', error.code);
    }
    
    return Response.json({ 
      error: error.message || 'Internal server error',
      details: error.type || error.name,
      code: error.code
    }, { status: 500 });
  }
});