import React from 'react';
import { Lightbulb, X } from 'lucide-react';
import { GameMeta, ThemePalette } from '../types/game';

interface RulesModalProps {
  game: GameMeta;
  theme: ThemePalette;
  onClose: () => void;
}

export const RulesModal: React.FC<RulesModalProps> = ({ game, theme, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/65 backdrop-blur-xs" onClick={onClose} />
      <div
        className="relative z-10 w-full max-w-lg rounded-2xl p-6 shadow-2xl max-h-[85vh] overflow-y-auto"
        style={{
          backgroundColor: theme.bgSurface,
          border: `1px solid ${theme.border}`,
          color: theme.textPrimary,
        }}
      >
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h2 className="text-lg font-bold">{game.name} — How to Play</h2>
            <p className="text-xs mt-0.5" style={{ color: theme.textMuted }}>
              {game.players} • Typical game: {game.duration}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg cursor-pointer"
            style={{ color: theme.textMuted, backgroundColor: theme.bgBoard }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

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
  );
};
