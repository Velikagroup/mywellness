import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

// Genera un codice coupon personalizzato per un utente
function generatePersonalCode(userId, baseCode) {
    // Usa hash semplice dell'userId per creare un codice unico
    const hash = userId.split('').reduce((acc, char) => {
        return ((acc << 5) - acc) + char.charCodeAt(0);
    }, 0);
    
    const shortHash = Math.abs(hash).toString(36).toUpperCase().slice(0, 6);
    return `${baseCode}_${shortHash}`;
}

Deno.serve(async (req) => {
    console.log('🎟️ generatePersonalCoupon - Start');
    
    try {
        const base44 = createClientFromRequest(req);
        const body = await req.json();
        const { userId, baseCode, discountValue, emailTrigger } = body;

        if (!userId || !baseCode || !discountValue || !emailTrigger) {
            return Response.json({ 
                error: 'Missing required fields: userId, baseCode, discountValue, emailTrigger' 
            }, { status: 400 });
        }

        console.log(`🎫 Generating personal coupon for user ${userId}: ${baseCode}`);

        // Genera codice personalizzato
        const personalCode = generatePersonalCode(userId, baseCode);

        // Verifica se l'utente esiste
        const user = await base44.asServiceRole.entities.User.get(userId);
        if (!user) {
            return Response.json({ error: 'User not found' }, { status: 404 });
        }

        // Verifica se il coupon esiste già
        const existingCoupons = await base44.asServiceRole.entities.Coupon.filter({
            code: personalCode
        });

        if (existingCoupons.length === 0) {
            // Crea il nuovo coupon personalizzato
            await base44.asServiceRole.entities.Coupon.create({
                code: personalCode,
                discount_type: "percentage",
                discount_value: discountValue,
                is_active: true,
                expires_at: null // Mai scadenza per ora
            });
            console.log(`✅ Created coupon: ${personalCode}`);
        } else {
            console.log(`ℹ️ Coupon already exists: ${personalCode}`);
        }

        // Aggiorna l'utente con il coupon assegnato
        const assignedCoupons = user.assigned_coupons || [];
        
        // Verifica se questo coupon è già stato assegnato
        const alreadyAssigned = assignedCoupons.find(c => c.code === personalCode);
        
        if (!alreadyAssigned) {
            assignedCoupons.push({
                code: personalCode,
                assigned_date: new Date().toISOString(),
                used: false,
                email_trigger: emailTrigger
            });

            await base44.asServiceRole.entities.User.update(userId, {
                assigned_coupons: assignedCoupons
            });
            console.log(`✅ Assigned coupon to user`);
        } else {
            console.log(`ℹ️ Coupon already assigned to user`);
        }

        return Response.json({
            success: true,
            coupon_code: personalCode,
            discount_value: discountValue,
            message: 'Personal coupon generated and assigned'
        });

    } catch (error) {
        console.error('❌ Error generating personal coupon:', error);
        return Response.json({ 
            error: error.message 
        }, { status: 500 });
    }
});