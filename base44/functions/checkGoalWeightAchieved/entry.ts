import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * 🎯 CHECK GOAL WEIGHT ACHIEVED
 * 
 * Eseguito ogni ora, verifica se qualche utente ha raggiunto il peso obiettivo
 * e invia l'email celebrativa
 */

Deno.serve(async (req) => {
    console.log('🎯 checkGoalWeightAchieved - Start');
    
    try {
        const base44 = createClientFromRequest(req);

        // Verifica autenticazione admin (questa è una funzione schedulata)
        const user = await base44.auth.me();
        if (user?.role !== 'admin') {
            console.log('❌ Unauthorized - admin only');
            return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
        }

        // Ottieni tutti gli utenti con subscription attiva o trial
        const allUsers = await base44.asServiceRole.entities.User.list();
        const activeUsers = allUsers.filter(u => 
            (u.subscription_status === 'active' || u.subscription_status === 'trial') && 
            u.target_weight && 
            !u.goal_achieved_email_sent // Flag per non inviare più volte
        );

        console.log(`📊 Checking ${activeUsers.length} active users for goal achievement`);

        let emailsSent = 0;

        for (const user of activeUsers) {
            try {
                const targetWeight = parseFloat(user.target_weight);
                
                // Prendi il peso più recente dallo storico
                const weightHistory = await base44.asServiceRole.entities.WeightHistory.filter(
                    { user_id: user.id },
                    ['-date'],
                    1
                );
                
                if (weightHistory.length === 0) {
                    continue; // Nessun peso registrato
                }
                
                const currentWeight = parseFloat(weightHistory[0].weight);

                // Tolleranza di 0.5 kg per raggiungimento obiettivo
                const hasReachedGoal = currentWeight <= targetWeight + 0.5;

                if (hasReachedGoal) {
                    console.log(`🎉 User ${user.email} has reached goal! (${currentWeight} kg ≤ ${targetWeight} kg)`);

                    // Invia email celebrativa
                    await base44.asServiceRole.functions.invoke('sendGoalWeightAchieved', {
                        userId: user.id
                    });

                    // Marca come inviata
                    await base44.asServiceRole.entities.User.update(user.id, {
                        goal_achieved_email_sent: true,
                        goal_achieved_date: new Date().toISOString()
                    });

                    emailsSent++;
                    console.log(`✅ Goal achievement email sent to ${user.email}`);
                }
            } catch (userError) {
                console.error(`❌ Error processing user ${user.email}:`, userError);
                // Continua con gli altri utenti
            }
        }

        console.log(`✅ Check completed. Emails sent: ${emailsSent}`);

        return Response.json({ 
            success: true,
            users_checked: activeUsers.length,
            emails_sent: emailsSent
        });

    } catch (error) {
        console.error('❌ Error in checkGoalWeightAchieved:', error);
        return Response.json({ 
            error: error.message 
        }, { status: 500 });
    }
});