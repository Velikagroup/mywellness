import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import Stripe from 'npm:stripe';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { transactionId } = await req.json();

    if (!transactionId) {
      return Response.json({ error: 'Transaction ID is required' }, { status: 400 });
    }

    // Get transaction from database
    const transactions = await base44.entities.Transaction.filter({ id: transactionId });
    const transaction = transactions[0];

    if (!transaction) {
      return Response.json({ error: 'Transaction not found' }, { status: 404 });
    }

    // Verify user owns this transaction
    if (transaction.user_id !== user.id && user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized access to this transaction' }, { status: 403 });
    }

    // Check if we have a Stripe invoice ID
    if (!transaction.stripe_invoice_id) {
      return Response.json({ 
        error: 'No invoice available for this transaction',
        message: 'Questa transazione non ha una fattura Stripe associata'
      }, { status: 404 });
    }

    // Initialize Stripe
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeSecretKey) {
      throw new Error('STRIPE_SECRET_KEY not configured');
    }
    
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2023-10-16',
    });

    // Get invoice from Stripe
    const invoice = await stripe.invoices.retrieve(transaction.stripe_invoice_id);

    if (!invoice.invoice_pdf) {
      return Response.json({ 
        error: 'Invoice PDF not available',
        message: 'Il PDF della fattura non è ancora disponibile'
      }, { status: 404 });
    }

    // Return the Stripe PDF URL
    return Response.json({ 
      success: true,
      pdfUrl: invoice.invoice_pdf,
      invoiceNumber: invoice.number
    });

  } catch (error) {
    console.error('Error downloading Stripe invoice:', error);
    return Response.json({ 
      error: 'Failed to download invoice',
      details: error.message 
    }, { status: 500 });
  }
});