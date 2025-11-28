import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { event_type, event_data } = await req.json();

        if (!event_type) {
            return Response.json({ error: 'event_type is required' }, { status: 400 });
        }

        // Use service role to bypass RLS
        await base44.asServiceRole.entities.UserActivity.create({
            user_id: user.email,
            event_type: event_type,
            event_data: event_data || {},
            completed: false
        });

        console.log(`✅ Activity tracked: ${event_type} for ${user.email}`);

        return Response.json({ success: true });

    } catch (error) {
        console.error('❌ Error tracking activity:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});