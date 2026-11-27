import React, { useEffect, useState } from 'react';
import {
  Check,
  Copy,
  Globe,
  Link2,
  Loader2,
  Radio,
  Share2,
  Sparkles,
  Wifi,
  X,
} from 'lucide-react';
import { ConnectionPhase, TransportKind, buildRoomInviteUrl, normalizeRoomCode } from '../multiplayer/types';
import { ThemePalette } from '../types/game';
import { QrCodeBox } from './QrCodeBox';

interface MultiplayerModalProps {
  theme: ThemePalette;
  initialTab: 'online' | 'hotspot';
  initialJoinCode?: string;
  phase: ConnectionPhase;
  transportKind: TransportKind | null;
  roomCode: string;
  hotspotOfferCode: string;
  hotspotAnswerCode: string;
  errorMsg: string | null;
  onClose: () => void;
  onCreateRoom: () => void;
  onJoinRoom: (code: string) => void;
  onStartHotspotHost: () => void;
  onAcceptHotspotAnswer: (answerCode: string) => void;
  onJoinHotspotOffer: (offerCode: string) => void;
  onResetConnection: () => void;
}

export const MultiplayerModal: React.FC<MultiplayerModalProps> = ({
  theme,
  initialTab,
  initialJoinCode = '',
  phase,
  transportKind,
  roomCode,
  hotspotOfferCode,
  hotspotAnswerCode,
  errorMsg,
  onClose,
  onCreateRoom,
  onJoinRoom,
  onStartHotspotHost,
  onAcceptHotspotAnswer,
  onJoinHotspotOffer,
  onResetConnection,
}) => {
  const [tab, setTab] = useState<'online' | 'hotspot'>(initialTab);
  const [joinInput, setJoinInput] = useState(initialJoinCode);
  const [hotspotSubMode, setHotspotSubMode] = useState<'host' | 'guest'>('host');
  const [offerInput, setOfferInput] = useState('');
  const [answerInput, setAnswerInput] = useState('');
  const [copiedField, setCopiedField] = useState<string | null>(null);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const inviteUrl = roomCode ? buildRoomInviteUrl(roomCode) : '';

  const copyText = (text: string, field: string) => {
    navigator.clipboard?.writeText(text).catch(() => {});
    setCopiedField(field);
    window.setTimeout(() => setCopiedField(null), 1800);
  };

  const nativeShare = async () => {
    if (!inviteUrl || !navigator.share) return;
    try {
      await navigator.share({
        title: 'Join my BoardCraft match!',
        text: `Join Room ${roomCode} on BoardCraft:`,
        url: inviteUrl,
      });
    } catch {
      // User cancelled share sheet
    }
  };

  const isBusy = phase === 'initializing' || phase === 'connecting';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <div
        className="relative z-10 w-full max-w-xl rounded-3xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto animate-pop-in"
        role="dialog"
        aria-modal="true"
        aria-labelledby="multiplayer-title"
        aria-describedby="multiplayer-description"
        style={{
          backgroundColor: theme.bgSurface,
          border: `1px solid ${theme.border}`,
          color: theme.textPrimary,
        }}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-5">
          <div>
            <div className="flex items-center gap-2">
              <span
                className="w-8 h-8 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: theme.accentSoft, color: theme.accent }}
              >
                <Radio className="w-4 h-4" />
              </span>
              <h2 id="multiplayer-title" className="text-lg font-bold tracking-tight">Play with a friend</h2>
            </div>
            <p id="multiplayer-description" className="text-xs mt-1" style={{ color: theme.textMuted }}>
              No account needed. Online rooms need internet; local pairing uses the same Wi-Fi or hotspot.
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close multiplayer window"
            className="p-1.5 rounded-xl cursor-pointer"
            style={{ backgroundColor: theme.bgBoard, color: theme.textMuted }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Transport Tabs */}
        <div
          className="grid grid-cols-2 p-1 rounded-xl gap-1 mb-5"
          style={{ backgroundColor: theme.bgBoard, border: `1px solid ${theme.border}` }}
        >
          <button
            onClick={() => setTab('online')}
            disabled={phase === 'connected'}
            className="flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer"
            style={{
              backgroundColor: tab === 'online' ? theme.bgSurface : 'transparent',
              color: tab === 'online' ? theme.accent : theme.textMuted,
              boxShadow: tab === 'online' ? '0 2px 6px rgba(0,0,0,0.2)' : 'none',
            }}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Online Room (Code / QR)</span>
          </button>
          <button
            onClick={() => setTab('hotspot')}
            disabled={phase === 'connected'}
            className="flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer"
            style={{
              backgroundColor: tab === 'hotspot' ? theme.bgSurface : 'transparent',
              color: tab === 'hotspot' ? theme.validHighlight : theme.textMuted,
              boxShadow: tab === 'hotspot' ? '0 2px 6px rgba(0,0,0,0.2)' : 'none',
            }}
          >
            <Wifi className="w-3.5 h-3.5" />
            <span>Local Wi-Fi</span>
          </button>
        </div>

        {errorMsg && (
          <div
            className="mb-4 rounded-xl px-3.5 py-2.5 text-xs font-medium flex items-center justify-between gap-2"
            style={{
              backgroundColor: theme.captureHighlight + '1F',
              color: theme.captureHighlight,
              border: `1px solid ${theme.captureHighlight}55`,
            }}
          >
            <span>{errorMsg}</span>
            <button onClick={onResetConnection} className="underline cursor-pointer shrink-0">
              Reset
            </button>
          </div>
        )}

        {phase === 'connected' && (
          <div className="mb-4 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3" style={{ backgroundColor: theme.accentSoft, border: `1px solid ${theme.accent}44` }}>
            <div>
              <div className="text-sm font-bold" style={{ color: theme.textPrimary }}>You&apos;re connected</div>
              <p className="text-xs mt-1" style={{ color: theme.textSecondary }}>
                {transportKind === 'online-room' ? `Room ${roomCode} is live.` : 'Your local connection is live.'} Return to the board to continue the match.
              </p>
            </div>
            <button onClick={onClose} className="rounded-xl px-3.5 py-2 text-xs font-bold shrink-0" style={{ backgroundColor: theme.accent, color: theme.isDark ? '#07111A' : '#FFFFFF' }}>Back to game</button>
          </div>
        )}

        {/* TAB 1: ONLINE ROOM */}
        {phase !== 'connected' && tab === 'online' && (
          <div className="space-y-4">
            {transportKind === 'online-room' && roomCode && (phase === 'waiting' || phase === 'initializing') ? (
              <div
                className="rounded-2xl p-5 text-center space-y-4"
                style={{ backgroundColor: theme.bgBoard, border: `1px solid ${theme.border}` }}
              >
                <div className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-1 rounded-full" style={{ backgroundColor: theme.accentSoft, color: theme.accent }}>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>{phase === 'initializing' ? 'Opening Room…' : 'Waiting for opponent to join…'}</span>
                </div>

                <div>
                  <div className="text-[11px] uppercase tracking-wider mb-1" style={{ color: theme.textMuted }}>
                    Room Code
                  </div>
                  <div className="text-3xl font-mono font-extrabold tracking-[0.22em]" style={{ color: theme.textPrimary }}>
                    {roomCode}
                  </div>
                </div>

                <div className="flex justify-center">
                  <QrCodeBox value={inviteUrl} size={148} />
                </div>
                <p className="text-[11px]" style={{ color: theme.textMuted }}>
                  Scan the QR code or share the invite link. Both players need internet to join this room.
                </p>

                <div className="flex flex-wrap items-center justify-center gap-2">
                  <button
                    onClick={() => copyText(roomCode, 'code')}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer"
                    style={{ backgroundColor: theme.bgSurface, border: `1px solid ${theme.border}` }}
                  >
                    {copiedField === 'code' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedField === 'code' ? 'Copied Code' : 'Copy Code'}</span>
                  </button>
                  <button
                    onClick={() => copyText(inviteUrl, 'link')}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer"
                    style={{ backgroundColor: theme.bgSurface, border: `1px solid ${theme.border}` }}
                  >
                    {copiedField === 'link' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Link2 className="w-3.5 h-3.5" />}
                    <span>{copiedField === 'link' ? 'Copied Link' : 'Copy Invite Link'}</span>
                  </button>
                  {typeof navigator !== 'undefined' && 'share' in navigator && (
                    <button
                      onClick={nativeShare}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer"
                      style={{ backgroundColor: theme.accentSoft, color: theme.accent }}
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      <span>Share</span>
                    </button>
                  )}
                </div>

                <button
                  onClick={onResetConnection}
                  className="text-xs underline cursor-pointer"
                  style={{ color: theme.textMuted }}
                >
                  Cancel Room
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Host Card */}
                <div
                  className="rounded-2xl p-4 flex flex-col justify-between gap-4"
                  style={{ backgroundColor: theme.bgBoard, border: `1px solid ${theme.border}` }}
                >
                  <div>
                    <div className="text-sm font-bold flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4" style={{ color: theme.accent }} />
                      <span>Create a Room</span>
                    </div>
                    <p className="text-xs mt-1 leading-relaxed" style={{ color: theme.textSecondary }}>
                      Generate a 6-character code &amp; QR invite. You control game switching and rematch.
                    </p>
                  </div>
                  <button
                    onClick={onCreateRoom}
                    disabled={isBusy}
                    className="w-full py-2.5 rounded-xl text-xs font-bold cursor-pointer disabled:opacity-50 transition-transform active:scale-95"
                    style={{
                      backgroundColor: theme.accent,
                      color: theme.isDark ? '#070B14' : '#FFFFFF',
                    }}
                  >
                    Create Room
                  </button>
                </div>

                {/* Join Card */}
                <div
                  className="rounded-2xl p-4 flex flex-col justify-between gap-3"
                  style={{ backgroundColor: theme.bgBoard, border: `1px solid ${theme.border}` }}
                >
                  <div>
                    <div className="text-sm font-bold">Join a Room</div>
                    <p className="text-xs mt-1" style={{ color: theme.textSecondary }}>
                      Enter the 6-character code shared by the host.
                    </p>
                  </div>
                  <div className="space-y-2.5">
                    <input
                      type="text"
                      value={joinInput}
                      aria-label="Room code"
                      onChange={(e) => setJoinInput(normalizeRoomCode(e.target.value))}
                      placeholder="e.g. K7M9P2"
                      maxLength={8}
                      className="w-full px-3 py-2 rounded-xl text-sm font-mono font-bold tracking-widest uppercase outline-none"
                      style={{
                        backgroundColor: theme.bgSurface,
                        color: theme.textPrimary,
                        border: `1px solid ${theme.border}`,
                      }}
                    />
                    <button
                      onClick={() => joinInput.length >= 4 && onJoinRoom(joinInput)}
                      disabled={isBusy || joinInput.length < 4}
                      className="w-full py-2.5 rounded-xl text-xs font-bold cursor-pointer disabled:opacity-45 flex items-center justify-center gap-1.5"
                      style={{
                        backgroundColor: theme.validHighlight,
                        color: '#FFFFFF',
                      }}
                    >
                      {phase === 'connecting' && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                      <span>{phase === 'connecting' ? 'Connecting…' : 'Join Room'}</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: HOTSPOT DIRECT (OFFLINE ZERO-INTERNET) */}
        {phase !== 'connected' && tab === 'hotspot' && (
          <div className="space-y-4">
            <div
              className="rounded-xl px-3.5 py-2.5 text-xs leading-relaxed"
              style={{ backgroundColor: theme.bgBoard, color: theme.textSecondary, border: `1px solid ${theme.border}` }}
            >
              <strong>Local pairing:</strong> Put both devices on the same Wi-Fi or hotspot, then exchange the offer and answer codes. Some hotspot networks block device-to-device traffic.
            </div>

            <div className="flex gap-2">
              {(['host', 'guest'] as const).map((role) => (
                <button
                  key={role}
                  onClick={() => setHotspotSubMode(role)}
                  className="flex-1 py-2 rounded-xl text-xs font-semibold cursor-pointer capitalize"
                  style={{
                    backgroundColor: hotspotSubMode === role ? theme.accentSoft : theme.bgBoard,
                    color: hotspotSubMode === role ? theme.accent : theme.textMuted,
                    border: `1px solid ${hotspotSubMode === role ? theme.accent + '55' : theme.border}`,
                  }}
                >
                  {role === 'host' ? '1. Host on Hotspot' : '2. Join on Hotspot'}
                </button>
              ))}
            </div>

            {hotspotSubMode === 'host' ? (
              <div className="space-y-3 rounded-2xl p-4" style={{ backgroundColor: theme.bgBoard, border: `1px solid ${theme.border}` }}>
                {!hotspotOfferCode ? (
                  <button
                    onClick={onStartHotspotHost}
                    disabled={isBusy}
                    className="w-full py-2.5 rounded-xl text-xs font-bold cursor-pointer"
                    style={{ backgroundColor: theme.validHighlight, color: '#FFFFFF' }}
                  >
                    Generate Hotspot Pairing Code
                  </button>
                ) : (
                  <>
                    <div className="text-xs font-semibold" style={{ color: theme.textPrimary }}>
                      Step 1: Send this Offer Code to your friend (AirDrop / Nearby / Copy)
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        readOnly
                        value={hotspotOfferCode}
                        aria-label="Hotspot offer code"
                        className="flex-1 px-2.5 py-2 rounded-lg text-[11px] font-mono outline-none"
                        style={{ backgroundColor: theme.bgSurface, color: theme.textSecondary, border: `1px solid ${theme.border}` }}
                      />
                      <button
                        onClick={() => copyText(hotspotOfferCode, 'offer')}
                        className="px-3 py-2 rounded-lg text-xs font-semibold cursor-pointer shrink-0"
                        style={{ backgroundColor: theme.accentSoft, color: theme.accent }}
                      >
                        {copiedField === 'offer' ? 'Copied!' : 'Copy'}
                      </button>
                    </div>

                    <div className="text-xs font-semibold pt-2" style={{ color: theme.textPrimary }}>
                      Step 2: Paste your friend&apos;s Answer Code to link
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        value={answerInput}
                        aria-label="Host answer code"
                        onChange={(e) => setAnswerInput(e.target.value)}
                        placeholder="Paste BC1:... answer code"
                        className="flex-1 px-2.5 py-2 rounded-lg text-[11px] font-mono outline-none"
                        style={{ backgroundColor: theme.bgSurface, color: theme.textPrimary, border: `1px solid ${theme.border}` }}
                      />
                      <button
                        onClick={() => answerInput.trim() && onAcceptHotspotAnswer(answerInput.trim())}
                        disabled={!answerInput.trim()}
                        className="px-3.5 py-2 rounded-lg text-xs font-bold cursor-pointer disabled:opacity-45 shrink-0"
                        style={{ backgroundColor: theme.validHighlight, color: '#FFFFFF' }}
                      >
                        Connect
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="space-y-3 rounded-2xl p-4" style={{ backgroundColor: theme.bgBoard, border: `1px solid ${theme.border}` }}>
                <div className="text-xs font-semibold" style={{ color: theme.textPrimary }}>
                  Step 1: Paste Host&apos;s Offer Code
                </div>
                <div className="flex items-center gap-2">
                  <input
                    value={offerInput}
                    aria-label="Host offer code"
                    onChange={(e) => setOfferInput(e.target.value)}
                    placeholder="Paste BC1:... offer code"
                    className="flex-1 px-2.5 py-2 rounded-lg text-[11px] font-mono outline-none"
                    style={{ backgroundColor: theme.bgSurface, color: theme.textPrimary, border: `1px solid ${theme.border}` }}
                  />
                  <button
                    onClick={() => offerInput.trim() && onJoinHotspotOffer(offerInput.trim())}
                    disabled={!offerInput.trim() || isBusy}
                    className="px-3.5 py-2 rounded-lg text-xs font-bold cursor-pointer disabled:opacity-45 shrink-0"
                    style={{ backgroundColor: theme.validHighlight, color: '#FFFFFF' }}
                  >
                    Generate Answer
                  </button>
                </div>

                {hotspotAnswerCode && (
                  <>
                    <div className="text-xs font-semibold pt-2" style={{ color: theme.textPrimary }}>
                      Step 2: Send this Answer Code back to the Host
                    </div>
                    <p className="text-[11px]" style={{ color: theme.textMuted }}>Wait for the host to paste it and accept the connection.</p>
                    <div className="flex items-center gap-2">
                      <input
                        readOnly
                        value={hotspotAnswerCode}
                        aria-label="Hotspot answer code"
                        className="flex-1 px-2.5 py-2 rounded-lg text-[11px] font-mono outline-none"
                        style={{ backgroundColor: theme.bgSurface, color: theme.textSecondary, border: `1px solid ${theme.border}` }}
                      />
                      <button
                        onClick={() => copyText(hotspotAnswerCode, 'answer')}
                        className="px-3 py-2 rounded-lg text-xs font-semibold cursor-pointer shrink-0"
                        style={{ backgroundColor: theme.accentSoft, color: theme.accent }}
                      >
                        {copiedField === 'answer' ? 'Copied!' : 'Copy'}
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
            {(hotspotOfferCode || hotspotAnswerCode) && (
              <div className="text-right">
                <button onClick={onResetConnection} className="text-xs underline" style={{ color: theme.textMuted }}>Cancel pairing</button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
