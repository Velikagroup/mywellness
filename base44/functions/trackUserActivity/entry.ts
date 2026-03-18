import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
    console.log('🚀 trackUserActivity called');
    
    try {
        const base44 = createClientFromRequest(req);
        console.log('✅ SDK initialized');
        
        const user = await base44.auth.me();
        console.log('✅ User:', user?.email);

        if (!user || !user.email) {
            console.log('❌ No user');
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        console.log('✅ Body:', JSON.stringify(body));
        
        const { event_type, event_data, utm_params } = body;

        if (!event_type) {
            return Response.json({ error: 'event_type is required' }, { status: 400 });
        }

        console.log(`📊 Creating: ${event_type} for ${user.email}`);
        if (utm_params) {
            console.log(`📈 UTM params:`, JSON.stringify(utm_params));
        }

        // Use service role to bypass RLS
        await base44.asServiceRole.entities.UserActivity.create({
            user_id: user.email,
            event_type: event_type,
            event_data: event_data || {},
            utm_params: utm_params || {},
            completed: false
        });

        console.log(`✅ Done`);
        return Response.json({ success: true });

    } catch (error) {
        console.error('❌ ERROR:', error);
        return Response.json({ 
            error: error.message || 'Unknown error',
            stack: error.stack 
        }, { status: 500 });
    }
});