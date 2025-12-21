import { createClientFromRequest } from 'npm:@base44/sdk@0.8.3';

Deno.serve(async (req) => {
    console.log('📧 sendTestEmailDirect - Start');
    
    try {
        console.log('📦 Parsing request body...');
        const body = await req.json();
        console.log('📦 Body received:', JSON.stringify(body));
        const { to, from_email, from_name, reply_to, subject, html } = body;

        if (!to || !from_email || !subject || !html) {
            return Response.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const sendgridApiKey = Deno.env.get('SENDGRID_API_KEY');
        if (!sendgridApiKey) {
            return Response.json({ error: 'SendGrid API key not configured' }, { status: 500 });
        }

        console.log(`📬 Sending test email to ${to} from ${from_email}`);

        const payload = {
            personalizations: [{
                to: [{ email: to }]
            }],
            from: {
                email: from_email,
                name: from_name || 'MyWellness'
            },
            reply_to: reply_to ? {
                email: reply_to
            } : undefined,
            subject: subject,
            content: [{
                type: 'text/html',
                value: html
            }]
        };

        console.log('📤 SendGrid Payload:', JSON.stringify({
            to,
            from_email,
            from_name,
            reply_to,
            subject,
            htmlLength: html?.length
        }));

        // Chiama direttamente l'API SendGrid
        const sendgridResponse = await fetch('https://api.sendgrid.com/v3/mail/send', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${sendgridApiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (!sendgridResponse.ok) {
            const errorText = await sendgridResponse.text();
            console.error('❌ SendGrid API error response:', errorText);
            console.error('❌ Failed payload:', JSON.stringify(payload, null, 2));
            console.error('❌ Status code:', sendgridResponse.status);
            
            let errorDetails = errorText;
            try {
                const errorJson = JSON.parse(errorText);
                errorDetails = JSON.stringify(errorJson, null, 2);
            } catch (e) {
                // errorText is not JSON, keep as is
            }
            
            return Response.json({ 
                success: false,
                error: `SendGrid API error (${sendgridResponse.status})`,
                details: errorDetails,
                debugInfo: {
                    to,
                    from_email,
                    subject,
                    hasHtml: !!html,
                    htmlLength: html?.length
                }
            }, { status: sendgridResponse.status });
        }

        console.log('✅ Test email sent successfully via SendGrid API');

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