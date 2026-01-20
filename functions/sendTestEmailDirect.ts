import { createClientFromRequest } from 'npm:@base44/sdk@0.8.3';

Deno.serve(async (req) => {
    console.log('📧 sendTestEmailDirect - Start');
    
    try {
        console.log('📦 Parsing request body...');
        const body = await req.json();
        console.log('📦 Body received:', JSON.stringify(body));
        const { to, from_email, from_name, reply_to, subject, html } = body;

        if (!to || !subject || !html) {
            return Response.json({ error: 'Missing required fields: to, subject, html' }, { status: 400 });
        }

        const base44 = createClientFromRequest(req);
        console.log(`📬 Sending test email to ${to}`);

        // Usa Base44 Core SendEmail
        const result = await base44.asServiceRole.integrations.Core.SendEmail({
            to: to,
            subject: subject,
            body: html
        });

        console.log('✅ Test email sent successfully via Base44 Core', result);

        return Response.json({ 
            success: true,
            message: 'Test email sent successfully'
        });

    } catch (error) {
        console.error('❌ Error sending test email:', error);
        return Response.json({ 
            error: error.message 
        }, { status: 500 });
    }
});