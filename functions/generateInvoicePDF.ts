import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
    console.log('📄 generateInvoicePDF - Start v2');
    
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
        if (transaction.user_id !== user.id && user.role !== 'admin') {
            return Response.json({ 
                success: false, 
                error: 'Unauthorized access to transaction' 
            }, { status: 403 });
        }

        // Recupera dati utente con service role
        const transactionUser = await base44.asServiceRole.entities.User.filter({ id: transaction.user_id });
        const userData = transactionUser[0];

        // ✅ Recupera aliquota IVA dal database SalesTax in base al paese
        let taxRate = 0;
        let taxName = 'IVA';
        const userCountry = userData.billing_country || 'IT';
        
        try {
            const salesTaxRecords = await base44.asServiceRole.entities.SalesTax.filter({ 
                country_code: userCountry,
                is_active: true 
            });
            
            if (salesTaxRecords && salesTaxRecords.length > 0) {
                taxRate = salesTaxRecords[0].tax_rate / 100; // Converti da percentuale a decimale
                taxName = salesTaxRecords[0].tax_name || 'IVA';
                console.log(`📊 Found tax for ${userCountry}: ${salesTaxRecords[0].tax_rate}% (${taxName})`);
            } else {
                console.log(`⚠️ No SalesTax record for ${userCountry}, using 0%`);
            }
        } catch (taxError) {
            console.error('❌ Error fetching SalesTax:', taxError);
            // Fallback: se non trova la tabella, usa 22% per IT
            if (userCountry === 'IT') {
                taxRate = 0.22;
                taxName = 'IVA';
            }
        }

        const invoiceNumber = `INV-${new Date(transaction.payment_date).getFullYear()}-${String(transaction.id).slice(0, 8).toUpperCase()}`;
        const invoiceDate = new Date(transaction.payment_date).toLocaleDateString('it-IT');

        // ✅ Calcola importi
        const netAmount = transaction.amount / (1 + taxRate);
        const taxAmount = transaction.amount - netAmount;
        const taxPercentage = Math.round(taxRate * 100);

        // Genera HTML fattura
        const invoiceHTML = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Fattura ${invoiceNumber}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body { 
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; 
            padding: 40px; 
            max-width: 800px;
            margin: 0 auto;
            color: #333;
            background: #fff;
            line-height: 1.5;
        }
        .header { 
            border-bottom: 3px solid #26847F; 
            padding-bottom: 25px; 
            margin-bottom: 30px;
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
        }
        .company { 
            font-weight: bold; 
            font-size: 28px; 
            color: #26847F;
            margin-bottom: 12px;
        }
        .company-details {
            font-size: 12px;
            line-height: 1.7;
            color: #555;
        }
        .invoice-title {
            text-align: right;
        }
        .invoice-title h1 {
            margin: 0;
            font-size: 32px;
            color: #26847F;
            font-weight: 700;
        }
        .invoice-meta {
            font-size: 13px;
            color: #666;
            margin-top: 8px;
        }
        .invoice-meta div {
            margin: 3px 0;
        }
        .parties {
            display: flex;
            justify-content: space-between;
            margin: 35px 0;
            gap: 30px;
        }
        .party {
            flex: 1;
            padding: 20px;
            background: #f8f9fa;
            border-radius: 10px;
            border: 1px solid #e9ecef;
        }
        .party h3 {
            margin: 0 0 12px 0;
            font-size: 11px;
            color: #26847F;
            text-transform: uppercase;
            letter-spacing: 1px;
            font-weight: 700;
        }
        .party p {
            margin: 4px 0;
            font-size: 13px;
            line-height: 1.6;
            color: #444;
        }
        .party .name {
            font-weight: 600;
            font-size: 14px;
            color: #333;
        }
        .items { 
            margin: 35px 0; 
        }
        .items table { 
            width: 100%; 
            border-collapse: collapse;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 8px rgba(0,0,0,0.06);
        }
        .items th { 
            background: #26847F;
            color: white;
            padding: 14px 16px; 
            text-align: left;
            font-weight: 600;
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .items th:last-child {
            text-align: right;
        }
        .items td { 
            padding: 16px; 
            border-bottom: 1px solid #eee;
            font-size: 13px;
            background: #fff;
        }
        .items td:last-child {
            text-align: right;
            font-weight: 500;
        }
        .items tr:last-child td {
            border-bottom: none;
        }
        .summary {
            margin-top: 30px;
            display: flex;
            justify-content: flex-end;
        }
        .summary-table {
            min-width: 320px;
            background: #f8f9fa;
            border-radius: 10px;
            padding: 20px;
            border: 1px solid #e9ecef;
        }
        .summary-row {
            display: flex;
            justify-content: space-between;
            padding: 10px 0;
            font-size: 14px;
        }
        .summary-row.subtotal {
            border-bottom: 1px solid #e0e0e0;
            padding-bottom: 15px;
        }
        .summary-row.tax {
            color: #666;
        }
        .summary-row.total {
            border-top: 2px solid #26847F;
            margin-top: 10px;
            padding-top: 15px;
            font-size: 18px;
            font-weight: 700;
            color: #26847F;
        }
        .summary-label {
            color: #666;
        }
        .summary-value {
            font-weight: 600;
            color: #333;
        }
        .paid-badge {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            margin-top: 20px;
            padding: 10px 20px;
            background: linear-gradient(135deg, #10b981, #059669);
            color: white;
            border-radius: 6px;
            font-weight: 600;
            font-size: 13px;
            box-shadow: 0 2px 6px rgba(16, 185, 129, 0.3);
        }
        .footer { 
            margin-top: 50px; 
            padding-top: 25px; 
            border-top: 2px solid #eee; 
            font-size: 11px; 
            color: #888;
            line-height: 1.8;
        }
        .footer-section {
            margin-bottom: 15px;
        }
        .footer-title {
            font-weight: 600;
            color: #666;
            margin-bottom: 5px;
        }
        .print-btn {
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: #26847F;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            box-shadow: 0 4px 12px rgba(38, 132, 127, 0.3);
            display: flex;
            align-items: center;
            gap: 8px;
        }
        .print-btn:hover {
            background: #1f6b66;
        }
        @media print {
            .print-btn { display: none; }
            body { padding: 20px; }
        }
        @media (max-width: 600px) {
            body { padding: 20px; }
            .header { flex-direction: column; gap: 20px; }
            .invoice-title { text-align: left; }
            .parties { flex-direction: column; gap: 15px; }
            .summary-table { min-width: 100%; }
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
            <div class="invoice-meta">
                <div><strong>Numero:</strong> ${invoiceNumber}</div>
                <div><strong>Data:</strong> ${invoiceDate}</div>
            </div>
        </div>
    </div>

    <div class="parties">
        <div class="party">
            <h3>Venditore</h3>
            <p class="name">VELIKA GROUP LLC</p>
            <p>30 N Gould St 32651</p>
            <p>Sheridan, WY 82801</p>
            <p>United States</p>
            <p>EIN: 36-5141800</p>
        </div>
        <div class="party">
            <h3>Acquirente</h3>
            <p class="name">${userData.full_name || userData.email}</p>
            ${userData.billing_type === 'company' && userData.company_name ? `<p>${userData.company_name}</p>` : ''}
            ${userData.billing_address ? `<p>${userData.billing_address}</p>` : ''}
            ${userData.billing_city || userData.billing_zip ? `<p>${userData.billing_city || ''} ${userData.billing_zip || ''}</p>` : ''}
            ${userData.billing_country ? `<p>${userData.billing_country}</p>` : ''}
            ${userData.tax_id ? `<p><strong>${userData.billing_type === 'company' ? 'P.IVA' : 'C.F.'}:</strong> ${userData.tax_id}</p>` : ''}
            ${userData.billing_type === 'company' && userData.pec_sdi ? `<p><strong>PEC/SDI:</strong> ${userData.pec_sdi}</p>` : ''}
            <p><strong>Email:</strong> ${userData.email}</p>
        </div>
    </div>

    <div class="items">
        <table>
            <thead>
                <tr>
                    <th style="width: 50%;">Descrizione</th>
                    <th>Piano</th>
                    <th>Periodo</th>
                    <th style="width: 100px;">Importo</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>${transaction.description || 'Abbonamento MyWellness'}</td>
                    <td style="text-transform: capitalize;">${transaction.plan || 'N/D'}</td>
                    <td style="text-transform: capitalize;">${transaction.billing_period === 'monthly' ? 'Mensile' : transaction.billing_period === 'yearly' ? 'Annuale' : (transaction.billing_period || 'N/D')}</td>
                    <td>€${netAmount.toFixed(2)}</td>
                </tr>
            </tbody>
        </table>
    </div>

    <div class="summary">
        <div class="summary-table">
            <div class="summary-row subtotal">
                <span class="summary-label">Imponibile:</span>
                <span class="summary-value">€${netAmount.toFixed(2)}</span>
            </div>
            ${taxAmount > 0 ? `
            <div class="summary-row tax">
                <span class="summary-label">${taxName} (${taxPercentage}%):</span>
                <span class="summary-value">€${taxAmount.toFixed(2)}</span>
            </div>
            ` : `
            <div class="summary-row tax">
                <span class="summary-label">Tasse:</span>
                <span class="summary-value">€0.00 (esente)</span>
            </div>
            `}
            <div class="summary-row total">
                <span>TOTALE:</span>
                <span>€${transaction.amount.toFixed(2)}</span>
            </div>
            <div style="text-align: center;">
                <div class="paid-badge">✓ PAGATO</div>
            </div>
        </div>
    </div>

    <div class="footer">
        <div class="footer-section">
            <div class="footer-title">Dettagli Pagamento</div>
            <div>Metodo: ${transaction.metadata?.payment_method || 'Carta di Credito/Debito'}</div>
            <div>Processato tramite: Stripe Inc.</div>
            <div>ID Transazione: ${transaction.stripe_payment_intent_id || transaction.id}</div>
            <div>Data/Ora Pagamento: ${new Date(transaction.payment_date).toLocaleString('it-IT')}</div>
        </div>
        <div class="footer-section">
            <div class="footer-title">Note</div>
            <div>Questa è una fattura elettronica generata automaticamente dal sistema MyWellness.</div>
            <div>Per qualsiasi domanda, contattare: velika.03@outlook.it</div>
        </div>
    </div>

    <button class="print-btn" onclick="window.print()">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
            <rect x="6" y="14" width="12" height="8"/>
        </svg>
        Stampa / Salva PDF
    </button>
</body>
</html>
        `;

        console.log('✅ Invoice HTML generated with tax info');

        return Response.json({
            success: true,
            invoiceHTML: invoiceHTML,
            invoiceNumber: invoiceNumber,
            taxInfo: {
                country: userCountry,
                taxName: taxName,
                taxRate: taxPercentage,
                taxAmount: taxAmount,
                netAmount: netAmount,
                totalAmount: transaction.amount
            }
        });

    } catch (error) {
        console.error('❌ Invoice generation error:', error);
        return Response.json({ 
            success: false,
            error: error.message || 'Unknown error'
        }, { status: 500 });
    }
});