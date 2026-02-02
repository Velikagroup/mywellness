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
            
            // Invia email celebrativa
            await base44.asServiceRole.functions.invoke('sendGoalWeightAchieved', {
                userId: user.id
            });
            
            console.log(`✅ Goal achievement email sent to ${user.email}`);
            
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