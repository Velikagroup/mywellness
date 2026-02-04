import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    console.log('📧 sendCartAbandoned24h - Checking users registered 24h without purchase');

    try {
        const base44 = createClientFromRequest(req);
        
        const now = new Date();
        const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

        const allUsers = await base44.asServiceRole.entities.User.list();
        
        const usersToEmail = allUsers.filter(u => {
            const createdDate = new Date(u.created_date);
            
            // User created more than 24 hours ago
            if (createdDate > twentyFourHoursAgo) return false;
            
            // User hasn't purchased (no valid subscription)
            const validStatuses = ['active', 'trial'];
            const hasPurchased = validStatuses.includes(u.subscription_status);
            
            // Email not already sent
            if (u.abandoned_email_24h_sent === true) return false;
            
            return !hasPurchased;
        });

        console.log(`📧 Found ${usersToEmail.length} users registered 24h without purchase`);

        let sentCount = 0;

        for (const user of usersToEmail) {
            try {
                const userLanguage = user.preferred_language || 'it';
                const templateId = `cart_abandoned_24h_${userLanguage}`;
                
                await base44.asServiceRole.functions.invoke('sendEmailUnified', {
                    userId: user.id,
                    userEmail: user.email,
                    templateId: templateId,
                    variables: {
                        user_name: user.full_name || 'Utente'
                    },
                    language: userLanguage,
                    triggerSource: 'abandoned_registration_24h'
                });

                await base44.asServiceRole.entities.User.update(user.id, {
                    abandoned_email_24h_sent: true
                });

                sentCount++;
                console.log(`✅ Email sent to ${user.email} (24h abandoned)`);

            } catch (error) {
                console.error(`❌ Failed to send email to ${user.email}:`, error.message);
            }
        }

        console.log(`🎉 24h abandoned emails: ${sentCount}/${usersToEmail.length} sent`);

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