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

  // ... rest of code continues with Payment Request useEffect, scroll useEffect, and all handler functions ...