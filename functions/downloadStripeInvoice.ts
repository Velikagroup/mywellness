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

    // Get transaction from database using service role
    const transactions = await base44.asServiceRole.entities.Transaction.filter({ id: transactionId });
    const transaction = transactions[0];

    if (!transaction) {
      return Response.json({ error: 'Transaction not found' }, { status: 404 });
    }

    // Verify user owns this transaction
    if (transaction.user_id !== user.id && user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized access to this transaction' }, { status: 403 });
    }

    // Initialize Stripe
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeSecretKey) {
      throw new Error('STRIPE_SECRET_KEY not configured');
    }
    
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2023-10-16',
    });

    // Prima prova con stripe_invoice_id se presente
    if (transaction.stripe_invoice_id) {
      try {
        const invoice = await stripe.invoices.retrieve(transaction.stripe_invoice_id);
        if (invoice.invoice_pdf) {
          return Response.json({ 
            success: true,
            pdfUrl: invoice.invoice_pdf,
            invoiceNumber: invoice.number
          });
        }
      } catch (e) {
        console.log('Invoice not found by ID, trying payment intent...');
      }
    }

    // Se non ha invoice_id, prova prima a ottenere la ricevuta dal payment intent
    if (transaction.stripe_payment_intent_id) {
      try {
        const paymentIntent = await stripe.paymentIntents.retrieve(transaction.stripe_payment_intent_id, {
          expand: ['latest_charge']
        });
        
        // Prima prova receipt_url dal charge
        if (paymentIntent.latest_charge?.receipt_url) {
          return Response.json({ 
            success: true,
            pdfUrl: paymentIntent.latest_charge.receipt_url,
            invoiceNumber: 'Ricevuta'
          });
        }
        
        // Se il charge ha un ID, cerca direttamente il charge per la ricevuta
        if (paymentIntent.latest_charge?.id) {
          const charge = await stripe.charges.retrieve(paymentIntent.latest_charge.id);
          if (charge.receipt_url) {
            return Response.json({ 
              success: true,
              pdfUrl: charge.receipt_url,
              invoiceNumber: 'Ricevuta'
            });
          }
        }
      } catch (e) {
        console.log('Error getting receipt from payment intent:', e.message);
      }
      
      // Poi cerca invoice associata al payment intent
      try {
        const invoices = await stripe.invoices.list({
          limit: 50,
        });
        
        for (const inv of invoices.data) {
          if (inv.payment_intent === transaction.stripe_payment_intent_id && inv.invoice_pdf) {
            return Response.json({ 
              success: true,
              pdfUrl: inv.invoice_pdf,
              invoiceNumber: inv.number
            });
          }
        }
      } catch (e) {
        console.log('Error searching invoices:', e.message);
      }
      
      // Cerca tutti i charge per questo payment intent
      try {
        const charges = await stripe.charges.list({
          payment_intent: transaction.stripe_payment_intent_id,
          limit: 5
        });
        
        for (const charge of charges.data) {
          if (charge.receipt_url) {
            return Response.json({ 
              success: true,
              pdfUrl: charge.receipt_url,
              invoiceNumber: 'Ricevuta'
            });
          }
        }
      } catch (e) {
        console.log('Error listing charges:', e.message);
      }
    }

    return Response.json({ 
      success: false,
      message: 'Nessuna fattura disponibile per questa transazione'
    }, { status: 404 });

  } catch (error) {
    console.error('Error downloading Stripe invoice:', error);
    return Response.json({ 
      error: 'Failed to download invoice',
      details: error.message 
    }, { status: 500 });
  }
});