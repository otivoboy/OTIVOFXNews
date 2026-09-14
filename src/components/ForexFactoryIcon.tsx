import React, { useId } from 'react';

export interface ForexFactoryIconProps {
  className?: string;
  impact?: 'HIGH' | 'MEDIUM' | 'LOW' | 'NONE';
  title?: string;
}

export const ForexFactoryIcon: React.FC<ForexFactoryIconProps> = ({
  className = 'w-4 h-3.5 inline-block flex-shrink-0',
  impact = 'HIGH',
  title = 'High Impact Release (Forex Factory)',
}) => {
  const rawId = useId();
  const gradId = `ff-shadow-${rawId.replace(/[^a-zA-Z0-9_-]/g, '')}`;

  // Default is HIGH (exact colors as provided by user)
  let fillColor = '#FF0000';
  let strokeColor = '#7A0000';
  let bottomLineColor = '#4A0000';
  let dotColor = '#CC0000';

  if (impact === 'MEDIUM') {
    fillColor = '#FF9900';
    strokeColor = '#995C00';
    bottomLineColor = '#663E00';
    dotColor = '#CC7A00';
  } else if (impact === 'LOW') {
    fillColor = '#FFDE00';
    strokeColor = '#998500';
    bottomLineColor = '#665900';
    dotColor = '#CCB200';
  } else if (impact === 'NONE') {
    fillColor = '#94A3B8';
    strokeColor = '#475569';
    bottomLineColor = '#334155';
    dotColor = '#64748B';
  }

  return (
    <svg
      viewBox="0 0 240 200"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      title={title}
      style={{ verticalAlign: 'middle' }}
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#000000" stopOpacity="0" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0.35" />
        </linearGradient>
      </defs>

      {/* Main Red Body & Flames */}
      <path
        d="M 30,160 
           L 30,55 
           Q 42,42 58,42 
           C 65,28 75,18 88,18 
           Q 98,28 98,42 
           C 108,28 120,18 132,18 
           Q 142,28 142,42 
           C 152,28 165,18 178,18 
           Q 188,28 188,42 
           L 210,42 
           L 210,160 
           Z"
        fill={fillColor}
        stroke={strokeColor}
        strokeWidth="5"
        strokeLinejoin="round"
      />

      {/* Darkened Bottom Area */}
      <path
        d="M 30,105 
           L 210,105 
           L 210,160 
           L 30,160 
           Z"
        fill={`url(#${gradId})`}
      />

      {/* Bottom Dark Border */}
      <line x1="30" y1="160" x2="210" y2="160" stroke={bottomLineColor} strokeWidth="6" />

      {/* Three Dots */}
      <circle cx="85" cy="132" r="7" fill={dotColor} />
      <circle cx="120" cy="132" r="7" fill={dotColor} />
      <circle cx="155" cy="132" r="7" fill={dotColor} />
    </svg>
  );
};
