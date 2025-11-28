import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        let user;
        try {
            user = await base44.auth.me();
        } catch (authError) {
            console.error('Auth error:', authError);
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (!user || !user.email) {
            return Response.json({ error: 'User not found' }, { status: 401 });
        }

        let body;
        try {
            body = await req.json();
        } catch (parseError) {
            console.error('JSON parse error:', parseError);
            return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
        }

        const { event_type, event_data } = body;

        if (!event_type) {
            return Response.json({ error: 'event_type is required' }, { status: 400 });
        }

        console.log(`📊 Creating activity: ${event_type} for ${user.email}`);

        // Use service role to bypass RLS
        const result = await base44.asServiceRole.entities.UserActivity.create({
            user_id: user.email,
            event_type: event_type,
            event_data: event_data || {},
            completed: false
        });

        console.log(`✅ Activity tracked: ${event_type} for ${user.email}`, result);

        return Response.json({ success: true, id: result?.id });

    } catch (error) {
        console.error('❌ Error tracking activity:', error.message, error.stack);
        return Response.json({ error: error.message }, { status: 500 });
    }
});