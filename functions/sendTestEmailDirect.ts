import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const body = await req.json();
        const { to, subject, html } = body;

        if (!to || !subject || !html) {
            return Response.json({ error: 'Missing required fields' }, { status: 400 });
        }

        console.log(`📬 Sending test email to ${to}`);

        const result = await base44.asServiceRole.integrations.Core.SendEmail({
            to: to,
            subject: subject,
            body: html
        });

        console.log('✅ Email sent via Base44 Core');

        return Response.json({ 
            success: true,
            message: 'Email sent successfully',
            messageId: result?.message_id
        });

    } catch (error) {
        console.error('❌ Error:', error.message);
        return Response.json({ 
            error: error.message 
        }, { status: 500 });
    }
});