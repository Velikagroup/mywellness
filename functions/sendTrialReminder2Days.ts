import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
    console.log('📧 sendTrialReminder2Days - Start');

    try {
        const base44 = createClientFromRequest(req);
        // TEMPORANEO: Commento il controllo admin per test
        // const user = await base44.auth.me();
        // if (!user || user.role !== 'admin') {
        //     return Response.json({ error: 'Unauthorized' }, { status: 401 });
        // }

        console.log('🔍 TEST MODE - Sending to andrea.fontana@bluadv.net');

        // TEST: Invia solo a te
        const targetUser = await base44.asServiceRole.entities.User.filter({
            email: 'andrea.fontana@bluadv.net'
        });

        if (targetUser.length === 0) {
            throw new Error('User not found');
        }

        let emailsSent = 0;
        const user = targetUser[0];

        console.log(`📧 Sending reminder to: ${user.email}`);

        // Usa sendEmailUnified per template centralizzato
        const userLanguage = user.preferred_language || 'it';
        const templateSuffix = `_${userLanguage}`;
        const templateId = `renewal_reminder_48h${templateSuffix}`;
        
        console.log(`📧 Using template: ${templateId} for user ${user.email}`);
        
        // Chiama sendEmailUnified direttamente tramite fetch
        console.log('🔧 Calling sendEmailUnified via direct call...');
        
        const emailPayload = {
            userId: user.id,
            userEmail: user.email,
            templateId: templateId,
            variables: {
                user_name: user.full_name || 'Utente'
            },
            language: userLanguage,
            triggerSource: 'sendTrialReminder2Days'
        };
        
        console.log('📤 Email payload:', JSON.stringify(emailPayload));
        
        const emailResponse = await base44.asServiceRole.integrations.Core.SendEmail({
            to: user.email,
            subject: '⏰ Reminder: Rinnovo Piano Annuale MyWellness',
            body: `<p>Ciao ${user.full_name},</p><p>Ti scriviamo per ricordarti che, qualora tu non abbia ancora effettuato la cancellazione del Piano Annuale MyWellness, entro 24 ore verrà elaborato il relativo pagamento.</p>`,
            from_name: 'MyWellness'
        });
        
        console.log(`✅ Email sent via Base44 Core to ${user.email}`);
        emailsSent++;

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