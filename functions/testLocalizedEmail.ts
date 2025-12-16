import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

/**
 * Funzione di test per verificare email localizzate
 * 
 * Esempi:
 * - standard_free_welcome_it
 * - base_welcome_en
 * - pro_welcome_es
 * - premium_welcome_pt
 * - renewal_confirmation_de
 * - landing_new_user_fr
 */

Deno.serve(async (req) => {
    console.log('🧪 testLocalizedEmail - Start');
    
    try {
        const base44 = createClientFromRequest(req);
        
        // Solo admin può testare
        const user = await base44.auth.me();
        if (!user || user.role !== 'admin') {
            return Response.json({ error: 'Unauthorized - Admin only' }, { status: 401 });
        }

        const body = await req.json();
        const { templateId, testEmail, language } = body;

        if (!templateId || !testEmail) {
            return Response.json({ 
                error: 'Missing templateId or testEmail' 
            }, { status: 400 });
        }

        console.log(`📧 Testing template: ${templateId}`);
        console.log(`📧 Sending to: ${testEmail}`);

        // Verifica che il template esista
        const templates = await base44.asServiceRole.entities.EmailTemplate.filter({ 
            template_id: templateId,
            is_active: true 
        });
        
        if (templates.length === 0) {
            return Response.json({ 
                error: `Template ${templateId} not found or inactive`,
                suggestion: 'Verifica che il template esista nel database con is_active=true'
            }, { status: 404 });
        }

        const template = templates[0];

        // Invia email di test
        const response = await base44.functions.invoke('sendEmailUnified', {
            userId: user.id,
            userEmail: testEmail,
            templateId: templateId,
            variables: {
                user_name: 'Test User',
                plan_name: 'Premium',
                amount: '29.00',
                next_billing_date: '15 Marzo 2025',
                invoice_url: 'https://example.com/invoice'
            },
            language: language || 'it',
            triggerSource: 'testLocalizedEmail'
        });

        console.log('✅ Test email sent');

        return Response.json({ 
            success: true,
            message: `Test email sent to ${testEmail}`,
            templateId: templateId,
            templateName: template.name,
            subject: template.subject,
            language: language || 'it'
        });

    } catch (error) {
        console.error('❌ Error:', error);
        return Response.json({ 
            error: error.message,
            stack: error.stack 
        }, { status: 500 });
    }
});