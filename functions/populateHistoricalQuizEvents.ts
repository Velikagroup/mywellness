import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user || user.role !== 'admin') {
            return Response.json({ error: 'Admin access required' }, { status: 403 });
        }

        console.log('🔄 Starting historical quiz events population...');

        // Get all users
        const allUsers = await base44.asServiceRole.entities.User.list();
        console.log(`📊 Total users: ${allUsers.length}`);

        let eventsCreated = 0;
        let usersProcessed = 0;

        for (const targetUser of allUsers) {
            // Check if user has quiz_completed
            if (!targetUser.quiz_completed) {
                continue;
            }

            usersProcessed++;

            // Check if events already exist for this user
            const existingEvents = await base44.asServiceRole.entities.QuizEvent.filter({
                user_id: targetUser.id
            });

            if (existingEvents.length > 0) {
                console.log(`⏭️ User ${targetUser.email} already has quiz events, skipping`);
                continue;
            }

            console.log(`📝 Creating events for user: ${targetUser.email}`);

            // Create quiz_started event
            await base44.asServiceRole.entities.QuizEvent.create({
                user_id: targetUser.id,
                event_name: 'quiz_started',
                step_index: 0,
                step_name: 'Quiz Started',
                metadata: {
                    source: 'historical_import',
                    created_date_override: targetUser.created_date
                }
            });
            eventsCreated++;

            // Create quiz_completed event
            await base44.asServiceRole.entities.QuizEvent.create({
                user_id: targetUser.id,
                event_name: 'quiz_completed',
                step_index: 10,
                step_name: 'Quiz Completed',
                metadata: {
                    source: 'historical_import',
                    created_date_override: targetUser.created_date
                }
            });
            eventsCreated++;

            // Create email_saved event (all users with quiz_completed have email)
            await base44.asServiceRole.entities.QuizEvent.create({
                user_id: targetUser.id,
                event_name: 'email_saved',
                step_index: 11,
                step_name: 'Email Saved',
                metadata: {
                    source: 'historical_import',
                    email: targetUser.email,
                    created_date_override: targetUser.created_date
                }
            });
            eventsCreated++;

            // Create trial_started event if user has/had subscription
            const hasSubscription = targetUser.subscription_status === 'active' || 
                                   targetUser.subscription_status === 'trial' ||
                                   targetUser.subscription_status === 'cancelled' ||
                                   targetUser.subscription_status === 'expired';

            if (hasSubscription) {
                await base44.asServiceRole.entities.QuizEvent.create({
                    user_id: targetUser.id,
                    event_name: 'trial_started',
                    step_index: 999,
                    step_name: 'Trial Started',
                    metadata: {
                        source: 'historical_import',
                        subscription_status: targetUser.subscription_status,
                        created_date_override: targetUser.created_date
                    }
                });
                eventsCreated++;
            }

            console.log(`✅ Events created for user ${targetUser.email}`);
        }

        console.log(`✅ Population complete! ${eventsCreated} events created for ${usersProcessed} users`);

        return Response.json({
            success: true,
            eventsCreated,
            usersProcessed
        });

    } catch (error) {
        console.error('❌ Error populating historical events:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});