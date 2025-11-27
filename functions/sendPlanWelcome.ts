import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

/**
 * Invia email di benvenuto per piani a pagamento (Base, Pro, Premium)
 */

Deno.serve(async (req) => {
    console.log('📧 sendPlanWelcome - Start');
    
    try {
        const base44 = createClientFromRequest(req);
        
        const body = await req.json();
        const { userId, userEmail, userName, plan } = body;

        if (!userEmail) {
            return Response.json({ error: 'Missing userEmail' }, { status: 400 });
        }

        if (!plan) {
            return Response.json({ error: 'Missing plan' }, { status: 400 });
        }

        // Mappa piano -> template_id
        const planTemplateMap = {
            'base': 'base_welcome',
            'pro': 'pro_welcome',
            'premium': 'premium_welcome'
        };

        const templateId = planTemplateMap[plan.toLowerCase()];
        
        if (!templateId) {
            console.error(`❌ Unknown plan: ${plan}`);
            return Response.json({ error: `Unknown plan: ${plan}` }, { status: 400 });
        }

        console.log(`📬 Sending ${plan} welcome to ${userEmail}`);

        // Verifica che il template esista
        const templates = await base44.asServiceRole.entities.EmailTemplate.filter({ 
            template_id: templateId,
            is_active: true 
        });
        
        if (templates.length === 0) {
            console.error(`❌ Template ${templateId} not found`);
            return Response.json({ error: 'Template not found' }, { status: 404 });
        }

        // Invia email tramite funzione unificata
        const response = await base44.functions.invoke('sendEmailUnified', {
            userId: userId,
            userEmail: userEmail,
            templateId: templateId,
            variables: {
                user_name: userName || 'Utente'
            },
            triggerSource: 'sendPlanWelcome'
        });

        console.log(`✅ ${plan} welcome sent to ${userEmail}`);

        return Response.json({ 
            success: true,
            message: `${plan} welcome email sent`,
            plan: plan
        });

    } catch (error) {
        console.error('❌ Error:', error);
        return Response.json({ 
            error: error.message 
        }, { status: 500 });
    }
});