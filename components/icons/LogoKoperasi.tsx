import React from 'react';

export const LogoKoperasi: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" {...props}>
    {/* Modern, abstract logo representing synergy and growth */}
    <g>
      {/* Blue: The larger, stable cooperative body, providing support */}
      <path
        d="M 30 85 A 45 45 0 1 1 85 70 L 65 70 A 25 25 0 1 0 30 85 Z"
        fill="currentColor"
      />
      
      {/* Green: The member's growth, emerging from the cooperative's support */}
      <path
        d="M 50 65 A 20 20 0 1 1 70 45 L 50 25 Z"
        className="text-secondary"
        fill="currentColor"
      />
    </g>
  </svg>
);