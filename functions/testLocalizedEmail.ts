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

        // Variabili complete per test realistici
        const testVariables = {
            user_name: 'Mario Rossi',
            user_email: testEmail,
            plan_name: 'Premium',
            amount: '29.00',
            next_billing_date: '15 Marzo 2025',
            invoice_url: 'https://example.com/invoice',
            app_url: 'https://projectmywellness.com',
            dashboard_url: 'https://projectmywellness.com/Dashboard',
            
            // Weekly report variables
            week_range: '10 - 16 Dicembre 2024',
            weight_change: '-1.2',
            weight_change_direction: 'down',
            current_weight: '72.5',
            target_weight: '68.0',
            start_weight: '78.0',
            distance_remaining: '4.5',
            progress_percentage: '62',
            avg_calories: '1847',
            target_calories: '1900',
            workouts_completed: '4',
            planned_workouts: '5',
            adherence_percentage: '89',
            motivational_message: 'Ottimo lavoro! Sei sulla strada giusta per raggiungere il tuo obiettivo. Continua così!',
            
            // Cart/checkout variables
            cart_total: '€19.00',
            selected_plan: 'Base',
            billing_period: 'mensile'
        };

        // Invia email di test
        const response = await base44.functions.invoke('sendEmailUnified', {
            userId: user.id,
            userEmail: testEmail,
            templateId: templateId,
            variables: testVariables,
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