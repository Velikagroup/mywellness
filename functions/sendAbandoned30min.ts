import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    console.log('📧 sendAbandoned30min - Checking users registered 30min without purchase');

    try {
        const base44 = createClientFromRequest(req);
        
        const now = new Date();
        const thirtyMinutesAgo = new Date(now.getTime() - 30 * 60 * 1000);

        // Get users created in the last 30 minutes
        const allUsers = await base44.asServiceRole.entities.User.list();
        
        const usersToEmail = allUsers.filter(u => {
            const createdDate = new Date(u.created_date);
            
            // User created in last 30 minutes
            if (createdDate < thirtyMinutesAgo) return false;
            
            // User hasn't purchased (no valid subscription)
            const validStatuses = ['active', 'trial'];
            const hasPurchased = validStatuses.includes(u.subscription_status);
            
            // Email not already sent
            if (u.abandoned_email_30min_sent === true) return false;
            
            return !hasPurchased;
        });

        console.log(`📧 Found ${usersToEmail.length} users registered 30min without purchase`);

        let sentCount = 0;

        for (const user of usersToEmail) {
            try {
                const userLanguage = user.preferred_language || 'it';
                const templateId = `cart_checkout_abandoned_${userLanguage}`;
                
                await base44.asServiceRole.functions.invoke('sendEmailUnified', {
                    userId: user.id,
                    userEmail: user.email,
                    templateId: templateId,
                    variables: {
                        user_name: user.full_name || 'Utente'
                    },
                    language: userLanguage,
                    triggerSource: 'abandoned_registration_30min'
                });

                // Mark email as sent
                await base44.asServiceRole.entities.User.update(user.id, {
                    abandoned_email_30min_sent: true
                });

                sentCount++;
                console.log(`✅ Email sent to ${user.email} (30min abandoned)`);

            } catch (error) {
                console.error(`❌ Failed to send email to ${user.email}:`, error.message);
            }
        }

        console.log(`🎉 30min abandoned emails: ${sentCount}/${usersToEmail.length} sent`);

        return Response.json({
            success: true,
            sent_count: sentCount,
            total_users: usersToEmail.length
        });

    } catch (error) {
        console.error('❌ Error:', error);
        return Response.json({ 
            error: error.message 
        }, { status: 500 });
    }
});