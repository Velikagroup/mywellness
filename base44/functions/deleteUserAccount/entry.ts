import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import Stripe from 'npm:stripe';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'), {
    apiVersion: '2023-10-16',
});

Deno.serve(async (req) => {
    console.log('🗑️ deleteUserAccount - Start');
    
    try {
        const base44 = createClientFromRequest(req);
        
        // Authenticate user
        const user = await base44.auth.me();
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        console.log(`🔄 Resetting account for user: ${user.id} (${user.email})`);

        // 1. Cancel Stripe subscription if exists
        if (user.stripe_subscription_id) {
            try {
                await stripe.subscriptions.cancel(user.stripe_subscription_id);
                console.log(`✅ Stripe subscription cancelled: ${user.stripe_subscription_id}`);
            } catch (stripeError) {
                console.warn('⚠️ Error cancelling Stripe subscription:', stripeError.message);
            }
        }

        // 2. Delete user data from all entities
        const entitiesToClean = [
            'WeightHistory',
            'MealPlan',
            'MealLog',
            'WorkoutPlan',
            'WorkoutLog',
            'ProgressPhoto',
            'ShoppingList',
            'Transaction',
            'EmailLog',
            'SupportTicket',
            'AIFeedback',
            'UserActivity',
            'UserOnboarding',
            'PlanGeneration',
            'UserIngredient',
            'AffiliateLink',
            'AffiliateCredit'
        ];

        for (const entityName of entitiesToClean) {
            try {
                // Skip se l'entità non esiste nel database
                if (!base44.asServiceRole.entities[entityName]) {
                    console.log(`⏭️ Skipping ${entityName} (entity not found)`);
                    continue;
                }
                
                const records = await base44.asServiceRole.entities[entityName].filter({ user_id: user.id });
                
                if (records && records.length > 0) {
                    for (const record of records) {
                        await base44.asServiceRole.entities[entityName].delete(record.id);
                    }
                    console.log(`✅ Deleted ${records.length} records from ${entityName}`);
                } else {
                    console.log(`⏭️ No records to delete in ${entityName}`);
                }
            } catch (error) {
                console.warn(`⚠️ Error deleting from ${entityName}:`, error.message);
                // Non bloccare l'eliminazione se un'entity fallisce
                continue;
            }
        }

        // 3. Reset user account data (keep account but clear all data)
        await base44.asServiceRole.entities.User.update(user.id, {
            quiz_completed: false,
            subscription_status: null,
            subscription_plan: null,
            billing_period: null,
            stripe_customer_id: null,
            stripe_subscription_id: null,
            purchased_plan_type: null,
            purchased_landing_offer: null,
            billing_name: null,
            billing_address: null,
            billing_city: null,
            billing_postal_code: null,
            billing_country: null,
            target_weight: null,
            current_weight: null,
            height: null,
            age: null,
            gender: null,
            activity_level: null,
            fitness_goal: null,
            dietary_preferences: null,
            allergies: null,
            daily_calorie_target: null,
            daily_protein_target: null,
            daily_carbs_target: null,
            daily_fat_target: null,
            workout_days_per_week: null,
            workout_style: null,
            equipment_available: null
        });
        console.log(`✅ User account reset: ${user.id}`);

        // 4. Logout user
        await base44.auth.logout();

        return Response.json({ 
            success: true,
            message: 'Account reset successfully. Please login again.'
        });

    } catch (error) {
        console.error('❌ Error deleting account:', error);
        return Response.json({ 
            error: error.message 
        }, { status: 500 });
    }
});