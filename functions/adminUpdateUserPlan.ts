import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
    console.log('🔧 adminUpdateUserPlan - Start');
    
    try {
        const base44 = createClientFromRequest(req);
        const adminUser = await base44.auth.me();

        if (!adminUser || adminUser.role !== 'admin') {
            return Response.json({ success: false, error: 'Unauthorized - Admin only' }, { status: 401 });
        }

        const { userEmail, newPlan } = await req.json();
        
        if (!userEmail || !newPlan) {
            return Response.json({ success: false, error: 'Missing userEmail or newPlan' }, { status: 400 });
        }

        const validPlans = ['free', 'base', 'pro', 'premium'];
        if (!validPlans.includes(newPlan)) {
            return Response.json({ success: false, error: 'Invalid plan. Must be: free, base, pro, premium' }, { status: 400 });
        }

        console.log(`🔄 Admin ${adminUser.email} updating ${userEmail} to plan: ${newPlan}`);

        const users = await base44.asServiceRole.entities.User.filter({ email: userEmail });

        if (users.length === 0) {
            return Response.json({ success: false, error: 'User not found' }, { status: 404 });
        }

        const user = users[0];
        const oldPlan = user.subscription_plan;

        await base44.asServiceRole.entities.User.update(user.id, {
            subscription_plan: newPlan
        });

        console.log(`✅ User ${userEmail} updated from ${oldPlan} to ${newPlan}`);

        return Response.json({ 
            success: true,
            message: `User ${userEmail} updated from ${oldPlan} to ${newPlan}`,
            oldPlan,
            newPlan
        });

    } catch (error) {
        console.error('❌ Error:', error);
        return Response.json({ success: false, error: error.message }, { status: 500 });
    }
});