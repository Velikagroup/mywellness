import { createClientFromRequest } from 'npm:@base44/sdk@0.8.3';

Deno.serve(async (req) => {
    console.log('📧 sendTestEmailDirect - Start');
    
    try {
        const body = await req.json();
        const { to, subject, html } = body;

        if (!to || !subject || !html) {
            return Response.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const base44 = createClientFromRequest(req);
        
        console.log(`📬 Sending email to ${to}`);

        const result = await base44.asServiceRole.integrations.Core.SendEmail({
            to: to,
            subject: subject,
            body: html
        });

        console.log('✅ Email sent via Base44:', result);

        return Response.json({ 
            success: true,
            message: 'Email sent successfully'
        });

    } catch (error) {
        console.error('❌ Error:', error);
        return Response.json({ 
            error: error.message 
        }, { status: 500 });
    }
});