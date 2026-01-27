import React, { useMemo } from 'react';
import QuizHeader from './QuizHeader';
import { Button } from "@/components/ui/button";

export default function WeightDifferenceStep({ data, translations, currentStep, totalSteps, onPrev, onNext }) {
  const t = translations?.quiz || {};

  const weightDifference = useMemo(() => {
    const current = data.current_weight || 0;
    const target = data.target_weight || 0;
    return target - current;
  }, [data.current_weight, data.target_weight]);

  const isLosing = weightDifference < 0;
  const absDifference = Math.abs(Math.round(weightDifference));

  const getMessage = () => {
    if (absDifference <= 3) {
    if (isLosing) {
      return {
        title: `Perdiendo ${absDifference} kg es un objetivo realista. ¡No es nada difícil!`,
        subtitle: `El 90% de los usuarios dice que el cambio es evidente tras usar MyWellness y que no es fácil recuperar el peso.`
      };
    } else {
      return {
        title: `Ganando ${absDifference} kg es un objetivo realista. ¡No es nada difícil!`,
        subtitle: `El 90% de los usuarios dice que el cambio es evidente tras usar MyWellness y que no es fácil perder el peso ganado.`
      };
    }
    } else if (absDifference <= 8) {
    if (isLosing) {
      return {
        title: `Perdiendo ${absDifference} kg es un objetivo realista. ¡Totalmente alcanzable!`,
        subtitle: `El 90% de los usuarios dice que el cambio es evidente tras usar MyWellness y que no es fácil recuperar el peso.`
      };
    } else {
      return {
        title: `Ganando ${absDifference} kg es un objetivo realista. ¡Totalmente alcanzable!`,
        subtitle: `El 90% de los usuarios dice que el cambio es evidente tras usar MyWellness y que no es fácil perder el peso ganado.`
      };
    }
    } else if (absDifference <= 15) {
    if (isLosing) {
      return {
        title: `Perdiendo ${absDifference} kg es un objetivo desafiante pero posible.`,
        subtitle: `Requiere consistencia, pero con el plan personalizado de MyWellness lo conseguirás. El 85% de los usuarios logra su objetivo.`
      };
    } else {
      return {
        title: `Ganando ${absDifference} kg es un objetivo desafiante pero posible.`,
        subtitle: `Requiere consistencia, pero con el plan personalizado de MyWellness lo conseguirás. El 85% de los usuarios logra su objetivo.`
      };
    }
    } else {
    if (isLosing) {
      return {
        title: `Perdiendo ${absDifference} kg es un objetivo ambicioso.`,
        subtitle: `Será un viaje, pero con dedicación y tu plan personalizado, lo alcanzarás. Muchos usuarios lo han logrado antes que tú.`
      };
    } else {
      return {
        title: `Ganando ${absDifference} kg es un objetivo ambicioso.`,
        subtitle: `Será un viaje, pero con dedicación y tu plan personalizado, lo alcanzarás. Muchos usuarios lo han logrado antes que tú.`
      };
    }
    }
  };

  const message = getMessage();

  return (
    <div className="space-y-6 w-full max-w-[416px] mx-auto px-4 md:px-0 min-h-[80vh] flex flex-col justify-start pt-20">
      <QuizHeader
        currentStep={currentStep}
        totalSteps={totalSteps}
        showBackButton={true}
        onBackClick={onPrev}
      />

      <div className="flex-1 flex flex-col items-center justify-center px-4 pb-8 space-y-8">
        <div className="text-center space-y-6">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 leading-tight">
            {message.title.split(absDifference)[0]}
            <span className="text-[#26847F]">{absDifference} kg</span>
            {message.title.split(absDifference)[1]}
          </h2>

          <p className="text-gray-600 text-base leading-relaxed">
            {message.subtitle}
          </p>
        </div>
      </div>

      <div>
        <Button
          onClick={onNext}
          className="w-full bg-gray-900 hover:bg-gray-950 text-white text-base font-semibold quiz-button-fixed"
        >
          {t.quizContinue || 'Continuar'}
        </Button>
      </div>
    </div>
  );
}