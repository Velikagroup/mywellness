import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * 📧 SEND WELCOME EMAIL "CA 1" - Triggered ~30 min after user registration
 * 
 * Questo script viene chiamato da un'automazione schedulata ogni 5 minuti.
 * Cerca utenti registrati tra 28 e 35 minuti fa che non hanno ancora ricevuto l'email CA 1.
 * Seleziona il template Resend in base alla lingua dell'utente.
 */

// Mappa lingua → nome del template Resend
const TEMPLATE_MAP = {
    it: 'CA 1 - IT',
    es: 'CA 1 - ES',
    en: 'CA 1 - EN',
    pt: 'CA 1 - PT',
    de: 'CA 1 - DE',
    fr: 'CA 1 - FR',
};
const FALLBACK_TEMPLATE = 'CA 1 - EN';

Deno.serve(async (req) => {
    console.log('📧 sendWelcomeCA1Email - Start');

    try {
        const base44 = createClientFromRequest(req);

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
    const templateName = TEMPLATE_MAP[language?.toLowerCase()] || FALLBACK_TEMPLATE;
    console.log(`📨 Sending "${templateName}" to ${email} (lang: ${language})`);

    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (!resendApiKey) throw new Error('RESEND_API_KEY not configured');

    const fromEmail = 'info@notifications.projectmywellness.com';

    // Cerca il template nel database EmailTemplate tramite il nome
    let templateId = null;
    try {
        const dbTemplates = await base44.asServiceRole.entities.EmailTemplate.filter({
            template_id: templateName,
            is_active: true
        });
        if (dbTemplates.length > 0 && dbTemplates[0].resend_template_id) {
            templateId = dbTemplates[0].resend_template_id;
            console.log(`✅ Found template in DB: ${templateName} → ${templateId}`);
        }
    } catch (e) {
        console.warn('⚠️ Could not fetch template from DB:', e.message);
    }

    // Se non trovato nel DB, prova a listare i template da Resend
    if (!templateId) {
        const templatesRes = await fetch('https://api.resend.com/broadcasts', {
            headers: { 'Authorization': `Bearer ${resendApiKey}` }
        });
        if (templatesRes.ok) {
            const templatesData = await templatesRes.json();
            console.log('📋 Resend broadcasts response:', JSON.stringify(templatesData).substring(0, 300));
        }

        // Prova endpoint corretto per i template
        const tplRes = await fetch('https://api.resend.com/emails/templates', {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${resendApiKey}` }
        });
        console.log(`📋 Resend templates endpoint status: ${tplRes.status}`);
        if (tplRes.ok) {
            const tplData = await tplRes.json();
            console.log('📋 Resend templates:', JSON.stringify(tplData).substring(0, 500));
            const templates = tplData.data || tplData.templates || tplData.results || [];
            const found = templates.find(t => t.name === templateName);
            if (found) {
                templateId = found.id;
                console.log(`✅ Found Resend template via API: ${templateName} → ${templateId}`);
            }
        }
    }

    if (!templateId) {
        throw new Error(`Template "${templateName}" non trovato. Assicurarsi che esista su Resend e che il nome corrisponda esattamente.`);
    }

    const emailPayload = {
        from: `MyWellness <${fromEmail}>`,
        to: [email],
        template_id: templateId,
        data: { user_name: full_name || email.split('@')[0] }
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
            template_id: templateName,
            subject: emailPayload.subject || templateName,
            status: 'sent',
            provider: 'sendgrid',
            from_email: fromEmail,
            language: language || 'en',
            sent_at: new Date().toISOString(),
            trigger_source: 'sendWelcomeCA1Email',
            sendgrid_message_id: result.id,
            metadata: { template_name: templateName, resend_template_id: templateId }
        });
    } catch (logError) {
        console.warn('⚠️ Failed to save email log:', logError);
    }

    return { success: true, templateName, messageId: result.id };
}