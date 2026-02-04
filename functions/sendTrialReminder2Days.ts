import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
    console.log('📧 sendTrialReminder2Days - Start');

    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user || user.role !== 'admin') {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        console.log('🔍 Finding users with trial ending in ~24h...');

        // Trova tutti gli utenti con trial attivo che finisce tra 12 e 36 ore
        const now = new Date();
        const oneDayFromNow = new Date(now.getTime() + (36 * 60 * 60 * 1000)); // 36h
        const halfDayFromNow = new Date(now.getTime() + (12 * 60 * 60 * 1000)); // 12h

        const users = await base44.asServiceRole.entities.User.filter({
            subscription_status: 'trial'
        });

        console.log(`📊 Found ${users.length} users with trial status`);

        let emailsSent = 0;

        for (const targetUser of users) {
            if (!targetUser.trial_ends_at || !targetUser.email) continue;

            const trialEndsAt = new Date(targetUser.trial_ends_at);
            
            // Controlla se il trial finisce tra 12 e 36 ore
            if (trialEndsAt < halfDayFromNow || trialEndsAt > oneDayFromNow) {
                continue;
            }

            // Verifica che non abbia già ricevuto il reminder
            const existingReminders = await base44.asServiceRole.entities.EmailLog.filter({
                user_id: targetUser.id,
                email_type: 'trial_reminder_24h'
            });

            if (existingReminders.length > 0) {
                console.log(`⏭️ Skipping ${targetUser.email} - reminder already sent`);
                continue;
            }

            console.log(`📧 Sending reminder to: ${targetUser.email}`);

            // Usa sendEmailUnified per template centralizzato
            const userLanguage = targetUser.preferred_language || 'it';
            const templateSuffix = `_${userLanguage}`;
            const templateId = `renewal_reminder_48h${templateSuffix}`;
            
            console.log(`📧 Using template: ${templateId} for user ${targetUser.email}`);
            
            // Chiama sendEmailUnified
            const emailResponse = await base44.asServiceRole.functions.invoke('sendEmailUnified', {
                userId: targetUser.id,
                userEmail: targetUser.email,
                templateId: templateId,
                variables: {
                    user_name: targetUser.full_name || 'Utente'
                },
                language: userLanguage,
                triggerSource: 'sendTrialReminder2Days'
            });
            
            if (!emailResponse.success) {
                throw new Error(`sendEmailUnified failed: ${emailResponse.error}`);
            }
            
            console.log(`✅ Email sent via sendEmailUnified to ${targetUser.email}`);
            emailsSent++;


        }

        console.log(`✅ Trial reminder process completed. Emails sent: ${emailsSent}`);

        return Response.json({ 
            success: true,
            emailsSent,
            message: `Sent ${emailsSent} trial reminder emails`
        });

    } catch (error) {
        console.error('❌ Trial reminder error:', error);
        return Response.json({ 
            success: false,
            error: error.message 
        }, { status: 500 });
    }
});