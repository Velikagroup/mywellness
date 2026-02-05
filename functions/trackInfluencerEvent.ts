import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const { influencerId, eventType } = await req.json();

        if (!influencerId || !eventType) {
            return Response.json({ error: 'Missing influencerId or eventType' }, { status: 400 });
        }

        // Get current influencer data
        const influencers = await base44.asServiceRole.entities.Influencer.filter({ id: influencerId });
        
        if (influencers.length === 0) {
            return Response.json({ error: 'Influencer not found' }, { status: 404 });
        }

        const influencer = influencers[0];
        const updateData = {};

        // Increment the appropriate counter based on event type
        if (eventType === 'quiz_confirmed') {
            const currentCount = influencer.referral_code_confirmed_count || 0;
            updateData.referral_code_confirmed_count = currentCount + 1;
            console.log(`✅ Quiz confirmed: ${currentCount} → ${currentCount + 1}`);
        } else if (eventType === 'email_registered') {
            const currentCount = influencer.email_registered_count || 0;
            updateData.email_registered_count = currentCount + 1;
            console.log(`✅ Email registered: ${currentCount} → ${currentCount + 1}`);
        } else if (eventType === 'subscription_activated') {
            const currentCount = influencer.subscription_activated_count || 0;
            updateData.subscription_activated_count = currentCount + 1;
            console.log(`✅ Subscription activated: ${currentCount} → ${currentCount + 1}`);
        } else {
            return Response.json({ error: 'Invalid eventType' }, { status: 400 });
        }

        // Update using service role to bypass RLS
        await base44.asServiceRole.entities.Influencer.update(influencerId, updateData);

        return Response.json({ 
            success: true, 
            influencerId,
            eventType,
            newCount: updateData[Object.keys(updateData)[0]]
        });

    } catch (error) {
        console.error('Error tracking influencer event:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});