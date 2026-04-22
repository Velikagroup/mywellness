import React from 'react';

export default function BodyScanAnimatedPreview() {
  return (
    <div className="relative w-full max-w-[340px] mx-auto aspect-[9/16] bg-black rounded-[40px] overflow-hidden shadow-2xl border-8 border-gray-900">
      <img
        src="https://media.base44.com/images/public/68d44c626cc2c19cca9c750d/f1550bb62_OnboardingIMG2.png"
        alt="Body Scan Preview"
        className="w-full h-full object-cover"
      />
    </div>
  );
}