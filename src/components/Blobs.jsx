import React from 'react';

/**
 * Two slow-floating blurred blobs (orange and violet) at low opacity for background ambiance.
 */
export default function Blobs() {
  return (
    <div
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
      aria-hidden="true"
    >
      {/* Orange ambient blob */}
      <div
        className="absolute -top-[10%] -left-[10%] h-[550px] w-[550px] rounded-full bg-[#FF5E00]/10 blur-[130px] animate-float-slow transition-opacity duration-1000"
      />
      {/* Violet ambient blob */}
      <div
        className="absolute top-[35%] -right-[12%] h-[600px] w-[600px] rounded-full bg-[#7C3AED]/10 blur-[140px] animate-float-reverse transition-opacity duration-1000"
      />
      {/* Subtle bottom warm glow */}
      <div
        className="absolute -bottom-[15%] left-[20%] h-[480px] w-[480px] rounded-full bg-[#FF5E00]/5 blur-[120px]"
      />
    </div>
  );
}
