import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * ⏰ AUTOMAZIONE: Invia reminder 48h dopo registrazione
 * Trova utenti creati esattamente 48h fa e invia email "Plan Renewal Reminder" tramite Resend
 */

Deno.serve(async (req) => {
    console.log('⏰ send48hRenewalReminder - Start');
    
    try {
        const base44 = createClientFromRequest(req);

        // Calcola data 48h fa (con tolleranza di 30 minuti)
        const now = new Date();
        const target48h = new Date(now.getTime() - (48 * 60 * 60 * 1000));
        const target47h30min = new Date(now.getTime() - (47.5 * 60 * 60 * 1000));
        
        console.log(`🔍 Looking for trial starts between ${target48h.toISOString()} and ${target47h30min.toISOString()}`);

        // Recupera TUTTI gli utenti
        const allUsers = await base44.asServiceRole.entities.User.list();
        
        // Filtra utenti con subscription_start_date esattamente 48h fa
        const targetUsers = allUsers.filter(user => {
            if (!user.subscription_start_date) return false;
            
            const startDate = new Date(user.subscription_start_date);
            const isInWindow = startDate >= target48h && startDate <= target47h30min;
            
            if (isInWindow) {
                console.log(`✅ Found user ${user.email} with trial start ${startDate.toISOString()}`);
            }
            
            return isInWindow;
        });

        console.log(`👥 Found ${targetUsers.length} users with trial started 48h ago`);

        if (targetUsers.length === 0) {
            return Response.json({
                success: true,
                message: 'No users found for 48h reminder',
                sent_count: 0
            });
        }

        let sentCount = 0;
        const results = [];

        for (const user of targetUsers) {
            try {
                // Verifica se email già inviata (controlla EmailLog)
                const existingLogs = await base44.asServiceRole.entities.EmailLog.filter({
                    user_email: user.email,
                    template_id: 'plan-renewal-reminder',
                    status: 'sent'
                });

                if (existingLogs.length > 0) {
                    console.log(`⏭️ Email already sent to ${user.email}, skipping`);
                    results.push({
                        user_id: user.id,
                        email: user.email,
                        status: 'skipped',
                        reason: 'Already sent'
                    });
                    continue;
                }

                // Determina lingua utente
                const userLang = user.preferred_language || 'it';

                console.log(`📧 Sending reminder to ${user.email} (lang: ${userLang})`);

                // Invia email tramite Resend template
                await base44.asServiceRole.functions.invoke('sendResendEmail', {
                    to: user.email,
                    resendTemplateId: 'plan-renewal-reminder',
                    variables: {
                        NAME: user.full_name || 'Utente'
                    },
                    language: userLang
                });

                sentCount++;
                console.log(`✅ Reminder sent to ${user.email}`);
                
                results.push({
                    user_id: user.id,
                    email: user.email,
                    status: 'sent'
                });

                // Rate limiting (150ms tra ogni email)
                await new Promise(resolve => setTimeout(resolve, 150));

            } catch (error) {
                console.error(`❌ Failed to send reminder to ${user.email}:`, error.message);
                results.push({
                    user_id: user.id,
                    email: user.email,
                    status: 'failed',
                    error: error.message
                });
            }
        }

        console.log(`🎉 48h renewal reminders sent: ${sentCount}/${targetUsers.length}`);

        return Response.json({
            success: true,
            message: `Sent ${sentCount} reminders`,
            sent_count: sentCount,
            total_users: targetUsers.length,
            results: results
        });

    } catch (error) {
        console.error('❌ Automation error:', error);
        return Response.json({ 
            success: false,
            error: error.message 
        }, { status: 500 });
    }
});