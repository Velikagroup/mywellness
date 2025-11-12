import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { CheckCircle, X, Sparkles, Zap, Crown, AlertCircle, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export default function UpgradeModal({ isOpen, onClose, currentPlan = 'base' }) {
  const [billingCycle, setBillingCycle] = useState('monthly');
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [selectedPlanToUpgrade, setSelectedPlanToUpgrade] = useState(null);
  const [isUpgrading, setIsUpgrading] = useState(false);

  if (!isOpen) return null;

  const plans = [
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
        'Dashboard scientifica completa',
        'Piano nutrizionale settimanale personalizzato',
        '🔄 4 generazioni piano nutrizionale/mese',
        'Ricette con foto AI e istruzioni',
        '🔄 Sostituzione ingredienti AI',
        'Calcolo BMR e massa grassa',
        'Lista della spesa automatica',
        'Tracking peso e progressi'
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
        '🔄 8 generazioni piano nutrizionale/mese',
        'Piano di allenamento personalizzato',
        '🔄 4 generazioni piano allenamento/mese',
        'Workout con warm-up e cool-down',
        'Schede adattive al tuo livello',
        '🔥 Analisi AI dei pasti con foto',
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
        '♾️ Generazioni ILLIMITATE piani nutrizionali',
        '♾️ Generazioni ILLIMITATE piani allenamento',
        '🔥 Modifica schede AI per imprevisti',
        '🔥 Analisi progressi con foto AI',
        '🎯 Supporto prioritario'
      ]
    }
  ];

  const handleSelectPlan = (plan) => {
    setSelectedPlanToUpgrade(plan);
    setShowConfirmDialog(true);
  };

  const handleConfirmUpgrade = async () => {
    if (!selectedPlanToUpgrade) return;

    setIsUpgrading(true);
    try {
      const response = await base44.functions.invoke('upgradeDowngradeSubscription', {
        newPlan: selectedPlanToUpgrade.id,
        newBillingPeriod: billingCycle
      });

      const data = response.data || response;

      if (data.success) {
        alert(`✅ Piano aggiornato a ${selectedPlanToUpgrade.name}!`);
        setShowConfirmDialog(false);
        onClose();
        window.location.reload();
      } else {
        alert('❌ Errore: ' + (data.error || 'Errore sconosciuto'));
      }
    } catch (error) {
      console.error('Error upgrading:', error);
      alert('❌ Errore durante l\'upgrade. Riprova.');
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
            background: linear-gradient(90deg, #4ade80, #16a34a, #4ade80);
            background-size: 200% auto;
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            animation: shimmer 12s linear infinite;
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
            className="absolute top-4 right-4 z-[102] text-gray-400 hover:text-gray-600 transition-colors bg-white rounded-full p-2 shadow-lg hover:shadow-xl"
            aria-label="Chiudi"
          >
            <X className="w-5 h-5" />
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

            <div className="grid md:grid-cols-3 gap-6 max-w-7xl mx-auto">
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
                        {billingCycle === 'monthly' ? (
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
                          Scegli {plan.name}
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
            <DialogTitle className="text-xl font-bold text-gray-900">
              Conferma Upgrade Immediato
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            {selectedPlanToUpgrade && (
              <>
                <div className="bg-gradient-to-br from-[var(--brand-primary-light)] to-teal-50 rounded-xl p-6 border-2 border-[var(--brand-primary)]/30">
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-12 h-12 rounded-xl ${selectedPlanToUpgrade.iconBg} flex items-center justify-center`}>
                      <selectedPlanToUpgrade.icon className={`w-6 h-6 ${selectedPlanToUpgrade.iconColor}`} />
                    </div>
                    <div>
                      <p className="text-lg font-bold text-gray-900">{selectedPlanToUpgrade.name}</p>
                      <p className="text-sm text-gray-600">
                        €{billingCycle === 'monthly' ? selectedPlanToUpgrade.monthlyPrice : selectedPlanToUpgrade.yearlyMonthly}/mese
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-blue-900">
                      <p className="font-semibold mb-2">⚡ Upgrade Immediato:</p>
                      <ul className="space-y-1 text-blue-800">
                        <li>• Il piano verrà aggiornato immediatamente</li>
                        <li>• La carta verrà addebitata SUBITO per il nuovo piano</li>
                        <li>• Avrai accesso immediato a tutte le nuove funzionalità</li>
                        <li>• Puoi sempre cancellare in qualsiasi momento</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                  <p className="text-xs text-amber-800 font-medium">
                    💳 La tua carta salvata verrà addebitata immediatamente per l'upgrade.
                  </p>
                </div>

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setShowConfirmDialog(false)}
                    className="flex-1"
                  >
                    Annulla
                  </Button>
                  <Button
                    onClick={handleConfirmUpgrade}
                    disabled={isUpgrading}
                    className="flex-1 bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] text-white"
                  >
                    {isUpgrading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Aggiornamento...
                      </>
                    ) : (
                      'Conferma e Addebita Ora'
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