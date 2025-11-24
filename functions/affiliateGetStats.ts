import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Carica affiliate link
    const affiliateLinks = await base44.asServiceRole.entities.AffiliateLink.filter({ user_id: user.id });
    
    if (affiliateLinks.length === 0) {
      return Response.json({ 
        success: true,
        has_affiliate_link: false 
      });
    }

    const affiliateLink = affiliateLinks[0];

    // Carica tutti i crediti
    const allCredits = await base44.asServiceRole.entities.AffiliateCredit.filter({ 
      affiliate_user_id: user.id 
    });

    // Carica affiliati unici (paganti)
    const referredUserIds = [...new Set(allCredits.map(c => c.referred_user_id))];
    
    // Conta gli utenti unici che hanno fatto login con questo link (anche non paganti)
    const usersWithAffiliateCode = await base44.asServiceRole.entities.User.filter({
      referred_by_affiliate_code: affiliateLink.affiliate_code
    });
    const totalLinkClicks = usersWithAffiliateCode.length;
    
    // Carica prelievi
    const withdrawals = await base44.asServiceRole.entities.AffiliateWithdrawal.filter({ 
      user_id: user.id 
    });

    // Calcola statistiche
    const totalWithdrawn = withdrawals
      .filter(w => w.status === 'completed')
      .reduce((sum, w) => sum + w.amount, 0);

    const totalUsedForSubscription = allCredits
      .filter(c => c.commission_status === 'used_for_subscription')
      .reduce((sum, c) => sum + c.commission_amount, 0);

    const monthlyEarnings = {};
    allCredits.forEach(credit => {
      const month = credit.payment_date.substring(0, 7); // YYYY-MM
      if (!monthlyEarnings[month]) {
        monthlyEarnings[month] = 0;
      }
      monthlyEarnings[month] += credit.commission_amount;
    });

    return Response.json({ 
      success: true,
      has_affiliate_link: true,
      affiliate_code: affiliateLink.affiliate_code,
      affiliate_url: `https://app.projectmywellness.com?affiliate=${affiliateLink.affiliate_code}`,
      stats: {
        total_referrals: referredUserIds.length,
        total_link_clicks: totalLinkClicks,
        total_earned: affiliateLink.total_earned,
        available_balance: affiliateLink.available_balance,
        total_withdrawn: totalWithdrawn,
        total_used_for_subscription: totalUsedForSubscription,
        is_active: affiliateLink.is_active,
        onboarding_completed: affiliateLink.onboarding_completed
      },
      monthly_earnings: monthlyEarnings,
      recent_credits: allCredits.slice(-10).reverse()
    });

  } catch (error) {
    console.error('Error getting affiliate stats:', error);
    return Response.json({ 
      error: 'Internal server error',
      details: error.message 
    }, { status: 500 });
  }
});