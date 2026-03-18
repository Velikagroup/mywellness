import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
    console.log('🔧 adminUpdateUserPlan - Start');
    
    try {
        const base44 = createClientFromRequest(req);
        const adminUser = await base44.auth.me();

        if (!adminUser || (adminUser.role !== 'admin' && adminUser.custom_role !== 'customer_support')) {
            return Response.json({ success: false, error: 'Unauthorized - Admin or Customer Support only' }, { status: 401 });
        }

        const { userEmail, newPlan, customRole, updates } = await req.json();
        
        if (!userEmail) {
            return Response.json({ success: false, error: 'Missing userEmail' }, { status: 400 });
        }

        const users = await base44.asServiceRole.entities.User.filter({ email: userEmail });

        if (users.length === 0) {
            return Response.json({ success: false, error: 'User not found' }, { status: 404 });
        }

        const user = users[0];
        const updateData = {};

        // Handle plan change
        if (newPlan) {
            const validPlans = ['free', 'base', 'pro', 'premium'];
            if (!validPlans.includes(newPlan)) {
                return Response.json({ success: false, error: 'Invalid plan. Must be: free, base, pro, premium' }, { status: 400 });
            }
            updateData.subscription_plan = newPlan;
            console.log(`🔄 Admin ${adminUser.email} updating ${userEmail} to plan: ${newPlan}`);
        }

        // Handle custom_role change (customer_support)
        // NOTA: Il campo 'role' è built-in e non può essere modificato via SDK
        // Usiamo solo custom_role per gestire i permessi customer_support
        if (customRole !== undefined) {
            if (customRole === null || customRole === '') {
                updateData.custom_role = null;
                console.log(`🔄 Admin ${adminUser.email} removing custom_role from ${userEmail}`);
            } else if (customRole === 'customer_support') {
                updateData.custom_role = 'customer_support';
                console.log(`🔄 Admin ${adminUser.email} setting ${userEmail} as customer_support`);
            } else {
                return Response.json({ success: false, error: 'Invalid customRole. Must be: customer_support or null' }, { status: 400 });
            }
        }

        // Apply generic updates if provided
        if (updates && typeof updates === 'object') {
            Object.assign(updateData, updates);
        }

        if (Object.keys(updateData).length === 0) {
            return Response.json({ success: false, error: 'No valid updates provided' }, { status: 400 });
        }

        await base44.asServiceRole.entities.User.update(user.id, updateData);

        console.log(`✅ User ${userEmail} updated:`, updateData);

        return Response.json({ 
            success: true,
            message: `User ${userEmail} updated successfully`,
            updates: updateData
        });

    } catch (error) {
        console.error('❌ Error:', error);
        return Response.json({ success: false, error: error.message }, { status: 500 });
    }
});