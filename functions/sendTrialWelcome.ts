import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    console.log('📧 sendTrialWelcome - Start');

    try {
        const base44 = createClientFromRequest(req);
        const body = await req.json();
        
        const { userId, userEmail, userName } = body;

        if (!userEmail) {
            return Response.json({ 
                success: false, 
                error: 'Missing userEmail' 
            }, { status: 400 });
        }

        console.log(`📧 Sending trial welcome to: ${userEmail}`);

        // Ottieni dati utente per lingua
        let userLang = 'it'; // default
        if (userId) {
            const user = await base44.asServiceRole.entities.User.get(userId);
            if (user?.preferred_language) {
                userLang = user.preferred_language;
            }
        }

        const templateId = `trial_welcome_${userLang}`;

        // Invia tramite sistema unificato (supporta multilingue)
        await base44.asServiceRole.functions.invoke('sendEmailUnified', {
            userId: userId,
            userEmail: userEmail,
            templateId: templateId,
            variables: {
                user_name: userName || 'Utente'
            },
            language: userLang,
            triggerSource: 'sendTrialWelcome'
        });

        console.log('✅ Trial welcome email sent');

        return Response.json({ 
            success: true,
            message: 'Trial welcome email sent'
        });

    } catch (error) {
        console.error('❌ Send email error:', error);
        return Response.json({ 
            success: false,
            error: error.message 
        }, { status: 500 });
    }
});