import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { base44 } from "@/api/base44Client";
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import QuizHeader from './QuizHeader';

export default function ReferralCodeStep({ data, onDataChange, onNext, translations, currentStep, totalSteps, onPrev }) {
  const t = translations?.quiz || {};
  const [code, setCode] = useState(data.referral_code || '');
  const [isValidating, setIsValidating] = useState(false);
  const [validationStatus, setValidationStatus] = useState(null); // 'valid', 'invalid', null

  const handleValidateAndContinue = async () => {
    if (!code.trim()) {
      onDataChange({ referral_code: null, referral_source: null });
      onNext();
      return;
    }

    setIsValidating(true);
    setValidationStatus(null);

    try {
      // Check if coupon/referral code exists (coupons and referral codes are unified)
      const coupons = await base44.entities.Coupon.filter({ 
        code: code.toUpperCase(),
        is_active: true
      });

      // Also check influencer referral code for backwards compatibility
      const influencers = await base44.entities.Influencer.filter({
        referral_code: code.toUpperCase()
      });

      if (coupons.length > 0) {
        setValidationStatus('valid');
        const coupon = coupons[0];

        onDataChange({ 
          referral_code: code.toUpperCase(),
          referral_source: 'coupon',
          coupon_id: coupon.id
        });
        
        localStorage.setItem('referralCode', code.toUpperCase());
        localStorage.setItem('couponId', coupon.id);

        // Track influencer if this coupon matches an influencer referral_code
        if (influencers.length > 0) {
          const influencer = influencers[0];
          localStorage.setItem('influencerReferralCode', code.toUpperCase());
          localStorage.setItem('influencerId', influencer.id);
          try {
            await base44.functions.invoke('trackInfluencerEvent', {
              influencerId: influencer.id,
              eventType: 'quiz_confirmed'
            });
          } catch (e) {
            console.error('Error tracking influencer event:', e);
          }
        }

        setTimeout(() => {
          onNext();
        }, 800);
      } else if (influencers.length > 0) {
        // Backwards compat: influencer code not yet a coupon → accept anyway
        setValidationStatus('valid');
        const influencer = influencers[0];
        
        onDataChange({ 
          referral_code: code.toUpperCase(),
          referral_source: 'influencer',
          influencer_id: influencer.id
        });
        
        localStorage.setItem('influencerReferralCode', code.toUpperCase());
        localStorage.setItem('influencerId', influencer.id);
        
        try {
          await base44.functions.invoke('trackInfluencerEvent', {
            influencerId: influencer.id,
            eventType: 'quiz_confirmed'
          });
        } catch (error) {
          console.error('❌ Error tracking quiz confirmed:', error);
        }
        
        setTimeout(() => {
          onNext();
        }, 800);
      } else {
        setValidationStatus('invalid');
      }
    } catch (error) {
      console.error('Error validating referral code:', error);
      setValidationStatus('invalid');
    }

    setIsValidating(false);
  };

  const handleSkip = () => {
    onDataChange({ referral_code: null });
    onNext();
  };

  return (
    <div className="space-y-6 pt-20 w-full max-w-[416px] mx-auto px-4 md:px-0 min-h-[80vh] flex flex-col justify-start pb-28">
      <QuizHeader 
        currentStep={currentStep} 
        totalSteps={totalSteps}
        showBackButton={true}
        onBackClick={onPrev}
      />

      <div className="flex-1 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-3">
            {t.quizReferralTitle || 'Introduce el código de referido (opcional)'}
          </h1>
          <p className="text-base text-gray-500">
            {t.quizReferralSubtitle || 'Puedes omitir este paso'}
          </p>
        </div>

        <div className="space-y-4 pt-8">
          <div className="relative">
            <Input
              type="text"
              value={code}
              onChange={(e) => {
                setCode(e.target.value.toUpperCase());
                setValidationStatus(null);
              }}
              placeholder={t.quizReferralPlaceholder || 'Código de referido'}
              className="h-14 text-base bg-gray-50 border-gray-200 rounded-xl pr-12"
              disabled={isValidating}
            />
            
            {validationStatus === 'valid' && (
              <CheckCircle2 className="absolute right-4 top-4 w-6 h-6 text-green-500" />
            )}
            {validationStatus === 'invalid' && (
              <AlertCircle className="absolute right-4 top-4 w-6 h-6 text-red-500" />
            )}
          </div>

          {validationStatus === 'invalid' && (
            <p className="text-sm text-red-500 px-2">
              {t.quizReferralInvalid || 'Código no válido. Verifica e intenta de nuevo.'}
            </p>
          )}

          {code.trim() && (
            <Button
              onClick={handleValidateAndContinue}
              disabled={isValidating}
              className="w-full bg-[#26847F] hover:bg-[#1f6b66] text-white text-base font-semibold rounded-xl h-14"
            >
              {isValidating ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  {t.quizReferralValidating || 'Validando...'}
                </>
              ) : (
                t.quizReferralSubmit || 'Enviar'
              )}
            </Button>
          )}
        </div>
      </div>

      <Button
        onClick={handleSkip}
        disabled={isValidating}
        className="w-full bg-gray-900 hover:bg-gray-950 text-white text-base font-semibold quiz-button-fixed"
      >
        {t.quizReferralSkip || 'Omitir'}
      </Button>
    </div>
  );
}