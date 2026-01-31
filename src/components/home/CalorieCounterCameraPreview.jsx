import React from 'react';
import { UtensilsCrossed, FlipHorizontal, X, Image } from 'lucide-react';

export default function CalorieCounterCameraPreview() {
  return (
    <div className="relative w-full max-w-[340px] mx-auto aspect-[9/16] bg-black rounded-[40px] overflow-hidden shadow-2xl border-8 border-gray-900">
      {/* Camera background simulation */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-800 via-gray-700 to-gray-900"></div>

      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 pt-6 px-4">
        <div className="flex items-center justify-between">
          <button className="p-2 rounded-full bg-white/10 backdrop-blur-sm">
            <X className="w-5 h-5 text-white" />
          </button>
          <button className="p-2 rounded-full bg-white/10 backdrop-blur-sm">
            <FlipHorizontal className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>

      {/* Frame Guide per Calories */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none pb-32">
        <div className="relative w-64 h-80 rounded-3xl flex items-center justify-center" style={{boxShadow: '0 0 0 10000px rgba(0,0,0,0.5)'}}>
          <div className="absolute inset-0 border-2 border-white/80 rounded-3xl"></div>
          <div className="flex flex-col items-center gap-3 z-10">
            <UtensilsCrossed className="w-12 h-12 text-white/90" strokeWidth={1.5} />
            <p className="text-white text-xs font-semibold text-center px-4">Centra il piatto</p>
          </div>

          {/* Corner markers */}
          <div className="absolute top-2 left-2 w-5 h-5 border-t-2 border-l-2 border-white/90 rounded-tl-lg"></div>
          <div className="absolute top-2 right-2 w-5 h-5 border-t-2 border-r-2 border-white/90 rounded-tr-lg"></div>
          <div className="absolute bottom-2 left-2 w-5 h-5 border-b-2 border-l-2 border-white/90 rounded-bl-lg"></div>
          <div className="absolute bottom-2 right-2 w-5 h-5 border-b-2 border-r-2 border-white/90 rounded-br-lg"></div>
        </div>
      </div>

      {/* Gallery Button */}
      <button className="absolute bottom-28 left-4 p-3 rounded-full bg-white/20 backdrop-blur-sm">
        <Image className="w-5 h-5 text-white" />
      </button>

      {/* Mode Selector Buttons */}
      <div className="absolute bottom-12 left-1/2 -translate-x-1/2 z-10 flex gap-2">
        <button className="flex flex-col items-center gap-1 p-2 rounded-xl bg-black text-white scale-110">
          <UtensilsCrossed className="w-5 h-5" strokeWidth={2} />
          <span className="text-[10px] font-medium">Calorie</span>
        </button>
      </div>

      {/* Capture Button */}
      <button className="absolute bottom-3 left-1/2 -translate-x-1/2 w-16 h-16 rounded-full bg-white border-4 border-black shadow-2xl z-20" />
    </div>
  );
}