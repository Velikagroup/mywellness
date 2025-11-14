import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

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

        // ✅ Verifica che l'utente possa accedere solo alle sue transazioni
        if (transaction.user_id !== user.id) {
            return Response.json({ 
                success: false, 
                error: 'Unauthorized access to transaction' 
            }, { status: 403 });
        }

        // Recupera dati utente con service role
        const transactionUser = await base44.asServiceRole.entities.User.filter({ id: transaction.user_id });
        const userData = transactionUser[0];

        const invoiceNumber = `INV-${new Date(transaction.payment_date).getFullYear()}-${String(transaction.id).slice(0, 8).toUpperCase()}`;
        const invoiceDate = new Date(transaction.payment_date).toLocaleDateString('it-IT');

        // ✅ Calcola IVA se applicabile (IT = 22%)
        const taxRate = userData.billing_country === 'IT' ? 0.22 : 0;
        const netAmount = transaction.amount / (1 + taxRate);
        const taxAmount = transaction.amount - netAmount;

        // Genera HTML fattura
        const invoiceHTML = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { 
            font-family: 'Helvetica', Arial, sans-serif; 
            padding: 40px; 
            max-width: 800px;
            margin: 0 auto;
            color: #333;
        }
        .header { 
            border-bottom: 3px solid #26847F; 
            padding-bottom: 20px; 
            margin-bottom: 30px;
            display: flex;
            justify-content: space-between;
            align-items: start;
        }
        .company { 
            font-weight: bold; 
            font-size: 24px; 
            color: #26847F;
            margin-bottom: 10px;
        }
        .company-details {
            font-size: 12px;
            line-height: 1.6;
            color: #666;
        }
        .invoice-title {
            text-align: right;
        }
        .invoice-title h1 {
            margin: 0;
            font-size: 28px;
            color: #26847F;
        }
        .invoice-title .invoice-number {
            font-size: 14px;
            color: #666;
            margin-top: 5px;
        }
        .parties {
            display: flex;
            justify-content: space-between;
            margin: 30px 0;
            gap: 40px;
        }
        .party {
            flex: 1;
            padding: 20px;
            background: #f9f9f9;
            border-radius: 8px;
        }
        .party h3 {
            margin: 0 0 15px 0;
            font-size: 14px;
            color: #26847F;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .party p {
            margin: 5px 0;
            font-size: 13px;
            line-height: 1.5;
        }
        .items { 
            margin: 30px 0; 
        }
        .items table { 
            width: 100%; 
            border-collapse: collapse;
            box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        }
        .items th { 
            background: #26847F;
            color: white;
            padding: 15px 12px; 
            text-align: left;
            font-weight: 600;
            font-size: 13px;
            text-transform: uppercase;
            letter-spacing: 0.3px;
        }
        .items td { 
            padding: 15px 12px; 
            border-bottom: 1px solid #eee;
            font-size: 13px;
        }
        .items tr:last-child td {
            border-bottom: none;
        }
        .items tr:hover {
            background: #fafafa;
        }
        .summary {
            margin-top: 30px;
            text-align: right;
        }
        .summary table {
            margin-left: auto;
            min-width: 300px;
        }
        .summary td {
            padding: 8px 15px;
            font-size: 14px;
        }
        .summary .label {
            text-align: right;
            color: #666;
        }
        .summary .value {
            text-align: right;
            font-weight: 600;
        }
        .summary .total-row {
            border-top: 2px solid #26847F;
            font-size: 18px;
            color: #26847F;
        }
        .footer { 
            margin-top: 50px; 
            padding-top: 20px; 
            border-top: 2px solid #eee; 
            font-size: 11px; 
            color: #999;
            line-height: 1.6;
        }
        .footer p {
            margin: 5px 0;
        }
        .paid-stamp {
            display: inline-block;
            padding: 8px 20px;
            background: #10b981;
            color: white;
            border-radius: 4px;
            font-weight: bold;
            font-size: 12px;
            margin-top: 10px;
        }
    </style>
</head>
<body>
    <div class="header">
        <div>
            <div class="company">VELIKA GROUP LLC</div>
            <div class="company-details">
                30 N Gould St 32651<br>
                Sheridan, WY 82801<br>
                United States<br>
                EIN: 36-5141800<br>
                Email: velika.03@outlook.it
            </div>
        </div>
        <div class="invoice-title">
            <h1>FATTURA</h1>
            <div class="invoice-number">${invoiceNumber}</div>
            <div class="invoice-number">Data: ${invoiceDate}</div>
        </div>
    </div>

    <div class="parties">
        <div class="party">
            <h3>Da:</h3>
            <p><strong>VELIKA GROUP LLC</strong></p>
            <p>30 N Gould St 32651</p>
            <p>Sheridan, WY 82801, USA</p>
            <p>EIN: 36-5141800</p>
        </div>
        <div class="party">
            <h3>A:</h3>
            <p><strong>${userData.full_name || userData.email}</strong></p>
            ${userData.billing_type === 'company' ? `<p>${userData.company_name || 'N/D'}</p>` : ''}
            <p>${userData.billing_address || 'N/D'}</p>
            <p>${userData.billing_city || ''} ${userData.billing_zip || ''}</p>
            <p>${userData.billing_country || ''}</p>
            <p><strong>${userData.billing_type === 'company' ? 'P.IVA' : 'CF'}:</strong> ${userData.tax_id || 'N/D'}</p>
            ${userData.billing_type === 'company' && userData.pec_sdi ? `<p><strong>PEC/SDI:</strong> ${userData.pec_sdi}</p>` : ''}
            <p><strong>Email:</strong> ${userData.email}</p>
        </div>
    </div>

    <div class="items">
        <table>
            <thead>
                <tr>
                    <th>Descrizione</th>
                    <th>Piano</th>
                    <th>Periodo</th>
                    <th style="text-align: right; width: 120px;">Importo</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>${transaction.description || 'Abbonamento MyWellness'}</td>
                    <td style="text-transform: capitalize;">${transaction.plan || 'N/D'}</td>
                    <td style="text-transform: capitalize;">${transaction.billing_period || 'N/D'}</td>
                    <td style="text-align: right;">€${netAmount.toFixed(2)}</td>
                </tr>
            </tbody>
        </table>
    </div>

    <div class="summary">
        <table>
            <tr>
                <td class="label">Subtotale:</td>
                <td class="value">€${netAmount.toFixed(2)}</td>
            </tr>
            ${taxAmount > 0 ? `
            <tr>
                <td class="label">IVA (22%):</td>
                <td class="value">€${taxAmount.toFixed(2)}</td>
            </tr>
            ` : ''}
            <tr class="total-row">
                <td class="label"><strong>TOTALE:</strong></td>
                <td class="value"><strong>€${transaction.amount.toFixed(2)}</strong></td>
            </tr>
        </table>
        <div class="paid-stamp">✓ PAGATO</div>
    </div>

    <div class="footer">
        <p><strong>Dettagli Pagamento:</strong></p>
        <p>Metodo: ${transaction.metadata?.payment_method || 'Carta di Credito/Debito'}</p>
        <p>Processato tramite: Stripe Inc.</p>
        <p>ID Transazione: ${transaction.stripe_payment_intent_id || transaction.id}</p>
        <p>Data Pagamento: ${new Date(transaction.payment_date).toLocaleString('it-IT')}</p>
        <p style="margin-top: 15px;">Questa è una fattura elettronica generata automaticamente. Per qualsiasi domanda, contattare velika.03@outlook.it</p>
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