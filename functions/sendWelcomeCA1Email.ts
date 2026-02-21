import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * 📧 SEND WELCOME EMAIL "CA 1" - Triggered ~30 min after user registration
 * 
 * Questo script viene chiamato da un'automazione schedulata ogni 5 minuti.
 * Cerca utenti registrati tra 28 e 35 minuti fa che non hanno ancora ricevuto l'email CA 1.
 * Seleziona il template Resend in base alla lingua dell'utente.
 */

// Mappa lingua → UUID del template Resend
const TEMPLATE_MAP = {
    it: 'aca1f873-3063-48db-bec8-3ab3c5a79b4b',
    es: '95beec35-9339-4887-8136-c8276c3c277d',
    en: 'c04f6d33-a8c8-4e46-86b8-f32c36ee0e53',
    pt: '785881ea-f854-47a5-89e7-06a20ae15f09',
    de: '3c352309-b5e4-440f-95a6-e229f4ff5b23',
    fr: 'e78548fe-189d-4d59-a0ae-03d8b7449dac',
};
const FALLBACK_TEMPLATE = 'c04f6d33-a8c8-4e46-86b8-f32c36ee0e53'; // en

Deno.serve(async (req) => {
    console.log('📧 sendWelcomeCA1Email - Start');

    try {
        console.log('🔑 Creating base44 client...');
        const base44 = createClientFromRequest(req);
        console.log('✅ base44 client created');

        // Auth: solo admin o cron interno
        let isAuthorized = false;
        try {
            const user = await base44.auth.me();
            if (user?.role === 'admin') isAuthorized = true;
        } catch (_) {}

        // Permetti anche richieste non autenticate (da automazioni interne)
        if (!isAuthorized) {
            const authHeader = req.headers.get('authorization') || '';
            const cronSecret = Deno.env.get('CRON_SECRET') || '';
            if (cronSecret && authHeader === `Bearer ${cronSecret}`) {
                isAuthorized = true;
            }
        }

        // Supporta anche chiamate dirette senza auth (da entity automation)
        // In questo caso processiamo un singolo utente passato nel body
        const body = await req.json().catch(() => ({}));

        console.log('📦 Body received:', JSON.stringify(body));

        if (body.user_email && body.user_language !== undefined) {
            // Modalità: invio singolo utente (chiamato da automazione entity)
            return await sendForSingleUser(base44, {
                email: body.user_email,
                language: body.user_language,
                full_name: body.full_name || '',
                user_id: body.user_id || ''
            });
        }

        // Modalità: scan utenti registrati ~30 min fa (chiamato da cron ogni 5 min)
        const now = new Date();
        const minAgo28 = new Date(now.getTime() - 28 * 60 * 1000).toISOString();
        const minAgo35 = new Date(now.getTime() - 35 * 60 * 1000).toISOString();

        console.log(`🔍 Looking for users registered between ${minAgo35} and ${minAgo28}`);

        // Recupera tutti gli utenti - filtriamo manualmente per created_date
        const allUsers = await base44.asServiceRole.entities.User.list('-created_date', 200);

        const targetUsers = allUsers.filter(u => {
            if (!u.created_date) return false;
            return u.created_date >= minAgo35 && u.created_date <= minAgo28;
        });

        console.log(`👥 Found ${targetUsers.length} users in the 28-35 min window`);

        const results = [];

        for (const user of targetUsers) {
            // Controlla se l'email CA 1 è già stata inviata
            const existingLogs = await base44.asServiceRole.entities.EmailLog.filter({
                user_email: user.email,
                trigger_source: 'sendWelcomeCA1Email'
            });

            if (existingLogs.length > 0) {
                console.log(`⏭️ Skipping ${user.email} - CA 1 already sent`);
                continue;
            }

            const result = await sendForSingleUser(base44, {
                email: user.email,
                language: user.preferred_language || user.language || 'en',
                full_name: user.full_name || '',
                user_id: user.id
            });

            results.push({ email: user.email, result });
        }

        return Response.json({
            success: true,
            processed: results.length,
            results
        });

    } catch (error) {
        console.error('❌ sendWelcomeCA1Email error:', error);
        return Response.json({ success: false, error: error.message }, { status: 500 });
    }
});

async function sendForSingleUser(base44, { email, language, full_name, user_id }) {
    const templateAlias = TEMPLATE_MAP[language?.toLowerCase()] || FALLBACK_TEMPLATE;
    console.log(`📨 Sending template "${templateAlias}" to ${email} (lang: ${language})`);

    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (!resendApiKey) throw new Error('RESEND_API_KEY not configured');

    const fromEmail = 'info@notifications.projectmywellness.com';

    const emailPayload = {
        from: `MyWellness <${fromEmail}>`,
        to: [email],
        template: {
            id: templateAlias,
            variables: { user_name: full_name || email.split('@')[0] }
        }
    };

    const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(emailPayload)
    });

    const result = await response.json();

    if (!response.ok) {
        console.error('❌ Resend API error:', result);
        throw new Error(`Resend API failed: ${result.message || 'Unknown error'}`);
    }

    console.log(`✅ CA 1 email sent to ${email}:`, result.id);

    // Log invio
    try {
        await base44.asServiceRole.entities.EmailLog.create({
            user_id: user_id || '',
            user_email: email,
            template_id: templateAlias,
            subject: 'CA 1 Welcome',
            status: 'sent',
            provider: 'sendgrid',
            from_email: fromEmail,
            language: language || 'en',
            sent_at: new Date().toISOString(),
            trigger_source: 'sendWelcomeCA1Email',
            sendgrid_message_id: result.id,
            metadata: { template_alias: templateAlias }
        });
    } catch (logError) {
        console.warn('⚠️ Failed to save email log:', logError);
    }

    return { success: true, templateAlias, messageId: result.id };
}