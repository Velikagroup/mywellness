import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { CheckCircle, X, Sparkles, Zap, Crown, AlertCircle, Loader2, TrendingUp, TrendingDown } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export default function UpgradeModal({ isOpen, onClose, currentPlan = 'base' }) {
  const [billingCycle, setBillingCycle] = useState('monthly');
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [selectedPlanToUpgrade, setSelectedPlanToUpgrade] = useState(null);
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [pricingInfo, setPricingInfo] = useState(null);
  const [isCalculating, setIsCalculating] = useState(false);

  if (!isOpen) return null;

  const plans = [
    {
      id: 'standard',
      name: 'Standard',
      description: 'Piano gratuito per monitorare i tuoi progressi',
      monthlyPrice: 0,
      yearlyPrice: 0,
      yearlyMonthly: 0,
      icon: CheckCircle,
      iconBg: 'bg-gray-100',
      iconColor: 'text-gray-600',
      isFree: true,
      features: [
        'Dashboard scientifica completa',
        'Calcolo BMR e massa grassa',
        'Tracking peso e progressi',
        'Conta calorie istantaneo',
        'Impostazioni profilo'
      ]
    },
    {
      id: 'base',
      name: 'Base',
      description: 'Perfetto per iniziare il tuo percorso nutrizionale',
      monthlyPrice: 19,
      yearlyPrice: 182.4,
      yearlyMonthly: 15.2,
      icon: Sparkles,
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
      features: [
        'Tutto del Piano Standard',
        'Piano nutrizionale settimanale personalizzato',
        '4 generazioni piano nutrizionale/mese',
        'Ricette con foto AI e istruzioni',
        'Sostituzione ingredienti AI',
        'Lista della spesa automatica'
      ]
    },
    {
      id: 'pro',
      name: 'Pro',
      description: 'Il piano più completo per risultati garantiti',
      monthlyPrice: 29,
      yearlyPrice: 278.4,
      yearlyMonthly: 23.2,
      icon: Zap,
      iconBg: 'bg-gradient-to-br from-[#26847F] to-teal-500',
      iconColor: 'text-white',
      popular: true,
      badge: '✅ PIÙ SCELTO ✅',
      features: [
        'Tutto del Piano Base',
        '8 generazioni piano nutrizionale/mese',
        'Piano di allenamento personalizzato',
        '4 generazioni piano allenamento/mese',
        'Workout con warm-up e cool-down',
        'Schede adattive al tuo livello',
        'Analisi AI dei pasti con foto',
        'Ribilanciamento automatico calorie',
        'Tracking allenamento'
      ]
    },
    {
      id: 'premium',
      name: 'Premium',
      description: 'Per chi vuole il massimo con AI avanzata',
      monthlyPrice: 39,
      yearlyPrice: 374.4,
      yearlyMonthly: 31.2,
      icon: Crown,
      iconBg: 'bg-purple-100',
      iconColor: 'text-purple-600',
      badge: '💎 PIANO ESCLUSIVO',
      features: [
        'Tutto del Piano Pro',
        'Generazioni ILLIMITATE piani nutrizionali',
        'Generazioni ILLIMITATE piani allenamento',
        'Modifica schede AI per imprevisti',
        'Analisi progressi con foto AI',
        'Scansione etichette con Health Score AI',
        'Supporto prioritario'
      ]
    }
  ];

  const handleSelectPlan = async (plan) => {
    setSelectedPlanToUpgrade(plan);
    setIsCalculating(true);
    setShowConfirmDialog(true);
    
    // Calcola il prezzo prorated
    try {
      const response = await base44.functions.invoke('upgradeDowngradeSubscription', {
        newPlan: plan.id,
        newBillingPeriod: billingCycle,
        calculateOnly: true
      });

      const data = response.data || response;
      
      if (data.success && data.calculate) {
        setPricingInfo(data);
      }
    } catch (error) {
      console.error('Error calculating pricing:', error);
    }
    setIsCalculating(false);
  };

  const handleConfirmUpgrade = async () => {
    if (!selectedPlanToUpgrade) return;

    setIsUpgrading(true);
    try {
      const response = await base44.functions.invoke('upgradeDowngradeSubscription', {
        newPlan: selectedPlanToUpgrade.id,
        newBillingPeriod: billingCycle,
        calculateOnly: false
      });

      const data = response.data || response;

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
              <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-4">
                Scegli <span className="gradient-text">il Tuo Piano</span>
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Inizia subito con 3 giorni gratuiti. Cancella quando vuoi, senza vincoli.
              </p>
            </div>

            <div className="flex items-center justify-center gap-2 mb-12">
              <div className="relative bg-gray-100 rounded-full p-1 flex">
                <button
                  onClick={() => setBillingCycle('monthly')}
                  className={`relative px-8 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 ${
                    billingCycle === 'monthly'
                      ? 'bg-[#26847F] text-white shadow-lg'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Mensile
                </button>
                <button
                  onClick={() => setBillingCycle('yearly')}
                  className={`relative px-8 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 ${
                    billingCycle === 'yearly'
                      ? 'bg-[#26847F] text-white shadow-lg'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Annuale
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full font-bold">
                    -20%
                  </span>
                </button>
              </div>
            </div>

            <div className="grid md:grid-cols-4 gap-6 max-w-7xl mx-auto">
              {plans.map((plan) => {
                const Icon = plan.icon;
                const isCurrentPlan = currentPlan === plan.id;
                
                return (
                  <div key={plan.id} className="relative">
                    {plan.badge && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                        <div className={`px-4 py-1 rounded-full text-xs font-bold ${
                          plan.popular 
                            ? 'bg-[#26847F] text-white' 
                            : 'bg-purple-600 text-white'
                        }`}>
                          {plan.badge}
                        </div>
                      </div>
                    )}
                    
                    <div className={`liquid-glass rounded-3xl p-6 h-full flex flex-col transition-all duration-300 hover:shadow-2xl ${
                      plan.popular ? 'ring-2 ring-[#26847F] scale-105' : ''
                    }`}>
                      <div className="text-center mb-6">
                        <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl ${plan.iconBg} flex items-center justify-center`}>
                          <Icon className={`w-8 h-8 ${plan.iconColor}`} />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                        <p className="text-sm text-gray-600">{plan.description}</p>
                      </div>

                      <div className="text-center mb-6">
                        {plan.isFree ? (
                          <div>
                            <div className="text-4xl font-black text-gray-900">
                              Gratis
                            </div>
                            <div className="text-sm text-gray-600 mt-1">Per sempre</div>
                          </div>
                        ) : billingCycle === 'monthly' ? (
                          <div>
                            <div className="text-4xl font-black text-gray-900">
                              €{plan.monthlyPrice}
                            </div>
                            <div className="text-sm text-gray-600 mt-1">/mese</div>
                          </div>
                        ) : (
                          <div>
                            <div className="text-4xl font-black text-gray-900">
                              €{plan.yearlyMonthly}
                            </div>
                            <div className="text-sm text-gray-600 mt-1">/mese</div>
                            <div className="text-xs text-green-600 font-semibold mt-1">
                              Risparmi €{((plan.monthlyPrice * 12) - plan.yearlyPrice).toFixed(0)}/anno
                            </div>
                          </div>
                        )}
                      </div>

                      <ul className="space-y-3 mb-6 flex-1">
                        {plan.features.map((feature, fIdx) => (
                          <li key={fIdx} className="flex items-start gap-2 text-sm">
                            <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                            <span className="text-gray-700">{feature}</span>
                          </li>
                        ))}
                      </ul>

                      {isCurrentPlan ? (
                        <Button
                          disabled
                          className="w-full h-12 text-base font-bold bg-gray-200 text-gray-500 cursor-not-allowed rounded-xl"
                        >
                          Piano Attuale
                        </Button>
                      ) : (
                        <Button
                          onClick={() => handleSelectPlan(plan)}
                          className={`w-full h-12 text-base font-bold rounded-xl transition-all ${
                            plan.popular
                              ? 'bg-[#26847F] hover:bg-[#1f6b66] text-white shadow-lg hover:shadow-xl'
                              : 'bg-gray-900 hover:bg-gray-800 text-white'
                          }`}
                        >
                          Passa a {plan.name}
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="text-center mt-12">
              <p className="text-sm text-gray-500">
                💳 Pagamento sicuro • 🔒 Cancellazione facile • ✅ Garanzia 30 giorni
              </p>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="max-w-md z-[200]">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
              {pricingInfo?.isDowngrade ? (
                <><TrendingDown className="w-5 h-5 text-orange-600" /> Conferma Downgrade</>
              ) : (
                <><TrendingUp className="w-5 h-5 text-green-600" /> Conferma Upgrade Immediato</>
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
                        €{billingCycle === 'monthly' ? selectedPlanToUpgrade.monthlyPrice : selectedPlanToUpgrade.yearlyMonthly}/mese
                      </p>
                    </div>
                  </div>

                  {isCalculating ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="w-6 h-6 text-[var(--brand-primary)] animate-spin" />
                      <span className="ml-2 text-sm text-gray-600">Calcolo in corso...</span>
                    </div>
                  ) : pricingInfo && (
                    <div className="space-y-3 pt-3 border-t border-[#26847F]/20">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Piano attuale:</span>
                        <span className="font-semibold text-gray-900 capitalize">
                          {pricingInfo.currentPlan} ({pricingInfo.currentBillingPeriod === 'yearly' ? 'Annuale' : 'Mensile'})
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Prezzo piano completo:</span>
                        <span className="font-semibold text-gray-900">€{pricingInfo.newPlanPrice.toFixed(2)}</span>
                      </div>
                      {!pricingInfo.isDowngrade && (
                        <>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Credito residuo ({pricingInfo.percentageRemaining}%):</span>
                            <span className="font-semibold text-green-600">-€{pricingInfo.creditFromCurrentPlan.toFixed(2)}</span>
                          </div>
                          <div className="h-px bg-gray-300"></div>
                          <div className="flex justify-between">
                            <span className="font-bold text-gray-900">Da pagare ora:</span>
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
                        <p className="font-semibold mb-2">📅 Downgrade Programmato:</p>
                        <ul className="space-y-1 text-orange-800">
                          <li>• Nessun addebito immediato</li>
                          <li>• Continuerai a usare il piano attuale fino alla fine del periodo</li>
                          <li>• Il nuovo piano sarà attivo dal prossimo rinnovo</li>
                          <li>• Non riceverai rimborsi per il periodo corrente</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                      <div className="text-sm text-blue-900">
                        <p className="font-semibold mb-2">⚡ Upgrade Immediato:</p>
                        <ul className="space-y-1 text-blue-800">
                          <li>• Il piano verrà aggiornato immediatamente</li>
                          <li>• La carta verrà addebitata SUBITO per la differenza</li>
                          <li>• Avrai accesso immediato a tutte le nuove funzionalità</li>
                          <li>• Il credito del piano attuale viene scalato automaticamente</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                  <p className="text-xs text-amber-800 font-medium">
                    💳 {pricingInfo?.isDowngrade 
                      ? 'Nessun addebito ora. Il cambio sarà effettivo al prossimo rinnovo.' 
                      : `La tua carta salvata verrà addebitata di €${pricingInfo?.amountToPay?.toFixed(2) || '0.00'} immediatamente.`
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
                    Annulla
                  </Button>
                  <Button
                    onClick={handleConfirmUpgrade}
                    disabled={isUpgrading || isCalculating}
                    className="flex-1 bg-[#26847F] hover:bg-[#1f6b66] text-white"
                  >
                    {isUpgrading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Elaborazione...
                      </>
                    ) : pricingInfo?.isDowngrade ? (
                      'Conferma Downgrade'
                    ) : (
                      `Conferma e Addebita €${pricingInfo?.amountToPay?.toFixed(2) || '0.00'}`
                    )}
                  </Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}