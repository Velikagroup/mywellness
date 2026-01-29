import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { CheckCircle, X, Sparkles, Zap, Crown, AlertCircle, Loader2, TrendingUp, TrendingDown } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { createPageUrl } from '@/utils';
import UpgradeCheckoutModal from '../modals/UpgradeCheckoutModal';
import { useLanguage } from '../i18n/LanguageContext';
import { useNavigate } from 'react-router-dom';

export default function UpgradeModal({ isOpen, onClose, currentPlan = 'base', targetPlan = null }) {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const [billingCycle, setBillingCycle] = useState('monthly');
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [selectedPlanToUpgrade, setSelectedPlanToUpgrade] = useState(null);
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [pricingInfo, setPricingInfo] = useState(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [showCheckoutView, setShowCheckoutView] = useState(false);
  const [checkoutPlan, setCheckoutPlan] = useState('base');
  const [checkoutBilling, setCheckoutBilling] = useState('monthly');

  const getPlans = () => [
    {
      id: 'monthly',
      name: t('upgradeModal.monthly'),
      description: t('upgradeModal.monthlyPayment'),
      price: 9.99,
      billingPeriod: 'monthly',
      icon: Sparkles,
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
      features: [
        t('upgradeModal.aiPersonalizedPlans'),
        t('upgradeModal.completeTracking'),
        t('upgradeModal.personalizedWorkouts'),
        t('upgradeModal.photoProgressAI'),
        t('upgradeModal.unlimitedAccess')
      ]
    },
    {
      id: 'yearly',
      name: t('upgradeModal.yearly'),
      description: t('upgradeModal.threeDaysFree'),
      price: 4.16,
      totalPrice: 49.99,
      billingPeriod: 'yearly',
      icon: Crown,
      iconBg: 'bg-gradient-to-br from-[#26847F] to-teal-500',
      iconColor: 'text-white',
      popular: true,
      badge: t('upgradeModal.save58'),
      hasTrial: true,
      features: [
        t('upgradeModal.aiPersonalizedPlans'),
        t('upgradeModal.completeTracking'),
        t('upgradeModal.personalizedWorkouts'),
        t('upgradeModal.photoProgressAI'),
        t('upgradeModal.unlimitedAccess'),
        '🎁 ' + t('subscription.threeDaysFree'),
        '💰 ' + t('upgradeModal.save70PerYear')
      ]
    }
  ];

  const plans = getPlans();

  React.useEffect(() => {
    if (targetPlan && isOpen && !showConfirmDialog) {
      const plan = getPlans().find(p => p.id === targetPlan);
      if (plan) {
        handleSelectPlan(plan);
      }
    }
  }, [targetPlan, isOpen, t]);

  if (!isOpen) return null;

  const handleSelectPlan = async (plan) => {
    setIsUpgrading(true);
    try {
      const response = await base44.functions.invoke('upgradeDowngradeSubscription', {
        newPlan: plan.id,
        calculateOnly: false
      });

      const data = response.data || response;

      if (data.success) {
        alert(`✅ Piano aggiornato a ${plan.name}!`);
        onClose();
        window.location.reload();
      } else if (data.requiresCheckout) {
        navigate(createPageUrl('PostQuizSubscription'));
        onClose();
      } else {
        alert('❌ Errore: ' + (data.error || 'Errore sconosciuto'));
      }
    } catch (error) {
      console.error('Error upgrading:', error);
      alert('❌ Errore durante l\'operazione. Riprova.');
    }
    setIsUpgrading(false);
  };

  const handleConfirmUpgrade = async () => {
    if (!selectedPlanToUpgrade) return;

    // Se richiede checkout (no metodo pagamento salvato), passa alla vista checkout
    if (pricingInfo?.requiresCheckout || pricingInfo?.hasPaymentMethod === false) {
      console.log('🔄 Requires checkout - opening checkout view');
      setShowConfirmDialog(false);
      setCheckoutPlan(selectedPlanToUpgrade.id);
      setCheckoutBilling(billingCycle);
      setShowCheckoutView(true);
      return;
    }

    setIsUpgrading(true);
    try {
      console.log('💳 Processing upgrade with saved payment method...');
      const response = await base44.functions.invoke('upgradeDowngradeSubscription', {
        newPlan: selectedPlanToUpgrade.id,
        newBillingPeriod: billingCycle,
        calculateOnly: false
      });

      const data = response.data || response;
      console.log('📊 Upgrade response:', data);

      if (data.success) {
        if (data.isDowngrade) {
          alert(`✅ ${data.message}\nEffettivo dal: ${data.effectiveDate}`);
        } else {
          alert(`✅ ${data.message}\nImporto addebitato: €${data.amountCharged?.toFixed(2)}`);
        }
        setShowConfirmDialog(false);
        onClose();
        window.location.reload();
      } else {
        alert('❌ Errore: ' + (data.error || 'Errore sconosciuto'));
      }
    } catch (error) {
      console.error('Error upgrading:', error);
      alert('❌ Errore durante l\'operazione. Riprova.');
    }
    setIsUpgrading(false);
  };

  return (
    <>
      {/* Mostra checkout se richiesto, altrimenti la vista comparativa */}
      {showCheckoutView ? (
        <UpgradeCheckoutModal
          isOpen={true}
          onClose={() => {
            setShowCheckoutView(false);
            onClose();
          }}
          selectedPlan={checkoutPlan}
          selectedBillingPeriod={checkoutBilling}
        />
      ) : (
      <>
      {/* Nascondi la vista comparativa se c'è un targetPlan specifico */}
      {!targetPlan && (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <style>{`
          @keyframes shimmer {
            0% { background-position: -200% center; }
            100% { background-position: 200% center; }
          }
          
          .animated-gradient-bg-modal {
            background: #f0f4f8;
          }

          .gradient-text {
            background: linear-gradient(135deg, #26847F 0%, #2a9087 20%, #14b8a6 40%, #3dccb4 60%, #22c55e 80%, #26847F 100%);
            background-size: 300% 300%;
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            animation: shimmer 18s ease-in-out infinite;
          }

          .liquid-glass {
            background: rgba(255, 255, 255, 0.7);
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.3);
          }
        `}</style>
        
        <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm" onClick={onClose}></div>
        
        <div className="relative z-[101] w-full max-w-7xl max-h-[95vh] overflow-y-auto animated-gradient-bg-modal rounded-3xl shadow-2xl">
          <button 
            onClick={onClose} 
            className="absolute top-1 right-1 md:top-4 md:right-4 z-[102] text-gray-600 hover:text-gray-900 transition-colors bg-white rounded-full p-3 shadow-lg hover:shadow-xl"
            aria-label="Chiudi"
          >
            <X className="w-6 h-6" />
          </button>

          <div className="p-8 md:p-12">
            <div className="text-center mb-12">
              <div className="inline-block bg-blue-50 border border-blue-200 rounded-full px-6 py-2 mb-4">
                <p className="text-sm font-semibold text-blue-800">
                  {t('upgradeModal.currentPlan')} <span className="capitalize">{currentPlan === 'trial' ? 'Standard' : currentPlan}</span>
                </p>
              </div>
              <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-4">
                {t('upgradeModal.chooseYourPlan').split(' ').slice(0, -2).join(' ')} <span className="gradient-text">{t('upgradeModal.chooseYourPlan').split(' ').slice(-2).join(' ')}</span>
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                {t('upgradeModal.startImmediately')}
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {plans.map((plan) => {
                const Icon = plan.icon;
                const isCurrentPlan = currentPlan === plan.id;
                
                return (
                  <div key={plan.id} className="relative">
                    {plan.badge && (
                      <div className="absolute -top-5 left-1/2 -translate-x-1/2 z-10">
                        <div className="px-6 py-2 rounded-full text-xs font-bold bg-[#26847F] text-white shadow-lg">
                          {plan.badge}
                        </div>
                      </div>
                    )}
                    
                    <div className={`liquid-glass rounded-3xl p-8 h-full flex flex-col transition-all duration-300 hover:shadow-2xl ${
                      plan.popular ? 'ring-2 ring-[#26847F] scale-105' : ''
                    }`}>
                      <div className="text-center mb-6">
                        <div className={`w-20 h-20 mx-auto mb-4 rounded-2xl ${plan.iconBg} flex items-center justify-center`}>
                          <Icon className={`w-10 h-10 ${plan.iconColor}`} />
                        </div>
                        <h3 className="text-3xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                        <p className="text-sm text-gray-600">{plan.description}</p>
                      </div>

                      <div className="text-center mb-8">
                        <div className="text-5xl font-black text-gray-900">
                          €{plan.price}
                        </div>
                        <div className="text-sm text-gray-600 mt-2">{t('upgradeModal.perMonth')}</div>
                        {plan.totalPrice && (
                          <div className="text-xs text-gray-500 mt-1">
                            €{plan.totalPrice} {t('upgradeModal.billedAnnually')}
                          </div>
                        )}
                        {plan.hasTrial && (
                          <div className="mt-3 inline-block bg-green-100 text-green-700 text-xs font-bold px-4 py-2 rounded-full">
                            🎁 {t('subscription.threeDaysFree')}
                          </div>
                        )}
                      </div>

                      <ul className="space-y-4 mb-8 flex-1">
                        {plan.features.map((feature, fIdx) => (
                          <li key={fIdx} className="flex items-start gap-3 text-sm">
                            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                            <span className="text-gray-700 font-medium">{feature}</span>
                          </li>
                        ))}
                      </ul>

                      {isCurrentPlan ? (
                        <Button
                          disabled
                          className="w-full h-14 text-base font-bold bg-gray-200 text-gray-500 cursor-not-allowed rounded-xl"
                        >
                          {t('upgradeModal.currentPlanBadge')}
                        </Button>
                      ) : (
                        <Button
                          onClick={() => handleSelectPlan(plan)}
                          className={`w-full h-14 text-base font-bold rounded-xl transition-all ${
                            plan.popular
                              ? 'bg-[#26847F] hover:bg-[#1f6b66] text-white shadow-lg hover:shadow-xl'
                              : 'bg-gray-900 hover:bg-gray-800 text-white'
                          }`}
                        >
                          {plan.hasTrial ? t('upgradeModal.startFreeTrial') : t('upgradeModal.chooseMonthly')}
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="text-center mt-12">
              <p className="text-sm text-gray-500">
                {t('upgradeModal.securePayment')}
              </p>
            </div>
          </div>
        </div>
      </div>
      )}

      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="max-w-md z-[200]">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
              {pricingInfo?.isDowngrade ? (
                <><TrendingDown className="w-5 h-5 text-orange-600" /> {t('upgradeModal.confirmDowngrade')}</>
              ) : (
                <><TrendingUp className="w-5 h-5 text-green-600" /> {t('upgradeModal.confirmUpgrade')}</>
              )}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            {selectedPlanToUpgrade && (
              <>
                <div className="bg-gradient-to-br from-[#E0F2F1] to-teal-50 rounded-xl p-6 border-2 border-[#26847F]/30">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-xl bg-[#26847F] flex items-center justify-center">
                      <selectedPlanToUpgrade.icon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-lg font-bold text-gray-900">{selectedPlanToUpgrade.name}</p>
                      <p className="text-sm text-gray-600">
                        €{billingCycle === 'monthly' ? selectedPlanToUpgrade.monthlyPrice : selectedPlanToUpgrade.yearlyMonthly}{t('upgradeModal.perMonth')}
                      </p>
                    </div>
                  </div>

                  {isCalculating ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="w-6 h-6 text-[var(--brand-primary)] animate-spin" />
                      <span className="ml-2 text-sm text-gray-600">{t('upgradeModal.calculating')}</span>
                    </div>
                  ) : pricingInfo && (
                    <div className="space-y-3 pt-3 border-t border-[#26847F]/20">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">{t('upgradeModal.currentPlanLabel')}</span>
                        <span className="font-semibold text-gray-900 capitalize">
                          {pricingInfo.currentPlan} ({pricingInfo.currentBillingPeriod === 'yearly' ? t('upgradeModal.yearly') : t('upgradeModal.monthly')})
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">{t('upgradeModal.newPlanLabel')}</span>
                        <span className="font-semibold text-gray-900">€{pricingInfo.newPlanPrice.toFixed(2)}</span>
                      </div>
                      {!pricingInfo.isDowngrade && (
                        <>
                          {pricingInfo.creditFromCurrentPlan > 0 && (
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">{t('upgradeModal.creditRemaining').replace('{percentage}', pricingInfo.percentageRemaining)}</span>
                              <span className="font-semibold text-green-600">-€{pricingInfo.creditFromCurrentPlan.toFixed(2)}</span>
                            </div>
                          )}
                          {pricingInfo.affiliateCreditApplied > 0 && (
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">{t('upgradeModal.affiliateCredit')}</span>
                              <span className="font-semibold text-purple-600">-€{pricingInfo.affiliateCreditApplied.toFixed(2)}</span>
                            </div>
                          )}
                          <div className="h-px bg-gray-300"></div>
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-gray-900">{t('upgradeModal.payNow')}</span>
                            <span className="font-black text-2xl text-[#26847F]">
                              €{pricingInfo.amountToPay.toFixed(2)}
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>

                {pricingInfo?.isDowngrade ? (
                  <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                      <div className="text-sm text-orange-900">
                        <p className="font-semibold mb-2">{t('upgradeModal.scheduledDowngrade')}</p>
                        <ul className="space-y-1 text-orange-800">
                          <li>• {t('upgradeModal.noImmediateCharge')}</li>
                          <li>• {t('upgradeModal.continueCurrentUntilEnd')}</li>
                          <li>• {t('upgradeModal.newPlanActiveNextRenewal')}</li>
                          <li>• {t('upgradeModal.noRefunds')}</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                      <div className="text-sm text-blue-900">
                        <p className="font-semibold mb-2">{t('upgradeModal.immediateUpgrade')}</p>
                        <ul className="space-y-1 text-blue-800">
                          <li>• {t('upgradeModal.planUpgradedImmediately')}</li>
                          <li>• {t('upgradeModal.cardChargedNow')}</li>
                          <li>• {t('upgradeModal.immediateAccessFeatures')}</li>
                          <li>• {t('upgradeModal.creditAutoDeducted')}</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                  <p className="text-xs text-amber-800 font-medium">
                    {pricingInfo?.isDowngrade 
                      ? t('upgradeModal.noChargeDowngrade')
                      : t('upgradeModal.chargeInfo').replace('{amount}', pricingInfo?.amountToPay?.toFixed(2) || '0.00')
                    }
                  </p>
                </div>

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowConfirmDialog(false);
                      setPricingInfo(null);
                    }}
                    className="flex-1"
                  >
                    {t('upgradeModal.cancel')}
                  </Button>
                  <Button
                    onClick={handleConfirmUpgrade}
                    disabled={isUpgrading || isCalculating}
                    className="flex-1 bg-[#26847F] hover:bg-[#1f6b66] text-white"
                  >
                    {isUpgrading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        {t('upgradeModal.processing')}
                      </>
                    ) : pricingInfo?.requiresCheckout ? (
                      t('upgradeModal.continueToPayment')
                    ) : pricingInfo?.isDowngrade ? (
                      t('upgradeModal.confirmDowngradeBtn')
                    ) : (
                      t('upgradeModal.confirmAndCharge').replace('{amount}', pricingInfo?.amountToPay?.toFixed(2) || '0.00')
                    )}
                  </Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
      </>
      )}
    </>
  );
}