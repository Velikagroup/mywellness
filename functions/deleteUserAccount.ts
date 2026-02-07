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

        console.log(`🗑️ Deleting account for user: ${user.id} (${user.email})`);

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

        // 3. Delete user account (this will log them out)
        await base44.asServiceRole.entities.User.delete(user.id);
        console.log(`✅ User account deleted: ${user.id}`);

        return Response.json({ 
            success: true,
            message: 'Account deleted successfully'
        });

    } catch (error) {
        console.error('❌ Error deleting account:', error);
        return Response.json({ 
            error: error.message 
        }, { status: 500 });
    }
});