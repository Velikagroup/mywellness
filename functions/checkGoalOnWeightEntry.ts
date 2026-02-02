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
                ['-date'],
                100
            );

            const startWeight = weightHistory.length > 0 
                ? weightHistory[weightHistory.length - 1].weight 
                : currentWeight;
            const weightLost = (startWeight - currentWeight).toFixed(1);
            const daysToGoal = weightHistory.length > 1 
                ? Math.floor((new Date(weightHistory[0].date) - new Date(weightHistory[weightHistory.length - 1].date)) / (1000 * 60 * 60 * 24))
                : 0;

            const fromEmail = Deno.env.get('FROM_EMAIL') || 'info@projectmywellness.com';
            const appUrl = 'https://projectmywellness.com';

            // 🔐 GENERA COUPON PERSONALIZZATO inline
            function generatePersonalCode(userId, baseCode) {
                const hash = userId.split('').reduce((acc, char) => {
                    return ((acc << 5) - acc) + char.charCodeAt(0);
                }, 0);
                const shortHash = Math.abs(hash).toString(36).toUpperCase().slice(0, 6);
                return `${baseCode}_${shortHash}`;
            }

            const personalCouponCode = generatePersonalCode(user.id, 'WINNER30');

            // Verifica se il coupon esiste già
            const existingCoupons = await base44.asServiceRole.entities.Coupon.filter({
                code: personalCouponCode
            });

            if (existingCoupons.length === 0) {
                await base44.asServiceRole.entities.Coupon.create({
                    code: personalCouponCode,
                    discount_type: "percentage",
                    discount_value: 30,
                    is_active: true,
                    expires_at: null
                });
                console.log(`✅ Created coupon: ${personalCouponCode}`);
            } else {
                console.log(`ℹ️ Coupon already exists: ${personalCouponCode}`);
            }

            // Marca come inviata sul profilo utente
            await base44.asServiceRole.entities.User.update(user.id, {
                goal_achieved_email_sent: true,
                goal_achieved_date: new Date().toISOString()
            });

            console.log(`🎫 Using coupon: ${personalCouponCode}`);

            // Invia email tramite sistema unificato
            await base44.asServiceRole.functions.invoke('sendEmailUnified', {
                userId: user.id,
                userEmail: user.email,
                templateId: 'goal_weight_achieved_it',
                variables: {
                    user_name: user.full_name || 'Campione',
                    weight_lost: weightLost,
                    days_to_goal: daysToGoal,
                    coupon_code: personalCouponCode
                },
                language: 'it',
                triggerSource: 'checkGoalOnWeightEntry'
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