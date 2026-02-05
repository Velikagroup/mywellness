import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (user?.role !== 'admin') {
            return Response.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const { userId, referralCode, influencerId } = await req.json();

        if (!userId || !referralCode || !influencerId) {
            return Response.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Update usando service role
        await base44.asServiceRole.entities.User.update(userId, {
            influencer_referral_code: referralCode,
            influencer_id: influencerId,
            subscription_status: 'trial'
        });

        return Response.json({ success: true });
    } catch (error) {
        console.error('Error updating user referral:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});