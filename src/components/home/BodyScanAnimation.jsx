import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export default function BodyScanAnimation() {
  const [stage, setStage] = useState(0);

  useEffect(() => {
    const timings = [0, 3000, 6000, 9000];
    const timer = setInterval(() => {
      setStage(prev => (prev + 1) % 2);
    }, 6000);
    
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="w-full aspect-square bg-gradient-to-b from-orange-300 to-orange-200 rounded-2xl overflow-hidden relative">
      {/* Scanning Stage */}
      <motion.div
        className="absolute inset-0 flex flex-col items-center justify-center p-4"
        initial={{ opacity: 1 }}
        animate={{ opacity: stage === 0 ? 1 : 0 }}
        transition={{ duration: 0.8 }}
        pointerEvents={stage === 0 ? 'auto' : 'none'}
      >
        {/* Woman Figure with body outline */}
        <div className="relative w-24 h-40 mb-4">
          {/* Head */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-white/80 border-2 border-white"></div>
          
          {/* Torso */}
          <div className="absolute top-8 left-1/2 -translate-x-1/2 w-8 h-12 border-2 border-dashed border-white"></div>
          
          {/* Arms */}
          <div className="absolute top-10 left-0 w-6 h-1 border border-white"></div>
          <div className="absolute top-10 right-0 w-6 h-1 border border-white"></div>
          
          {/* Legs */}
          <div className="absolute top-20 left-1/2 -translate-x-1/2 w-1 h-12 border-l-2 border-dashed border-white ml-2"></div>
          <div className="absolute top-20 left-1/2 -translate-x-1/2 w-1 h-12 border-r-2 border-dashed border-white -ml-2"></div>

          {/* Scanning Lines Animation */}
          <motion.div
            className="absolute inset-0 border-2 border-white"
            animate={{ opacity: [0.3, 0.7, 0.3] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          ></motion.div>
        </div>

        {/* Camera Options */}
        <div className="flex gap-2 mb-4">
          <button className="px-3 py-1 bg-black/60 text-white text-xs rounded-full font-semibold">Fronte</button>
          <button className="px-3 py-1 bg-white/40 text-white text-xs rounded-full font-semibold">Lato</button>
          <button className="px-3 py-1 bg-white/40 text-white text-xs rounded-full font-semibold">Atrás</button>
        </div>

        {/* Scanning Text */}
        <motion.p
          className="text-white text-xs font-semibold"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          Scanning...
        </motion.p>

        {/* Bottom Controls */}
        <div className="absolute bottom-4 flex gap-4">
          <button className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center text-white">
            📷
          </button>
          <button className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center text-white">
            🖼️
          </button>
        </div>
      </motion.div>

      {/* Results Stage */}
      <motion.div
        className="absolute inset-0 flex flex-col items-center justify-center p-3"
        initial={{ opacity: 0 }}
        animate={{ opacity: stage === 1 ? 1 : 0 }}
        transition={{ duration: 0.8 }}
        pointerEvents={stage === 1 ? 'auto' : 'none'}
      >
        <h3 className="text-xs font-bold text-gray-800 mb-2 text-center">✅ Scan Complete</h3>
        
        {/* Results Grid */}
        <div className="w-full space-y-2">
          <div className="grid grid-cols-2 gap-2">
            {/* Age */}
            <div className="bg-emerald-50 border border-emerald-300 rounded-2xl p-2">
              <div className="text-xs font-bold text-emerald-700">AGE</div>
              <div className="text-2xl font-black text-emerald-600">25</div>
            </div>

            {/* Type */}
            <div className="bg-purple-50 border border-purple-300 rounded-2xl p-2">
              <div className="text-xs font-bold text-purple-700">TYPE</div>
              <div className="text-lg font-black text-purple-600">Ecto</div>
            </div>

            {/* Fat */}
            <div className="bg-orange-50 border border-orange-300 rounded-2xl p-2">
              <div className="text-xs font-bold text-orange-700">FAT %</div>
              <div className="text-2xl font-black text-orange-600">19%</div>
            </div>

            {/* Definition */}
            <div className="bg-blue-50 border border-blue-300 rounded-2xl p-2">
              <div className="text-xs font-bold text-blue-700">DEF</div>
              <div className="text-xl font-black text-blue-600">72/100</div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}