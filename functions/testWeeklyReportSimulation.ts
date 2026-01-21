import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
    console.log('🧪 Testing Weekly Report with TIME SIMULATION');
    
    try {
        const base44 = createClientFromRequest(req);
        
        // Auth check - solo admin
        const user = await base44.auth.me();
        if (user?.role !== 'admin') {
            return Response.json({ error: 'Unauthorized' }, { status: 403 });
        }

        // Parametro opzionale: simula un orario UTC specifico
        const body = await req.json().catch(() => ({}));
        const simulateUTCTime = body.simulateUTCTime; // formato: "2026-01-20T23:00:00Z" (lunedì 23:00 UTC = martedì 00:00 Roma)
        
        const now = simulateUTCTime ? new Date(simulateUTCTime) : new Date();
        console.log(`🕐 ${simulateUTCTime ? 'SIMULATED' : 'Current'} UTC time: ${now.toISOString()}`);
        
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
                    day_of_week: dayNames[userDay],
                    hour: userHour,
                    is_monday: userDay === 1,
                    is_midnight_hour: userHour === 0,
                    would_receive_email: isEligible ? '✅ YES' : '❌ NO',
                    reason: isEligible ? 'Monday + Midnight hour' : 
                            !userDay === 1 ? `Wrong day (${dayNames[userDay]})` : 
                            'Wrong hour',
                    user_id: user.id
                });
                
            } catch (error) {
                results.push({
                    email: user.email,
                    timezone: userTimezone,
                    error: error.message,
                    would_receive_email: '❌ ERROR'
                });
            }
        }

        // Ordina: prima chi riceverà l'email, poi per timezone
        results.sort((a, b) => {
            if (a.would_receive_email !== b.would_receive_email) {
                return a.would_receive_email.includes('YES') ? -1 : 1;
            }
            return (a.timezone || '').localeCompare(b.timezone || '');
        });

        // Suggerisci orari UTC per testare vari timezone
        const testSuggestions = [
            { utc: "2026-01-20T23:00:00Z", description: "Lunedì 23:00 UTC → Martedì 00:00 Europe/Rome (mezzanotte italiana)" },
            { utc: "2026-01-20T05:00:00Z", description: "Lunedì 05:00 UTC → Lunedì 00:00 America/New_York (mezzanotte NY)" },
            { utc: "2026-01-20T15:00:00Z", description: "Lunedì 15:00 UTC → Martedì 00:00 Asia/Tokyo (mezzanotte Tokyo)" },
            { utc: "2026-01-20T08:00:00Z", description: "Lunedì 08:00 UTC → Martedì 00:00 Australia/Sydney (mezzanotte Sydney)" }
        ];

        console.log(`✅ Test completed: ${eligibleCount}/${activeUsers.length} users would receive email`);

        return Response.json({
            success: true,
            simulation_mode: !!simulateUTCTime,
            test_time_utc: now.toISOString(),
            total_active_users: activeUsers.length,
            eligible_users_count: eligibleCount,
            users: results,
            test_suggestions: testSuggestions,
            how_to_test: {
                description: "Per testare altri orari, invia una richiesta POST con:",
                example: {
                    simulateUTCTime: "2026-01-20T23:00:00Z"
                },
                note: "Questo simula cosa succederebbe a quell'ora UTC"
            },
            explanation: {
                criteria: "Email inviata quando: timezone dell'utente mostra Lunedì E ora è 00:00-00:59",
                automation_frequency: "Automazione parte ogni ora",
                logic: "Ogni utente riceve email alla SUA mezzanotte di lunedì, non la tua"
            }
        });

    } catch (error) {
        console.error('❌ Test Error:', error);
        return Response.json({ 
            error: error.message 
        }, { status: 500 });
    }
});