import React from 'react';
import { ThemePalette } from '../types/game';

interface ConfettiBurstProps {
  theme: ThemePalette;
}

const PARTICLES = [
  { left: '8%', delay: '0ms', size: 8, rot: 25 },
  { left: '16%', delay: '90ms', size: 10, rot: -40 },
  { left: '24%', delay: '40ms', size: 7, rot: 70 },
  { left: '33%', delay: '130ms', size: 9, rot: -15 },
  { left: '42%', delay: '20ms', size: 11, rot: 50 },
  { left: '51%', delay: '110ms', size: 8, rot: -65 },
  { left: '60%', delay: '60ms', size: 10, rot: 30 },
  { left: '69%', delay: '150ms', size: 7, rot: -30 },
  { left: '78%', delay: '30ms', size: 9, rot: 85 },
  { left: '86%', delay: '100ms', size: 8, rot: -55 },
  { left: '93%', delay: '70ms', size: 10, rot: 45 },
];

export const ConfettiBurst: React.FC<ConfettiBurstProps> = ({ theme }) => {
  const colors = [theme.accent, theme.p2Color, theme.validHighlight, theme.p1Color];
  return (
    <div className="pointer-events-none fixed inset-x-0 top-12 z-40 h-80 overflow-hidden">
      {PARTICLES.map((p, idx) => (
        <span
          key={idx}
          className="absolute top-0 rounded-xs animate-confetti"
          style={{
            left: p.left,
            width: p.size,
            height: p.size * 0.65,
            backgroundColor: colors[idx % colors.length],
            animationDelay: p.delay,
            transform: `rotate(${p.rot}deg)`,
          }}
        />
      ))}
    </div>
  );
};
