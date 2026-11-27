import React from 'react';
import { Lightbulb, X } from 'lucide-react';
import { GameMeta, ThemePalette } from '../types/game';
import { useModalAccessibility } from '../hooks/useModalAccessibility';

interface RulesModalProps {
  game: GameMeta;
  theme: ThemePalette;
  onClose: () => void;
}

export const RulesModal: React.FC<RulesModalProps> = ({ game, theme, onClose }) => {
  const dialogRef = useModalAccessibility(onClose);
  return (
    <div className="modal-backdrop fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
      <button className="fixed inset-0 bg-black/65 backdrop-blur-xs" onClick={onClose} aria-label="Close game rules" />
      <div
        ref={dialogRef}
        className="relative z-10 flex w-full max-w-lg flex-col overflow-hidden rounded-2xl shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="rules-title"
        style={{ maxHeight: 'calc(100dvh - env(safe-area-inset-top) - env(safe-area-inset-bottom) - 1rem)',
          backgroundColor: theme.bgSurface,
          border: `1px solid ${theme.border}`,
          color: theme.textPrimary,
        }}
      >
        <div
          className="flex shrink-0 items-start justify-between gap-4 border-b px-4 pb-3 pt-4 sm:px-6 sm:pb-4 sm:pt-6"
          style={{ borderColor: theme.border }}
        >
          <div>
            <h2 id="rules-title" className="text-lg font-bold">{game.name} — How to Play</h2>
            <p className="text-xs mt-0.5" style={{ color: theme.textMuted }}>
              {game.players} • Typical game: {game.duration}
            </p>
          </div>
          <button
            onClick={onClose}
            className="grid min-h-11 min-w-11 place-items-center rounded-lg cursor-pointer"
            style={{ color: theme.textMuted, backgroundColor: theme.bgBoard }}
            aria-label="Close game rules"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="dialog-scroll-content min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-4 pt-4 sm:px-6 sm:pb-6">
        <div className="space-y-3 mb-5">
          {game.rules.map((rule, idx) => (
            <div key={idx} className="flex gap-3 text-sm leading-relaxed" style={{ color: theme.textSecondary }}>
              <span
                className="w-5 h-5 rounded-full text-xs font-bold flex items-center justify-center shrink-0 mt-0.5"
                style={{ backgroundColor: theme.accentSoft, color: theme.accent }}
              >
                {idx + 1}
              </span>
              <span>{rule}</span>
            </div>
          ))}
        </div>

        <div
          className="rounded-xl p-4"
          style={{ backgroundColor: theme.bgBoard, border: `1px solid ${theme.border}` }}
        >
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: theme.accent }}>
            <Lightbulb className="w-3.5 h-3.5" />
            <span>Strategy Tips</span>
          </div>
          <ul className="space-y-1.5 text-xs leading-relaxed" style={{ color: theme.textSecondary }}>
            {game.tips.map((tip, i) => (
              <li key={i}>• {tip}</li>
            ))}
          </ul>
        </div>
        </div>
      </div>
    </div>
  );
};
