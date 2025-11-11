Deno.serve(async (req) => {
    const publishableKey = Deno.env.get("STRIPE_PUBLISHABLE_KEY");
    
    if (!publishableKey) {
        return Response.json({ 
            error: 'Stripe publishable key not configured' 
        }, { status: 500 });
    }
    
    return Response.json({ 
        publishableKey: publishableKey 
    });
});