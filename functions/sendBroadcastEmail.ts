import { createClientFromRequest } from 'npm:@base44/sdk@0.8.3';

Deno.serve(async (req) => {
    console.log('📧 sendBroadcastEmail - Start');
    
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        // Solo admin possono inviare broadcast
        if (!user || user.role !== 'admin') {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { subject, body: emailBody, segment = 'all' } = body;

        if (!subject || !emailBody) {
            return Response.json({ error: 'Missing subject or body' }, { status: 400 });
        }

        console.log(`📊 Loading users for segment: ${segment}`);

        // Carica tutti gli utenti
        const allUsers = await base44.asServiceRole.entities.User.list();
        
        // Carica lista unsubscribed
        const unsubscribedList = await base44.asServiceRole.entities.UnsubscribedEmail.list();
        const unsubscribedEmails = new Set(unsubscribedList.map(u => u.email));
        console.log(`🚫 Found ${unsubscribedEmails.size} unsubscribed emails`);
        
        // Filtra in base al segmento
        let targetUsers = allUsers.filter(u => !unsubscribedEmails.has(u.email));
        
        switch(segment) {
            case 'active':
                targetUsers = targetUsers.filter(u => u.subscription_status === 'active');
                break;
            case 'trial':
                targetUsers = targetUsers.filter(u => u.subscription_status === 'trial');
                break;
            case 'expired':
                targetUsers = targetUsers.filter(u => 
                    u.subscription_status === 'expired' || u.subscription_status === 'cancelled'
                );
                break;
            case 'all':
            default:
                // targetUsers already filtered by unsubscribed
                break;
        }

        console.log(`📬 Sending to ${targetUsers.length} users`);

        let sentCount = 0;
        let errorCount = 0;

        // Invia email a ogni utente
        for (const targetUser of targetUsers) {
            if (!targetUser.email) {
                console.log(`⚠️ Skipping user ${targetUser.id}: no email`);
                continue;
            }

            try {
                // Sostituisci variabili nel body
                let personalizedBody = emailBody
                    .replace(/\{user_name\}/g, targetUser.full_name || 'Utente')
                    .replace(/\{user_email\}/g, targetUser.email);

                // Genera link unsubscribe
                const unsubscribeUrl = `https://projectmywellness.com/api/functions/unsubscribeEmail?email=${encodeURIComponent(targetUser.email)}&source=broadcast`;

                // Wrap in proper HTML template with desktop spacing
                const htmlEmail = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { margin: 0; padding: 0; font-family: 'Inter', -apple-system, sans-serif; }
        .logo-cell { padding: 60px 30px 24px 30px; }
        .content-cell { padding: 40px 30px; }
        @media only screen and (min-width: 600px) {
            .logo-cell { padding: 60px 60px 24px 60px !important; }
            .content-cell { padding: 60px 60px 40px 60px !important; }
        }
        @media only screen and (max-width: 600px) {
            .container { width: 100% !important; border-radius: 0 !important; }
            .outer-wrapper { padding: 0 !important; }
        }
    </style>
</head>
<body style="margin: 0; padding: 0;">
    <table class="outer-wrapper" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #fafafa; padding: 20px 0;">
        <tr>
            <td align="center">
                <table class="container" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; background: white; border-radius: 16px; overflow: hidden;">
                    <tr>
                        <td class="logo-cell" style="background: white;">
                            <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68d44c626cc2c19cca9c750d/2e82f3cae_IconaMyWellness.png" alt="MyWellness" style="height: 48px; width: auto; display: block;">
                        </td>
                    </tr>
                    <tr>
                        <td class="content-cell">
                            ${personalizedBody}
                        </td>
                    </tr>
                </table>
                
                <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; margin-top: 20px; background-color: #fafafa;">
                    <tr>
                        <td align="center" style="padding: 20px; color: #999999; background-color: #fafafa;">
                            <p style="margin: 5px 0; font-size: 12px; font-weight: 600;">© VELIKA GROUP LLC. All Rights Reserved.</p>
                            <p style="margin: 5px 0; font-size: 11px;">30 N Gould St 32651 Sheridan, WY 82801, United States</p>
                            <p style="margin: 5px 0; font-size: 11px;">EIN: 36-5141800 - velika.03@outlook.it</p>
                            <p style="margin: 15px 0 5px 0; font-size: 11px;">
                                <a href="${unsubscribeUrl}" style="color: #999999; text-decoration: underline;">Disiscriviti da queste email</a>
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
                `;

                await base44.asServiceRole.integrations.Core.SendEmail({
                    to: targetUser.email,
                    from_name: 'MyWellness <info@projectmywellness.com>',
                    subject: subject,
                    body: htmlEmail
                });

                sentCount++;
                console.log(`✅ Sent to ${targetUser.email}`);

            } catch (emailError) {
                console.error(`❌ Failed to send to ${targetUser.email}:`, emailError.message);
                errorCount++;
            }

            // Small delay per evitare rate limiting
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        console.log(`🎉 Broadcast completed! Sent: ${sentCount}, Errors: ${errorCount}`);

        return Response.json({
            success: true,
            sent_count: sentCount,
            error_count: errorCount,
            total_users: targetUsers.length
        });

    } catch (error) {
        console.error('❌ Broadcast error:', error);
        return Response.json({ 
            error: error.message 
        }, { status: 500 });
    }
});