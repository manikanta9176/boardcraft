import React, { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown, Music2, Volume2, VolumeX } from 'lucide-react';
import { MUSIC_TRACKS, MusicTrackId } from '../utils/music';
import { ThemePalette } from '../types/game';

interface AudioMenuProps {
  theme: ThemePalette;
  musicEnabled: boolean;
  musicTrack: MusicTrackId;
  soundEnabled: boolean;
  onToggleMusic: () => void;
  onSelectMusicTrack: (track: MusicTrackId) => void;
  onToggleSound: () => void;
}

export const AudioMenu: React.FC<AudioMenuProps> = ({ theme, musicEnabled, musicTrack, soundEnabled, onToggleMusic, onSelectMusicTrack, onToggleSound }) => {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') setOpen(false); };
    document.addEventListener('pointerdown', close);
    document.addEventListener('keydown', escape);
    return () => {
      document.removeEventListener('pointerdown', close);
      document.removeEventListener('keydown', escape);
    };
  }, [open]);

  const toggleStyle = (active: boolean): React.CSSProperties => ({
    backgroundColor: active ? theme.accentSoft : theme.bgBoard,
    color: active ? theme.accent : theme.textSecondary,
    border: `1px solid ${active ? `${theme.accent}35` : theme.border}`,
  });

  return (
    <div ref={rootRef} className="relative">
      <button
        onClick={() => setOpen((value) => !value)}
        aria-label="Open music and sound settings"
        aria-expanded={open}
        title="Music and sound settings"
        className="inline-flex min-h-11 items-center gap-1 rounded-full px-3 cursor-pointer"
        style={{ backgroundColor: theme.bgSurface, color: musicEnabled ? theme.accent : theme.textSecondary, border: `1px solid ${theme.border}` }}
      >
        <Music2 className="w-4 h-4" />
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <section className="absolute right-0 top-[calc(100%+10px)] z-50 w-[min(19rem,calc(100vw-2rem))] overflow-hidden rounded-2xl p-3 shadow-2xl" style={{ backgroundColor: theme.bgSurface, color: theme.textPrimary, border: `1px solid ${theme.border}` }} aria-label="Audio settings">
          <div className="mb-2 px-1">
            <h2 className="text-sm font-bold">Sound &amp; music</h2>
            <p className="mt-0.5 text-xs" style={{ color: theme.textMuted }}>Set a soundtrack for your game</p>
          </div>
          <button onClick={onToggleMusic} aria-pressed={musicEnabled} className="flex min-h-11 w-full items-center justify-between gap-3 rounded-xl px-3 text-left text-sm font-medium" style={toggleStyle(musicEnabled)}>
            <span className="inline-flex items-center gap-2"><Music2 className="w-4 h-4" />Background music</span><span className="text-xs">{musicEnabled ? 'On' : 'Off'}</span>
          </button>
          <button onClick={onToggleSound} aria-pressed={soundEnabled} className="mt-1.5 flex min-h-11 w-full items-center justify-between gap-3 rounded-xl px-3 text-left text-sm font-medium" style={toggleStyle(soundEnabled)}>
            <span className="inline-flex items-center gap-2">{soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}Game sounds</span><span className="text-xs">{soundEnabled ? 'On' : 'Off'}</span>
          </button>
          <div className="mb-1 mt-4 px-1 text-[10px] font-bold uppercase tracking-[.12em]" style={{ color: theme.textMuted }}>Choose a track</div>
          {MUSIC_TRACKS.map((track) => (
            <button key={track.id} onClick={() => onSelectMusicTrack(track.id)} aria-pressed={musicTrack === track.id} className="flex min-h-11 w-full items-center justify-between gap-3 rounded-xl px-3 text-left transition-colors" style={{ color: musicTrack === track.id ? theme.accent : theme.textSecondary, backgroundColor: musicTrack === track.id ? theme.accentSoft : 'transparent' }}>
              <span><span className="block text-xs font-semibold">{track.name}</span><span className="block text-[10px]" style={{ color: theme.textMuted }}>{track.mood}</span></span>
              {musicTrack === track.id && <Check className="w-4 h-4 shrink-0" />}
            </button>
          ))}
        </section>
      )}
    </div>
  );
};
