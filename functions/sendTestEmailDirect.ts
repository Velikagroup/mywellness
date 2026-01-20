import { createClientFromRequest } from 'npm:@base44/sdk@0.8.3';

Deno.serve(async (req) => {
    console.log('📧 sendTestEmailDirect - Start');
    
    try {
        console.log('📦 Parsing request body...');
        const body = await req.json();
        const { to, subject, html } = body;

        if (!to || !subject || !html) {
            return Response.json({ error: 'Missing required fields: to, subject, html' }, { status: 400 });
        }

        const sendgridApiKey = Deno.env.get('SENDGRID_API_KEY');
        if (!sendgridApiKey) {
            console.error('❌ SENDGRID_API_KEY not configured');
            return Response.json({ error: 'SendGrid API key not configured' }, { status: 500 });
        }

        console.log(`📬 Sending to ${to}`);

        const payload = {
            personalizations: [{
                to: [{ email: to }]
            }],
            from: {
                email: 'info@projectmywellness.com',
                name: 'MyWellness'
            },
            subject: subject,
            content: [{
                type: 'text/html',
                value: html
            }]
        };

        const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${sendgridApiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        console.log(`📧 SendGrid Response Status: ${response.status}`);

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`❌ SendGrid error (${response.status}):`, errorText);
            return Response.json({ 
                success: false,
                error: `SendGrid API error (${response.status})`,
                details: errorText
            }, { status: response.status });
        }

        console.log('✅ Email sent successfully via SendGrid');

        return Response.json({ 
            success: true,
            message: 'Test email sent successfully'
        });

    } catch (error) {
        console.error('❌ Error:', error);
        return Response.json({ 
            error: error.message 
        }, { status: 500 });
    }
});