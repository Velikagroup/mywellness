import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

/**
 * Invia email di invito upgrade per utenti Standard Free
 * Trigger: Cron - Utenti Standard Free da 7+ giorni
 */

Deno.serve(async (req) => {
    console.log('📧 sendStandardUpgradeInvite - Start');
    
    try {
        const base44 = createClientFromRequest(req);
        
        // Verifica cron secret se chiamato da cron
        const cronSecret = req.headers.get('x-cron-secret');
        const expectedSecret = Deno.env.get('CRON_SECRET');
        
        const body = await req.json().catch(() => ({}));
        
        // Se è una chiamata singola con userId
        if (body.userId && body.userEmail) {
            console.log(`📬 Sending upgrade invite to ${body.userEmail}`);
            
            await base44.functions.invoke('sendEmailUnified', {
                userId: body.userId,
                userEmail: body.userEmail,
                templateId: 'standard_upgrade_invite',
                variables: {
                    user_name: body.userName || 'Utente'
                },
                triggerSource: 'sendStandardUpgradeInvite'
            });

            return Response.json({ 
                success: true,
                message: 'Upgrade invite sent'
            });
        }

        // Altrimenti è un job cron - trova tutti gli utenti Standard Free da 7+ giorni
        if (cronSecret !== expectedSecret) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const users = await base44.asServiceRole.entities.User.list();
        
        const eligibleUsers = users.filter(u => {
            // Solo utenti Standard Free
            if (u.subscription_plan !== 'standard' && u.subscription_plan !== null && u.subscription_plan !== undefined) {
                return false;
            }
            // Solo se subscription_status è 'active' o undefined (free)
            if (u.subscription_status && u.subscription_status !== 'active') {
                return false;
            }
            // Registrati da almeno 7 giorni
            if (!u.created_date) return false;
            const createdDate = new Date(u.created_date);
            return createdDate <= sevenDaysAgo;
        });

        console.log(`👥 Found ${eligibleUsers.length} eligible users for upgrade invite`);

        let sentCount = 0;
        let errorCount = 0;

        for (const user of eligibleUsers) {
            try {
                await base44.functions.invoke('sendEmailUnified', {
                    userId: user.id,
                    userEmail: user.email,
                    templateId: 'standard_upgrade_invite',
                    variables: {
                        user_name: user.full_name || 'Utente'
                    },
                    triggerSource: 'sendStandardUpgradeInvite_cron'
                });
                sentCount++;
                
                // Rate limiting
                await new Promise(resolve => setTimeout(resolve, 100));
            } catch (error) {
                console.error(`❌ Failed to send to ${user.email}:`, error.message);
                errorCount++;
            }
        }

        console.log(`✅ Upgrade invites sent: ${sentCount}/${eligibleUsers.length}`);

        return Response.json({ 
            success: true,
            sent: sentCount,
            errors: errorCount,
            total: eligibleUsers.length
        });

    } catch (error) {
        console.error('❌ Error:', error);
        return Response.json({ 
            error: error.message 
        }, { status: 500 });
    }
});