import React from 'react';

export const LogoBinaWarga: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 420 100" xmlns="http://www.w3.org/2000/svg" {...props}>
    {/* The number 13, large and on the left */}
    <text 
      x="0" 
      y="50" 
      fontFamily="Poppins, sans-serif" 
      fontWeight="800" 
      fontSize="85"
      dominantBaseline="middle"
      textAnchor="start"
    >
      <tspan fill="#FBBF24">1</tspan>
      <tspan fill="#10B981">3</tspan>
    </text>
    
    {/* The two lines of text, moved to the right of the number */}
    <text 
      x="95" 
      y="40" 
      fontFamily="Poppins, sans-serif" 
      fontWeight="600" 
      fontSize="34" 
      fill="currentColor"
      letterSpacing="1"
    >
      KOPERASI
    </text>
    
    <text 
      x="95" 
      y="85" 
      fontFamily="Poppins, sans-serif" 
      fontWeight="700" 
      fontSize="44" 
      fill="currentColor"
      letterSpacing="1"
    >
      BINA WARGA
    </text>
  </svg>
);