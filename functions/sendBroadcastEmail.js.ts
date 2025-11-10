
import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

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
        
        // Filtra in base al segmento
        let targetUsers = allUsers;
        
        switch(segment) {
            case 'active':
                targetUsers = allUsers.filter(u => u.subscription_status === 'active');
                break;
            case 'trial':
                targetUsers = allUsers.filter(u => u.subscription_status === 'trial');
                break;
            case 'expired':
                targetUsers = allUsers.filter(u => 
                    u.subscription_status === 'expired' || u.subscription_status === 'cancelled'
                );
                break;
            case 'all':
            default:
                targetUsers = allUsers;
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

                await base44.asServiceRole.integrations.Core.SendEmail({
                    to: targetUser.email,
                    from_name: 'MyWellness Team <info@projectmywellness.com>',
                    subject: subject,
                    body: personalizedBody
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
