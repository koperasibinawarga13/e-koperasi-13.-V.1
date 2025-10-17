import React from 'react';

export const LogoKoperasi: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" {...props}>
    {/* Modern Abstract Logo for Koperasi 13 */}
    <g>
      {/* Blue Roof/Growth Arrow, subtly forming the number '1' on the left */}
      <path
        d="M50 15 L18 85 H42 L56 55 Q 65 85 82 85 L 50 15 Z"
        fill="currentColor"
      />
      
      {/* Green Leaf accent for growth and community */}
      <path
        d="M26 65 Q 40 75 42 58 C 43 45 30 50 26 65 Z"
        className="text-secondary"
        fill="currentColor"
      />

      {/* White cutout to define the number '3' on the right side of the roof */}
       <path
        d="M55 42 C 65 42, 65 58, 55 58 M55 50 H 70"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth="7"
        strokeLinecap="round"
      />
    </g>
  </svg>
);