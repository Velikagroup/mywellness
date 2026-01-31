import React from 'react';
import { ScanLine, FlipHorizontal, X, Image, Camera } from 'lucide-react';

export default function BodyScanCameraPreview() {
  return (
    <div className="relative w-full max-w-[340px] mx-auto aspect-[9/16] bg-black rounded-[40px] overflow-hidden shadow-2xl border-8 border-gray-900">
      {/* Camera background with body scan photo */}
      <div className="absolute inset-0">
        <img 
          src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68d44c626cc2c19cca9c750d/7a925baab_360_F_531993310_X9av29FGPzWQ7rg0fs32wA3URBxfEKnu.jpg"
          alt="Body Scan"
          className="w-full h-full object-cover"
          style={{ objectPosition: '-10px center' }}
        />
      </div>

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

      {/* Body Scan Photo Indicators */}
      <div className="absolute top-24 left-1/2 -translate-x-1/2 z-10 flex gap-3">
        {/* Front - Active */}
        <div className="relative flex flex-col items-center gap-2 p-2 rounded-xl bg-black/80 backdrop-blur-sm border-2 border-white">
          <div className="w-12 h-16 rounded-lg border-2 border-white/50 flex items-center justify-center">
            <Camera className="w-5 h-5 text-white" />
          </div>
          <span className="text-[10px] text-white font-medium">Fronte</span>
        </div>

        {/* Side - Not active */}
        <div className="relative flex flex-col items-center gap-2 p-2 rounded-xl bg-white/20 backdrop-blur-sm">
          <div className="w-12 h-16 rounded-lg border-2 border-white/50 flex items-center justify-center">
            <Camera className="w-5 h-5 text-white/60" />
          </div>
          <span className="text-[10px] text-white/60 font-medium">Lato</span>
        </div>

        {/* Back - Not active */}
        <div className="relative flex flex-col items-center gap-2 p-2 rounded-xl bg-white/20 backdrop-blur-sm">
          <div className="w-12 h-16 rounded-lg border-2 border-white/50 flex items-center justify-center">
            <Camera className="w-5 h-5 text-white/60" />
          </div>
          <span className="text-[10px] text-white/60 font-medium">Retro</span>
        </div>
      </div>

      {/* Body outline guide */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none pb-24">
        <div className="relative w-48 h-96">
          {/* Simplified body outline */}
          <svg className="w-full h-full" viewBox="0 0 100 200" fill="none">
            {/* Head */}
            <ellipse cx="50" cy="20" rx="12" ry="15" stroke="white" strokeWidth="1.5" strokeDasharray="4 4" opacity="0.6" />
            {/* Torso */}
            <path d="M 38 35 L 35 80 L 32 120 L 35 160 L 38 180" stroke="white" strokeWidth="1.5" strokeDasharray="4 4" opacity="0.6" />
            <path d="M 62 35 L 65 80 L 68 120 L 65 160 L 62 180" stroke="white" strokeWidth="1.5" strokeDasharray="4 4" opacity="0.6" />
            {/* Shoulders */}
            <line x1="38" y1="35" x2="25" y2="45" stroke="white" strokeWidth="1.5" strokeDasharray="4 4" opacity="0.6" />
            <line x1="62" y1="35" x2="75" y2="45" stroke="white" strokeWidth="1.5" strokeDasharray="4 4" opacity="0.6" />
            {/* Arms */}
            <line x1="25" y1="45" x2="20" y2="100" stroke="white" strokeWidth="1.5" strokeDasharray="4 4" opacity="0.6" />
            <line x1="75" y1="45" x2="80" y2="100" stroke="white" strokeWidth="1.5" strokeDasharray="4 4" opacity="0.6" />
            {/* Legs */}
            <line x1="38" y1="180" x2="35" y2="200" stroke="white" strokeWidth="1.5" strokeDasharray="4 4" opacity="0.6" />
            <line x1="62" y1="180" x2="65" y2="200" stroke="white" strokeWidth="1.5" strokeDasharray="4 4" opacity="0.6" />
          </svg>
          <p className="absolute bottom-0 left-1/2 -translate-x-1/2 text-white text-xs font-semibold text-center">Posizionati al centro</p>
        </div>
      </div>

      {/* Gallery Button */}
      <button className="absolute bottom-28 left-4 p-3 rounded-full bg-white/20 backdrop-blur-sm">
        <Image className="w-5 h-5 text-white" />
      </button>

      {/* Mode Selector Buttons */}
      <div className="absolute bottom-12 left-1/2 -translate-x-1/2 z-10 flex gap-2">
        <button className="flex flex-col items-center gap-1 p-2 rounded-xl bg-black text-white scale-110">
          <ScanLine className="w-5 h-5" />
          <span className="text-[10px] font-medium">Body Scan</span>
        </button>
      </div>

      {/* Capture Button */}
      <button className="absolute bottom-3 left-1/2 -translate-x-1/2 w-16 h-16 rounded-full bg-white border-4 border-black shadow-2xl z-20" />
    </div>
  );
}