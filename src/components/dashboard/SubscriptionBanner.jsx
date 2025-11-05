
import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Crown, Zap, Target, Calendar } from 'lucide-react';
import { PLANS, getPlanName } from '@/components/utils/subscriptionPlans'; // Updated import path
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function SubscriptionBanner({ user }) {
  const navigate = useNavigate();
  
  if (!user) return null;

  const planIcons = {
    [PLANS.BASE]: Target,
    [PLANS.PRO]: Zap,
    [PLANS.PREMIUM]: Crown
  };

  const planColors = {
    [PLANS.BASE]: 'from-blue-500 to-blue-600',
    [PLANS.PRO]: 'from-[var(--brand-primary)] to-teal-500',
    [PLANS.PREMIUM]: 'from-purple-500 to-purple-600'
  };

  const PlanIcon = planIcons[user.subscription_plan] || Target;
  const isTrialActive = user.subscription_status === 'trial';
  const trialDaysLeft = isTrialActive && user.trial_ends_at 
    ? Math.ceil((new Date(user.trial_ends_at) - new Date()) / (1000 * 60 * 60 * 24))
    : 0;

  return (
    <Card className={`bg-gradient-to-r ${planColors[user.subscription_plan]} text-white p-6 shadow-lg`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
            <PlanIcon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold">Piano {getPlanName(user.subscription_plan)}</h3>
            {isTrialActive && (
              <div className="flex items-center gap-2 mt-1">
                <Calendar className="w-4 h-4" />
                <p className="text-sm text-white/90">
                  Prova gratuita: {trialDaysLeft} {trialDaysLeft === 1 ? 'giorno' : 'giorni'} rimanenti
                </p>
              </div>
            )}
            {user.subscription_status === 'active' && (
              <p className="text-sm text-white/90 mt-1">Abbonamento attivo</p>
            )}
          </div>
        </div>

        {user.subscription_plan !== PLANS.PREMIUM && (
          <Button
            onClick={() => navigate(createPageUrl('Pricing'))}
            variant="secondary"
            className="bg-white text-gray-900 hover:bg-gray-100"
          >
            Upgrade
          </Button>
        )}
      </div>
    </Card>
  );
}
