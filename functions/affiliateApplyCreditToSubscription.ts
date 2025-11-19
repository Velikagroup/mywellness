import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { amount } = await req.json();

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

    // Aggiorna balance
    await base44.entities.AffiliateLink.update(affiliateLink.id, {
      available_balance: affiliateLink.available_balance - amount
    });

    // Marca crediti come usati per subscription
    const credits = await base44.entities.AffiliateCredit.filter({
      affiliate_user_id: user.id,
      commission_status: 'available'
    });

    let remaining = amount;
    for (const credit of credits) {
      if (remaining <= 0) break;
      
      const toUse = Math.min(remaining, credit.commission_amount);
      await base44.entities.AffiliateCredit.update(credit.id, {
        commission_status: 'used_for_subscription'
      });
      remaining -= toUse;
    }

    return Response.json({ 
      success: true,
      amount_used: amount,
      new_balance: affiliateLink.available_balance - amount
    });

  } catch (error) {
    console.error('Error applying credit:', error);
    return Response.json({ 
      error: 'Internal server error',
      details: error.message 
    }, { status: 500 });
  }
});