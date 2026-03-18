import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe@17.5.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'), {
  apiVersion: '2024-12-18.acacia',
});

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Non autenticato' }, { status: 401 });
    }

    // Verifica che l'utente abbia già un customer Stripe
    if (!user.stripe_customer_id) {
      return Response.json({ 
        error: 'Nessun metodo di pagamento trovato. Completa prima il checkout.' 
      }, { status: 400 });
    }

    // Recupera i payment methods del customer
    const paymentMethods = await stripe.paymentMethods.list({
      customer: user.stripe_customer_id,
      type: 'card',
    });

    if (paymentMethods.data.length === 0) {
      return Response.json({ 
        error: 'Nessuna carta salvata. Completa prima il checkout.' 
      }, { status: 400 });
    }

    const defaultPaymentMethod = paymentMethods.data[0].id;

    // Crea il pagamento one-time di 99€
    const paymentIntent = await stripe.paymentIntents.create({
      amount: 9900, // 99€ in centesimi
      currency: 'eur',
      customer: user.stripe_customer_id,
      payment_method: defaultPaymentMethod,
      off_session: true,
      confirm: true,
      description: 'Upgrade a Premium 12 mesi - One Time Offer',
      metadata: {
        user_id: user.id,
        plan: 'premium',
        billing_period: 'yearly',
        oto: 'true',
      },
    });

    if (paymentIntent.status !== 'succeeded') {
      return Response.json({ 
        error: 'Pagamento non riuscito. Riprova più tardi.' 
      }, { status: 400 });
    }

    // Calcola la data di fine subscription (12 mesi da oggi)
    const endDate = new Date();
    endDate.setFullYear(endDate.getFullYear() + 1);

    // Aggiorna l'utente con piano Premium e data di scadenza
    await base44.asServiceRole.entities.User.update(user.id, {
      subscription_plan: 'premium',
      subscription_end_date: endDate.toISOString().split('T')[0],
      order_bump_selected: true,
      stripe_subscription_status: 'active',
    });

    // Salva la transazione
    await base44.asServiceRole.entities.Transaction.create({
      user_id: user.id,
      stripe_payment_intent_id: paymentIntent.id,
      amount: 99,
      currency: 'eur',
      status: 'succeeded',
      type: 'one_time_payment',
      plan: 'premium',
      billing_period: 'yearly',
      payment_date: new Date().toISOString(),
      description: 'Upgrade Premium 12 mesi - OTO',
      traffic_source: user.traffic_source || 'direct',
    });

    return Response.json({
      success: true,
      message: 'Pagamento completato! Benvenuto in Premium per 12 mesi!',
      subscription_end_date: endDate.toISOString().split('T')[0],
    });

  } catch (error) {
    console.error('Errore OTO:', error);
    
    if (error.type === 'StripeCardError') {
      return Response.json({ 
        error: 'Carta rifiutata. Verifica i dati della tua carta.' 
      }, { status: 400 });
    }

    return Response.json({ 
      error: 'Errore durante il pagamento. Riprova più tardi.',
      details: error.message 
    }, { status: 500 });
  }
});