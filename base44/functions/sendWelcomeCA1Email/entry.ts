import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const TEMPLATE_MAP = {
    it: 'aca1f873-3063-48db-bec8-3ab3c5a79b4b',
    es: '95beec35-9339-4887-8136-c8276c3c277d',
    en: 'c04f6d33-a8c8-4e46-86b8-f32c36ee0e53',
    pt: '785881ea-f854-47a5-89e7-06a20ae15f09',
    de: '3c352309-b5e4-440f-95a6-e229f4ff5b23',
    fr: 'e78548fe-189d-4d59-a0ae-03d8b7449dac',
};
const FALLBACK_TEMPLATE = 'c04f6d33-a8c8-4e46-86b8-f32c36ee0e53';
const FROM_EMAIL = 'info@notifications.projectmywellness.com';

async function sendForSingleUser(base44, email, language, full_name, user_id) {
    const templateId = TEMPLATE_MAP[String(language).toLowerCase()] || FALLBACK_TEMPLATE;
    console.log('Sending template', templateId, 'to', email);

    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (!resendApiKey) throw new Error('RESEND_API_KEY not configured');

    const payload = {
        from: 'MyWellness <' + FROM_EMAIL + '>',
        to: [email],
        template: {
            id: templateId,
            variables: { user_name: full_name || email.split('@')[0] }
        }
    };

    const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
            'Authorization': 'Bearer ' + resendApiKey,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    });

    const result = await response.json();
    console.log('Resend response status:', response.status, JSON.stringify(result));

    if (!response.ok) {
        throw new Error('Resend API failed: ' + (result.message || 'Unknown error'));
    }

    try {
        await base44.asServiceRole.entities.EmailLog.create({
            user_id: user_id || '',
            user_email: email,
            template_id: templateId,
            subject: 'CA 1 Welcome',
            status: 'sent',
            provider: 'sendgrid',
            from_email: FROM_EMAIL,
            language: language || 'en',
            sent_at: new Date().toISOString(),
            trigger_source: 'sendWelcomeCA1Email',
            sendgrid_message_id: result.id,
            metadata: { template_id: templateId }
        });
    } catch (logError) {
        console.warn('Failed to save email log:', logError.message);
    }

    return { success: true, templateId: templateId, messageId: result.id };
}

Deno.serve(async (req) => {
    console.log('sendWelcomeCA1Email - Start');

    try {
        const base44 = createClientFromRequest(req);
        const body = await req.json().catch(() => ({}));
        console.log('Body:', JSON.stringify(body));

        if (body.user_email) {
            const result = await sendForSingleUser(
                base44,
                body.user_email,
                body.user_language || 'en',
                body.full_name || '',
                body.user_id || ''
            );
            return Response.json(result);
        }

        // Cron mode: cerca utenti registrati tra 28 e 35 min fa
        const now = new Date();
        const minAgo28 = new Date(now.getTime() - 28 * 60 * 1000).toISOString();
        const minAgo35 = new Date(now.getTime() - 35 * 60 * 1000).toISOString();

        console.log('Looking for users registered between', minAgo35, 'and', minAgo28);

        const allUsers = await base44.asServiceRole.entities.User.list('-created_date', 200);
        const targetUsers = allUsers.filter(function(u) {
            if (!u.created_date) return false;
            return u.created_date >= minAgo35 && u.created_date <= minAgo28;
        });

        console.log('Found', targetUsers.length, 'users in window');

        const results = [];
        for (const user of targetUsers) {
            const existingLogs = await base44.asServiceRole.entities.EmailLog.filter({
                user_email: user.email,
                trigger_source: 'sendWelcomeCA1Email'
            });

            if (existingLogs.length > 0) {
                console.log('Skipping', user.email, '- already sent');
                continue;
            }

            const result = await sendForSingleUser(
                base44,
                user.email,
                user.preferred_language || 'en',
                user.full_name || '',
                user.id
            );
            results.push({ email: user.email, result: result });
        }

        return Response.json({ success: true, processed: results.length, results: results });

    } catch (error) {
        console.error('sendWelcomeCA1Email error:', error.message);
        return Response.json({ success: false, error: error.message }, { status: 500 });
    }
});