import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
    console.log('🧹 cleanupDuplicateTransactions - Start');
    
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user || user.role !== 'admin') {
            return Response.json({ success: false, error: 'Admin only' }, { status: 403 });
        }

        // Carica tutte le transazioni
        const allTransactions = await base44.asServiceRole.entities.Transaction.list('-created_date', 1000);
        console.log(`📊 Found ${allTransactions.length} total transactions`);

        // Raggruppa per stripe_payment_intent_id
        const groupedByPI = {};
        const toDelete = [];

        for (const tx of allTransactions) {
            const key = tx.stripe_payment_intent_id || `no_pi_${tx.id}`;
            
            if (!groupedByPI[key]) {
                groupedByPI[key] = [];
            }
            groupedByPI[key].push(tx);
        }

        // Per ogni gruppo con più di 1 transazione, tieni solo quella con invoice_id (se presente) o la più vecchia
        for (const [key, txList] of Object.entries(groupedByPI)) {
            if (txList.length > 1) {
                console.log(`🔄 Found ${txList.length} duplicates for ${key}`);
                
                // Ordina: prima quelle con invoice_id, poi per created_date (la più vecchia prima)
                txList.sort((a, b) => {
                    if (a.stripe_invoice_id && !b.stripe_invoice_id) return -1;
                    if (!a.stripe_invoice_id && b.stripe_invoice_id) return 1;
                    return new Date(a.created_date) - new Date(b.created_date);
                });

                // Tieni la prima, elimina le altre
                for (let i = 1; i < txList.length; i++) {
                    toDelete.push(txList[i].id);
                }
            }
        }

        console.log(`🗑️ Deleting ${toDelete.length} duplicate transactions`);

        // Elimina i duplicati
        let deletedCount = 0;
        for (const id of toDelete) {
            try {
                await base44.asServiceRole.entities.Transaction.delete(id);
                deletedCount++;
            } catch (e) {
                console.error(`Failed to delete ${id}:`, e.message);
            }
        }

        return Response.json({
            success: true,
            totalFound: allTransactions.length,
            duplicatesDeleted: deletedCount,
            remaining: allTransactions.length - deletedCount
        });

    } catch (error) {
        console.error('❌ Error:', error);
        return Response.json({ 
            success: false,
            error: error.message 
        }, { status: 500 });
    }
});