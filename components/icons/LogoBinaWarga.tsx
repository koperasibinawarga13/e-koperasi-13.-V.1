import React from 'react';

export const LogoBinaWarga: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 280 100" xmlns="http://www.w3.org/2000/svg" {...props}>
    <style>
        {`@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@700&display=swap');`}
    </style>
    <text x="0" y="45" fontFamily="'Poppins', sans-serif" fontWeight="700" fontSize="50" letterSpacing="-2" fill="currentColor">BINA</text>
    <text x="135" y="45" fontFamily="'Poppins', sans-serif" fontWeight="700" fontSize="50" letterSpacing="-2" fill="#22C55E">1</text>
    <text x="165" y="45" fontFamily="'Poppins', sans-serif" fontWeight="700" fontSize="50" letterSpacing="-2" fill="#F97316">3</text>
    <text x="0" y="95" fontFamily="'Poppins', sans-serif" fontWeight="700" fontSize="50" letterSpacing="-2" fill="currentColor">WARGA</text>
  </svg>
);