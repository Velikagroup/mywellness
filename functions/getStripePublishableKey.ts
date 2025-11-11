Deno.serve(async (req) => {
    console.log('🔑 getStripePublishableKey called');
    
    const publishableKey = Deno.env.get("STRIPE_PUBLISHABLE_KEY");
    
    console.log('📦 STRIPE_PUBLISHABLE_KEY exists:', !!publishableKey);
    if (publishableKey) {
        console.log('📏 Key length:', publishableKey.length);
        console.log('🔍 Key preview:', publishableKey.substring(0, 20) + '...' + publishableKey.substring(publishableKey.length - 10));
    }
    
    if (!publishableKey) {
        console.error('❌ STRIPE_PUBLISHABLE_KEY not found in environment');
        return Response.json({ 
            error: 'Stripe publishable key not configured' 
        }, { status: 500 });
    }
    
    return Response.json({ 
        publishableKey: publishableKey 
    });
});