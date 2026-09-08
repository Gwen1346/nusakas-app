import React from 'react';

export default function NusaKasLogo({ className = "w-48 h-48" }) {
  return (
    <div className={`flex flex-col items-center justify-center font-sans ${className}`}>
      <svg
        viewBox="0 0 400 400"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-auto"
      >
        <defs>
          {/* Background Gradient */}
          <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#10B981" />
            <stop offset="100%" stopColor="#047857" />
          </linearGradient>

          {/* Receipt Fold Gradient */}
          <linearGradient id="foldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#E6F4EA" />
            <stop offset="100%" stopColor="#A7F3D0" />
          </linearGradient>

          {/* Soft Shadow */}
          <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0" dy="8" stdDeviation="6" floodColor="#000" floodOpacity="0.15" />
          </filter>
        </defs>

        {/* Rounded Container Box */}
        <rect
          x="40"
          y="40"
          width="320"
          height="320"
          rx="80"
          fill="url(#bgGrad)"
          filter="url(#shadow)"
        />

        {/* Letter N & Receipt Combination */}
        <g transform="translate(110, 110)">
          {/* Left Vertical Bar of N */}
          <rect x="0" y="0" width="45" height="180" rx="22.5" fill="#FFFFFF" />

          {/* Diagonal Connection of N */}
          <path
            d="M 22.5 0 L 157.5 157.5 C 168 168 158 180 142 180 L 110 180 Z"
            fill="#FFFFFF"
          />

          {/* Right Vertical Bar (Receipt Concept) */}
          <rect x="125" y="45" width="45" height="135" rx="22.5" fill="#FFFFFF" />

          {/* Top Curved Receipt Paper */}
          <path
            d="M 125 45 C 125 15, 170 15, 170 45 L 170 110 C 170 125, 125 110, 125 90 Z"
            fill="url(#foldGrad)"
          />

          {/* Receipt Text Lines */}
          <line x1="137" y1="42" x2="158" y2="42" stroke="#047857" strokeWidth="4.5" strokeLinecap="round" />
          <line x1="137" y1="54" x2="158" y2="54" stroke="#047857" strokeWidth="4.5" strokeLinecap="round" />
          <line x1="137" y1="66" x2="151" y2="66" stroke="#047857" strokeWidth="4.5" strokeLinecap="round" />
        </g>
      </svg>

      {/* Brand Name Text */}
      <div className="mt-2 text-center select-none">
        <span className="text-4xl font-extrabold tracking-tight text-[#064E3B]">Nusa</span>
        <span className="text-4xl font-extrabold tracking-tight text-[#10B981]">Kas</span>
      </div>
    </div>
  );
}