import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Check, Bell, Lock, Crown, Sparkles } from 'lucide-react';
import { useLanguage } from '@/components/i18n/LanguageContext';

export default function PostQuizSubscription() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [user, setUser] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState('monthly');
  const [showReminderScreen, setShowReminderScreen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [timelineProgress, setTimelineProgress] = useState(0);
  const [walletAvailable, setWalletAvailable] = useState(false);
  const stripeRef = React.useRef(null);

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
        
        if (currentUser.subscription_status === 'active' || currentUser.subscription_status === 'trial') {
          navigate(createPageUrl('Dashboard'), { replace: true });
          return;
        }

        const keyRes = await base44.functions.invoke('getStripePublishableKey');
        const key = keyRes?.data?.key || keyRes?.key;
        
        if (!key) {
          console.error('Stripe key not found');
          return;
        }

        // Carica Stripe script
        const loadStripe = () => {
          if (window.Stripe) {
            stripeRef.current = window.Stripe(key);
            checkWalletAvailability();
            return;
          }

          const script = document.createElement('script');
          script.src = 'https://js.stripe.com/v3/';
          script.async = true;
          script.onload = () => {
            if (window.Stripe) {
              stripeRef.current = window.Stripe(key);
              checkWalletAvailability();
            }
          };
          document.head.appendChild(script);
        };

        const checkWalletAvailability = () => {
          if (!stripeRef.current) return;

          const paymentRequest = stripeRef.current.paymentRequest({
            country: 'IT',
            currency: 'eur',
            total: { label: 'MyWellness', amount: 1000 }
          });

          paymentRequest.canMakePayment().then((result) => {
            setWalletAvailable(!!result);
          }).catch(() => {
            setWalletAvailable(false);
          });
        };

        loadStripe();
      } catch (error) {
        console.error('Error loading data:', error);
        navigate(createPageUrl('Quiz'), { replace: true });
      }
    };
    
    loadInitialData();
  }, [navigate]);

  // Animazione timeline quando yearly è selezionato
  useEffect(() => {
    if (selectedPlan === 'yearly') {
      const interval = setInterval(() => {
        setTimelineProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            return 100;
          }
          return prev + 2;
        });
      }, 30);
      
      return () => clearInterval(interval);
    } else {
      setTimelineProgress(0);
    }
  }, [selectedPlan]);

  const handleStartTrial = () => {
    if (selectedPlan === 'yearly') {
      setShowReminderScreen(true);
    } else {
      handleCheckout('monthly');
    }
  };

  const handleCheckout = async (plan) => {
    setIsLoading(true);

    try {
      const priceId = plan === 'yearly' 
          ? 'price_1SubPS2OXBs6ZYwlrhculB4e'
          : 'price_1SubPS2OXBs6ZYwlbjszSDt9';

      if (!stripeRef.current || !walletAvailable) {
        alert('Wallet non disponibile');
        setIsLoading(false);
        return;
      }

      const amount = plan === 'yearly' ? 4999 : 999;
      const paymentRequest = stripeRef.current.paymentRequest({
        country: 'IT',
        currency: 'eur',
        total: {
          label: 'MyWellness Subscription',
          amount: amount,
        },
        requestPayerName: true,
        requestPayerEmail: true,
      });

      paymentRequest.on('paymentmethod', (e) => {
        base44.functions.invoke('stripePaymentIntent', {
          priceId,
          hasTrial: plan === 'yearly'
        }).then((response) => {
          const data = response?.data || response;
          if (!data?.success) {
            e.complete('fail');
            setIsLoading(false);
            return;
          }

          return stripeRef.current.confirmCardPayment(
            data.clientSecret,
            { payment_method: e.paymentMethod.id },
            { handleActions: false }
          ).then(({ paymentIntent, error }) => {
            if (error) {
              e.complete('fail');
              setIsLoading(false);
            } else {
              e.complete('success');
              navigate(createPageUrl('ThankYou'), { replace: true });
            }
          });
        }).catch(() => {
          e.complete('fail');
          setIsLoading(false);
        });
      });

      paymentRequest.canMakePayment().then((result) => {
        if (result) {
          paymentRequest.show();
        } else {
          setIsLoading(false);
        }
      });
    } catch (error) {
      console.error('Errore:', error);
      alert('Errore durante il checkout. Riprova.');
      setIsLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Sparkles className="w-8 h-8 animate-spin text-[#26847F]" />
      </div>
    );
  }

  const features = [
    {
      icon: '🧬',
      title: t('subscription.feature1Title'),
      subtitle: t('subscription.feature1Subtitle')
    },
    {
      icon: '📊',
      title: t('subscription.feature2Title'),
      subtitle: t('subscription.feature2Subtitle')
    },
    {
      icon: '💪',
      title: t('subscription.feature3Title'),
      subtitle: t('subscription.feature3Subtitle')
    },
    {
      icon: '📸',
      title: t('subscription.feature4Title'),
      subtitle: t('subscription.feature4Subtitle')
    }
  ];

  const timelineSteps = [
    {
      icon: Lock,
      title: t('subscription.timelineToday'),
      subtitle: t('subscription.timelineTodayText'),
      color: 'text-orange-500'
    },
    {
      icon: Bell,
      title: t('subscription.timeline2Days'),
      subtitle: t('subscription.timeline2DaysText'),
      color: 'text-orange-500'
    },
    {
      icon: Crown,
      title: t('subscription.timeline3Days'),
      subtitle: t('subscription.timeline3DaysText', { date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toLocaleDateString() }),
      color: 'text-gray-900'
    }
  ];

  if (showReminderScreen) {
    return (
      <div className="min-h-screen bg-white p-6 flex flex-col pb-28">
        <button
          onClick={() => setShowReminderScreen(false)}
          className="self-start text-gray-600 mb-8"
        >
          ← {t('subscription.back')}
        </button>

        <div className="flex-1 flex flex-col items-center justify-between max-w-md mx-auto w-full">
          <div className="space-y-8 text-center w-full">
            <h1 className="text-3xl font-bold text-gray-900 px-4">
              {t('subscription.reminderTitle')}
            </h1>

            <div className="relative py-12">
              <div className="relative w-48 h-48 mx-auto">
                <Bell className="w-48 h-48 text-gray-300" strokeWidth={1.5} />
                <div className="absolute -top-2 -right-2 w-16 h-16 bg-red-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-2xl font-bold">1</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-center gap-2 text-gray-900">
              <Check className="w-5 h-5" />
              <p className="font-semibold">{t?.subscription?.noPaymentNow || 'No Payment Due Now'}</p>
            </div>
          </div>

          <div className="fixed bottom-5 left-6 right-6 max-w-md mx-auto space-y-4 bg-white">
            <Button
              onClick={() => handleCheckout('yearly')}
              disabled={isLoading}
              className="w-full h-14 bg-gray-900 hover:bg-gray-950 text-white font-bold rounded-full"
            >
              {isLoading ? t('common.loading') : t('subscription.continueForFree')}
            </Button>
            <p className="text-center text-sm text-gray-500">
              {t('subscription.yearlyPrice')}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white p-6 flex flex-col pb-28">
      <button
        onClick={() => navigate(createPageUrl('Dashboard'))}
        className="self-start text-gray-600 mb-8"
      >
        ← {t('subscription.back')}
      </button>

      <div className="flex-1 flex flex-col max-w-md mx-auto w-full space-y-8">
        <div className="space-y-4 text-center">
          <h1 className="text-3xl font-bold text-gray-900">
            {selectedPlan === 'yearly' 
              ? t('subscription.trialTitle')
              : t('subscription.unlockTitle')}
          </h1>
        </div>

        {/* Features List - mostrato SOLO se monthly */}
        {selectedPlan === 'monthly' && (
          <div className="space-y-4">
            {features.map((feature, index) => (
              <div key={index} className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-900 flex items-center justify-center">
                  <Check className="w-4 h-4 text-white" strokeWidth={3} />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-gray-900 flex items-center gap-2">
                    <span className="text-xl">{feature.icon}</span>
                    {feature.title}
                  </p>
                  <p className="text-sm text-gray-600">{feature.subtitle}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Animated Timeline - mostrato SOLO se yearly */}
        {selectedPlan === 'yearly' && (
          <div className="space-y-1 py-4">
            {timelineSteps.map((step, index) => {
              const StepIcon = step.icon;
              const isActive = timelineProgress >= (index * 33.33);
              const isFilling = timelineProgress > (index * 33.33) && timelineProgress < ((index + 1) * 33.33);
              const fillPercentage = isFilling ? ((timelineProgress - (index * 33.33)) / 33.33) * 100 : (isActive ? 100 : 0);
              
              return (
                <div key={index} className="flex items-start gap-4 relative">
                  {/* Icon Circle */}
                  <div className={`w-12 h-12 rounded-full ${isActive ? 'bg-orange-500' : 'bg-gray-300'} flex items-center justify-center flex-shrink-0 relative z-10 transition-all duration-300`}>
                    <StepIcon className="w-6 h-6 text-white" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 pb-8">
                    <h3 className={`font-bold ${isActive ? 'text-gray-900' : 'text-gray-500'} transition-colors duration-300`}>
                      {step.title}
                    </h3>
                    <p className={`text-sm ${isActive ? 'text-gray-600' : 'text-gray-400'} transition-colors duration-300`}>
                      {step.subtitle.replace('{date}', new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toLocaleDateString())}
                    </p>
                  </div>

                  {/* Connecting Line */}
                  {index < timelineSteps.length - 1 && (
                    <div className="absolute left-6 top-12 w-0.5 h-full -translate-x-1/2">
                      <div className="w-full bg-gray-200 h-full">
                        <div 
                          className="w-full bg-orange-500 transition-all duration-300 ease-out"
                          style={{ height: `${fillPercentage}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Plan Selection - SEMPRE Fixed a 20px dal basso */}
        <div className="fixed bottom-5 left-6 right-6 max-w-md mx-auto space-y-4 bg-white">
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => setSelectedPlan('monthly')}
              disabled={isLoading}
              className={`relative p-4 rounded-2xl border-2 transition-all ${
                selectedPlan === 'monthly'
                  ? 'border-gray-900 bg-gray-50'
                  : 'border-gray-200 bg-white'
              } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <div className="text-left space-y-1">
                <p className="font-semibold text-gray-900">{t('subscription.monthly')}</p>
                <p className="text-2xl font-bold text-gray-900">9,99 €<span className="text-sm font-normal">/mo</span></p>
              </div>
              {selectedPlan === 'monthly' && (
                <div className="absolute top-4 right-4 w-6 h-6 bg-gray-900 rounded-full flex items-center justify-center">
                  <Check className="w-4 h-4 text-white" strokeWidth={3} />
                </div>
              )}
            </button>

            <button
              onClick={() => setSelectedPlan('yearly')}
              disabled={isLoading}
              className={`relative p-4 rounded-2xl border-2 transition-all ${
                selectedPlan === 'yearly'
                  ? 'border-gray-900 bg-gray-50'
                  : 'border-gray-200 bg-white'
              } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <div className="absolute -top-2 right-2 bg-gray-900 text-white text-xs font-bold px-3 py-1 rounded-full">
                {t('subscription.threeDaysFree')}
              </div>
              <div className="text-left space-y-1">
                <p className="font-semibold text-gray-900">{t('subscription.yearly')}</p>
                <p className="text-2xl font-bold text-gray-900">4,16 €<span className="text-sm font-normal">/mo</span></p>
              </div>
              {selectedPlan === 'yearly' && (
                <div className="absolute top-4 right-4 w-6 h-6 bg-gray-900 rounded-full flex items-center justify-center">
                  <Check className="w-4 h-4 text-white" strokeWidth={3} />
                </div>
              )}
            </button>
          </div>

          {/* No Payment Badge */}
          {selectedPlan === 'yearly' && (
            <div className="flex items-center justify-center gap-2 text-gray-900">
              <Check className="w-5 h-5" />
              <p className="font-semibold">{t('subscription.noPaymentNow')}</p>
            </div>
          )}

          {/* CTA Button */}
          <div className="space-y-2">
            <Button
              onClick={() => handleCheckout(selectedPlan)}
              disabled={isLoading || !walletAvailable}
              className="w-full h-14 bg-gray-900 hover:bg-gray-950 disabled:opacity-50 text-white font-bold rounded-full"
            >
              {isLoading ? 
                t('common.loading')
              : !walletAvailable ?
                'Caricamento...'
              : selectedPlan === 'yearly' ? 
                t('subscription.startTrial')
              : 
                t('subscription.startJourney')
              }
            </Button>
            <p className="text-center text-sm text-gray-500">
              {selectedPlan === 'yearly'
                ? t('subscription.yearlyPrice')
                : t('subscription.monthlyPrice')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}