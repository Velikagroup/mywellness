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

        // Get current user for marking coupon as used
        const currentUser = await base44.auth.me();
        let userId = currentUser?.id || null;

        // Mark coupon as used NOW (when entered in quiz)
        if (userId && !coupon.used_by) {
            try {
                await base44.asServiceRole.entities.Coupon.update(coupon.id, {
                    used_by: userId,
                    used_at: new Date().toISOString()
                });
                console.log(`✅ Coupon ${upperCode} marked as used by ${userId} in quiz`);
            } catch (updateError) {
                console.warn('⚠️ Could not mark coupon as used:', updateError.message);
            }
        }

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
            influencer_id,
            user_id: userId
        });

    } catch (error) {
        console.error('Error validating referral code:', error);
        return Response.json({ valid: false, error: error.message }, { status: 500 });
    }
});