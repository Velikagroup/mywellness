import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
    console.log('📊 adminListTransactions - Start');
    
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        // Solo admin può vedere tutte le transazioni
        if (user.role !== 'admin') {
            return Response.json({ success: false, error: 'Admin only' }, { status: 403 });
        }

        // Usa service role per bypassare RLS
        const transactions = await base44.asServiceRole.entities.Transaction.filter({});
        
        console.log(`✅ Found ${transactions.length} transactions`);

        return Response.json({
            success: true,
            transactions: transactions
        });

    } catch (error) {
        console.error('❌ Error:', error);
        return Response.json({ 
            success: false,
            error: error.message 
        }, { status: 500 });
    }
});