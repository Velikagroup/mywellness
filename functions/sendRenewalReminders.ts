import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    console.log('🔔 sendRenewalReminders CRON - Start');
    
    try {
        const base44 = createClientFromRequest(req);

        const today = new Date();
        const in7Days = new Date(today);
        in7Days.setDate(in7Days.getDate() + 7);
        const in3Days = new Date(today);
        in3Days.setDate(in3Days.getDate() + 3);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        console.log(`📅 Today: ${today.toISOString().split('T')[0]}`);

        // Recupera tutti gli utenti CON TRIAL ATTIVO che stanno per passare al piano annuale
        const allUsers = await base44.asServiceRole.entities.User.list();
        const usersWithPendingRenewal = allUsers.filter(u => 
            u.subscription_status === 'trial' && 
            u.trial_end &&
            u.subscription_plan // Hanno un piano in attesa dopo il trial
        );

        console.log(`👥 Found ${usersWithPendingRenewal.length} trial users with pending annual renewal to check`);

        let sent7Days = 0;
        let sent3Days = 0;
        let sent1Day = 0;
        const results = [];

        for (const user of usersWithPendingRenewal) {
            // ✅ CONTROLLO PREFERENZE EMAIL
            if (user.email_notifications?.renewal_reminders === false) {
                console.log(`⏭️ Skipping ${user.email} - renewal reminders disabled`);
                continue;
            }

            const trialEndsAt = new Date(user.trial_end);
            const hoursUntilRenewal = Math.ceil((trialEndsAt.getTime() - today.getTime()) / (1000 * 60 * 60));

            console.log(`📧 User ${user.email}: trial ends in ${hoursUntilRenewal} hours, will convert to ${user.subscription_plan}`);

            let shouldSend = false;
            const userLang = user.preferred_language || 'it';
            const templateId = `renewal_reminder_48h_${userLang}`;

            // Reminder a 24-48h prima del passaggio da trial a piano annuale
            if (hoursUntilRenewal >= 24 && hoursUntilRenewal <= 48) {
                shouldSend = true;
                sent1Day++;
            }

            if (shouldSend) {
                try {
                    // Usa il sistema email unificato con template multilingue
                    await base44.asServiceRole.functions.invoke('sendEmailUnified', {
                        userId: user.id,
                        userEmail: user.email,
                        templateId: templateId,
                        variables: {
                            user_name: user.full_name || 'Utente'
                        },
                        language: userLang,
                        triggerSource: 'sendRenewalReminders'
                    });

                    console.log(`✅ Renewal reminder sent to ${user.email} (${hoursUntilRenewal}h before conversion)`);
                    results.push({
                        user_id: user.id,
                        email: user.email,
                        hours_until_renewal: hoursUntilRenewal,
                        status: 'sent'
                    });
                } catch (error) {
                    console.error(`❌ Failed to send to ${user.email}:`, error.message);
                    results.push({
                        user_id: user.id,
                        email: user.email,
                        hours_until_renewal: hoursUntilRenewal,
                        status: 'failed',
                        error: error.message
                    });
                }

                // Rate limiting
                await new Promise(resolve => setTimeout(resolve, 100));
            }
        }

        console.log('🎉 Trial renewal reminders completed');
        console.log(`📊 Sent: ${sent1Day} reminders (24-48h before renewal)`);

        return Response.json({
            success: true,
            sent_reminders: sent1Day,
            total_sent: sent1Day,
            results: results
        });

    } catch (error) {
        console.error('❌ CRON Error:', error);
        return Response.json({ 
            error: error.message 
        }, { status: 500 });
    }
});