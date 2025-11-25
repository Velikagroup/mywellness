import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Controlla se ha già un link
    const existingLinks = await base44.asServiceRole.entities.AffiliateLink.filter({ user_id: user.id });
    
    if (existingLinks.length > 0) {
      const link = existingLinks[0];
      return Response.json({ 
        success: true, 
        affiliate_link: `https://projectmywellness.com?affiliate=${link.affiliate_code}`,
        affiliate_code: link.affiliate_code,
        stats: {
          total_referrals: link.total_referrals || 0,
          total_earned: link.total_earned || 0,
          available_balance: link.available_balance || 0
        }
      });
    }

    // Genera codice univoco basato su nome + random
    const firstName = user.full_name?.split(' ')[0]?.toUpperCase() || 'USER';
    const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    const affiliateCode = `${firstName}${randomSuffix}`;

    console.log('🔑 Generating new affiliate code:', affiliateCode);

    // Crea link affiliazione
    const affiliateLink = await base44.asServiceRole.entities.AffiliateLink.create({
      user_id: user.id,
      affiliate_code: affiliateCode,
      total_referrals: 0,
      total_earned: 0,
      available_balance: 0,
      is_active: user.subscription_status === 'active' || user.subscription_status === 'trial'
    });

    console.log('✅ Affiliate link created:', affiliateLink.id);

    return Response.json({ 
      success: true, 
      affiliate_link: `https://projectmywellness.com?affiliate=${affiliateCode}`,
      affiliate_code: affiliateCode,
      stats: {
        total_referrals: 0,
        total_earned: 0,
        available_balance: 0
      }
    });

  } catch (error) {
    console.error('Error generating affiliate link:', error);
    console.error('Error stack:', error.stack);
    console.error('Error name:', error.name);
    return Response.json({ 
      error: 'Internal server error',
      details: error.message,
      name: error.name
    }, { status: 500 });
  }
});