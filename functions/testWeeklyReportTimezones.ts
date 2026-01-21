import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
    console.log('🧪 Testing Weekly Report Timezone Logic');
    
    try {
        const base44 = createClientFromRequest(req);
        
        // Auth check - solo admin
        const user = await base44.auth.me();
        if (user?.role !== 'admin') {
            return Response.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const now = new Date();
        console.log(`🕐 Current UTC time: ${now.toISOString()}`);
        
        // Recupera tutti gli utenti attivi
        const allUsers = await base44.asServiceRole.entities.User.list();
        const activeUsers = allUsers.filter(u => 
            u.subscription_status === 'active' && 
            u.quiz_completed === true
        );

        console.log(`👥 Found ${activeUsers.length} active users total`);

        const results = [];
        let eligibleCount = 0;
        
        for (const user of activeUsers) {
            const userTimezone = user.timezone || 'Europe/Rome';
            
            try {
                // Calcola che ore sono nel timezone dell'utente
                const userNow = new Date(now.toLocaleString('en-US', { timeZone: userTimezone }));
                const userHour = userNow.getHours();
                const userMinute = userNow.getMinutes();
                const userDay = userNow.getDay(); // 0=Sunday, 1=Monday, etc.
                const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                
                // Controlla se è lunedì e se è tra mezzanotte e 1am
                const isEligible = userDay === 1 && userHour === 0;
                
                if (isEligible) {
                    eligibleCount++;
                }
                
                results.push({
                    email: user.email,
                    timezone: userTimezone,
                    local_time: `${dayNames[userDay]} ${userHour.toString().padStart(2, '0')}:${userMinute.toString().padStart(2, '0')}`,
                    is_monday: userDay === 1,
                    is_midnight_hour: userHour === 0,
                    would_receive_email: isEligible,
                    user_id: user.id
                });
                
            } catch (error) {
                results.push({
                    email: user.email,
                    timezone: userTimezone,
                    error: error.message,
                    would_receive_email: false
                });
            }
        }

        // Ordina: prima chi riceverà l'email, poi per timezone
        results.sort((a, b) => {
            if (a.would_receive_email !== b.would_receive_email) {
                return b.would_receive_email ? 1 : -1;
            }
            return (a.timezone || '').localeCompare(b.timezone || '');
        });

        console.log(`✅ Test completed: ${eligibleCount}/${activeUsers.length} users would receive email now`);

        return Response.json({
            success: true,
            current_utc_time: now.toISOString(),
            total_active_users: activeUsers.length,
            eligible_users_count: eligibleCount,
            users: results,
            explanation: {
                criteria: "Email sent when: user.timezone shows Monday AND hour is 00:00-00:59",
                automation_frequency: "Runs every hour",
                note: "Each user receives email at THEIR Monday midnight, not yours"
            }
        });

    } catch (error) {
        console.error('❌ Test Error:', error);
        return Response.json({ 
            error: error.message 
        }, { status: 500 });
    }
});