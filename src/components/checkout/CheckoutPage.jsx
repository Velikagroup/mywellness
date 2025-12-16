import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { CreditCard, CheckCircle, Sparkles, Shield, FileText, Check, ChevronsUpDown, Briefcase, Tag, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { createPageUrl } from '@/utils';
import { useLanguage } from '../i18n/LanguageContext';
import { useNavigate, useLocation } from 'react-router-dom';

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

export default function CheckoutPage() {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const cardElementRef = useRef(null);
  const stripeLoadedRef = useRef(false);
  const cardMountedRef = useRef(false);
  
  const [isSaving, setIsSaving] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [paymentInfoTracked, setPaymentInfoTracked] = useState(false);
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
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [marketingConsent, setMarketingConsent] = useState(false);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [countryPopoverOpen, setCountryPopoverOpen] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState(countries.find(c => c.code === 'IT'));
  const [user, setUser] = useState(null);
  const [trafficSource, setTrafficSource] = useState('direct');
  const [affiliateDiscount, setAffiliateDiscount] = useState(null);

  // Get plan and billing from URL params
  const urlParams = new URLSearchParams(location.search);
  const selectedPlan = urlParams.get('plan') || 'base';
  const selectedBillingPeriod = urlParams.get('billing') || 'monthly';

  useEffect(() => {
    window.scrollTo(0, 0);
    
    const initPage = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);

        // 📊 TikTok Event: InitiateCheckout
        try {
          await base44.functions.invoke('sendTikTokEvent', {
            event: 'InitiateCheckout',
            email: currentUser.email,
            phone: currentUser.phone_number,
            external_id: currentUser.id,
            ip: null,
            user_agent: navigator.userAgent,
            value: selectedPlan === 'base' ? 19 : selectedPlan === 'pro' ? 29 : 39,
            currency: 'EUR',
            content_id: selectedPlan,
            content_type: 'product',
            content_name: `MyWellness ${selectedPlan}`,
            url: window.location.href
          });
          console.log('✅ TikTok InitiateCheckout tracked');
        } catch (e) {
          console.warn('⚠️ TikTok tracking error:', e);
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

        const affiliateCode = currentUser.referred_by_affiliate_code || currentUser.referred_by;
        if (affiliateCode) {
          setAffiliateDiscount({
            type: 'affiliate_referral',
            value: 20,
            code: affiliateCode
          });
        }

        if (!stripeLoadedRef.current) {
          const keyResponse = await base44.functions.invoke('getStripePublishableKey');
          const responseData = keyResponse.data || keyResponse;
          
          if (!responseData.publishableKey) {
            throw new Error('publishableKey missing from response');
          }
          
          const stripeKey = responseData.publishableKey;
          
          if (window.Stripe) {
            const stripeInstance = window.Stripe(stripeKey);
            setStripe(stripeInstance);
            stripeLoadedRef.current = true;
          } else {
            const script = document.createElement('script');
            script.src = 'https://js.stripe.com/v3/';
            script.async = true;
            script.onload = () => {
              const stripeInstance = window.Stripe(stripeKey);
              setStripe(stripeInstance);
              stripeLoadedRef.current = true;
            };
            script.onerror = () => {
              alert('Errore nel caricamento del sistema di pagamento. Ricarica la pagina.');
            };
            
            if (!document.querySelector('script[src="https://js.stripe.com/v3/"]')) {
              document.body.appendChild(script);
            }
          }
        }
      } catch (error) {
        console.error('Page initialization error:', error);
        if (error?.response?.status === 401 || error?.message?.includes('401')) {
          navigate(createPageUrl('Home'));
        }
      }
    };

    initPage();
  }, [navigate]);

  useEffect(() => {
    if (!stripe || paymentMethod !== 'card' || !cardElementRef.current) {
      return;
    }

    if (cardMountedRef.current || cardElement) {
      return;
    }
    
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

      card.mount(cardElementRef.current);
      cardMountedRef.current = true;
      
      card.on('change', (event) => {
        setCardComplete(event.complete);
      });

      setCardElement(card);

    } catch (error) {
      console.error('Error creating Card Element:', error);
    }

    return () => {
      if (cardElement && cardMountedRef.current) {
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
            label: 'MyWellness - Upgrade',
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

  const handleBillingInfoChange = (e) => {
    const { name, value } = e.target;
    setBillingInfo(prev => ({ ...prev, [name]: value }));
  };

  const handleApplyDiscount = async () => {
    if (!couponCode.trim()) {
      setDiscountError(t('checkout.couponPlaceholder'));
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
      paymentRequest.update({
        total: {
          label: 'MyWellness - Upgrade',
          amount: 100,
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
            orderBumpSelected: false,
            appliedCouponCode: appliedCoupon ? appliedCoupon.code : null,
            trafficSource: trafficSource,
            skipTrial: true,
            affiliateDiscountPercent: affiliateDiscount && selectedBillingPeriod === 'monthly' ? affiliateDiscount.value : null,
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
          navigate(createPageUrl('Dashboard'));

        } catch (error) {
          console.error('Digital Wallet payment error:', error);
          ev.complete('fail');
          alert('Errore con il pagamento: ' + (error?.message || 'Errore sconosciuto'));
          setIsSaving(false);
        }
      });

      paymentRequest.show();

    } catch (error) {
      console.error('Digital Wallet initialization error:', error);
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
        throw new Error(stripeError.message);
      }
      
      const fullPhoneNumber = selectedCountry.dial_code + ' ' + phoneNumber;

      const payload = {
        paymentMethodId: stripePaymentMethod.id,
        planType: selectedPlan,
        billingPeriod: selectedBillingPeriod,
        orderBumpSelected: false,
        appliedCouponCode: appliedCoupon ? appliedCoupon.code : null,
        trafficSource: trafficSource,
        skipTrial: true,
        affiliateDiscountPercent: affiliateDiscount && selectedBillingPeriod === 'monthly' ? affiliateDiscount.value : null,
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

      const result = await base44.functions.invoke('stripeCreateTrialSubscription', payload);
      const resultData = result.data || result;

      if (!resultData || !resultData.success) {
        const errorMsg = resultData?.error || resultData?.details || 'Setup failed';
        throw new Error(errorMsg);
      }

      navigate(createPageUrl('Dashboard'));

    } catch (error) {
      console.error('Setup error:', error);
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

  const planPrices = {
    base: 19,
    pro: 29,
    premium: 39
  };

  const monthlyPrice = planPrices[selectedPlan] || 19;
  
  const activeDiscount = affiliateDiscount || appliedCoupon;
  const discountPercentage = activeDiscount?.value || 0;
  const discountedMonthlyPrice = monthlyPrice * (1 - discountPercentage / 100);
  const yearlyPrice = monthlyPrice * 12 * 0.8;
  const discountedYearlyPrice = yearlyPrice * (1 - discountPercentage / 100);
  const finalPrice = selectedBillingPeriod === 'monthly' ? discountedMonthlyPrice : discountedYearlyPrice;

  return (
    <div className="min-h-screen animated-gradient-bg py-12 px-4">
      <style>{`
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
          border-color: #26847F;
          box-shadow: 0 0 0 3px rgba(38, 132, 127, 0.1);
        }
        
        #card-element-container iframe {
          min-height: 28px !important;
        }
      `}</style>

      <div className="max-w-2xl mx-auto water-glass-effect rounded-3xl overflow-hidden">
        <div className="text-center pb-6 pt-8 px-8">
          <div className="w-20 h-20 bg-gradient-to-br from-[#26847F] to-teal-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl">
            <Sparkles className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-3">
            {t('checkout.completePayment')}
          </h2>
          <p className="text-gray-600 text-base">
            {selectedPlan === 'base' && t('checkout.planBase')}
            {selectedPlan === 'pro' && t('checkout.planPro')}
            {selectedPlan === 'premium' && t('checkout.planPremium')}
          </p>
          
          {affiliateDiscount && (
            <div className="mt-4 p-4 bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200 rounded-xl">
              <div className="flex items-center justify-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-600" />
                <span className="font-bold text-purple-700">
                  {t('checkout.affiliateDiscount').replace('{percent}', affiliateDiscount.value)}
                </span>
              </div>
            </div>
          )}

          {appliedCoupon && !affiliateDiscount && (
            <div className="mt-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl">
              <div className="flex items-center justify-center gap-2">
                <Tag className="w-5 h-5 text-green-600" />
                <span className="font-bold text-green-700">
                  {t('checkout.discountApplied').replace('{percent}', appliedCoupon.discount_value).replace('{code}', appliedCoupon.code)}
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
        </div>

        <div className="px-4 sm:px-8 pb-8 space-y-6">
          <div className="bg-[#e9f6f5] rounded-xl p-5 border border-[#26847F]/20">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-[#26847F] flex-shrink-0" />
                <span className="text-sm text-gray-800 font-medium">Piano nutrizionale personalizzato completo</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-[#26847F] flex-shrink-0" />
                <span className="text-sm text-gray-800 font-medium">Ricette con foto AI e istruzioni dettagliate</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-[#26847F] flex-shrink-0" />
                <span className="text-sm text-gray-800 font-medium">Dashboard scientifica con BMR e massa grassa</span>
              </div>
              {(selectedPlan === 'pro' || selectedPlan === 'premium') && (
                <>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-[#26847F] flex-shrink-0" />
                    <span className="text-sm text-gray-800 font-medium">Piano allenamento adattivo</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-[#26847F] flex-shrink-0" />
                    <span className="text-sm text-gray-800 font-medium">Analisi AI dei pasti con foto</span>
                  </div>
                </>
              )}
              {selectedPlan === 'premium' && (
                <>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-[#26847F] flex-shrink-0" />
                    <span className="text-sm text-gray-800 font-medium">Generazioni illimitate piani</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-[#26847F] flex-shrink-0" />
                    <span className="text-sm text-gray-800 font-medium">Supporto prioritario</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Rest of the form - IDENTICAL to UpgradeCheckoutModal */}
          {/* Billing fields */}
          <div className="space-y-4 pt-4 border-t border-gray-200/50">
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-[#26847F]"/>
              <h3 className="text-xl font-bold text-gray-800">{t('checkout.personalInfo')}</h3>
            </div>
            <div>
              <Label htmlFor="billingName" className="text-sm font-semibold text-gray-700 mb-2 block">
                {t('checkout.fullName')}
              </Label>
              <Input
                id="billingName" name="name" type="text" placeholder={t('checkout.fullNamePlaceholder')}
                value={billingInfo.name} onChange={handleBillingInfoChange}
                className="h-12 text-base bg-white"
                autoComplete="name"
              />
            </div>
            <div>
              <Label htmlFor="email" className="text-sm font-semibold text-gray-700 mb-2 block">
                {t('checkout.email')}
              </Label>
              <Input
                id="email" name="email" type="email"
                value={billingInfo.email}
                readOnly
                disabled
                className="h-12 text-base bg-gray-100 text-gray-600 cursor-not-allowed"
              />
            </div>
            <div>
              <Label htmlFor="phoneNumber" className="text-sm font-semibold text-gray-700 mb-2 block">
                {t('checkout.phoneNumber')}
              </Label>
              <div className="flex items-center gap-2">
                <Popover open={popoverOpen} onOpenChange={setPopoverOpen} modal={true}>
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
                  <PopoverContent className="w-[300px] p-0 z-[400]">
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
                  id="phoneNumber" name="tel-national" type="tel" placeholder={t('checkout.phonePlaceholder')}
                  value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)}
                  className="h-12 text-base bg-white"
                  autoComplete="tel-national"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="address" className="text-sm font-semibold text-gray-700 mb-2 block">{t('checkout.billingAddress')}</Label>
              <Input id="address" name="address" type="text" placeholder={t('checkout.addressPlaceholder')}
                value={billingInfo.address} onChange={handleBillingInfoChange}
                className="h-12 text-base bg-white" autoComplete="address-line1"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="city" className="text-sm font-semibold text-gray-700 mb-2 block">{t('checkout.city')}</Label>
                <Input id="city" name="city" type="text" placeholder={t('checkout.cityPlaceholder')}
                  value={billingInfo.city} onChange={handleBillingInfoChange}
                  className="h-12 text-base bg-white" autoComplete="address-level2" />
              </div>
              <div>
                <Label htmlFor="zip" className="text-sm font-semibold text-gray-700 mb-2 block">{t('checkout.zip')}</Label>
                <Input id="zip" name="zip" type="text" placeholder={t('checkout.zipPlaceholder')}
                  value={billingInfo.zip} onChange={handleBillingInfoChange}
                  className="h-12 text-base bg-white" autoComplete="postal-code" />
              </div>
            </div>
            <div>
              <Label htmlFor="country" className="text-sm font-semibold text-gray-700 mb-2 block">{t('checkout.country')}</Label>
              <Popover open={countryPopoverOpen} onOpenChange={setCountryPopoverOpen} modal={true}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={countryPopoverOpen}
                    className="w-full justify-between h-12 text-base font-normal bg-white"
                  >
                    {billingInfo.country
                      ? countries.find((country) => country.code === billingInfo.country)?.name
                      : t('checkout.selectCountry')}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0 z-[400]">
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
                className="flex items-center gap-3 cursor-pointer text-sm font-semibold text-gray-600 hover:text-[#26847F] transition-colors"
                onClick={() => setShowBillingFields(!showBillingFields)}
              >
                <Briefcase className="w-5 h-5" />
                <span>{showBillingFields ? t('checkout.hideFiscalData') : t('checkout.needInvoice')}</span>
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
                      <Label htmlFor="r-private">{t('checkout.private')}</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="company" id="r-company" />
                      <Label htmlFor="r-company">{t('checkout.company')}</Label>
                    </div>
                  </RadioGroup>

                  {billingInfo.billingType === 'company' && (
                    <div>
                      <Label htmlFor="companyName" className="text-sm font-semibold text-gray-700 mb-2 block">
                        {t('checkout.companyName')}
                      </Label>
                      <Input
                        id="companyName" name="companyName" type="text" placeholder={t('checkout.companyNamePlaceholder')}
                        value={billingInfo.companyName} onChange={handleBillingInfoChange}
                        className="h-12 text-base bg-white"
                      />
                    </div>
                  )}

                  <div>
                    <Label htmlFor="taxId" className="text-sm font-semibold text-gray-700 mb-2 block">
                      {billingInfo.billingType === 'private' ? t('checkout.fiscalCode') : t('checkout.vatNumber')}
                    </Label>
                    <Input
                      id="taxId" name="taxId" type="text"
                      placeholder={billingInfo.billingType === 'private' ? t('checkout.fiscalCodePlaceholder') : t('checkout.vatNumberPlaceholder')}
                      value={billingInfo.taxId} onChange={handleBillingInfoChange}
                      className="h-12 text-base bg-white"
                    />
                  </div>

                  {billingInfo.billingType === 'company' && (
                    <div>
                      <Label htmlFor="pecSdi" className="text-sm font-semibold text-gray-700 mb-2 block">
                        {t('checkout.pecSdi')} <span className="text-gray-400 font-normal">{t('checkout.optional')}</span>
                      </Label>
                      <Input
                        id="pecSdi" name="pecSdi" type="text" placeholder={t('checkout.pecSdiPlaceholder')}
                        value={billingInfo.pecSdi} onChange={handleBillingInfoChange}
                        className="h-12 text-base bg-white"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Payment methods */}
          <div className="space-y-4 pt-4 border-t border-gray-200/50">
            <div className="flex items-center gap-3 mb-4">
              <CreditCard className="w-5 h-5 text-[#26847F]"/>
              <h3 className="text-xl font-bold text-gray-800">{t('checkout.paymentMethod')}</h3>
            </div>
            
            <div className="space-y-3">
              <button
                onClick={async () => {
                  setPaymentMethod('card');
                  if (!paymentInfoTracked && user) {
                    try {
                      await base44.functions.invoke('sendTikTokEvent', {
                        event: 'AddPaymentInfo',
                        email: user.email,
                        phone: user.phone_number,
                        external_id: user.id,
                        user_agent: navigator.userAgent,
                        value: selectedPlan === 'base' ? 19 : selectedPlan === 'pro' ? 29 : 39,
                        currency: 'EUR',
                        content_id: selectedPlan,
                        url: window.location.href
                      });
                      setPaymentInfoTracked(true);
                      console.log('✅ TikTok AddPaymentInfo tracked');
                    } catch (e) {
                      console.warn('⚠️ TikTok tracking error:', e);
                    }
                  }
                }}
                className={`w-full p-5 rounded-xl border-2 transition-all flex items-center gap-4 ${
                  paymentMethod === 'card'
                    ? 'border-[#26847F] bg-[#e9f6f5]'
                    : 'border-gray-200 bg-white hover:border-[#26847F]'
                }`}
              >
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                  paymentMethod === 'card' ? 'bg-white' : 'bg-gray-50'
                }`}>
                  <CreditCard className={`w-6 h-6 ${paymentMethod === 'card' ? 'text-[#26847F]' : 'text-gray-400'}`} />
                </div>
                <p className="text-base font-semibold text-gray-800">{t('checkout.cardCredit')}</p>
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
                      ? 'border-[#26847F] bg-[#e9f6f5]'
                      : 'border-gray-200 bg-white hover:border-[#26847F]'
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
                    <p className="text-base font-semibold text-gray-800">{t('checkout.applePay')}</p>
                    <p className="text-xs text-gray-500">{t('checkout.applePayDesc')}</p>
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
                      ? 'border-[#26847F] bg-[#e9f6f5]'
                      : 'border-gray-200 bg-white hover:border-[#26847F]'
                  }`}
                >
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                    paymentMethod === 'google_pay' ? 'bg-white' : 'bg-gray-50'
                  }`}>
                    <svg className={`w-8 h-8 ${paymentMethod === 'google_pay' ? 'text-[#26847F]' : 'text-gray-400'}`} fill="currentColor" viewBox="0 0 512 512">
                      <path d="M473.16 221.48l-2.26-9.59H262.46v88.22H387c-12.93 61.4-72.93 93.72-121.94 93.72-35.66 0-73.25-15-98.13-39.11a140.08 140.08 0 01-41.8-98.88c0-37.16 16.7-74.33 41-98.78s61-38.13 97.49-38.13c41.79 0 71.74 22.19 82.94 32.31l62.69-62.36C390.86 72.72 340.34 32 261.6 32c-60.75 0-119 23.27-161.58 65.71C58 139.5 36.25 199.93 36.25 256s20.58 113.48 61.3 155.6c43.51 44.92 105.13 68.4 168.58 68.4 57.73 0 112.45-22.62 151.45-63.66 38.34-40.4 58.17-96.3 58.17-154.9 0-24.67-2.48-39.32-2.59-39.96z"/>
                    </svg>
                  </div>
                  <div className="text-left">
                    <p className="text-base font-semibold text-gray-800">{t('checkout.googlePay')}</p>
                    <p className="text-xs text-gray-500">{t('checkout.googlePayDesc')}</p>
                  </div>
                </button>
              )}
            </div>
          </div>

          {paymentMethod === 'card' && stripe && (
            <div className="space-y-4 pt-4">
              <div>
                <Label htmlFor="card-element" className="text-sm font-semibold text-gray-700 mb-3 block">
                  {t('checkout.enterCardDetails')}
                </Label>
                <div 
                  id="card-element-container"
                  ref={cardElementRef}
                  style={{ minHeight: '52px' }}
                />
                <p className="text-xs text-gray-500 mt-3 flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5" />
                  {t('checkout.securePayment')}
                </p>
              </div>
            </div>
          )}
          
          {paymentMethod === 'card' && !stripe && (
            <div className="space-y-4 pt-4">
              <div className="flex items-center justify-center p-6 bg-gray-50 rounded-xl">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#26847F] mr-3"></div>
                <span className="text-gray-600">{t('checkout.loadingPayment')}</span>
              </div>
            </div>
          )}

          {(paymentMethod === 'apple_pay' || paymentMethod === 'google_pay') && (
            <div className="p-6 bg-gradient-to-br from-[#e9f6f5] to-teal-50 rounded-xl border border-[#26847F]/20">
              <div className="flex items-center gap-3 mb-2">
                <CheckCircle className="w-5 h-5 text-[#26847F]" />
                <p className="font-semibold text-gray-900">{t('checkout.fastSecureMethod')}</p>
              </div>
              <p className="text-sm text-gray-700">
                {t('checkout.walletOpens').replace('{wallet}', paymentMethod === 'apple_pay' ? 'Apple Pay' : 'Google Pay')}
              </p>
            </div>
          )}

          {paymentMethod && (
            <>
              <div className="space-y-6 pt-6 border-t border-gray-200/50">
                <div className="space-y-2">
                  <Label htmlFor="couponCode" className="text-sm font-semibold text-gray-700">
                    {t('checkout.couponCode')}
                  </Label>
                  <div className="relative">
                    <Input id="couponCode" type="text" placeholder={t('checkout.couponPlaceholder')} value={couponCode}
                      onChange={(e) => { setCouponCode(e.target.value); setDiscountError(''); }} className="h-12 text-base pr-28 bg-white" />
                    <Button type="button" onClick={handleApplyDiscount} disabled={isApplyingCoupon || !couponCode.trim()}
                      className={cn("absolute right-2 top-1/2 -translate-y-1/2 h-9", couponCode.trim() ? "bg-[#26847F] text-white hover:bg-[#1f6b66]" : "bg-gray-200 text-gray-700 cursor-not-allowed")}>
                        {isApplyingCoupon ? t('checkout.applyingCoupon') : t('checkout.applyCoupon')}
                    </Button>
                  </div>
                  {discountError && <p className="text-red-500 text-sm mt-1">{discountError}</p>}
                </div>
                
                <div className="space-y-3 pt-4">
                  <div className="flex items-start space-x-3">
                    <Checkbox id="terms" checked={termsAccepted} onCheckedChange={setTermsAccepted} />
                    <Label htmlFor="terms" className="text-xs text-gray-600" dangerouslySetInnerHTML={{
                      __html: t('checkout.termsAccept').replace('{link}', `<a href="${createPageUrl('Terms')}" target="_blank" class="underline hover:text-[#26847F]">${t('checkout.termsLink')}</a>`)
                    }} />
                  </div>
                  <div className="flex items-start space-x-3">
                    <Checkbox id="privacy" checked={privacyAccepted} onCheckedChange={setPrivacyAccepted} />
                    <Label htmlFor="privacy" className="text-xs text-gray-600" dangerouslySetInnerHTML={{
                      __html: t('checkout.privacyAccept').replace('{link}', `<a href="${createPageUrl('Privacy')}" target="_blank" class="underline hover:text-[#26847F]">${t('checkout.privacyLink')}</a>`)
                    }} />
                  </div>
                  <div className="flex items-start space-x-3">
                    <Checkbox id="marketing" checked={marketingConsent} onCheckedChange={setMarketingConsent} />
                    <Label htmlFor="marketing" className="text-xs text-gray-600">
                      {t('checkout.marketingConsent')}
                    </Label>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-center gap-2 text-xs sm:text-sm text-gray-500 pt-2">
                <Shield className="w-4 h-4 flex-shrink-0" />
                <span className="text-center">{t('checkout.encryptedPayment')}</span>
              </div>

              <div className="bg-gray-50/50 rounded-xl p-4 space-y-2">
                {activeDiscount && (
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>{t('checkout.originalPrice')}</span>
                    <span className="line-through">€{selectedBillingPeriod === 'monthly' ? monthlyPrice.toFixed(2) : yearlyPrice.toFixed(2)}</span>
                  </div>
                )}
                {activeDiscount && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>{t('checkout.discount').replace('{percent}', activeDiscount.value)}</span>
                    <span>-€{(selectedBillingPeriod === 'monthly' ? (monthlyPrice - discountedMonthlyPrice) : (yearlyPrice - discountedYearlyPrice)).toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm sm:text-base text-gray-700 font-semibold pt-2 border-t border-gray-200">
                  <span>{t('checkout.paymentToday')}</span>
                  <span>€{finalPrice.toFixed(2)}</span>
                </div>
                <p className="text-xs text-gray-500 text-center pt-2">
                  {t('checkout.planLabel')
                    .replace('{plan}', selectedPlan.charAt(0).toUpperCase() + selectedPlan.slice(1))
                    .replace('{billing}', selectedBillingPeriod === 'monthly' ? t('checkout.planMonthly') : t('checkout.planYearly'))
                  }
                </p>
              </div>

              <Button
                onClick={handleCompleteSetup}
                disabled={isCtaDisabled}
                className="w-full h-14 text-base sm:text-lg font-bold bg-gradient-to-r from-[#26847F] to-teal-500 hover:from-[#1f6b66] hover:to-teal-600 text-white rounded-xl shadow-xl hover:shadow-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    {t('checkout.activating')}
                  </div>
                ) : (
                  t('checkout.payNow').replace('{amount}', finalPrice.toFixed(2))
                )}
              </Button>

              <p className="text-xs text-center text-gray-500 mt-4 px-2">
                {t('checkout.chargeNote')
                  .replace('{amount}', finalPrice.toFixed(2))
                  .replace('{discountNote}', activeDiscount && selectedBillingPeriod === 'monthly' ? t('checkout.fullPriceFromSecond') : '')
                }
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}