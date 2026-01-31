import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import CalorieCounterCameraPreview from './CalorieCounterCameraPreview';
import NutritionScannerCameraPreview from './NutritionScannerCameraPreview';
import BodyScanCameraPreview from './BodyScanCameraPreview';

const features = [
  {
    id: 0,
    component: CalorieCounterCameraPreview,
    title: 'Calorie Counter',
    description: 'Scatta una foto al tuo piatto e ottieni calorie e macros istantanei'
  },
  {
    id: 1,
    component: NutritionScannerCameraPreview,
    title: 'Nutrition Scanner',
    description: 'Scansiona etichette nutrizionali per valutare la qualità degli alimenti'
  },
  {
    id: 2,
    component: BodyScanCameraPreview,
    title: 'Body Scan',
    description: 'Analisi completa del corpo con AI per tracciare i tuoi progressi'
  }
];

export default function MobileCameraCarousel() {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % features.length);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const getPosition = (index) => {
    const diff = (index - activeIndex + features.length) % features.length;
    
    if (diff === 0) return 'center';
    if (diff === 1) return 'right';
    if (diff === features.length - 1) return 'left';
    return 'hidden';
  };

  return (
    <div className="md:hidden relative w-full overflow-visible" style={{ height: '720px' }}>
      <div className="relative w-full h-full flex items-start justify-center">
        {features.map((feature, index) => {
          const position = getPosition(index);
          const Component = feature.component;

          return (
            <motion.div
              key={feature.id}
              className="absolute top-0"
              initial={false}
              animate={{
                x: position === 'center' ? '-50%' : position === 'left' ? 'calc(-50% - 380px)' : position === 'right' ? 'calc(-50% + 380px)' : 'calc(-50% + 800px)',
                scale: position === 'center' ? 1.4 : 1,
                opacity: position === 'center' ? 1 : position === 'hidden' ? 0 : 0.3,
                zIndex: position === 'center' ? 10 : 5
              }}
              transition={{
                duration: 0.6,
                ease: [0.32, 0.72, 0, 1]
              }}
              style={{
                left: '50%'
              }}
            >
              <div className="pointer-events-none">
                <Component />
              </div>
              {position === 'center' && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-center mt-6 px-4"
                >
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{feature.title}</h3>
                  <p className="text-sm text-gray-600 max-w-[280px] mx-auto">{feature.description}</p>
                </motion.div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Dots indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex gap-2">
        {features.map((_, index) => (
          <button
            key={index}
            onClick={() => setActiveIndex(index)}
            className={`w-2 h-2 rounded-full transition-all ${
              index === activeIndex ? 'bg-[#26847F] w-6' : 'bg-gray-300'
            }`}
          />
        ))}
      </div>
    </div>
  );
}