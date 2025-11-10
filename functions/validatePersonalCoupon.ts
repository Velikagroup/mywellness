import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
    console.log('🔍 validatePersonalCoupon - Start');
    
    try {
        const base44 = createClientFromRequest(req);
        const body = await req.json();
        const { couponCode, userEmail } = body;

        if (!couponCode || !userEmail) {
            return Response.json({ 
                error: 'Missing required fields: couponCode, userEmail' 
            }, { status: 400 });
        }

        console.log(`🎫 Validating coupon ${couponCode} for ${userEmail}`);

        // Trova il coupon
        const coupons = await base44.asServiceRole.entities.Coupon.filter({
            code: couponCode
        });

        if (coupons.length === 0) {
            return Response.json({
                valid: false,
                error: 'Codice coupon non valido'
            }, { status: 200 });
        }

        const coupon = coupons[0];

        if (!coupon.is_active) {
            return Response.json({
                valid: false,
                error: 'Codice coupon non più attivo'
            }, { status: 200 });
        }

        // Verifica scadenza
        if (coupon.expires_at) {
            const expiryDate = new Date(coupon.expires_at);
            if (expiryDate < new Date()) {
                return Response.json({
                    valid: false,
                    error: 'Codice coupon scaduto'
                }, { status: 200 });
            }
        }

        // Se è un coupon personalizzato (contiene _), verifica che appartenga all'utente
        if (couponCode.includes('_')) {
            const users = await base44.asServiceRole.entities.User.filter({
                email: userEmail
            });

            if (users.length === 0) {
                return Response.json({
                    valid: false,
                    error: 'Utente non trovato'
                }, { status: 200 });
            }

            const user = users[0];
            const assignedCoupons = user.assigned_coupons || [];
            
            const couponAssignment = assignedCoupons.find(c => c.code === couponCode);

            if (!couponAssignment) {
                return Response.json({
                    valid: false,
                    error: 'Questo coupon non è stato assegnato a te'
                }, { status: 200 });
            }

            if (couponAssignment.used) {
                return Response.json({
                    valid: false,
                    error: 'Hai già utilizzato questo coupon'
                }, { status: 200 });
            }
        }

        // Coupon valido!
        return Response.json({
            valid: true,
            discount_type: coupon.discount_type,
            discount_value: coupon.discount_value,
            message: 'Coupon valido!'
        }, { status: 200 });

    } catch (error) {
        console.error('❌ Error validating coupon:', error);
        return Response.json({ 
            error: error.message 
        }, { status: 500 });
    }
});