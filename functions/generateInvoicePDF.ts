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

        // ✅ Usa asServiceRole per bypassare RLS
        const transactions = await base44.asServiceRole.entities.Transaction.filter({ id: transactionId });
        
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
        @page {
            size: A4;
            margin: 0;
        }
        body { 
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; 
            padding: 50px; 
            max-width: 800px;
            margin: 0 auto;
            color: #222;
            background: #fff;
            line-height: 1.5;
        }
        .header { 
            padding-bottom: 30px; 
            margin-bottom: 30px;
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
        }
        .logo-section {
            display: flex;
            align-items: center;
            gap: 8px;
        }
        .logo-icon {
            width: 36px;
            height: 36px;
        }
        .logo-text {
            font-size: 20px;
            font-weight: 600;
            color: #222;
            letter-spacing: -0.3px;
        }
        .logo-text span {
            color: #26847F;
        }
        .invoice-title {
            text-align: right;
        }
        .invoice-title h1 {
            margin: 0;
            font-size: 24px;
            color: #222;
            font-weight: 600;
            letter-spacing: -0.5px;
        }
        .invoice-meta {
            font-size: 12px;
            color: #666;
            margin-top: 6px;
        }
        .invoice-meta div {
            margin: 2px 0;
        }
        .parties {
            display: flex;
            justify-content: space-between;
            margin: 25px 0;
            gap: 20px;
        }
        .party {
            flex: 1;
            background: #f7f7f7;
            border-radius: 10px;
            padding: 18px;
        }
        .party h3 {
            margin: 0 0 10px 0;
            font-size: 10px;
            color: #888;
            text-transform: uppercase;
            letter-spacing: 1.5px;
            font-weight: 600;
        }
        .party p {
            margin: 2px 0;
            font-size: 12px;
            line-height: 1.5;
            color: #444;
        }
        .party .name {
            font-weight: 600;
            font-size: 13px;
            color: #222;
        }
        .items { 
            margin: 25px 0; 
            background: #f7f7f7;
            border-radius: 10px;
            overflow: hidden;
        }
        .items table { 
            width: 100%; 
            border-collapse: collapse;
        }
        .items th { 
            background: #f0f0f0;
            color: #222;
            padding: 12px 16px; 
            text-align: left;
            font-weight: 600;
            font-size: 10px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .items th:last-child {
            text-align: right;
        }
        .items td { 
            padding: 14px 16px; 
            font-size: 12px;
            color: #444;
            background: #f7f7f7;
        }
        .items td:last-child {
            text-align: right;
            font-weight: 500;
        }
        .summary {
            margin-top: 25px;
            display: flex;
            justify-content: flex-end;
        }
        .summary-table {
            min-width: 260px;
            background: #f7f7f7;
            border-radius: 10px;
            padding: 18px;
        }
        .summary-row {
            display: flex;
            justify-content: space-between;
            padding: 6px 0;
            font-size: 12px;
        }
        .summary-row.subtotal {
            padding-bottom: 10px;
            margin-bottom: 6px;
            border-bottom: 1px solid #e5e5e5;
        }
        .summary-row.tax {
            color: #666;
        }
        .summary-row.total {
            margin-top: 6px;
            padding-top: 10px;
            border-top: 1px solid #e5e5e5;
            font-size: 15px;
            font-weight: 700;
            color: #222;
        }
        .summary-label {
            color: #666;
        }
        .summary-value {
            font-weight: 500;
            color: #222;
        }
        .paid-badge {
            display: inline-flex;
            align-items: center;
            gap: 5px;
            margin-top: 12px;
            padding: 6px 14px;
            background: #222;
            color: white;
            border-radius: 6px;
            font-weight: 600;
            font-size: 11px;
            letter-spacing: 0.5px;
        }
        .footer { 
            margin-top: 40px; 
        }
        .payment-details {
            background: #f7f7f7;
            border-radius: 10px;
            padding: 16px;
            font-size: 11px;
            color: #666;
            line-height: 1.7;
        }
        .payment-details-title {
            font-weight: 600;
            color: #444;
            margin-bottom: 8px;
            font-size: 10px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .company-footer {
            margin-top: 30px;
            text-align: center;
            font-size: 10px;
            color: #999;
            line-height: 1.6;
        }
        .company-footer .company-name {
            font-weight: 600;
            color: #666;
            margin-bottom: 2px;
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
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            display: flex;
            align-items: center;
            gap: 8px;
        }
        .print-btn:hover {
            background: #1f6b66;
        }
        @media print {
            .print-btn { display: none !important; }
            html, body { 
                margin: 0 !important; 
                padding: 0 !important;
                width: 100% !important;
                height: 100% !important;
            }
            body {
                padding: 40px !important;
                max-width: none !important;
            }
        }
        @media (max-width: 600px) {
            body { padding: 20px; }
            .header { flex-direction: column; gap: 15px; }
            .invoice-title { text-align: left; }
            .parties { flex-direction: column; gap: 12px; }
            .summary-table { min-width: 100%; }
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="logo-section">
            <svg class="logo-icon" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="20" cy="20" r="18" fill="#26847F"/>
                <path d="M12 20.5C12 16 15 13 20 13C25 13 28 16 28 20.5C28 25 25 28 20 28" stroke="white" stroke-width="2.5" stroke-linecap="round"/>
                <circle cx="20" cy="20" r="3" fill="white"/>
            </svg>
            <span class="logo-text">My<span>Wellness</span></span>
        </div>
        <div class="invoice-title">
            <h1>FATTURA</h1>
            <div class="invoice-meta">
                <div>N° ${invoiceNumber}</div>
                <div>Data ${invoiceDate}</div>
            </div>
        </div>
    </div>

    <div class="parties">
        <div class="party">
            <h3>Da</h3>
            <p class="name">VELIKA GROUP LLC</p>
            <p>30 N Gould St 32651</p>
            <p>Sheridan, WY 82801, US</p>
            <p>EIN: 36-5141800</p>
        </div>
        <div class="party">
            <h3>A</h3>
            <p class="name">${userData.full_name || userData.email}</p>
            ${userData.billing_type === 'company' && userData.company_name ? `<p>${userData.company_name}</p>` : ''}
            ${userData.billing_address ? `<p>${userData.billing_address}</p>` : ''}
            ${userData.billing_city || userData.billing_zip ? `<p>${userData.billing_city || ''} ${userData.billing_zip || ''}</p>` : ''}
            ${userData.billing_country ? `<p>${userData.billing_country}</p>` : ''}
            ${userData.tax_id ? `<p>${userData.billing_type === 'company' ? 'P.IVA' : 'C.F.'}: ${userData.tax_id}</p>` : ''}
            ${userData.billing_type === 'company' && userData.pec_sdi ? `<p>PEC/SDI: ${userData.pec_sdi}</p>` : ''}
            <p>${userData.email}</p>
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
                <span class="summary-label">Imponibile</span>
                <span class="summary-value">€${netAmount.toFixed(2)}</span>
            </div>
            ${taxAmount > 0 ? `
            <div class="summary-row tax">
                <span class="summary-label">${taxName} (${taxPercentage}%)</span>
                <span class="summary-value">€${taxAmount.toFixed(2)}</span>
            </div>
            ` : `
            <div class="summary-row tax">
                <span class="summary-label">Tasse</span>
                <span class="summary-value">€0.00</span>
            </div>
            `}
            <div class="summary-row total">
                <span>Totale</span>
                <span>€${transaction.amount.toFixed(2)}</span>
            </div>
            <div style="text-align: right;">
                <div class="paid-badge">✓ PAGATO</div>
            </div>
        </div>
    </div>

    <div class="footer">
        <div class="payment-details">
            <div class="payment-details-title">Dettagli Pagamento</div>
            <div>Metodo: ${transaction.metadata?.payment_method || 'Carta di Credito/Debito'}</div>
            <div>Processato tramite: Stripe Inc.</div>
            <div>ID: ${transaction.stripe_payment_intent_id || transaction.id}</div>
            <div>Data: ${new Date(transaction.payment_date).toLocaleString('it-IT')}</div>
        </div>
        
        <div class="company-footer">
            <div class="company-name">VELIKA GROUP LLC</div>
            <div>30 N Gould St 32651, Sheridan, WY 82801, United States</div>
            <div>EIN: 36-5141800 • velika.03@outlook.it</div>
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