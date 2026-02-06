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

        // Parse date filters from request body
        const { from_date, to_date } = await req.json().catch(() => ({}));
        
        let filter = { user_id: user.id };
        if (from_date && to_date) {
            filter.payment_date = {
                $gte: from_date,
                $lte: to_date
            };
            console.log(`🗓️ Filtering transactions from ${from_date} to ${to_date}`);
        }

        // Usa service role per bypassare RLS e filtra per user_id
        const transactions = await base44.asServiceRole.entities.Transaction.filter(
            filter,
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