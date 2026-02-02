import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (user?.role !== 'admin') {
            return Response.json({ error: 'Admin only' }, { status: 403 });
        }

        const { userId } = await req.json();

        await base44.asServiceRole.entities.User.update(userId, {
            goal_achieved_email_sent: false,
            goal_achieved_date: null
        });

        console.log(`✅ Reset goal flag for user ${userId}`);

        return Response.json({ success: true });
    } catch (error) {
        console.error('Error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});