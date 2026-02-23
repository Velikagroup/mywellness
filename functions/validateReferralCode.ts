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

        // Try to get current user, but mark coupon as used regardless
        let currentUser = null;
        try {
            currentUser = await base44.auth.me();
        } catch (e) {
            // User not logged in yet - that's OK
            console.log('⚠️ User not authenticated in quiz, but marking coupon as used anyway');
        }

        let userId = currentUser?.id || null;
        const usedAtTimestamp = new Date().toISOString();

        // Mark coupon as used NOW (when entered in quiz) - even if not logged in
        if (!coupon.used_by) {
            try {
                const updatePayload = {
                    used_at: usedAtTimestamp
                };
                
                // If user is logged in, save their ID; otherwise use a placeholder
                if (userId) {
                    updatePayload.used_by = userId;
                } else {
                    // Mark with email or anonymous + timestamp
                    updatePayload.used_by = `quiz_${usedAtTimestamp}`;
                }

                await base44.asServiceRole.entities.Coupon.update(coupon.id, updatePayload);
                console.log(`✅ Coupon ${upperCode} marked as used on ${usedAtTimestamp}`);
            } catch (updateError) {
                console.error('❌ Could not mark coupon as used:', updateError.message);
                return Response.json({ valid: false, error: 'Errore nell\'utilizzo del codice' });
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
            user_id: userId,
            used_at: usedAtTimestamp
        });

    } catch (error) {
        console.error('Error validating referral code:', error);
        return Response.json({ valid: false, error: error.message }, { status: 500 });
    }
});