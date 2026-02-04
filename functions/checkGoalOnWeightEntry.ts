import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * 🎯 CHECK GOAL ON WEIGHT ENTRY
 * 
 * Triggered quando l'utente registra un nuovo peso
 * Verifica immediatamente se ha raggiunto il target e invia l'email
 */

Deno.serve(async (req) => {
    console.log('🎯 checkGoalOnWeightEntry - Start');
    
    try {
        const base44 = createClientFromRequest(req);
        const body = await req.json();
        
        // Payload da entity automation
        const { event, data } = body;
        
        if (!event || event.type !== 'create') {
            return Response.json({ success: false, message: 'Not a create event' });
        }
        
        const weightEntry = data;
        const userId = weightEntry.user_id;
        
        console.log(`📊 New weight entry for user ${userId}: ${weightEntry.weight} kg`);
        
        // Ottieni dati utente
        const user = await base44.asServiceRole.entities.User.get(userId);
        
        if (!user || !user.target_weight) {
            console.log('❌ User not found or no target weight set');
            return Response.json({ success: false, message: 'No target weight set' });
        }
        
        // Controlla se email già inviata
        if (user.goal_achieved_email_sent) {
            console.log('✅ Goal already achieved, email already sent');
            return Response.json({ success: true, message: 'Email already sent' });
        }
        
        const targetWeight = parseFloat(user.target_weight);
        const currentWeight = parseFloat(weightEntry.weight);
        
        // Tolleranza di 0.5 kg
        const hasReachedGoal = currentWeight <= targetWeight + 0.5;
        
        if (hasReachedGoal) {
            console.log(`🎉 GOAL REACHED! User ${user.email} reached ${currentWeight} kg (target: ${targetWeight} kg)`);
            
            // Recupera lo storico peso per calcolare i progressi
            const weightHistory = await base44.asServiceRole.entities.WeightHistory.filter(
                { user_id: userId },
                ['created_date'],  // Ordina dalla prima registrazione alla più recente
                500
            );

            // Peso iniziale: usa il current_weight dal quiz (peso di partenza)
            const startWeight = user.current_weight || currentWeight;
            
            const weightLost = (startWeight - currentWeight).toFixed(1);
            
            // Giorni: dalla prima registrazione peso ad oggi
            const daysToGoal = weightHistory.length > 0
                ? Math.floor((new Date() - new Date(weightHistory[0].created_date)) / (1000 * 60 * 60 * 24))
                : 0;

            // Recupera lingua preferita utente
            const userLang = user.preferred_language || 'it';
            const templateId = `goal_weight_achieved_${userLang}`;

            // Invia email tramite sistema unificato
            await base44.asServiceRole.functions.invoke('sendEmailUnified', {
                userId: user.id,
                userEmail: user.email,
                templateId: templateId,
                variables: {
                    user_name: user.full_name || 'Campione',
                    weight_lost: weightLost,
                    days_to_goal: daysToGoal,
                    app_url: 'https://projectmywellness.com',
                    coupon_code: 'GOALREACHED30'
                },
                language: userLang,
                triggerSource: 'checkGoalOnWeightEntry'
            });
            
            console.log(`✅ Goal achievement email sent to ${user.email}`);
            
            // Reset flag subito dopo l'invio per permettere email future
            await base44.asServiceRole.entities.User.update(user.id, {
                goal_achieved_email_sent: false,
                goal_achieved_date: new Date().toISOString()
            });
            
            return Response.json({ 
                success: true,
                goal_achieved: true,
                email_sent: true
            });
        } else {
            console.log(`📊 Not yet at goal: ${currentWeight} kg > ${targetWeight} kg`);
            return Response.json({ 
                success: true,
                goal_achieved: false,
                current_weight: currentWeight,
                target_weight: targetWeight,
                remaining: (currentWeight - targetWeight).toFixed(1)
            });
        }

    } catch (error) {
        console.error('❌ Error in checkGoalOnWeightEntry:', error);
        return Response.json({ 
            error: error.message 
        }, { status: 500 });
    }
});