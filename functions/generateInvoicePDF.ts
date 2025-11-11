import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';
import Stripe from 'npm:stripe@14.10.0';

Deno.serve(async (req) => {
    console.log('📄 generateInvoicePDF - Start');
    
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const { transactionId } = await req.json();
        
        if (!transactionId) {
            return Response.json({ 
                success: false, 
                error: 'Missing transactionId' 
            }, { status: 400 });
        }

        console.log(`✅ Generating invoice for transaction ${transactionId}`);

        const transactions = await base44.entities.Transaction.filter({ id: transactionId });
        
        if (!transactions || transactions.length === 0) {
            return Response.json({ 
                success: false, 
                error: 'Transaction not found' 
            }, { status: 404 });
        }

        const transaction = transactions[0];

        // Recupera dati utente
        const transactionUser = await base44.asServiceRole.entities.User.filter({ id: transaction.user_id });
        const userData = transactionUser[0];

        const invoiceNumber = `INV-${new Date(transaction.payment_date).getFullYear()}-${String(transaction.id).padStart(6, '0')}`;
        const invoiceDate = new Date(transaction.payment_date).toLocaleDateString('it-IT');

        // Genera HTML fattura
        const invoiceHTML = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; padding: 40px; }
        .header { border-bottom: 3px solid #26847F; padding-bottom: 20px; margin-bottom: 30px; }
        .company { font-weight: bold; font-size: 24px; color: #26847F; }
        .invoice-details { margin: 30px 0; }
        .invoice-details table { width: 100%; }
        .invoice-details td { padding: 8px 0; }
        .items { margin: 30px 0; }
        .items table { width: 100%; border-collapse: collapse; }
        .items th { background: #f5f5f5; padding: 12px; text-align: left; border-bottom: 2px solid #26847F; }
        .items td { padding: 12px; border-bottom: 1px solid #ddd; }
        .total { text-align: right; font-size: 18px; font-weight: bold; margin-top: 20px; }
        .footer { margin-top: 50px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; }
    </style>
</head>
<body>
    <div class="header">
        <div class="company">VELIKA GROUP LLC</div>
        <div>30 N Gould St 32651, Sheridan, WY 82801, United States</div>
        <div>EIN: 36-5141800</div>
        <div>Email: velika.03@outlook.it</div>
    </div>

    <h1>FATTURA N° ${invoiceNumber}</h1>
    <p>Data: ${invoiceDate}</p>

    <div class="invoice-details">
        <h3>Intestatario:</h3>
        <table>
            <tr>
                <td><strong>Nome:</strong></td>
                <td>${userData.billing_name || userData.full_name || 'N/D'}</td>
            </tr>
            <tr>
                <td><strong>Email:</strong></td>
                <td>${userData.email}</td>
            </tr>
            ${userData.billing_type === 'company' ? `
            <tr>
                <td><strong>Azienda:</strong></td>
                <td>${userData.company_name || 'N/D'}</td>
            </tr>
            ` : ''}
            <tr>
                <td><strong>${userData.billing_type === 'company' ? 'P.IVA' : 'Codice Fiscale'}:</strong></td>
                <td>${userData.tax_id || 'N/D'}</td>
            </tr>
            ${userData.billing_type === 'company' && userData.pec_sdi ? `
            <tr>
                <td><strong>PEC/SDI:</strong></td>
                <td>${userData.pec_sdi}</td>
            </tr>
            ` : ''}
            <tr>
                <td><strong>Indirizzo:</strong></td>
                <td>${userData.billing_address || 'N/D'}, ${userData.billing_city || ''} ${userData.billing_zip || ''}, ${userData.billing_country || ''}</td>
            </tr>
        </table>
    </div>

    <div class="items">
        <h3>Dettagli:</h3>
        <table>
            <thead>
                <tr>
                    <th>Descrizione</th>
                    <th>Piano</th>
                    <th>Periodo</th>
                    <th style="text-align: right;">Importo</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>${transaction.description || 'Abbonamento MyWellness'}</td>
                    <td>${transaction.plan || 'N/D'}</td>
                    <td>${transaction.billing_period || 'N/D'}</td>
                    <td style="text-align: right;">€${transaction.amount.toFixed(2)}</td>
                </tr>
            </tbody>
        </table>
    </div>

    <div class="total">
        <p>TOTALE: €${transaction.amount.toFixed(2)}</p>
    </div>

    <div class="footer">
        <p>Pagamento effettuato tramite Stripe - Transazione ID: ${transaction.stripe_payment_intent_id || transaction.id}</p>
        <p>Metodo di pagamento: ${transaction.metadata?.payment_method || 'Carta di credito'}</p>
        <p>Questa è una fattura elettronica generata automaticamente.</p>
    </div>
</body>
</html>
        `;

        console.log('✅ Invoice HTML generated');

        return Response.json({
            success: true,
            invoiceHTML: invoiceHTML,
            invoiceNumber: invoiceNumber
        });

    } catch (error) {
        console.error('❌ Invoice generation error:', error);
        return Response.json({ 
            success: false,
            error: error.message || 'Unknown error'
        }, { status: 500 });
    }
});