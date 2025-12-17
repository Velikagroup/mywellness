import { createClientFromRequest } from 'npm:@base44/sdk@0.8.3';

Deno.serve(async (req) => {
    console.log('📧 sendTestEmailDirect - Start');
    
    try {
        console.log('🔧 Creating base44 client...');
        const base44 = createClientFromRequest(req);
        
        console.log('👤 Getting user...');
        // Verifica che l'utente sia admin
        const user = await base44.auth.me();
        console.log('👤 User:', user?.email, 'Role:', user?.role);
        
        if (!user || user.role !== 'admin') {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        console.log('📦 Parsing request body...');
        const body = await req.json();
        console.log('📦 Body keys:', Object.keys(body));
        const { to, from_email, from_name, reply_to, subject, html } = body;

        if (!to || !from_email || !subject || !html) {
            return Response.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const sendgridApiKey = Deno.env.get('SENDGRID_API_KEY');
        if (!sendgridApiKey) {
            return Response.json({ error: 'SendGrid API key not configured' }, { status: 500 });
        }

        console.log(`📬 Sending test email to ${to} from ${from_email}`);

        // Chiama direttamente l'API SendGrid
        const sendgridResponse = await fetch('https://api.sendgrid.com/v3/mail/send', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${sendgridApiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
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
            })
        });

        if (!sendgridResponse.ok) {
            const errorText = await sendgridResponse.text();
            console.error('❌ SendGrid API error:', errorText);
            return Response.json({ 
                error: 'SendGrid API error',
                details: errorText 
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