import React from 'react';

export const LoginIllustration: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" {...props}>
    <g transform="translate(100 100)">
      {/* Body */}
      <path d="M -50,100 L -60,0 Q -40,-20 0,-20 Q 40,-20 60,0 L 50,100 Z" fill="#0052FF" />
      
      {/* Hand/Arm */}
      <path d="M 50,20 C 60,10 80,30 70,50 L 40,80 C 30,70 45,25 50,20 Z" fill="#FBBF24" />
      
      {/* Neck */}
      <rect x="-15" y="-35" width="30" height="15" fill="#f2d6b8" />
      
      {/* Head */}
      <circle cx="0" cy="-60" r="25" fill="#f2d6b8" />
      
      {/* Hair */}
      <path d="M -25 -85 Q 0 -95 25 -85 L 30 -55 Q 0 -45 -30 -55 Z" fill="#1A202C" />
    </g>
  </svg>
);