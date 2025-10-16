import React from 'react';

export const LogoKoperasi: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" {...props}>
    <g>
      {/* House shape */}
      <path d="M50 15 L15 45 v40 h70 V45 L50 15z" fill="currentColor"/>
      
      {/* Roof accent */}
      <path d="M50 15 L85 45 H15 L50 15z" fill="none" strokeWidth="4" strokeLinejoin="round" className="stroke-current opacity-20" />
      
      {/* Door/inner part */}
      <path d="M40 85 V60 H60 V85" fill="none" strokeWidth="4" strokeLinejoin="round" className="stroke-current opacity-20"/>

      {/* Number '13' inside a notched area */}
      <g transform="translate(48, 30)">
          <path d="M25 0 L0 10 V30 H18 V10 L25 5 Z" fill="#ffffff" />
          <text x="10" y="21" fontFamily="Poppins, sans-serif" fontSize="12" fontWeight="bold" fill="#0052FF" textAnchor="middle">13</text>
          
          {/* Green leaf accent */}
          <line x1="8" y1="9" x2="16" y2="14" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" />
      </g>
    </g>
  </svg>
);