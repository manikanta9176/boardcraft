import React from 'react';
import { ArrowLeft, Grid3X3 } from 'lucide-react';
import { ThemePalette } from '../types/game';

interface NotFoundViewProps {
  path: string;
  theme: ThemePalette;
  onGoHome: () => void;
}

export const NotFoundView: React.FC<NotFoundViewProps> = ({ path, theme, onGoHome }) => (
  <main className="flex min-h-full items-center justify-center px-5 py-12 text-center">
    <div className="max-w-md">
      <div className="mx-auto mb-5 grid h-14 w-14 place-items-center rounded-2xl" style={{ backgroundColor: theme.accentSoft, color: theme.accent }}>
        <Grid3X3 className="h-6 w-6" />
      </div>
      <p className="text-sm font-semibold" style={{ color: theme.accent }}>That board is missing</p>
      <h1 className="display-face mt-2 text-3xl font-bold tracking-[-.05em]" style={{ color: theme.textPrimary }}>We can’t find this game</h1>
      <p className="mt-3 text-sm leading-relaxed" style={{ color: theme.textSecondary }}>
        The link <code className="rounded bg-black/10 px-1.5 py-0.5">{path}</code> doesn’t match a board in the collection.
      </p>
      <button onClick={onGoHome} className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-xl px-4 text-sm font-bold" style={{ backgroundColor: theme.accent, color: theme.bgApp }}>
        <ArrowLeft className="h-4 w-4" /> Back to the game library
      </button>
    </div>
  </main>
);
