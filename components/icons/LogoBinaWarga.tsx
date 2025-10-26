import React from 'react';

export const LogoBinaWarga: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 225 155" xmlns="http://www.w3.org/2000/svg" {...props}>
    <style>
      {`
        .bina-font { font-family: Poppins, sans-serif; font-weight: 700; font-size: 36px; letter-spacing: -1px; text-anchor: middle; }
        .warga-font { font-family: Poppins, sans-serif; font-weight: 700; font-size: 40px; letter-spacing: -1.5px; }
      `}
    </style>

    {/* Graphics */}
    <g fillRule="evenodd">
      {/* Arrow */}
      <g fill="#3730A3">
        <polygon points="35,90 85,40 98,53 48,103" />
        <polygon points="85,40 98,27 111,40" />
      </g>
      {/* Bars */}
      <g fill="#10B981">
        <rect x="75" y="65" width="25" height="25" rx="3" />
        <rect x="115" y="45" width="25" height="45" rx="3" />
        <path d="M155 25 h 25 v 60 a 5 5 0 0 1 -5 5 h -15 a 5 5 0 0 1 -5 -5 v -60 z" />
      </g>
    </g>
    
    {/* Text */}
    <text x="112.5" y="118" className="bina-font" fill="#3730A3">
      BINA
    </text>
    <text y="150" className="warga-font">
      <tspan x="15" fill="#3730A3">WARGA</tspan>
      <tspan x="152" fill="#10B981">1</tspan>
      <tspan x="174" fill="#F59E0B">3</tspan>
    </text>
  </svg>
);
