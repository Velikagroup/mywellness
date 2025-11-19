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

    const { amount } = await req.json();

    if (!amount || amount < 10) {
      return Response.json({ 
        error: 'Importo minimo di prelievo: €10' 
      }, { status: 400 });
    }

    // Carica affiliate link
    const affiliateLinks = await base44.entities.AffiliateLink.filter({ user_id: user.id });
    
    if (affiliateLinks.length === 0) {
      return Response.json({ error: 'No affiliate link found' }, { status: 404 });
    }

    const affiliateLink = affiliateLinks[0];

    // Verifica credito disponibile
    if (affiliateLink.available_balance < amount) {
      return Response.json({ 
        error: `Credito insufficiente. Disponibile: €${affiliateLink.available_balance.toFixed(2)}` 
      }, { status: 400 });
    }

    // Verifica onboarding completato
    if (!affiliateLink.onboarding_completed || !affiliateLink.stripe_connect_account_id) {
      return Response.json({ 
        error: 'Completa prima l\'onboarding Stripe Connect' 
      }, { status: 400 });
    }

    // Crea richiesta di prelievo
    const withdrawal = await base44.entities.AffiliateWithdrawal.create({
      user_id: user.id,
      amount: amount,
      status: 'processing',
      requested_date: new Date().toISOString()
    });

    try {
      // Crea transfer su Stripe Connect
      const transfer = await stripe.transfers.create({
        amount: Math.round(amount * 100), // Converti in centesimi
        currency: 'eur',
        destination: affiliateLink.stripe_connect_account_id,
        metadata: {
          withdrawal_id: withdrawal.id,
          user_id: user.id
        }
      });

      // Aggiorna withdrawal
      await base44.entities.AffiliateWithdrawal.update(withdrawal.id, {
        status: 'completed',
        stripe_payout_id: transfer.id,
        completed_date: new Date().toISOString()
      });

      // Aggiorna balance affiliante
      await base44.entities.AffiliateLink.update(affiliateLink.id, {
        available_balance: affiliateLink.available_balance - amount
      });

      // Aggiorna crediti come withdrawn
      const credits = await base44.entities.AffiliateCredit.filter({
        affiliate_user_id: user.id,
        commission_status: 'available'
      });

      let remaining = amount;
      for (const credit of credits) {
        if (remaining <= 0) break;
        
        const toWithdraw = Math.min(remaining, credit.commission_amount);
        await base44.entities.AffiliateCredit.update(credit.id, {
          commission_status: 'withdrawn'
        });
        remaining -= toWithdraw;
      }

      return Response.json({ 
        success: true,
        withdrawal,
        transfer_id: transfer.id
      });

    } catch (stripeError) {
      // Aggiorna withdrawal come failed
      await base44.entities.AffiliateWithdrawal.update(withdrawal.id, {
        status: 'failed',
        failure_reason: stripeError.message
      });

      throw stripeError;
    }

  } catch (error) {
    console.error('Error processing withdrawal:', error);
    return Response.json({ 
      error: 'Internal server error',
      details: error.message 
    }, { status: 500 });
  }
});