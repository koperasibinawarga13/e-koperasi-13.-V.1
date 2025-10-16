import React from 'react';

export const LogoKoperasi: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" {...props}>
    <g>
      {/* Outer Circle */}
      <circle cx="50" cy="50" r="48" fill="#FFFFFF" stroke="currentColor" strokeWidth="3" />

      {/* Building/House representing "Warga" */}
      <path d="M 30 80 V 45 L 50 25 L 70 45 V 80 H 30 Z" fill="currentColor" opacity="0.8" />
      
      {/* Leaf representing "Bina" (growth) */}
      <path 
        d="M 50 50 C 50 50, 40 60, 50 70 C 60 60, 50 50, 50 50 Z" 
        fill="#10B981" 
        transform="rotate(45 50 50)"
      />
      <path 
        d="M 50 48 L 50 65" 
        stroke="#FFFFFF" 
        strokeWidth="1.5"
        strokeLinecap="round"
        transform="rotate(45 50 50)"
      />

       {/* Number "13" */}
      <text 
        x="50" 
        y="78" 
        fontFamily="Poppins, sans-serif" 
        fontSize="18" 
        fontWeight="bold" 
        fill="#FFFFFF" 
        textAnchor="middle"
      >
        13
      </text>
    </g>
  </svg>
);
