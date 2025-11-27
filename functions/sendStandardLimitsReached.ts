import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

/**
 * Invia email quando utente Standard Free raggiunge i limiti
 * Trigger: Chiamata dal frontend quando l'utente tenta di accedere a funzionalità bloccate
 */

Deno.serve(async (req) => {
    console.log('📧 sendStandardLimitsReached - Start');
    
    try {
        const base44 = createClientFromRequest(req);
        
        const body = await req.json();
        const { userId, userEmail, userName, featureAttempted } = body;

        if (!userEmail) {
            return Response.json({ error: 'Missing userEmail' }, { status: 400 });
        }

        console.log(`📬 Sending limits reached email to ${userEmail} (attempted: ${featureAttempted || 'unknown'})`);

        // Verifica che non abbiamo già inviato questa email nelle ultime 24 ore
        const oneDayAgo = new Date();
        oneDayAgo.setDate(oneDayAgo.getDate() - 1);

        const recentLogs = await base44.asServiceRole.entities.EmailLog.filter({
            user_email: userEmail,
            template_id: 'standard_limits_reached'
        });

        const recentSent = recentLogs.some(log => {
            if (!log.sent_at) return false;
            return new Date(log.sent_at) > oneDayAgo;
        });

        if (recentSent) {
            console.log(`⏭️ Skipping - already sent limits email to ${userEmail} in last 24h`);
            return Response.json({ 
                success: true,
                skipped: true,
                message: 'Already sent in last 24 hours'
            });
        }

        // Invia email tramite funzione unificata
        await base44.functions.invoke('sendEmailUnified', {
            userId: userId,
            userEmail: userEmail,
            templateId: 'standard_limits_reached',
            variables: {
                user_name: userName || 'Utente'
            },
            triggerSource: 'sendStandardLimitsReached'
        });

        console.log(`✅ Limits reached email sent to ${userEmail}`);

        return Response.json({ 
            success: true,
            message: 'Limits reached email sent'
        });

    } catch (error) {
        console.error('❌ Error:', error);
        return Response.json({ 
            error: error.message 
        }, { status: 500 });
    }
});