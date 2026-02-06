import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
    console.log('📊 getUserTransactions - Start');
    
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        console.log(`👤 Loading transactions for user: ${user.id} (${user.email})`);

        // Usa service role per bypassare RLS e filtra per user_id
        const transactions = await base44.asServiceRole.entities.Transaction.filter(
            { user_id: user.id },
            '-payment_date',
            50
        );
        
        console.log(`✅ Found ${transactions.length} transactions for user`);

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