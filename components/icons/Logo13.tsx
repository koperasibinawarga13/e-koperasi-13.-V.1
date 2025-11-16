import React from 'react';

export const Logo13: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 100 60" xmlns="http://www.w3.org/2000/svg" {...props}>
    <text 
      x="0" 
      y="50" 
      fontFamily="Poppins, sans-serif" 
      fontWeight="800" 
      fontSize="60"
      dominantBaseline="middle"
      textAnchor="start"
    >
      <tspan fill="#F59E0B">1</tspan>
      <tspan fill="#10B981" dx="-5">3</tspan>
    </text>
  </svg>
);
