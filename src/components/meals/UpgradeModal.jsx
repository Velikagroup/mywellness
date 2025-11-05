import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { CheckCircle, X, Sparkles, Zap, Crown, Shield } from 'lucide-react';

export default function UpgradeModal({ isOpen, onClose, currentPlan = 'base' }) {
  const [billingCycle, setBillingCycle] = useState('yearly');

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
    'Ricette con foto AI e istruzioni',
    'Calcolo BMR e massa grassa',
    'Lista della spesa automatica',
    'Tracking peso e progressi'],

    checkoutLinks: {
      monthly: 'https://buy.stripe.com/test_base_monthly',
      yearly: 'https://buy.stripe.com/test_base_yearly'
    }
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
    'Piano di allenamento personalizzato',
    'Workout con warm-up e cool-down',
    'Schede adattive al tuo livello',
    '🔥 Analisi AI dei pasti con foto',
    'Ribilanciamento automatico calorie',
    'Tracking allenamento'],

    checkoutLinks: {
      monthly: 'https://buy.stripe.com/test_pro_monthly',
      yearly: 'https://buy.stripe.com/test_pro_yearly'
    }
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
    '🔥 Sostituzione ingredienti AI',
    '🔥 Modifica schede AI per imprevisti',
    '🔥 Analisi progressi con foto AI',
    '🎯 Supporto prioritario'],

    checkoutLinks: {
      monthly: 'https://buy.stripe.com/test_premium_monthly',
      yearly: 'https://buy.stripe.com/test_premium_yearly'
    }
  }];

  const handleSelectPlan = (plan) => {
    const link = billingCycle === 'monthly' ? plan.checkoutLinks.monthly : plan.checkoutLinks.yearly;
    window.open(link, '_blank');
  };

  return (
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
      
      {/* Backdrop */}
      <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm" onClick={onClose}></div>
      
      {/* Modal Content */}
      <div className="relative z-[101] w-full max-w-7xl max-h-[95vh] overflow-y-auto animated-gradient-bg-modal rounded-3xl shadow-2xl">
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 z-[102] text-gray-400 hover:text-gray-600 transition-colors bg-white rounded-full p-2 shadow-lg"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-8 md:p-12">
          {/* Header */}
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-4">
              Scegli <span className="gradient-text">il Tuo Piano</span>
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Inizia subito con 3 giorni gratuiti. Cancella quando vuoi, senza vincoli.
            </p>
          </div>

          {/* Billing Toggle - Modern Style */}
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

          {/* Plans Grid */}
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
                    {/* Icon */}
                    <div className="text-center mb-6">
                      <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl ${plan.iconBg} flex items-center justify-center`}>
                        <Icon className={`w-8 h-8 ${plan.iconColor}`} />
                      </div>
                      <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                      <p className="text-sm text-gray-600">{plan.description}</p>
                    </div>

                    {/* Price */}
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

                    {/* Features */}
                    <ul className="space-y-3 mb-6 flex-1">
                      {plan.features.map((feature, fIdx) => (
                        <li key={fIdx} className="flex items-start gap-2 text-sm">
                          <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                          <span className="text-gray-700">{feature}</span>
                        </li>
                      ))}
                    </ul>

                    {/* Button */}
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

          {/* Footer */}
          <div className="text-center mt-12">
            <p className="text-sm text-gray-500">
              💳 Pagamento sicuro • 🔒 Cancellazione facile • ✅ Garanzia 30 giorni
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}