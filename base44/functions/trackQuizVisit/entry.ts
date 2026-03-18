import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const body = await req.json();
        const { language, user_identifier } = body;

        if (!language) {
            return Response.json({ error: 'language is required' }, { status: 400 });
        }

        await base44.asServiceRole.entities.UserActivity.create({
            user_id: user_identifier || 'anonymous',
            event_type: 'quiz_started',
            event_data: { language: language },
            completed: false
        });

        return Response.json({ success: true });
    } catch (error) {
        console.error('Error tracking quiz visit:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});