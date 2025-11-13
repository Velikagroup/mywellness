import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized - Admin only' }, { status: 401 });
    }

    const { email, plan, notes } = await req.json();

    if (!email || !plan) {
      return Response.json({ 
        error: 'Email and plan are required' 
      }, { status: 400 });
    }

    if (!['base', 'pro', 'premium'].includes(plan)) {
      return Response.json({ 
        error: 'Invalid plan. Must be: base, pro, or premium' 
      }, { status: 400 });
    }

    // Genera codice univoco personalizzato
    const timestamp = Date.now().toString(36).toUpperCase();
    const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase();
    const code = `LIFETIME_${timestamp}${randomPart}`;

    // Crea il coupon nel database
    const coupon = await base44.asServiceRole.entities.Coupon.create({
      code: code,
      discount_type: 'lifetime_free',
      discount_value: 0,
      assigned_to_email: email.toLowerCase(),
      assigned_plan: plan,
      is_active: true,
      expires_at: null,
      notes: notes || `Lifetime ${plan} coupon for ${email}`
    });

    console.log(`✅ Lifetime coupon created: ${code} for ${email} (${plan} plan)`);

    return Response.json({
      success: true,
      coupon: {
        code: coupon.code,
        email: coupon.assigned_to_email,
        plan: coupon.assigned_plan,
        created_at: coupon.created_date
      },
      message: `Coupon ${code} created successfully. User ${email} will have lifetime ${plan} access.`
    });

  } catch (error) {
    console.error('Error generating lifetime coupon:', error);
    return Response.json({ 
      error: error.message 
    }, { status: 500 });
  }
});