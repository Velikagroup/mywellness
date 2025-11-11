
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { CreditCard, CheckCircle, Sparkles, Shield, FileText, Check, ChevronsUpDown, Briefcase, Tag, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";

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
  
  const [isSaving, setIsSaving] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState(null);
  const [stripe, setStripe] = useState(null);
  const [cardElement, setCardElement] = useState(null);
  const [cardComplete, setCardComplete] = useState(false);
  const [paymentRequest, setPaymentRequest] = useState(null);
  const [canMakePayment, setCanMakePayment] = useState(null);
  const [showApplePay, setShowApplePay] = useState(false);
  const [showGooglePay, setShowGooglePay] = useState(false);
  
  const [billingInfo, setBillingInfo] = useState({
    name: '',
    email: '',
    companyName: '',
    taxId: '',
    pecSdi: '',
    billingType: 'private',
    address: '',
    city: '',
    zip: '',
    country: 'IT'
  });
  const [showBillingFields, setShowBillingFields] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  const [discountError, setDiscountError] = useState('');
  const [orderBumpSelected, setOrderBumpSelected] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [marketingConsent, setMarketingConsent] = useState(false);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [countryPopoverOpen, setCountryPopoverOpen] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState(countries.find(c => c.code === 'IT'));
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [trafficSource, setTrafficSource] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState('base');
  const [selectedBillingPeriod, setSelectedBillingPeriod] = useState('monthly');
  const [trialSetupTracked, setTrialSetupTracked] = useState(false);

  const validateCouponFromURL = async (code, email) => {
    try {
      const response = await base44.functions.invoke('validatePersonalCoupon', {
        couponCode: code,
        userEmail: email
      });

      const responseData = response.data || response;

      if (responseData.valid) {
        setAppliedCoupon({
          code: code,
          discount_type: responseData.discount_type,
          discount_value: responseData.discount_value
        });
        setDiscountError('');
      } else {
        setDiscountError(responseData.error || 'Coupon non valido');
      }
    } catch (error) {
      console.error('Error validating coupon from URL:', error);
      setDiscountError('Errore di validazione del coupon.');
    }
  };

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);

        if (!trialSetupTracked && currentUser) {
          try {
            await base44.entities.UserActivity.create({
              user_id: currentUser.id,
              event_type: 'trial_setup_opened',
              event_data: { plan: selectedPlan }
            });
            console.log('📊 Trial setup opened tracked');
            setTrialSetupTracked(true);
          } catch (error) {
            console.error('Error tracking trial setup:', error);
          }
        }

        const queryParams = new URLSearchParams(location.search);
        const refSource = queryParams.get('ref');
        const storedSource = localStorage.getItem('trafficSource');
        
        const couponParam = queryParams.get('coupon');
        if (couponParam && currentUser.email) {
          setCouponCode(couponParam);
          await validateCouponFromURL(couponParam, currentUser.email);
        }

        if (refSource) {
          setTrafficSource(refSource);
          localStorage.setItem('trafficSource', refSource);
        } else if (storedSource) {
          setTrafficSource(storedSource);
        } else {
          setTrafficSource('direct');
        }

        if (!stripeLoadedRef.current) {
          console.log('🔑 Loading Stripe publishable key from backend...');
          
          try {
            const keyResponse = await base44.functions.invoke('getStripePublishableKey');
            const responseData = keyResponse.data || keyResponse;
            
            if (!responseData.publishableKey) {
              throw new Error('publishableKey missing from response');
            }
            
            const stripeKey = responseData.publishableKey;
            console.log('✅ Stripe key loaded');
            
            if (window.Stripe) {
              console.log('✅ Stripe.js already loaded globally');
              const stripeInstance = window.Stripe(stripeKey);
              setStripe(stripeInstance);
              stripeLoadedRef.current = true;
            } else {
              console.log('⏳ Loading Stripe.js library...');
              const script = document.createElement('script');
              script.src = 'https://js.stripe.com/v3/';
              script.async = true;
              script.onload = () => {
                console.log('✅ Stripe.js loaded successfully');
                const stripeInstance = window.Stripe(stripeKey);
                setStripe(stripeInstance);
                stripeLoadedRef.current = true;
              };
              script.onerror = () => {
                console.error('❌ Failed to load Stripe.js');
                alert('Errore nel caricamento del sistema di pagamento. Ricarica la pagina.');
              };
              
              if (!document.querySelector('script[src="https://js.stripe.com/v3/"]')) {
                document.body.appendChild(script);
              }
            }
          } catch (stripeError) {
            console.error('💥 Stripe initialization failed:', stripeError);
            setIsLoading(false);
            return;
          }
        }
        
        setBillingInfo(prev => ({
          ...prev,
          name: currentUser.full_name || currentUser.billing_name || '',
          email: currentUser.email || '',
          address: currentUser.billing_address || '',
          city: currentUser.billing_city || '',
          zip: currentUser.billing_zip || '',
          country: currentUser.billing_country || 'IT',
          companyName: currentUser.company_name || '',
          taxId: currentUser.tax_id || '',
          pecSdi: currentUser.pec_sdi || '',
          billingType: currentUser.billing_type || 'private'
        }));

        if (currentUser.phone_number) {
          const phoneMatch = currentUser.phone_number.match(/\+\d+\s*(.+)/);
          if (phoneMatch) {
            setPhoneNumber(phoneMatch[1].trim());
          } else {
            setPhoneNumber(currentUser.phone_number);
          }
        }

        if (currentUser && currentUser.subscription_status === 'active') {
          navigate(createPageUrl('Dashboard'), { replace: true });
          return;
        }

        const fromLanding = location.state?.fromLanding || false;
        if (fromLanding) {
          setSelectedPlan('premium');
        } else {
          setSelectedPlan('base');
        }

        const savedQuizData = localStorage.getItem('quizData');
        if (savedQuizData) {
          try {
            const quizData = JSON.parse(savedQuizData);
            await base44.auth.updateMe(quizData);
            console.log('Quiz data saved to user profile');
            localStorage.removeItem('quizData');
          } catch (error) {
            console.error('Error saving quiz data:', error);
          }
        }

      } catch (error) {
        console.error('Authentication error:', error);
        localStorage.setItem('redirectToTrialSetup', 'true');
        const trialSetupUrl = window.location.origin + createPageUrl('TrialSetup');
        await base44.auth.redirectToLogin(trialSetupUrl);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [navigate, location, trialSetupTracked, selectedPlan]);

  useEffect(() => {
    if (!stripe || paymentMethod !== 'card' || !cardElementRef.current) {
      return;
    }

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
  }, [stripe, paymentMethod, cardElement]);

  useEffect(() => {
    if (!stripe || !user) return;

    const initializePaymentRequest = async () => {
      try {
        const pr = stripe.paymentRequest({
          country: 'IT',
          currency: 'eur',
          total: {
            label: 'MyWellness - Prova Gratuita',
            amount: 100,
          },
          requestPayerName: true,
          requestPayerEmail: true,
          requestPayerPhone: false,
          requestBillingAddress: true,
        });

        const canMakePaymentResult = await pr.canMakePayment();
        
        if (canMakePaymentResult) {
          setCanMakePayment(canMakePaymentResult);
          setPaymentRequest(pr);
          
          if (canMakePaymentResult.applePay) {
            setShowApplePay(true);
          }
          
          if (canMakePaymentResult.googlePay) {
            setShowGooglePay(true);
          }
          
          if (!canMakePaymentResult.applePay && !canMakePaymentResult.googlePay) {
            const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
            const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
            const isMacOS = /Macintosh|MacIntel|MacPPC|Mac68K/.test(navigator.platform);
            
            if (isIOS || isSafari || isMacOS) {
              setShowApplePay(true);
            } else {
              setShowGooglePay(true);
            }
          }
        }
      } catch (error) {
        console.error('Payment Request error:', error);
      }
    };

    initializePaymentRequest();
  }, [stripe, user]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleBillingInfoChange = (e) => {
    const { name, value } = e.target;
    setBillingInfo(prev => ({ ...prev, [name]: value }));
  };

  const handleApplyDiscount = async () => {
    if (!couponCode.trim()) {
      setDiscountError("Inserisci un codice coupon.");
      setAppliedCoupon(null);
      return;
    }

    setIsApplyingCoupon(true);
    setDiscountError('');
    try {
      const response = await base44.functions.invoke('validatePersonalCoupon', {
        couponCode: couponCode.toUpperCase(),
        userEmail: user.email
      });

      const responseData = response.data || response;

      if (responseData.valid) {
        setAppliedCoupon({
          code: couponCode.toUpperCase(),
          discount_type: responseData.discount_type,
          discount_value: responseData.discount_value
        });
        setDiscountError("");
        alert(`✅ Coupon applicato! Sconto del ${responseData.discount_value}%`);
      } else {
        setDiscountError(responseData.error || "Coupon non valido.");
        setAppliedCoupon(null);
      }
    } catch (error) {
      console.error("Error validating coupon:", error);
      setDiscountError("Errore nella verifica del coupon. Riprova più tardi.");
      setAppliedCoupon(null);
    }
    setIsApplyingCoupon(false);
  };

  const handleDigitalWalletClick = async (walletType) => {
    if (!paymentRequest || !stripe) {
      alert("Wallet digitale non disponibile.");
      return;
    }

    if (!billingInfo.name || !billingInfo.email || !phoneNumber || !billingInfo.address || !billingInfo.city || !billingInfo.zip || !billingInfo.country || !termsAccepted || !privacyAccepted) {
      alert("Per favore, compila tutti i campi obbligatori prima di procedere.");
      return;
    }

    setIsSaving(true);

    try {
      let subtotal = 0;
      if (orderBumpSelected) {
        subtotal = ORDER_BUMP_PRICE;
      }

      let discount = 0;
      if (appliedCoupon && appliedCoupon.discount_type === 'percentage') {
        discount = subtotal * (appliedCoupon.discount_value / 100);
      }

      const currentTotal = Math.max(0, subtotal - discount);
      const amount = Math.round(currentTotal * 100);

      paymentRequest.update({
        total: {
          label: 'MyWellness - Prova Gratuita',
          amount: amount,
        },
      });

      paymentRequest.off('paymentmethod');
      paymentRequest.on('paymentmethod', async (ev) => {
        try {
          const fullPhoneNumber = selectedCountry.dial_code + ' ' + phoneNumber;

          const payload = {
            paymentMethodId: ev.paymentMethod.id,
            planType: selectedPlan,
            billingPeriod: selectedBillingPeriod,
            orderBumpSelected: orderBumpSelected,
            appliedCouponCode: appliedCoupon ? appliedCoupon.code : null,
            trafficSource: trafficSource,
            billingInfo: {
              name: ev.payerName || billingInfo.name,
              email: ev.payerEmail || billingInfo.email,
              companyName: showBillingFields && billingInfo.billingType === 'company' ? billingInfo.companyName : null,
              taxId: showBillingFields ? billingInfo.taxId : null,
              pecSdi: showBillingFields && billingInfo.billingType === 'company' ? billingInfo.pecSdi : null,
              billingType: billingInfo.billingType,
              address: ev.billingAddress?.addressLine[0] || billingInfo.address,
              city: ev.billingAddress?.city || billingInfo.city,
              zip: ev.billingAddress?.postalCode || billingInfo.zip,
              country: ev.billingAddress?.countryCode || billingInfo.country
            },
            phoneNumber: fullPhoneNumber,
            termsAccepted: termsAccepted,
            privacyAccepted: privacyAccepted,
            marketingConsent: marketingConsent
          };

          const response = await base44.functions.invoke('stripeCreateTrialSubscription', payload);
          const responseData = response.data || response;

          if (!responseData || !responseData.success) {
            throw new Error(responseData?.error || responseData?.details || 'Setup failed');
          }

          ev.complete('success');
          navigate(createPageUrl('Dashboard'), { replace: true });

        } catch (error) {
          console.error('💥 Digital Wallet payment error:', error);
          ev.complete('fail');
          alert('Errore con il pagamento: ' + (error?.message || 'Errore sconosciuto'));
          setIsSaving(false);
        }
      });

      paymentRequest.show();

    } catch (error) {
      console.error('💥 Digital Wallet initialization error:', error);
      alert('Errore nell\'inizializzazione del wallet: ' + (error?.message || 'Errore sconosciuto'));
      setIsSaving(false);
    }
  };

  const handleCompleteSetup = async () => {
    if (!isFormValid) {
      alert("Per favor, compila tutti i campi obbligatori correttamente.");
      return;
    }

    if (paymentMethod === 'apple_pay' || paymentMethod === 'google_pay') {
      return handleDigitalWalletClick(paymentMethod === 'apple_pay' ? 'Apple Pay' : 'Google Pay');
    }

    setIsSaving(true);

    try {
      if (!stripe || !cardElement) {
        throw new Error('Stripe non inizializzato. Ricarica la pagina.');
      }

      console.log('🔐 Creating secure payment method with Stripe Elements...');
      const { paymentMethod: stripePaymentMethod, error: stripeError } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
        billing_details: {
          name: billingInfo.name,
          email: billingInfo.email,
          address: {
            line1: billingInfo.address,
            city: billingInfo.city,
            postal_code: billingInfo.zip,
            country: billingInfo.country
          }
        }
      });

      if (stripeError) {
        console.error('❌ Stripe payment method error:', stripeError);
        throw new Error(stripeError.message);
      }

      console.log('✅ Payment method created:', stripePaymentMethod.id);
      
      const fullPhoneNumber = selectedCountry.dial_code + ' ' + phoneNumber;

      const payload = {
        paymentMethodId: stripePaymentMethod.id,
        planType: selectedPlan,
        billingPeriod: selectedBillingPeriod,
        orderBumpSelected: orderBumpSelected,
        appliedCouponCode: appliedCoupon ? appliedCoupon.code : null,
        trafficSource: trafficSource,
        billingInfo: {
          name: billingInfo.name,
          email: billingInfo.email,
          companyName: showBillingFields && billingInfo.billingType === 'company' ? billingInfo.companyName : null,
          taxId: showBillingFields ? billingInfo.taxId : null,
          pecSdi: showBillingFields && billingInfo.billingType === 'company' ? billingInfo.pecSdi : null,
          billingType: billingInfo.billingType,
          address: billingInfo.address,
          city: billingInfo.city,
          zip: billingInfo.zip,
          country: billingInfo.country
        },
        phoneNumber: fullPhoneNumber,
        termsAccepted: termsAccepted,
        privacyAccepted: privacyAccepted,
        marketingConsent: marketingConsent
      };

      console.log('📤 Sending payment payload to backend...');
      const result = await base44.functions.invoke('stripeCreateTrialSubscription', payload);
      const resultData = result.data || result;

      if (!resultData || !resultData.success) {
        const errorMsg = resultData?.error || resultData?.details || 'Setup failed';
        console.error('❌ Setup failed:', errorMsg);
        throw new Error(errorMsg);
      }

      console.log('✅ Trial subscription created successfully!');
      navigate(createPageUrl('Dashboard'), { replace: true });

    } catch (error) {
      console.error('💥 Setup error:', error);
      alert('Errore durante l\'attivazione: ' + (error?.message || 'Errore sconosciuto. Riprova.'));
    } finally {
      setIsSaving(false);
    }
  };

  const isFormValid = paymentMethod && 
    (paymentMethod === 'apple_pay' || paymentMethod === 'google_pay' || cardComplete) &&
    billingInfo.name.length > 0 &&
    billingInfo.email.length > 0 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(billingInfo.email) &&
    phoneNumber.length > 0 &&
    billingInfo.address.length > 0 &&
    billingInfo.city.length > 0 &&
    billingInfo.zip.length > 0 &&
    billingInfo.country.length > 0 &&
    termsAccepted &&
    privacyAccepted &&
    (!showBillingFields || (
      billingInfo.taxId.length > 0 &&
      (billingInfo.billingType !== 'company' || billingInfo.companyName.length > 0)
    ));

  let isCtaDisabled = !isFormValid || isSaving;

  let subtotal = 0;
  if (orderBumpSelected) {
    subtotal = ORDER_BUMP_PRICE;
  }

  let discount = 0;
  if (appliedCoupon && appliedCoupon.discount_type === 'percentage') {
    discount = subtotal * (appliedCoupon.discount_value / 100);
  }

  const total = Math.max(0, subtotal - discount);

  const planPrices = {
    base: 19,
    pro: 29,
    premium: 39
  };

  const monthlyPrice = planPrices[selectedPlan] || 19;

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
    <div className="min-h-screen animated-gradient-bg overflow-x-hidden">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

        * { font-family: 'Inter', sans-serif; }

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
          background: linear-gradient(135deg, rgba(249, 250, 251, 0.75) 0%, rgba(243, 244, 246, 0.65) 50%, rgba(249, 250, 251, 0.75) 100%);
          box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.08), inset 0 1px 1px 0 rgba(255, 255, 255, 0.9), inset 0 -1px 1px 0 rgba(0, 0, 0, 0.05);
        }
        
        #card-element-container {
          border: 2px solid #d1d5db;
          border-radius: 12px;
          background-color: white;
          transition: all 0.3s ease;
          min-height: 52px;
          padding: 12px;
        }
        
        #card-element-container:focus-within {
          border-color: var(--brand-primary);
          box-shadow: 0 0 0 3px rgba(38, 132, 127, 0.1);
        }
        
        #card-element-container iframe {
          min-height: 28px !important;
        }
      `}</style>

      <div className="fixed top-6 left-1/2 transform -translate-x-1/2 z-50 px-4 w-full max-w-[300px]">
        <div className="water-glass-effect rounded-full px-6 py-3 flex justify-center">
          <img
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68d44c626cc2c19cca9c750d/c3567e77e_MyWellnesslogo.png"
            alt="MyWellness"
            className="h-6"
          />
        </div>
      </div>

      <div className="flex items-center justify-center min-h-screen pt-28 pb-12 px-4">
        <Card className="max-w-2xl w-full water-glass-effect border-gray-200/30 shadow-2xl rounded-2xl overflow-hidden">
          <CardHeader className="text-center pb-6 pt-8">
            <div className="w-20 h-20 bg-gradient-to-br from-[var(--brand-primary)] to-teal-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl">
              <Sparkles className="w-10 h-10 text-white" />
            </div>
            <CardTitle className="text-3xl font-bold text-gray-900 mb-3">
              Prova Gratuita {TRIAL_DAYS} Giorni
            </CardTitle>
            <p className="text-gray-600 text-base">
              {selectedPlan === 'base' && 'Piano Base - Nutrizionale completo con dashboard scientifica'}
              {selectedPlan === 'pro' && 'Piano Pro - Nutrizionale + Allenamento + Analisi AI'}
              {selectedPlan === 'premium' && 'Piano Premium - Accesso completo a tutte le funzionalità'}
            </p>
            
            {appliedCoupon && (
              <div className="mt-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl">
                <div className="flex items-center justify-center gap-2">
                  <Tag className="w-5 h-5 text-green-600" />
                  <span className="font-bold text-green-700">
                    Sconto del {appliedCoupon.discount_value}% applicato! ({appliedCoupon.code})
                  </span>
                  <button
                    onClick={() => {
                      setAppliedCoupon(null);
                      setCouponCode('');
                      setDiscountError('');
                    }}
                    className="ml-2 text-green-600 hover:text-green-800">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </CardHeader>

          <CardContent className="px-4 sm:px-8 pb-8 space-y-6">
            <div className="bg-[var(--brand-primary-light)] rounded-xl p-5 border border-[var(--brand-primary)]/20">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-[var(--brand-primary)] flex-shrink-0" />
                  <span className="text-sm text-gray-800 font-medium">Piano nutrizionale personalizzato completo</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-[var(--brand-primary)] flex-shrink-0" />
                  <span className="text-sm text-gray-800 font-medium">Ricette con foto AI e istruzioni dettagliate</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-[var(--brand-primary)] flex-shrink-0" />
                  <span className="text-sm text-gray-800 font-medium">Dashboard scientifica con BMR e massa grassa</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-[var(--brand-primary)] flex-shrink-0" />
                  <span className="text-sm text-gray-800 font-medium">Lista della spesa automatica</span>
                </div>
                {(selectedPlan === 'pro' || selectedPlan === 'premium') && (
                  <>
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-[var(--brand-primary)] flex-shrink-0" />
                      <span className="text-sm text-gray-800 font-medium">Piano allenamento adattivo</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-[var(--brand-primary)] flex-shrink-0" />
                      <span className="text-sm text-gray-800 font-medium">Analisi AI dei pasti con foto</span>
                    </div>
                  </>
                )}
                {selectedPlan === 'premium' && (
                  <>
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-[var(--brand-primary)] flex-shrink-0" />
                      <span className="text-sm text-gray-800 font-medium">Sostituzione ingredienti AI</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-[var(--brand-primary)] flex-shrink-0" />
                      <span className="text-sm text-gray-800 font-medium">Supporto prioritario</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-gray-200/50">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-[var(--brand-primary)]"/>
                <h3 className="text-xl font-bold text-gray-800">Dettagli Principali</h3>
              </div>
              <div>
                <Label htmlFor="billingName" className="text-sm font-semibold text-gray-700 mb-2 block">
                  Nome e Cognome
                </Label>
                <Input
                  id="billingName" name="name" type="text" placeholder="Mario Rossi"
                  value={billingInfo.name} onChange={handleBillingInfoChange}
                  className="h-12 text-base bg-white"
                  autoComplete="name"
                />
              </div>
              <div>
                <Label htmlFor="email" className="text-sm font-semibold text-gray-700 mb-2 block">
                  Email
                </Label>
                <Input
                  id="email" name="email" type="email" placeholder="mario.rossi@example.com"
                  value={billingInfo.email} onChange={handleBillingInfoChange}
                  className="h-12 text-base bg-white"
                  autoComplete="email"
                />
              </div>
              <div>
                <Label htmlFor="phoneNumber" className="text-sm font-semibold text-gray-700 mb-2 block">
                  Numero di Telefono
                </Label>
                <div className="flex items-center gap-2">
                  <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={popoverOpen}
                        className="w-[130px] justify-start h-12 bg-white"
                      >
                        {selectedCountry ? (
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{countryCodeToFlag(selectedCountry.code)}</span>
                            <span>{selectedCountry.dial_code}</span>
                          </div>
                        ) : (
                          "Prefisso"
                        )}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[300px] p-0">
                      <Command>
                        <CommandInput placeholder="Cerca paese..." />
                        <CommandList>
                          <CommandEmpty>Nessun paese trovato.</CommandEmpty>
                          <CommandGroup>
                            {countries.map((country) => (
                              <CommandItem
                                key={country.code}
                                value={`${country.name} ${country.dial_code}`}
                                onSelect={() => {
                                  setSelectedCountry(country);
                                  setPopoverOpen(false);
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    selectedCountry?.code === country.code ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                <span className="mr-2 text-lg">{countryCodeToFlag(country.code)}</span>
                                <span>{country.name}</span>
                                <span className="ml-auto text-gray-500">{country.dial_code}</span>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <Input
                    id="phoneNumber" name="tel-national" type="tel" placeholder="333 1234567"
                    value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)}
                    className="h-12 text-base bg-white"
                    autoComplete="tel-national"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="address" className="text-sm font-semibold text-gray-700 mb-2 block">Indirizzo di Fatturazione</Label>
                <Input id="address" name="address" type="text" placeholder="Via Roma, 123"
                  value={billingInfo.address} onChange={handleBillingInfoChange}
                  className="h-12 text-base bg-white" autoComplete="address-line1"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="city" className="text-sm font-semibold text-gray-700 mb-2 block">Città</Label>
                  <Input id="city" name="city" type="text" placeholder="Milano"
                    value={billingInfo.city} onChange={handleBillingInfoChange}
                    className="h-12 text-base bg-white" autoComplete="address-level2" />
                </div>
                <div>
                  <Label htmlFor="zip" className="text-sm font-semibold text-gray-700 mb-2 block">CAP</Label>
                  <Input id="zip" name="zip" type="text" placeholder="20121"
                    value={billingInfo.zip} onChange={handleBillingInfoChange}
                    className="h-12 text-base bg-white" autoComplete="postal-code" />
                </div>
              </div>
              <div>
                <Label htmlFor="country" className="text-sm font-semibold text-gray-700 mb-2 block">Paese</Label>
                <Popover open={countryPopoverOpen} onOpenChange={setCountryPopoverOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={countryPopoverOpen}
                      className="w-full justify-between h-12 text-base font-normal bg-white"
                    >
                      {billingInfo.country
                        ? countries.find((country) => country.code === billingInfo.country)?.name
                        : "Seleziona paese..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                    <Command>
                      <CommandInput placeholder="Cerca paese..." />
                      <CommandList>
                        <CommandEmpty>Nessun paese trovato.</CommandEmpty>
                        <CommandGroup>
                          {countries.map((country) => (
                            <CommandItem
                              key={country.code}
                              value={`${country.name} ${country.code}`}
                              onSelect={() => {
                                handleBillingInfoChange({ target: { name: 'country', value: country.code }});
                                setCountryPopoverOpen(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  billingInfo.country === country.code ? "opacity-100" : "opacity-0"
                                )}
                              />
                              <span>{country.name}</span>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              <div className="pt-4 space-y-4">
                <div
                  className="flex items-center gap-3 cursor-pointer text-sm font-semibold text-gray-600 hover:text-[var(--brand-primary)] transition-colors"
                  onClick={() => setShowBillingFields(!showBillingFields)}
                >
                  <Briefcase className="w-5 h-5" />
                  <span>{showBillingFields ? 'Nascondi dati fiscali' : '💼 Hai bisogno della fattura? Inserisci qui i dati fiscali'}</span>
                </div>

                {showBillingFields && (
                  <div className="p-4 bg-white rounded-xl border border-gray-200/50 space-y-4">
                    <RadioGroup
                      defaultValue="private"
                      onValueChange={(value) => handleBillingInfoChange({ target: { name: 'billingType', value } })}
                      className="flex gap-4"
                      value={billingInfo.billingType}
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="private" id="r-private" />
                        <Label htmlFor="r-private">Privato</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="company" id="r-company" />
                        <Label htmlFor="r-company">Azienda</Label>
                      </div>
                    </RadioGroup>

                    {billingInfo.billingType === 'company' && (
                      <div>
                        <Label htmlFor="companyName" className="text-sm font-semibold text-gray-700 mb-2 block">
                          Nome Azienda
                        </Label>
                        <Input
                          id="companyName" name="companyName" type="text" placeholder="MyWellness S.R.L."
                          value={billingInfo.companyName} onChange={handleBillingInfoChange}
                          className="h-12 text-base bg-white"
                        />
                      </div>
                    )}

                    <div>
                      <Label htmlFor="taxId" className="text-sm font-semibold text-gray-700 mb-2 block">
                        {billingInfo.billingType === 'private' ? 'Codice Fiscale' : 'Partita IVA'}
                      </Label>
                      <Input
                        id="taxId" name="taxId" type="text"
                        placeholder={billingInfo.billingType === 'private' ? 'RSSMRA80A01H501U' : '01234567890'}
                        value={billingInfo.taxId} onChange={handleBillingInfoChange}
                        className="h-12 text-base bg-white"
                      />
                    </div>

                    {billingInfo.billingType === 'company' && (
                      <div>
                        <Label htmlFor="pecSdi" className="text-sm font-semibold text-gray-700 mb-2 block">
                          PEC o Codice SDI <span className="text-gray-400 font-normal">(Opzionale)</span>
                        </Label>
                        <Input
                          id="pecSdi" name="pecSdi" type="text" placeholder="tuamail@pec.it o XXXXXXX"
                          value={billingInfo.pecSdi} onChange={handleBillingInfoChange}
                          className="h-12 text-base bg-white"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

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

                {showApplePay && (
                  <button
                    onClick={() => {
                      setPaymentMethod('apple_pay');
                      handleDigitalWalletClick('Apple Pay');
                    }}
                    disabled={isSaving}
                    className={`w-full p-5 rounded-xl border-2 transition-all flex items-center gap-4 ${
                      paymentMethod === 'apple_pay'
                        ? 'border-[var(--brand-primary)] bg-[var(--brand-primary-light)]'
                        : 'border-gray-200 bg-white hover:border-[var(--brand-primary)]'
                    }`}
                  >
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                      paymentMethod === 'apple_pay' ? 'bg-white' : 'bg-gray-50'
                    }`}>
                      <svg className={`w-8 h-8 ${paymentMethod === 'apple_pay' ? 'text-black' : 'text-gray-400'}`} viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                      </svg>
                    </div>
                    <div className="text-left">
                      <p className="text-base font-semibold text-gray-800">Apple Pay</p>
                      <p className="text-xs text-gray-500">Pagamento veloce e sicuro</p>
                    </div>
                  </button>
                )}

                {showGooglePay && (
                  <button
                    onClick={() => {
                      setPaymentMethod('google_pay');
                      handleDigitalWalletClick('Google Pay');
                    }}
                    disabled={isSaving}
                    className={`w-full p-5 rounded-xl border-2 transition-all flex items-center gap-4 ${
                      paymentMethod === 'google_pay'
                        ? 'border-[var(--brand-primary)] bg-[var(--brand-primary-light)]'
                        : 'border-gray-200 bg-white hover:border-[var(--brand-primary)]'
                    }`}
                  >
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                      paymentMethod === 'google_pay' ? 'bg-white' : 'bg-gray-50'
                    }`}>
                      <svg className={`w-8 h-8 ${paymentMethod === 'google_pay' ? 'text-[var(--brand-primary)]' : 'text-gray-400'}`} fill="currentColor" viewBox="0 0 512 512">
                        <path d="M473.16 221.48l-2.26-9.59H262.46v88.22H387c-12.93 61.4-72.93 93.72-121.94 93.72-35.66 0-73.25-15-98.13-39.11a140.08 140.08 0 01-41.8-98.88c0-37.16 16.7-74.33 41-98.78s61-38.13 97.49-38.13c41.79 0 71.74 22.19 82.94 32.31l62.69-62.36C390.86 72.72 340.34 32 261.6 32c-60.75 0-119 23.27-161.58 65.71C58 139.5 36.25 199.93 36.25 256s20.58 113.48 61.3 155.6c43.51 44.92 105.13 68.4 168.58 68.4 57.73 0 112.45-22.62 151.45-63.66 38.34-40.4 58.17-96.3 58.17-154.9 0-24.67-2.48-39.32-2.59-39.96z"/>
                      </svg>
                    </div>
                    <div className="text-left">
                      <p className="text-base font-semibold text-gray-800">Google Pay</p>
                      <p className="text-xs text-gray-500">Pagamento veloce e sicuro</p>
                    </div>
                  </button>
                )}
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

            {(paymentMethod === 'apple_pay' || paymentMethod === 'google_pay') && (
              <div className="p-6 bg-gradient-to-br from-[var(--brand-primary-light)] to-teal-50 rounded-xl border border-[var(--brand-primary)]/20">
                <div className="flex items-center gap-3 mb-2">
                  <CheckCircle className="w-5 h-5 text-[var(--brand-primary)]" />
                  <p className="font-semibold text-gray-900">Metodo Sicuro e Veloce</p>
                </div>
                <p className="text-sm text-gray-700">
                  Cliccando sul bottone sopra, si aprirà {paymentMethod === 'apple_pay' ? 'Apple Pay' : 'Google Pay'} per completare il pagamento in modo sicuro.
                </p>
              </div>
            )}

            {paymentMethod && (
              <>
                <div className="space-y-6 pt-6 border-t border-gray-200/50">
                  <div className="space-y-2">
                    <Label htmlFor="couponCode" className="text-sm font-semibold text-gray-700">
                      Codice Sconto (Opzionale)
                    </Label>
                    <div className="relative">
                      <Input id="couponCode" type="text" placeholder="Es. PROMO20" value={couponCode}
                        onChange={(e) => { setCouponCode(e.target.value); setDiscountError(''); }} className="h-12 text-base pr-28 bg-white" />
                      <Button type="button" onClick={handleApplyDiscount} disabled={isApplyingCoupon || !couponCode.trim()}
                        className={cn("absolute right-2 top-1/2 -translate-y-1/2 h-9", couponCode.trim() ? "bg-[var(--brand-primary)] text-white hover:bg-[var(--brand-primary-hover)]" : "bg-gray-200 text-gray-700 cursor-not-allowed")}>
                          {isApplyingCoupon ? 'Applicando...' : 'Applica'}
                      </Button>
                    </div>
                    {discountError && <p className="text-red-500 text-sm mt-1">{discountError}</p>}
                  </div>

                  <div className="pt-0">
                    <Label htmlFor="orderBump" className="block cursor-pointer">
                      <div className="bg-green-50/50 border-2 border-dashed border-green-400 rounded-xl p-5 space-y-3 transition-all duration-300 hover:bg-green-100/50">
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex-grow">
                            <p className="text-lg font-bold text-gray-900">
                              Si, lo voglio!
                            </p>
                            <p className="text-sm text-gray-600 mt-1">
                              Aggiungi "Mastery AI Wellness": video corso completo
                            </p>
                          </div>
                          <Checkbox id="orderBump" checked={orderBumpSelected} onCheckedChange={setOrderBumpSelected}
                            className="w-8 h-8 flex-shrink-0 border-gray-400 data-[state=checked]:bg-[var(--brand-primary)]" />
                        </div>
                        <div className="text-right">
                          <span className="text-gray-500 line-through text-sm mr-2">€49.99</span>
                          <span className="text-2xl font-bold text-green-600">€{ORDER_BUMP_PRICE.toFixed(2)}</span>
                        </div>
                      </div>
                    </Label>
                  </div>
                  
                  <div className="space-y-3 pt-4">
                    <div className="flex items-start space-x-3">
                      <Checkbox id="terms" checked={termsAccepted} onCheckedChange={setTermsAccepted} />
                      <Label htmlFor="terms" className="text-xs text-gray-600">
                        Accetto i <a href={createPageUrl('Terms')} target="_blank" className="underline hover:text-[var(--brand-primary)]">Termini e Condizioni</a> del servizio.*
                      </Label>
                    </div>
                    <div className="flex items-start space-x-3">
                      <Checkbox id="privacy" checked={privacyAccepted} onCheckedChange={setPrivacyAccepted} />
                      <Label htmlFor="privacy" className="text-xs text-gray-600">
                        Dichiaro di aver letto la <a href={createPageUrl('Privacy')} target="_blank" className="underline hover:text-[var(--brand-primary)]">Privacy Policy</a> e acconsento al trattamento dei dati.*
                      </Label>
                    </div>
                    <div className="flex items-start space-x-3">
                      <Checkbox id="marketing" checked={marketingConsent} onCheckedChange={setMarketingConsent} />
                      <Label htmlFor="marketing" className="text-xs text-gray-600">
                        Acconsento a ricevere comunicazioni di marketing e newsletter.
                      </Label>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-center gap-2 text-xs sm:text-sm text-gray-500 pt-2">
                  <Shield className="w-4 h-4 flex-shrink-0" />
                  <span className="text-center">Pagamento sicuro e crittografato</span>
                </div>

                <div className="bg-gray-50/50 rounded-xl p-4 space-y-2">
                  <div className="flex justify-between text-sm sm:text-base text-gray-700">
                    <span>Subtotale</span>
                    <span>€{subtotal.toFixed(2)}</span>
                  </div>
                  {appliedCoupon && appliedCoupon.discount_type === 'percentage' && (
                    <div className="flex justify-between text-sm sm:text-base text-green-600 font-semibold">
                      <span>Sconto ({appliedCoupon.code})</span>
                      <span>-€{discount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm sm:text-base text-gray-700 font-semibold pt-2 border-t border-gray-200">
                    <span>Oggi (Prova {TRIAL_DAYS} Giorni)</span>
                    <span>€{total.toFixed(2)}</span>
                  </div>
                  <p className="text-xs text-gray-500 text-center pt-2">
                    Dopo {TRIAL_DAYS} giorni: €{monthlyPrice}/mese (puoi cancellare in qualsiasi momento)
                  </p>
                </div>

                <Button
                  onClick={handleCompleteSetup}
                  disabled={isCtaDisabled}
                  className="w-full h-14 text-base sm:text-lg font-bold bg-gradient-to-r from-[var(--brand-primary)] to-teal-500 hover:from-[var(--brand-primary-hover)] hover:to-teal-600 text-white rounded-xl shadow-xl hover:shadow-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Attivazione...
                    </div>
                  ) : (
                    `Inizia Prova Gratuita (€${total.toFixed(2)} oggi)`
                  )}
                </Button>

                <p className="text-xs text-center text-gray-500 mt-4 px-2">
                  Nessun addebito durante i {TRIAL_DAYS} giorni di prova. Cancella in qualsiasi momento.
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <footer className="py-12 px-6 mt-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center space-y-2">
            <p className="text-sm font-semibold text-gray-700">
              © VELIKA GROUP LLC. All Rights Reserved.
            </p>
            <p className="text-xs text-gray-500">
              30 N Gould St 32651 Sheridan, WY 82801, United States
            </p>
            <p className="text-xs text-gray-500">
              EIN: 36-5141800 - velika.03@outlook.it
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
