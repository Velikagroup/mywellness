import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
    console.log('✅ markCouponAsUsed - Start');
    
    try {
        const base44 = createClientFromRequest(req);
        const body = await req.json();
        const { couponCode, userEmail } = body;

        if (!couponCode || !userEmail) {
            return Response.json({ 
                error: 'Missing required fields: couponCode, userEmail' 
            }, { status: 400 });
        }

        console.log(`🎫 Marking coupon ${couponCode} as used by ${userEmail}`);

        // Trova l'utente
        const users = await base44.asServiceRole.entities.User.filter({
            email: userEmail
        });

        if (users.length === 0) {
            return Response.json({ error: 'User not found' }, { status: 404 });
        }

        const user = users[0];
        const assignedCoupons = user.assigned_coupons || [];

        // Trova il coupon nell'array
        const couponIndex = assignedCoupons.findIndex(c => c.code === couponCode);

        if (couponIndex === -1) {
            console.log(`⚠️ Coupon ${couponCode} not found in user's assigned coupons`);
            return Response.json({
                success: false,
                message: 'Coupon not assigned to user'
            }, { status: 200 });
        }

        // Marca come usato
        assignedCoupons[couponIndex].used = true;
        assignedCoupons[couponIndex].used_date = new Date().toISOString();

        await base44.asServiceRole.entities.User.update(user.id, {
            assigned_coupons: assignedCoupons
        });

        console.log(`✅ Coupon marked as used`);

        return Response.json({
            success: true,
            message: 'Coupon marked as used'
        });

    } catch (error) {
        console.error('❌ Error marking coupon as used:', error);
        return Response.json({ 
            error: error.message 
        }, { status: 500 });
    }
});