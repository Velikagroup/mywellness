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

        // Variabili base
        const baseVariables = {
            user_name: 'Mario Rossi',
            plan_name: 'Premium',
            amount: '29.00',
            next_billing_date: '15 Marzo 2025',
            invoice_url: 'https://example.com/invoice',
            expiry_date: '31 Gennaio 2025',
            old_plan: 'Base',
            new_plan: 'Pro',
            features_unlocked: 'Allenamenti AI, Analisi Foto Progressi',
            effective_date: '1 Febbraio 2025'
        };

        // Identifica tipo di email
        const emailIdBase = templateId.replace(/_it$|_en$|_es$|_pt$|_de$|_fr$/, '');
        console.log('🧪 Testing email type:', emailIdBase);
        
        // Se è weekly_report, aggiungi dati per grafici
        if (emailIdBase === 'weekly_report') {
            console.log('📊 Adding weekly report test data');
            baseVariables.week_range = '10-16 Dicembre 2024';
            baseVariables.current_weight = 72.5;
            baseVariables.weight_change = -1.2;
            baseVariables.start_weight = 80.0;
            baseVariables.target_weight = 65.0;
            baseVariables.distance_remaining = 7.5;
            baseVariables.avg_calories = 1850;
            baseVariables.workouts_completed = 4;
            baseVariables.adherence = 85;
            baseVariables.progress = 65;
            baseVariables.motivational_message = 'Ottimo lavoro questa settimana! Continua così!';
            baseVariables.weight_data = [
                { date: '10 Dic', weight: 73.7 },
                { date: '11 Dic', weight: 73.5 },
                { date: '12 Dic', weight: 73.2 },
                { date: '13 Dic', weight: 73.0 },
                { date: '14 Dic', weight: 72.8 },
                { date: '15 Dic', weight: 72.6 },
                { date: '16 Dic', weight: 72.5 }
            ];
            console.log('📊 Weight data added:', baseVariables.weight_data.length, 'points');
        }

        // Invia email di test
        const response = await base44.asServiceRole.functions.invoke('sendEmailUnified', {
            userId: user.id,
            userEmail: testEmail,
            templateId: templateId,
            variables: baseVariables,
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