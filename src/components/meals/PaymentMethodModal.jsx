import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements, PaymentRequestButtonElement } from '@stripe/react-stripe-js';
import { Loader2, CreditCard, Smartphone, CheckCircle } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      fontSize: '16px',
      color: '#424770',
      '::placeholder': {
        color: '#aab7c4',
      },
    },
    invalid: {
      color: '#9e2146',
    },
  },
};

function PaymentForm({ plan, billingCycle, onSuccess, onCancel, pricingInfo }) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [paymentRequest, setPaymentRequest] = useState(null);
  const [canMakePayment, setCanMakePayment] = useState(false);

  useEffect(() => {
    if (!stripe || !pricingInfo) return;

    const pr = stripe.paymentRequest({
      country: 'IT',
      currency: 'eur',
      total: {
        label: `${plan.name} - ${billingCycle === 'monthly' ? 'Mensile' : 'Annuale'}`,
        amount: Math.round(pricingInfo.amountToPay * 100),
      },
      requestPayerName: true,
      requestPayerEmail: true,
    });

    pr.canMakePayment().then(result => {
      if (result) {
        setPaymentRequest(pr);
        setCanMakePayment(true);
      }
    });

    pr.on('paymentmethod', async (ev) => {
      setIsProcessing(true);
      try {
        const user = await base44.auth.me();
        
        // Crea o recupera il customer Stripe
        const { data: customer } = await base44.functions.invoke('stripeCreateTrialSubscription', {
          plan: plan.id,
          billingPeriod: billingCycle,
          paymentMethodId: ev.paymentMethod.id,
          setupOnly: true
        });

        ev.complete('success');
        onSuccess();
      } catch (error) {
        console.error('Digital wallet payment error:', error);
        ev.complete('fail');
        setErrorMessage('Errore nel pagamento. Riprova.');
        setIsProcessing(false);
      }
    });
  }, [stripe, plan, billingCycle, pricingInfo]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!stripe || !elements) return;

    setIsProcessing(true);
    setErrorMessage('');

    try {
      const cardElement = elements.getElement(CardElement);
      
      const { error, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
      });

      if (error) {
        setErrorMessage(error.message);
        setIsProcessing(false);
        return;
      }

      // Chiama il backend per completare l'upgrade con la nuova carta
      const response = await base44.functions.invoke('stripeCreateTrialSubscription', {
        plan: plan.id,
        billingPeriod: billingCycle,
        paymentMethodId: paymentMethod.id,
        setupOnly: false
      });

      const data = response.data || response;

      if (data.success) {
        onSuccess();
      } else {
        setErrorMessage(data.error || 'Errore nel pagamento');
      }
    } catch (error) {
      console.error('Payment error:', error);
      setErrorMessage('Errore nel pagamento. Riprova.');
    }

    setIsProcessing(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-gradient-to-br from-[#E0F2F1] to-teal-50 rounded-xl p-6 border-2 border-[#26847F]/30">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-[#26847F] flex items-center justify-center">
            <plan.icon className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="text-lg font-bold text-gray-900">{plan.name}</p>
            <p className="text-sm text-gray-600">
              €{pricingInfo?.amountToPay?.toFixed(2)}/adesso • Poi €{billingCycle === 'monthly' ? plan.monthlyPrice : plan.yearlyMonthly}/mese
            </p>
          </div>
        </div>

        {pricingInfo && (
          <div className="space-y-2 pt-3 border-t border-[#26847F]/20 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Prezzo piano completo:</span>
              <span className="font-semibold text-gray-900">€{pricingInfo.newPlanPrice.toFixed(2)}</span>
            </div>
            {pricingInfo.creditFromCurrentPlan > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600">Credito residuo:</span>
                <span className="font-semibold text-green-600">-€{pricingInfo.creditFromCurrentPlan.toFixed(2)}</span>
              </div>
            )}
            <div className="h-px bg-gray-300 my-2"></div>
            <div className="flex justify-between">
              <span className="font-bold text-gray-900">Da pagare ora:</span>
              <span className="font-black text-2xl text-[#26847F]">
                €{pricingInfo.amountToPay.toFixed(2)}
              </span>
            </div>
          </div>
        )}
      </div>

      {canMakePayment && paymentRequest && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-gray-600" />
            <span className="text-sm font-semibold text-gray-700">Pagamento Rapido</span>
          </div>
          <PaymentRequestButtonElement options={{ paymentRequest }} />
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">oppure</span>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-gray-600" />
          <span className="text-sm font-semibold text-gray-700">Carta di Credito/Debito</span>
        </div>
        <div className="border-2 border-gray-200 rounded-lg p-4 bg-white">
          <CardElement options={CARD_ELEMENT_OPTIONS} />
        </div>
      </div>

      {errorMessage && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-sm text-red-800">{errorMessage}</p>
        </div>
      )}

      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isProcessing}
          className="flex-1"
        >
          Annulla
        </Button>
        <Button
          type="submit"
          disabled={!stripe || isProcessing}
          className="flex-1 bg-[#26847F] hover:bg-[#1f6b66] text-white"
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Elaborazione...
            </>
          ) : (
            `Paga €${pricingInfo?.amountToPay?.toFixed(2) || '0.00'}`
          )}
        </Button>
      </div>

      <p className="text-xs text-center text-gray-500">
        🔒 Pagamento sicuro gestito da Stripe • I tuoi dati non vengono memorizzati
      </p>
    </form>
  );
}

export default function PaymentMethodModal({ isOpen, onClose, plan, billingCycle, onSuccess, pricingInfo }) {
  const [stripePromise, setStripePromise] = useState(null);

  useEffect(() => {
    const loadStripeKey = async () => {
      try {
        const { data } = await base44.functions.invoke('getStripePublishableKey');
        const publishableKey = data.publishableKey || data;
        setStripePromise(loadStripe(publishableKey));
      } catch (error) {
        console.error('Error loading Stripe key:', error);
      }
    };

    if (isOpen) {
      loadStripeKey();
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg z-[300]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-[#26847F]" />
            Metodo di Pagamento
          </DialogTitle>
        </DialogHeader>
        
        {stripePromise ? (
          <Elements stripe={stripePromise}>
            <PaymentForm 
              plan={plan}
              billingCycle={billingCycle}
              onSuccess={onSuccess}
              onCancel={onClose}
              pricingInfo={pricingInfo}
            />
          </Elements>
        ) : (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-[#26847F] animate-spin" />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}