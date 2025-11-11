// ... keep all imports exactly as they are ...

const countries = [
  { code: 'IT', name: 'Italia', dial_code: '+39' },
  { code: 'US', name: 'Stati Uniti', dial_code: '+1' },
  { code: 'GB', name: 'Regno Unito', dial_code: '+44' },
  { code: 'FR', name: 'Francia', dial_code: '+33' },
  { code: 'DE', name: 'Germania', dial_code: '+49' },
  { code: 'ES', name: 'Spagna', dial_code: '+34' },
  { code: 'CH', name: 'Svizzera', dial_code: '+41' },
  { code: 'BR', name: 'Brasile', dial_code: '+55' },
  { code: 'AU', name: 'Australia', dial_code: '+61' },
  { code: 'CA', name: 'Canada', dial_code: '+1' },
];

const countryCodeToFlag = (code) => {
  if (!code) return '';
  return String.fromCodePoint(...code.toUpperCase().split('').map(char => 127397 + char.charCodeAt(0)));
};

const TRIAL_DAYS = 3;
const ORDER_BUMP_PRICE = 19.99;

export default function TrialSetup() {
  const navigate = useNavigate();
  const location = useLocation();
  const cardElementRef = useRef(null);
  const stripeLoadedRef = useRef(false);
  const cardMountedRef = useRef(false);
  
  // ... keep all existing state declarations ...

  // ... keep validateCouponFromURL function ...

  // ... keep first useEffect for checkAuth ...

  // Initialize Stripe Card Element - FIXED VERSION
  useEffect(() => {
    if (!stripe || paymentMethod !== 'card' || !cardElementRef.current) {
      return;
    }

    // Prevent double mounting
    if (cardMountedRef.current || cardElement) {
      console.log('⚠️ Card Element already mounted, skipping');
      return;
    }

    console.log('🎨 Creating Stripe Card Element...');
    
    try {
      const elements = stripe.elements();
      const card = elements.create('card', {
        style: {
          base: {
            fontSize: '16px',
            color: '#1f2937',
            fontFamily: "'Inter', 'system-ui', 'sans-serif'",
            fontSmoothing: 'antialiased',
            '::placeholder': {
              color: '#9ca3af',
            },
          },
          invalid: {
            color: '#ef4444',
            iconColor: '#ef4444'
          }
        },
        hidePostalCode: true,
      });

      console.log('📦 Mounting Card Element to DOM...');
      card.mount(cardElementRef.current);
      cardMountedRef.current = true;
      
      card.on('change', (event) => {
        console.log('💳 Card change:', {
          complete: event.complete,
          error: event.error?.message,
          brand: event.brand
        });
        setCardComplete(event.complete);
      });

      card.on('ready', () => {
        console.log('✅ Card Element is ready and interactive');
      });

      setCardElement(card);
      console.log('✅ Card Element mounted successfully');

    } catch (error) {
      console.error('❌ Error creating Card Element:', error);
    }

    return () => {
      if (cardElement && cardMountedRef.current) {
        console.log('🧹 Unmounting Card Element');
        try {
          cardElement.unmount();
          cardMountedRef.current = false;
        } catch (e) {
          console.error('Error unmounting:', e);
        }
      }
    };
  }, [stripe, paymentMethod]);

  // ... keep all other useEffects and functions unchanged ...

  // ... keep isFormValid, isCtaDisabled, subtotal, discount, total, planPrices, monthlyPrice ...

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center animated-gradient-bg">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-[var(--brand-primary)]"></div>
          <p className="mt-4 text-gray-700 font-semibold text-lg">Caricamento sicuro...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen animated-gradient-bg">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

        * {
          font-family: 'Inter', sans-serif;
        }

        :root {
          --brand-primary: #26847F;
          --brand-primary-hover: #1f6b66;
          --brand-primary-light: #e9f6f5;
          --brand-primary-dark-text: #1a5753;
        }

        @keyframes gradientShift {
          0% { background-position: 0% 50%, 100% 20%, 0% 80%, 80% 60%, 30% 40%, 100% 90%; }
          33% { background-position: 100% 30%, 0% 70%, 100% 40%, 20% 80%, 70% 20%, 0% 60%; }
          66% { background-position: 0% 70%, 100% 40%, 0% 20%, 80% 30%, 40% 90%, 100% 50%; }
          100% { background-position: 0% 50%, 100% 20%, 0% 80%, 80% 60%, 30% 40%, 100% 90%; }
        }

        .animated-gradient-bg {
          background: #f9fafb;
          background-image:
            radial-gradient(circle at 10% 20%, #f5f9ff 0%, transparent 50%),
            radial-gradient(circle at 85% 10%, #c2ebe6 0%, transparent 50%),
            radial-gradient(circle at 20% 80%, #a8e0d7 0%, transparent 50%),
            radial-gradient(circle at 70% 60%, #d4bbff 0%, transparent 50%),
            radial-gradient(circle at 50% 50%, #fce7f3 0%, transparent 60%),
            radial-gradient(circle at 90% 85%, #e0ccff 0%, transparent 50%);
          background-size: 250% 250%, 250% 250%, 250% 250%, 250% 250%, 250% 250%, 250% 250%;
          animation: gradientShift 45s ease-in-out infinite;
          background-attachment: fixed;
        }

        .water-glass-effect {
          backdrop-filter: blur(12px) saturate(180%);
          background: linear-gradient(135deg,
            rgba(249, 250, 251, 0.75) 0%,
            rgba(243, 244, 246, 0.65) 50%),
            rgba(249, 250, 251, 0.75) 100%
          );
          box-shadow:
            0 8px 32px 0 rgba(31, 38, 135, 0.08),
            inset 0 1px 1px 0 rgba(255, 255, 255, 0.9),
            inset 0 -1px 1px 0 rgba(0, 0, 0, 0.05);
        }
        
        /* Stripe Element Container - DO NOT ADD PADDING HERE */
        #card-element-container {
          border: 2px solid #d1d5db;
          border-radius: 12px;
          background-color: white;
          transition: all 0.3s ease;
          min-height: 44px;
        }
        
        #card-element-container:focus-within {
          border-color: var(--brand-primary);
          box-shadow: 0 0 0 3px rgba(38, 132, 127, 0.1);
        }
        
        /* Stripe Element Iframe Styles */
        #card-element-container iframe {
          height: 44px !important;
        }
      `}</style>

      {/* ... keep navbar unchanged ... */}

      <div className="flex items-center justify-center min-h-screen pt-28 pb-12 px-4">
        <Card className="max-w-2xl w-full water-glass-effect border-gray-200/30 shadow-2xl rounded-2xl overflow-hidden">
          {/* ... keep CardHeader unchanged ... */}

          <CardContent className="px-8 pb-8 space-y-6">
            {/* ... keep all sections before payment method unchanged ... */}

            <div className="space-y-4 pt-4 border-t border-gray-200/50">
              <div className="flex items-center gap-3 mb-4">
                <CreditCard className="w-5 h-5 text-[var(--brand-primary)]"/>
                <h3 className="text-xl font-bold text-gray-800">Metodo di Pagamento</h3>
              </div>
              
              <div className="space-y-3">
                <button
                  onClick={() => setPaymentMethod('card')}
                  className={`w-full p-5 rounded-xl border-2 transition-all flex items-center gap-4 ${
                    paymentMethod === 'card'
                      ? 'border-[var(--brand-primary)] bg-[var(--brand-primary-light)]'
                      : 'border-gray-200 bg-white hover:border-[var(--brand-primary)]'
                  }`}
                >
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                    paymentMethod === 'card' ? 'bg-white' : 'bg-gray-50'
                  }`}>
                    <CreditCard className={`w-6 h-6 ${paymentMethod === 'card' ? 'text-[var(--brand-primary)]' : 'text-gray-400'}`} />
                  </div>
                  <p className="text-base font-semibold text-gray-800">Carta di Credito / Debito</p>
                </button>

                {/* ... keep Apple Pay and Google Pay buttons unchanged ... */}
              </div>
            </div>

            {paymentMethod === 'card' && (
              <div className="space-y-4 pt-4">
                <div>
                  <Label htmlFor="card-element" className="text-sm font-semibold text-gray-700 mb-3 block">
                    💳 Inserisci i Dati della Carta
                  </Label>
                  <div 
                    id="card-element-container"
                    ref={cardElementRef}
                  />
                  <p className="text-xs text-gray-500 mt-3 flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5" />
                    Pagamento sicuro gestito da Stripe. I tuoi dati sono protetti con crittografia SSL.
                  </p>
                </div>
              </div>
            )}

            {/* ... keep all remaining sections unchanged (digital wallet info, coupon, order bump, terms, CTA, etc.) ... */}
          </CardContent>
        </Card>
      </div>

      {/* ... keep footer unchanged ... */}
    </div>
  );
}