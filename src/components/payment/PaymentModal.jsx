import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

let stripePromise;

async function getStripe() {
  if (!stripePromise) {
    const response = await fetch('/api/stripe-key');
    const { publishableKey } = await response.json();
    stripePromise = loadStripe(publishableKey);
  }
  return stripePromise;
}

function PaymentForm({ clientSecret, onSuccess, onError, isLoading }) {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!stripe || !elements) return;

    setProcessing(true);

    try {
      const result = await stripe.confirmSetup({
        elements,
        clientSecret,
        redirect: 'if_required'
      });

      if (result.error) {
        onError(result.error.message);
      } else {
        onSuccess();
      }
    } catch (error) {
      onError(error.message);
    }

    setProcessing(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />
      <Button
        type="submit"
        disabled={!stripe || processing || isLoading}
        className="w-full h-12 bg-gray-900 hover:bg-gray-950 text-white font-bold rounded-full"
      >
        {processing ? 'Elaborazione...' : 'Completa il pagamento'}
      </Button>
    </form>
  );
}

export default function PaymentModal({ isOpen, clientSecret, onClose, onSuccess }) {
  const [stripePromise, setStripePromise] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && clientSecret) {
      getStripe().then(setStripePromise);
    }
  }, [isOpen, clientSecret]);

  if (!isOpen || !clientSecret) return null;

  const options = {
    clientSecret,
    appearance: {
      theme: 'light',
      variables: {
        colorPrimary: '#1f2937',
        colorText: '#1f2937',
        colorDanger: '#ef4444',
        fontFamily: "'Inter', sans-serif",
        spacingUnit: '0.5rem',
        borderRadius: '0.5rem'
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end z-50">
      <div className="bg-white w-full max-w-md mx-auto rounded-t-3xl p-6 animate-in slide-in-from-bottom">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Completa il pagamento</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-900"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {stripePromise ? (
          <Elements stripe={stripePromise} options={options}>
            <PaymentForm
              clientSecret={clientSecret}
              onSuccess={() => {
                onSuccess();
                onClose();
              }}
              onError={(error) => alert(`Errore: ${error}`)}
              isLoading={isLoading}
            />
          </Elements>
        ) : (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        )}
      </div>
    </div>
  );
}