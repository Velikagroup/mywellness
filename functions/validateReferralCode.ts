import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const { code } = await req.json();

        if (!code) {
            return Response.json({ valid: false, error: 'Codice mancante' });
        }

        const upperCode = code.toUpperCase();

        // Check coupon (service role bypasses RLS)
        const coupons = await base44.asServiceRole.entities.Coupon.filter({
            code: upperCode,
            is_active: true
        });

        if (coupons.length === 0) {
            return Response.json({ valid: false });
        }

        const coupon = coupons[0];

        // Check expiry
        if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
            return Response.json({ valid: false, error: 'Codice scaduto' });
        }

        // Check if already used (used_by set and not a quiz/trial placeholder)
        if (coupon.used_by && !coupon.used_by.startsWith('quiz_') && !coupon.used_by.startsWith('trial_')) {
            return Response.json({ valid: false, error: 'Codice già utilizzato' });
        }

        console.log(`✅ Coupon ${upperCode} validated in quiz`);

        // Check if linked to an influencer
        let influencer_id = null;
        const influencers = await base44.asServiceRole.entities.Influencer.filter({
            referral_code: upperCode
        });
        if (influencers.length > 0) {
            influencer_id = influencers[0].id;
        }

        return Response.json({
            valid: true,
            coupon_id: coupon.id,
            discount_type: coupon.discount_type,
            discount_value: coupon.discount_value || 0,
            influencer_id
        });

    } catch (error) {
        console.error('Error validating referral code:', error);
        return Response.json({ valid: false, error: error.message }, { status: 500 });
    }
});