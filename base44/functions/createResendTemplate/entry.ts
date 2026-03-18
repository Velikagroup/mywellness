import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (user?.role !== 'admin') {
            return Response.json({ error: 'Unauthorized - Admin only' }, { status: 403 });
        }

        const resendApiKey = Deno.env.get('RESEND_API_KEY');
        if (!resendApiKey) {
            return Response.json({ error: 'RESEND_API_KEY not configured' }, { status: 500 });
        }

        // Template HTML per "Reminder Rinnovo Piano - 48h"
        const htmlTemplate = `
<!DOCTYPE html>
<html lang="it">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reminder: Rinnovo Piano Annuale MyWellness</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background-color: #f3f4f6;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
        }
        .header {
            background: linear-gradient(135deg, #26847F 0%, #1f6b66 100%);
            padding: 40px 20px;
            text-align: center;
            color: #ffffff;
        }
        .header h1 {
            margin: 0 0 10px 0;
            font-size: 28px;
            font-weight: 700;
        }
        .header p {
            margin: 0;
            font-size: 16px;
            opacity: 0.95;
        }
        .content {
            padding: 40px 30px;
            color: #1f2937;
            line-height: 1.6;
        }
        .greeting {
            font-size: 18px;
            font-weight: 600;
            margin-bottom: 20px;
            color: #111827;
        }
        .main-text {
            font-size: 16px;
            margin-bottom: 20px;
            color: #374151;
        }
        .main-text p {
            margin: 0 0 15px 0;
        }
        .footer {
            background-color: #f9fafb;
            padding: 30px 20px;
            text-align: center;
            color: #6b7280;
            font-size: 14px;
        }
        .footer-signature {
            margin-top: 20px;
            font-weight: 600;
            color: #26847F;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>⏰ Reminder Importante</h1>
            <p>Rinnovo del tuo piano</p>
        </div>
        
        <div class="content">
            <div class="greeting">
                Ciao {{user_name}},
            </div>
            
            <div class="main-text">
                <p>Ti scriviamo per ricordarti che, qualora tu non abbia ancora effettuato la cancellazione del Piano Annuale MyWellness, entro 24 ore verrà elaborato il relativo pagamento.</p>
                
                <p>Nel caso in cui tu abbia già premuto il pulsante di cancellazione dal tuo pannello personale, puoi tranquillamente ignorare questa e-mail!</p>
            </div>
        </div>
        
        <div class="footer">
            <div class="footer-signature">
                Il Team MyWellness
            </div>
        </div>
    </div>
</body>
</html>
`;

        // Crea il template su Resend
        const response = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${resendApiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                from: 'MyWellness <info@projectmywellness.com>',
                to: ['test@example.com'], // Resend richiede un destinatario anche per i template
                subject: '⏰ Reminder: Rinnovo Piano Annuale MyWellness',
                html: htmlTemplate
            })
        });

        const data = await response.json();

        if (!response.ok) {
            console.error('Resend API error:', data);
            return Response.json({ 
                error: 'Failed to create template on Resend', 
                details: data 
            }, { status: response.status });
        }

        return Response.json({ 
            success: true, 
            message: 'Template created successfully on Resend',
            templateId: data.id,
            htmlPreview: htmlTemplate.substring(0, 500) + '...'
        });

    } catch (error) {
        console.error('Error creating Resend template:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});