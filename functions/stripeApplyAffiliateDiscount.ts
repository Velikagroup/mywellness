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

    const { affiliate_code } = await req.json();

    if (!affiliate_code) {
      return Response.json({ error: 'Codice affiliazione richiesto' }, { status: 400 });
    }

    // Verifica codice affiliazione
    const affiliateLinks = await base44.asServiceRole.entities.AffiliateLink.filter({ 
      affiliate_code: affiliate_code.toUpperCase() 
    });

    if (affiliateLinks.length === 0) {
      return Response.json({ error: 'Codice affiliazione non valido' }, { status: 404 });
    }

    const affiliateLink = affiliateLinks[0];

    // Verifica che l'affiliante abbia subscription attiva
    const affiliateUser = await base44.asServiceRole.entities.User.filter({ id: affiliateLink.user_id });
    
    if (affiliateUser.length === 0 || 
        (affiliateUser[0].subscription_status !== 'active' && affiliateUser[0].subscription_status !== 'trial')) {
      return Response.json({ 
        error: 'Questo link di affiliazione non è più attivo' 
      }, { status: 400 });
    }

    // Non può affiliare se stesso
    if (affiliateLink.user_id === user.id) {
      return Response.json({ 
        error: 'Non puoi usare il tuo stesso codice affiliazione' 
      }, { status: 400 });
    }

    // Crea o aggiorna coupon Stripe per 20% sconto
    let couponId = `AFFILIATE_${affiliate_code}`;
    
    try {
      await stripe.coupons.retrieve(couponId);
    } catch (error) {
      // Coupon non existe, crealo
      await stripe.coupons.create({
        id: couponId,
        percent_off: 20,
        duration: 'once',
        name: `Sconto Affiliazione ${affiliate_code}`,
        metadata: {
          affiliate_code: affiliate_code,
          affiliate_user_id: affiliateLink.user_id,
          type: 'affiliate_discount'
        }
      });
    }

    // Salva codice affiliazione sull'utente
    await base44.asServiceRole.entities.User.update(user.id, {
      referred_by_affiliate_code: affiliate_code
    });

    // Incrementa contatore referral
    await base44.asServiceRole.entities.AffiliateLink.update(affiliateLink.id, {
      total_referrals: affiliateLink.total_referrals + 1
    });

    return Response.json({ 
      success: true,
      coupon_id: couponId,
      discount_percent: 20,
      message: '🎉 Sconto del 20% applicato sul primo mese!'
    });

  } catch (error) {
    console.error('Error applying affiliate discount:', error);
    return Response.json({ 
      error: 'Internal server error',
      details: error.message 
    }, { status: 500 });
  }
});