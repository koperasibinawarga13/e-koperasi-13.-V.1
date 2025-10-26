import React from 'react';
import { LogoBinaWarga } from './LogoBinaWarga';

// The component now renders an SVG, so its props should match SVG element props.
// All current usages in the app only pass `className`, which is compatible.
// This change fixes the broken image issue by using a reliable, built-in SVG component.
export const Logo: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <LogoBinaWarga {...props} />
);
