import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Check, Sparkles, Crown, Target, Zap, CheckCircle, Menu, X, ChevronDown, Star, Shield, Clock, Award, TrendingUp, Tag, Gift, Globe } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useLanguage, SUPPORTED_LANGUAGES } from '@/components/i18n/LanguageContext';
import { translations } from '@/components/i18n/translations';

// Map language code to pricing page name (for createPageUrl)
const getPricingPageName = (langCode) => {
  const langPricingPages = {
    'en': 'pricing',
    'it': 'itpricing',
    'es': 'espricing',
    'pt': 'ptpricing',
    'de': 'depricing',
    'fr': 'frpricing'
  };
  return langPricingPages[langCode] || 'pricing';
};

const getHomePageUrl = (langCode) => {
  const langHomePages = {
    'en': '/',
    'it': '/ItHome',
    'es': '/EsHome',
    'pt': '/PtHome',
    'de': '/DeHome',
    'fr': '/FrHome'
  };
  return langHomePages[langCode] || '/';
};

const getQuizPageName = (langCode) => {
  const langQuizPages = {
    'en': 'enquiz',
    'it': 'itquiz',
    'es': 'esquiz',
    'pt': 'ptquiz',
    'de': 'dequiz',
    'fr': 'frquiz'
  };
  return langQuizPages[langCode] || 'quiz';
};

const getBlogPageName = (langCode) => {
  const langBlogPages = {
    'en': 'Blog',
    'it': 'itblog',
    'es': 'esblog',
    'pt': 'ptblog',
    'de': 'deblog',
    'fr': 'frblog'
  };
  return langBlogPages[langCode] || 'Blog';
};

export default function PricingPageContent() {
  const navigate = useNavigate();
  const { t, language, setLanguage } = useLanguage();
  const [isAnnual, setIsAnnual] = React.useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [openFaqIndex, setOpenFaqIndex] = React.useState(null);
  const [langMenuOpen, setLangMenuOpen] = React.useState(false);
  const [mobileLangMenuOpen, setMobileLangMenuOpen] = React.useState(false);
  
  const [couponCode, setCouponCode] = React.useState('');
  const [couponValidating, setCouponValidating] = React.useState(false);
  const [couponValid, setCouponValid] = React.useState(null);
  const [couponData, setCouponData] = React.useState(null);
  const [userEmail, setUserEmail] = React.useState(null);
  const [pricingTracked, setPricingTracked] = React.useState(false);
  const [selectedPlan, setSelectedPlan] = React.useState(null);
  const [user, setUser] = React.useState(null);

  React.useEffect(() => {
    window.scrollTo(0, 0);
    
    const urlParams = new URLSearchParams(window.location.search);
    const couponParam = urlParams.get('coupon');
    if (couponParam) {
      setCouponCode(couponParam);
    }
    
    const loadUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
        setUserEmail(currentUser.email);
        
        if (couponParam && currentUser.email) {
          validateCoupon(couponParam, currentUser.email);
        }
      } catch (error) {
        // User not logged in
      }
    };
    loadUser();
  }, []);

  React.useEffect(() => {
    if (!pricingTracked) {
      const trackPricingVisit = async () => {
        try {
          let userIdentifier = 'anonymous';
          let userObj = null;
          try {
            const currentUser = await base44.auth.me();
            userIdentifier = currentUser.email;
            userObj = currentUser;
          } catch (error) {
            // Not logged in
          }
          
          await base44.entities.UserActivity.create({
            user_id: userIdentifier,
            event_type: 'pricing_visited',
            event_data: {}
          });

          // 📊 TikTok Event: ViewContent (pricing page)
          try {
            const urlParams = new URLSearchParams(window.location.search);
            const ttclid = urlParams.get('ttclid');
            const ttp = urlParams.get('ttp');

            await base44.functions.invoke('sendTikTokEvent', {
              event: 'ViewContent',
              email: userObj?.email,
              phone: userObj?.phone_number,
              external_id: userObj?.id,
              user_agent: navigator.userAgent,
              content_id: 'pricing_page',
              content_type: 'page',
              content_name: 'Pricing Page',
              url: window.location.href,
              ttclid: ttclid,
              ttp: ttp
            });
            console.log('✅ TikTok ViewContent tracked (pricing)');
          } catch (e) {
            console.warn('⚠️ TikTok tracking error:', e);
          }

          setPricingTracked(true);
        } catch (error) {
          console.error('Error tracking pricing visit:', error);
        }
      };
      
      trackPricingVisit();
    }
  }, [pricingTracked]);

  const validateCoupon = async (code, email) => {
    if (!code || !email) return;

    setCouponValidating(true);
    setCouponValid(null);
    setCouponData(null);

    try {
      const response = await base44.functions.invoke('validatePersonalCoupon', {
        couponCode: code,
        userEmail: email
      });

      if (response.valid) {
        setCouponValid(true);
        setCouponData({
          discount_value: response.discount_value,
          discount_type: response.discount_type
        });
      } else {
        setCouponValid(false);
        setCouponData({ error: response.error || 'Codice sconto non valido o già utilizzato.' });
      }
    } catch (error) {
      console.error('Error validating coupon:', error);
      setCouponValid(false);
      setCouponData({ error: 'Errore di validazione. Riprova più tardi.' });
    } finally {
      setCouponValidating(false);
    }
  };

  const handleApplyCoupon = async () => {
    if (!userEmail) {
      alert('Devi effettuare il login o creare un account per applicare un coupon. Se sei già registrato, effettua il login.');
      return;
    }
    validateCoupon(couponCode, userEmail);
  };

  const plans = [
    {
      id: 'monthly',
      name: 'MyWellness',
      priceMonthly: 9.99,
      priceAnnual: 9.99,
      stripePriceIdMonthly: "price_1SuOAq2OXBs6ZYwlxkJ6LnU6",
      stripePriceIdAnnual: "price_1SuOAq2OXBs6ZYwlxkJ6LnU6",
      icon: Zap,
      iconColor: "text-[var(--brand-primary)]",
      iconBg: "bg-[var(--brand-primary-light)]",
      description: 'Piano completo mensile con tutte le funzionalità',
      features: [
        'Piani nutrizionali e allenamento AI',
        'Body Scan con analisi composizione corporea',
        'Analisi AI pasti con foto',
        'Ribilanciamento automatico calorie',
        'Scansione etichette con Health Score',
        'Lista della spesa intelligente',
        'Sincronizzazione smartwatch',
        'Supporto prioritario'
      ],
      cta: t('pricing.startFree'),
      popular: false
    },
    {
      id: 'yearly',
      name: 'MyWellness Annual',
      priceMonthly: 4.16,
      priceAnnual: 49.99,
      stripePriceIdMonthly: "price_1SuOAr2OXBs6ZYwlteMU5EVp",
      stripePriceIdAnnual: "price_1SuOAr2OXBs6ZYwlteMU5EVp",
      icon: Crown,
      iconColor: "text-purple-600",
      iconBg: "bg-purple-100",
      description: 'Piano completo annuale - Risparmia €69.89/anno',
      features: [
        'Piani nutrizionali e allenamento AI',
        'Body Scan con analisi composizione corporea',
        'Analisi AI pasti con foto',
        'Ribilanciamento automatico calorie',
        'Scansione etichette con Health Score',
        'Lista della spesa intelligente',
        'Sincronizzazione smartwatch',
        'Supporto prioritario'
      ],
      cta: t('pricing.startFree'),
      popular: true
    }
  ];

  const faqs = [
    {
      question: t('pricing.faq1Question'),
      answer: t('pricing.faq1Answer')
    },
    {
      question: t('pricing.faq2Question'),
      answer: t('pricing.faq2Answer')
    },
    {
      question: t('pricing.faq3Question'),
      answer: t('pricing.faq3Answer')
    },
    {
      question: t('pricing.faq4Question'),
      answer: t('pricing.faq4Answer')
    },
    {
      question: t('pricing.faq5Question'),
      answer: t('pricing.faq5Answer')
    },
    {
      question: t('pricing.faq6Question'),
      answer: t('pricing.faq6Answer')
    },
    {
      question: t('pricing.faq7Question'),
      answer: t('pricing.faq7Answer')
    },
    {
      question: t('pricing.faq8Question'),
      answer: t('pricing.faq8Answer')
    }
  ];

  const testimonials = translations[language].pricing.testimonials;

  const handleSelectPlan = async (planId) => {
    let planType = 'monthly';
    if (planId.toLowerCase().includes('yearly')) {
      planType = 'yearly';
    }

    setSelectedPlan(planId);

    // 📊 TikTok Event: AddToCart (plan selection)
    try {
      let userObj = null;
      try {
        userObj = await base44.auth.me();
      } catch (e) {
        // Not logged in
      }

      const urlParams = new URLSearchParams(window.location.search);
      const ttclid = urlParams.get('ttclid');
      const ttp = urlParams.get('ttp');

      const planPrices = { monthly: 9.99, yearly: 49.99 };
      const price = planPrices[planType] || 9.99;

      await base44.functions.invoke('sendTikTokEvent', {
        event: 'AddToCart',
        email: userObj?.email,
        phone: userObj?.phone_number,
        external_id: userObj?.id,
        user_agent: navigator.userAgent,
        value: price,
        currency: 'EUR',
        content_id: planType,
        content_type: 'subscription',
        content_name: `MyWellness ${planType}`,
        url: window.location.href,
        ttclid: ttclid,
        ttp: ttp
      });
      console.log('✅ TikTok AddToCart tracked');
    } catch (e) {
      console.warn('⚠️ TikTok tracking error:', e);
    } 

    try {
      const currentUser = await base44.auth.me();
      
      if (currentUser.subscription_status === 'trial' || 
          currentUser.subscription_status === 'active') {
        navigate(createPageUrl('Dashboard'));
      } else {
        const billingParam = isAnnual ? '&billing=yearly' : '&billing=monthly';
        const couponParam = couponValid && couponCode ? `&coupon=${couponCode}` : '';
        navigate(createPageUrl('Checkout') + `?plan=${planType}${billingParam}${couponParam}`);
      }
    } catch (error) {
      const billingParam = isAnnual ? '&billing=yearly' : '&billing=monthly';
      const couponParam = couponValid && couponCode ? `&coupon=${couponCode}` : '';
      const checkoutUrl = window.location.origin + createPageUrl('Checkout') + `?plan=${planType}${billingParam}${couponParam}`;
      await base44.auth.redirectToLogin(checkoutUrl);
    }
  };

  const handleLogin = async () => {
    const dashboardUrl = window.location.origin + createPageUrl('Dashboard');
    await base44.auth.redirectToLogin(dashboardUrl);
  };

  const handleLanguageChange = (newLang) => {
    // Navigate to the correct pricing page for the new language FIRST
    const targetPage = getPricingPageName(newLang);
    setLangMenuOpen(false);
    setMobileLangMenuOpen(false);
    // Use window.location for a full page navigation to ensure language context updates
    window.location.href = createPageUrl(targetPage);
  };

  const getPrice = (plan) => {
    let basePrice = isAnnual ? plan.priceAnnual : plan.priceMonthly;
    if (couponValid && couponData && couponData.discount_value) {
      const discount = (basePrice * couponData.discount_value) / 100;
      return (basePrice - discount).toFixed(2);
    }
    const formattedPrice = basePrice.toFixed(2);
    return formattedPrice.endsWith('.00') ? formattedPrice.slice(0, -3) : formattedPrice;
  };

  const getSavings = (plan) => {
    const monthlyCost = plan.priceMonthly;
    const annualMonthlyCost = plan.priceAnnual;
    return (monthlyCost - annualMonthlyCost).toFixed(1);
  };

  const getOriginalPrice = (plan) => {
    return (isAnnual ? plan.priceAnnual : plan.priceMonthly).toFixed(2);
  };

  return (
    <div className="min-h-screen animated-gradient-bg overflow-x-hidden">
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
          0% {
            background-position: 0% 50%, 100% 20%, 0% 80%, 80% 60%, 30% 40%, 100% 90%;
          }
          33% {
            background-position: 100% 30%, 0% 70%, 100% 40%, 20% 80%, 70% 20%, 0% 60%;
          }
          66% {
            background-position: 0% 70%, 100% 40%, 0% 20%, 80% 30%, 40% 90%, 100% 50%;
          }
          100% {
            background-position: 0% 50%, 100% 20%, 0% 80%, 80% 60%, 30% 40%, 100% 90%;
          }
        }
        
        @keyframes textGradientFlow {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
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
        
        .animated-text-gradient {
          background: linear-gradient(90deg, var(--brand-primary), #14b8a6, #10b981, #14b8a6, var(--brand-primary));
          background-size: 200% auto;
          background-clip: text;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: textGradientFlow 4s ease-in-out infinite;
        }

        .water-glass-effect {
          backdrop-filter: blur(12px) saturate(180%);
          background: linear-gradient(135deg, 
            rgba(249, 250, 251, 0.75) 0%,
            rgba(243, 244, 246, 0.65) 50%,
            rgba(249, 250, 241, 0.75) 100%
          );
          box-shadow: 
            0 8px 32px 0 rgba(31, 38, 135, 0.08),
            inset 0 1px 1px 0 rgba(255, 255, 255, 0.9),
            inset 0 -1px 1px 0 rgba(0, 0, 0, 0.05);
        }

        .burger-line {
          display: block;
          width: 24px;
          height: 2px;
          background-color: #4b5563;
          transition: all 0.3s ease;
          position: absolute;
          left: 0;
        }

        .burger-container {
          position: relative;
          width: 24px;
          height: 10px;
        }

        .burger-line:first-child {
          top: 0;
        }

        .burger-line:last-child {
          bottom: 0;
        }

        .burger-open .burger-line:first-child {
          top: 4px;
          transform: rotate(45deg);
        }

        .burger-open .burger-line:last-child {
          bottom: 4px;
          transform: rotate(-45deg);
        }

        .mobile-menu {
          max-height: 0;
          overflow: hidden;
          transition: max-height 0.4s ease-out;
        }

        .mobile-menu.open {
          max-height: 400px;
        }
        
        .pricing-card-liquid {
          position: relative;
          backdrop-filter: blur(20px) saturate(180%);
          background: linear-gradient(135deg, 
            rgba(255, 255, 255, 0.7) 0%,
            rgba(255, 255, 255, 0.5) 50%,
            rgba(255, 255, 255, 0.65) 100%
          );
          box-shadow: 
            0 8px 32px 0 rgba(31, 38, 135, 0.08),
            inset 0 1px 1px 0 rgba(255, 255, 255, 0.9),
            inset 0 -1px 1px 0 rgba(0, 0, 0, 0.05);
          border: 2px solid rgba(255, 255, 255, 0.5);
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .pricing-card-liquid:hover {
          transform: translateY(-12px) scale(1.02);
          box-shadow: 
            0 30px 80px -10px rgba(0, 0, 0, 0.18),
            0 15px 40px -10px rgba(0, 0, 0, 0.12),
            inset 0 1px 3px 0 rgba(255, 255, 255, 1),
            inset 0 -1px 6px 0 rgba(0, 0, 0, 0.05);
        }
        
        .pricing-card-liquid::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          border-radius: 1.5rem;
          padding: 2px;
          background: linear-gradient(135deg, 
            rgba(38, 132, 127, 0.3),
            rgba(38, 132, 127, 0.2),
            rgba(38, 132, 127, 0.2)
          );
          -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
          opacity: 0;
          transition: opacity 0.4s ease;
        }
        
        .pricing-card-liquid:hover::before {
          opacity: 1;
        }
        
        .pricing-card-popular {
          backdrop-filter: blur(20px) saturate(180%);
          background: linear-gradient(135deg,
            rgba(255, 255, 255, 0.7) 0%,
            rgba(255, 255, 255, 0.5) 50%,
            rgba(255, 255, 255, 0.65) 100%
          );
          border: 2px solid rgba(38, 132, 127, 0.4);
          box-shadow: 
            0 25px 70px -10px rgba(38, 132, 127, 0.25),
            0 12px 30px -5px rgba(38, 132, 127, 0.15),
            inset 0 1px 3px 0 rgba(255, 255, 255, 1),
            inset 0 -2px 6px 0 rgba(38, 132, 127, 0.1),
            0 0 0 1px rgba(38, 132, 127, 0.1);
        }
        
        .pricing-card-popular:hover {
          transform: translateY(-12px) scale(1.02);
          box-shadow: 
            0 35px 90px -10px rgba(38, 132, 127, 0.35),
            0 18px 45px -10px rgba(38, 132, 127, 0.25),
            inset 0 1px 4px 0 rgba(255, 255, 255, 1),
            inset 0 -2px 8px 0 rgba(38, 132, 127, 0.15),
            0 0 0 1px rgba(38, 132, 127, 0.2),
            0 0 60px rgba(38, 132, 127, 0.15);
        }
        
        .pricing-card-popular::after {
          content: '';
          position: absolute;
          top: -2px;
          left: -2px;
          right: -2px;
          bottom: -2px;
          background: linear-gradient(135deg, 
            rgba(38, 132, 127, 0.6),
            rgba(38, 132, 127, 0.4),
            rgba(38, 132, 127, 0.3)
          );
          border-radius: 1.5rem;
          z-index: -1;
          opacity: 0;
          filter: blur(20px);
          transition: opacity 0.4s ease;
        }
        
        .pricing-card-popular:hover::after {
          opacity: 0.6;
        }
        
        .icon-container {
          position: relative;
          transition: all 0.3s ease;
        }
        
        .pricing-card-liquid:hover .icon-container {
          transform: scale(1.1) rotate(5deg);
        }
        
        .popular-badge {
          background: linear-gradient(135deg, 
            rgba(38, 132, 127, 0.08),
            rgba(38, 132, 127, 0.06)
          );
          border: 1px solid rgba(38, 132, 127, 0.2);
          backdrop-filter: blur(10px);
        }
        
        .premium-badge {
          background: linear-gradient(135deg, 
            rgba(168, 85, 247, 0.08),
            rgba(129, 140, 248, 0.06)
          );
          border: 1px solid rgba(168, 85, 247, 0.2);
          backdrop-filter: blur(10px);
        }

        .price-display {
          background: linear-gradient(135deg,
            rgba(38, 132, 127, 0.05),
            rgba(38, 132, 127, 0.05)
          );
          border-radius: 1rem;
          padding: 1.25rem 1rem;
          margin: 1rem 0;
          border: 1px solid rgba(38, 132, 127, 0.1);
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        
        .pricing-card-popular {
          animation: float 6s ease-in-out infinite;
        }
        
        .pricing-card-popular:hover {
          animation: none;
        }
        
        .feature-item {
          transition: all 0.2s ease;
        }
        
        .feature-item:hover {
          transform: translateX(5px);
        }
        
        .cta-button {
          position: relative;
          overflow: hidden;
          transition: all 0.3s ease;
        }
        
        .cta-button::before {
          content: '';
          position: absolute;
          top: 50%;
          left: 50%;
          width: 0;
          height: 0;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.3);
          transform: translate(-50%, -50%);
          transition: width 0.6s ease, height 0.6s ease;
        }
        
        .cta-button:hover::before {
          width: 300px;
          height: 300px;
        }
      `}</style>

      {/* NAVBAR */}
      <nav className="fixed top-6 left-1/2 transform -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-sm md:w-auto md:max-w-none px-2 md:px-0">
        <div className="hidden md:flex water-glass-effect rounded-full items-center gap-8 px-6 py-[4px]">
          <img
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68d44c626cc2c19cca9c750d/c3567e77e_MyWellnesslogo.png"
            alt="MyWellness"
            className="h-5 flex-shrink-0 cursor-pointer"
            onClick={() => navigate(createPageUrl('Home'))}
          />

          <div className="flex items-center gap-4 flex-shrink-0">
            <button 
              onClick={() => navigate(createPageUrl(getPricingPageName(language)))}
              className="text-sm text-gray-600 hover:text-gray-900 transition-colors font-semibold whitespace-nowrap">
              {t('nav.pricing')}
            </button>
            <button 
              onClick={() => navigate(createPageUrl(getBlogPageName(language)))}
              className="text-sm text-gray-600 hover:text-gray-900 transition-colors font-semibold whitespace-nowrap">
              {t('nav.blog')}
            </button>
            
            <div className="relative">
              <button
                onClick={() => setLangMenuOpen(!langMenuOpen)}
                className="text-sm text-gray-600 hover:text-gray-900 hover:bg-white/50 h-auto py-2 px-3 font-semibold whitespace-nowrap rounded-full transition-colors flex items-center gap-2">
                <span className="text-lg">{SUPPORTED_LANGUAGES.find(l => l.code === language)?.flag}</span>
              </button>
              
              {langMenuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setLangMenuOpen(false)}></div>
                  <div className="absolute right-0 top-12 water-glass-effect rounded-2xl border border-white/40 shadow-xl p-2 min-w-[160px] z-50">
                    {SUPPORTED_LANGUAGES.map((lang) => (
                      <button
                        key={lang.code}
                        onClick={() => handleLanguageChange(lang.code)}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                          language === lang.code
                            ? 'bg-[var(--brand-primary)] text-white'
                            : 'text-gray-700 hover:bg-white/50'
                        }`}>
                        <span className="text-lg">{lang.flag}</span>
                        <span>{lang.name}</span>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
            
            {user ? (
              <button
                onClick={() => navigate(createPageUrl('Dashboard'))}
                className="text-sm text-[var(--brand-primary)] hover:text-[var(--brand-primary-hover)] hover:bg-white/50 h-auto py-2 px-3 font-semibold whitespace-nowrap rounded-full transition-colors">
                Dashboard
              </button>
            ) : (
              <button
                onClick={handleLogin}
                className="text-sm text-gray-600 hover:text-gray-900 hover:bg-white/50 h-auto py-2 px-3 font-semibold whitespace-nowrap rounded-full transition-colors">
                {t('nav.login')}
              </button>
            )}
            
            <button
              onClick={() => navigate(createPageUrl(getQuizPageName(language)))}
              className="bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] text-white py-2 px-4 text-sm font-medium rounded-full whitespace-nowrap flex-shrink-0 transition-colors">
              {t('pricing.freeQuiz')}
            </button>
          </div>
        </div>

        <div className={`md:hidden water-glass-effect px-6 py-[4px] transition-all duration-300 rounded-[30px]`}>
            <div className="flex items-center justify-between">
              <img
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68d44c626cc2c19cca9c750d/c3567e77e_MyWellnesslogo.png"
                alt="MyWellness"
                className="h-6 cursor-pointer"
                onClick={() => navigate(createPageUrl('Home'))}
              />
            
            <div className="flex items-center gap-2">
              {/* Language selector icon */}
              <div className="relative">
                <button
                  onClick={() => setMobileLangMenuOpen(!mobileLangMenuOpen)}
                  className="p-2 text-gray-600 hover:text-gray-900 transition-colors"
                  aria-label="Language">
                  <span className="text-xl">{SUPPORTED_LANGUAGES.find(l => l.code === language)?.flag}</span>
                </button>
                
                {mobileLangMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setMobileLangMenuOpen(false)}></div>
                    <div className="absolute right-0 top-12 water-glass-effect rounded-2xl border border-white/40 shadow-xl p-2 min-w-[160px] z-50">
                      {SUPPORTED_LANGUAGES.map((lang) => (
                        <button
                          key={lang.code}
                          onClick={() => {
                            handleLanguageChange(lang.code);
                            setMobileLangMenuOpen(false);
                          }}
                          className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                            language === lang.code
                              ? 'bg-[var(--brand-primary)] text-white'
                              : 'text-gray-700 hover:bg-white/50'
                          }`}>
                          <span className="text-lg">{lang.flag}</span>
                          <span>{lang.name}</span>
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
              
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className={`p-2 ${mobileMenuOpen ? 'burger-open' : ''}`}
                aria-label="Menu">
                <div className="burger-container">
                  <span className="burger-line"></span>
                  <span className="burger-line"></span>
                </div>
              </button>
            </div>
          </div>

          <div className={`mobile-menu ${mobileMenuOpen ? 'open' : ''}`}>
            <div className="pt-4 pb-2 space-y-3">
              <button
                onClick={() => {
                  navigate(createPageUrl(getPricingPageName(language)));
                  setMobileMenuOpen(false);
                }}
                className="block w-full text-left text-base text-gray-700 hover:text-gray-900 font-semibold py-2">
                {t('nav.pricing')}
              </button>
              <button
                onClick={() => {
                  navigate(createPageUrl(getBlogPageName(language)));
                  setMobileMenuOpen(false);
                }}
                className="block w-full text-left text-base text-gray-700 hover:text-gray-900 font-semibold py-2">
                {t('nav.blog')}
              </button>
              
              <div className="border-t border-gray-200/50 pt-3 mt-3">
                {user ? (
                  <button
                    onClick={() => {
                      navigate(createPageUrl('Dashboard'));
                      setMobileMenuOpen(false);
                    }}
                    className="w-full bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] text-white text-base font-medium rounded-full py-2">
                    Dashboard
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => {
                        handleLogin();
                        setMobileMenuOpen(false);
                      }}
                      className="block w-full text-left text-base text-gray-700 hover:text-gray-900 font-semibold py-2">
                      {t('nav.login')}
                    </button>
                    <button
                  onClick={() => {
                    navigate(createPageUrl(getQuizPageName(language)));
                    setMobileMenuOpen(false);
                  }}
                  className="w-full bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] text-white text-base font-medium rounded-full py-2 mt-2">
                  {t('pricing.freeQuiz')}
                </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <section className="pt-40 pb-12 px-4 md:px-6">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold text-gray-900 mb-6 tracking-tight px-2">
              {t('pricing.title')} <span className="animated-text-gradient">{t('pricing.titleHighlight')}</span>
            </h1>
            <p className="text-base md:text-xl text-gray-600 max-w-2xl mx-auto mb-8 px-2">
              {t('pricing.subtitle')}
            </p>


          </div>

          {/* Pricing Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 mb-16 max-w-5xl mx-auto">
            {plans.map((plan, index) => (
              <Card 
                key={plan.id}
                className={`water-glass-effect border-2 transition-all duration-300 hover:shadow-2xl h-full flex flex-col ${plan.popular ? 'border-[var(--brand-primary)] scale-100 md:scale-105' : 'border-white/40'} ${selectedPlan === plan.id ? 'ring-4 ring-[var(--brand-primary)]/30' : ''} ${plan.id === 'yearly' ? 'relative' : ''}`}
              >
                {plan.id === 'yearly' && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
                    <div className="bg-black text-white text-center px-4 py-1.5 rounded-full text-[10px] font-bold tracking-wider uppercase whitespace-nowrap shadow-lg">
                      3 GIORNI TRIAL GRATIS
                    </div>
                  </div>
                )}

                {plan.popular && plan.id !== 'yearly' && (
                  <div className="popular-badge text-[var(--brand-primary)] text-center py-2.5 text-xs font-semibold tracking-widest uppercase">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-[var(--brand-primary)] animate-pulse"></div>
                      {t('pricing.mostChosen')}
                      <div className="w-1.5 h-1.5 rounded-full bg-[var(--brand-primary)] animate-pulse"></div>
                    </div>
                  </div>
                )}

                {plan.id === "premium" && (
                  <div className="premium-badge text-purple-600 text-center py-2.5 text-xs font-semibold tracking-widest uppercase">
                    <div className="flex items-center justify-center gap-2">
                      <Crown className="w-3 h-3" />
                      {t('pricing.exclusivePlan')}
                    </div>
                  </div>
                )}

                <CardHeader className="text-center pb-6 pt-8 px-6">
                  <div className={`icon-container w-16 h-16 ${plan.iconBg} rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg`}>
                    <plan.icon className={`w-8 h-8 ${plan.iconColor}`} />
                  </div>
                  
                  <h3 className="text-2xl font-black text-gray-900 mb-3 tracking-tight min-h-[32px]">{plan.name}</h3>
                  <p className="text-gray-600 text-sm mb-6 leading-relaxed min-h-[40px]">{plan.description}</p>
                  
                  <div className="price-display min-h-[120px] flex flex-col justify-center">
                    <div className="mb-2">
                      {plan.isFree ? (
                        <>
                          <span className="text-4xl font-black bg-gradient-to-br from-gray-900 to-gray-700 bg-clip-text text-transparent">
                            {t('pricing.free')}
                          </span>
                          <div className="mt-2">
                            <span className="text-sm text-gray-600">{t('pricing.forever')} • {t('pricing.subtitle')}</span>
                          </div>
                        </>
                      ) : (
                        <>
                          {couponValid && couponData && (
                            <div className="mb-2">
                              <span className="text-2xl font-bold text-gray-400 line-through">€{getOriginalPrice(plan)}</span>
                            </div>
                          )}
                          <span className="text-4xl font-black bg-gradient-to-br from-gray-900 to-gray-700 bg-clip-text text-transparent">
                            €{getPrice(plan)}
                          </span>
                          <span className="text-gray-600 ml-2 text-lg font-semibold">{t('pricing.perMonth')}</span>
                        </>
                      )}
                    </div>
                    
                    {!plan.isFree && isAnnual && !couponValid && (
                      <div className="space-y-1">
                        <p className="text-sm text-gray-500 line-through">€{plan.priceMonthly}{t('pricing.perMonth')}</p>
                        <div className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">
                          <Check className="w-3 h-3" />
                          {t('pricing.save', { amount: getSavings(plan) })}
                        </div>
                      </div>
                    )}
                    
                    {!plan.isFree && couponValid && couponData && (
                      <div className="mt-2">
                        <div className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">
                          <Check className="w-3 h-3" />
                          -{couponData.discount_value}% SCONTO APPLICATO
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {!plan.isFree && isAnnual && (
                    <p className="text-xs text-gray-500 mt-2 font-medium">
                      💳 {t('pricing.billedAnnually', { amount: (getPrice(plan) * 12).toFixed(0) })}
                    </p>
                  )}
                </CardHeader>

                <CardContent className="px-6 pb-6 flex-1 flex flex-col">
                  <ul className="space-y-3 mb-6 flex-1">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="feature-item flex items-start gap-3 group">
                        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-[var(--brand-primary)] flex items-center justify-center mt-0.5 shadow-md group-hover:shadow-lg transition-all">
                          <Check className="w-3.5 h-3.5 text-white font-bold" strokeWidth={3} />
                        </div>
                        <span className="text-gray-700 text-sm leading-relaxed font-medium">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={() => handleSelectPlan(plan.id)}
                    className={`cta-button w-full text-base font-bold py-3.5 rounded-xl transition-all shadow-lg hover:shadow-2xl relative z-10 ${
                      plan.popular
                        ? 'bg-gradient-to-r from-[var(--brand-primary)] to-teal-500 hover:from-[var(--brand-primary-hover)] hover:to-teal-600 text-white'
                        : 'bg-gradient-to-r from-gray-900 to-gray-800 hover:from-gray-800 hover:to-gray-700 text-white'
                    }`}
                  >
                    <span className="relative z-10">{plan.cta}</span>
                  </button>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* FAQ Section */}
          <div className="max-w-3xl mx-auto mt-32 mb-20 px-4 sm:px-6">
            <h2 className="text-5xl md:text-6xl font-bold text-gray-900 text-center mb-16">{t('pricing.faqTitle')} <span className="animated-text-gradient">{t('pricing.faqTitleHighlight')}</span></h2>
            
            <div className="space-y-4">
              {faqs.map((faq, index) => (
                <div
                  key={index}
                  className="water-glass-effect rounded-[3rem] border border-white/40 hover:border-white/60 transition-all shadow-lg hover:shadow-xl overflow-hidden"
                >
                  <button
                    onClick={() => setOpenFaqIndex(openFaqIndex === index ? null : index)}
                    className="w-full p-6 text-left flex items-center justify-between gap-4 hover:bg-white/20 transition-all"
                  >
                    <h3 className="font-bold text-lg text-gray-900">{faq.question}</h3>
                    <div className={`transform transition-transform duration-300 ${openFaqIndex === index ? 'rotate-180' : ''}`}>
                      <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </button>
                  <div
                    className={`transition-all duration-300 ease-in-out ${
                      openFaqIndex === index ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                    } overflow-hidden`}
                  >
                    <p className="text-gray-700 leading-relaxed px-6 pb-6">{faq.answer}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Testimonials Section */}
          <div className="mt-20 mb-16 px-4 sm:px-6">
            <h2 className="text-5xl md:text-6xl font-bold text-gray-900 text-center mb-12">
              <span className="animated-text-gradient">{t('pricing.testimonialsTitle')}</span> {t('pricing.testimonialsTitleHighlight')}
            </h2>

            <div className="relative pb-32">
              <div className="flex flex-wrap gap-6">
                {testimonials.slice(0, 12).map((testimonial, index) => (
                  <div
                    key={index}
                    className="water-glass-effect rounded-2xl p-6 border border-white/40 hover:border-white/60 transition-all w-full md:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)]"
                  >
                    <div className="flex items-start gap-4 mb-4">
                      <img
                        src={testimonial.photo}
                        alt={testimonial.name}
                        className="w-12 h-12 rounded-full object-cover border-2 border-white/90 shadow-md flex-shrink-0"
                      />
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">{testimonial.name}</p>
                        <p className="text-xs text-gray-600">{testimonial.role}</p>
                      </div>
                    </div>
                    <p className="text-sm text-gray-800 leading-relaxed">
                      {testimonial.text}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Footer */}
          <footer className="py-12 px-6">
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
      </section>
    </div>
  );
}