import React, { useCallback, useEffect, useState } from 'react';
import {
  Check,
  Camera,
  Copy,
  Globe,
  Link2,
  Loader2,
  Search,
  Radio,
  Share2,
  Sparkles,
  ScanLine,
  Wifi,
  X,
} from 'lucide-react';
import { ConnectionPhase, TransportKind, buildRoomInviteUrl, normalizeRoomCode } from '../multiplayer/types';
import { GameId, ThemePalette } from '../types/game';
import { GAMES, getGameModes } from '../games/registry';
import { findNearbyGames, NearbyGameListing } from '../multiplayer/nearbyDiscovery';
import { QrCodeBox } from './QrCodeBox';
import { NearbyQrScanner } from './NearbyQrScanner';
import { useModalAccessibility } from '../hooks/useModalAccessibility';

interface MultiplayerModalProps {
  theme: ThemePalette;
  gameId: GameId;
  initialTab: 'online' | 'hotspot';
  initialJoinCode?: string;
  phase: ConnectionPhase;
  transportKind: TransportKind | null;
  nearbyHostActive: boolean;
  roomCode: string;
  hotspotOfferCode: string;
  hotspotAnswerCode: string;
  errorMsg: string | null;
  onClose: () => void;
  onCreateRoom: () => void;
  onJoinRoom: (code: string) => void;
  onStartNearbyHost: (gameId: GameId) => void;
  onJoinNearbyGame: (room: NearbyGameListing) => void;
  onStartHotspotHost: () => void;
  onAcceptHotspotAnswer: (answerCode: string) => void;
  onJoinHotspotOffer: (offerCode: string) => void;
  onResetConnection: () => void;
}

export const MultiplayerModal: React.FC<MultiplayerModalProps> = ({
  theme,
  gameId,
  initialTab,
  initialJoinCode = '',
  phase,
  transportKind,
  nearbyHostActive,
  roomCode,
  hotspotOfferCode,
  hotspotAnswerCode,
  errorMsg,
  onClose,
  onCreateRoom,
  onJoinRoom,
  onStartNearbyHost,
  onJoinNearbyGame,
  onStartHotspotHost,
  onAcceptHotspotAnswer,
  onJoinHotspotOffer,
  onResetConnection,
}) => {
  const dialogRef = useModalAccessibility(onClose);
  const [tab, setTab] = useState<'online' | 'hotspot'>(initialTab);
  const [joinInput, setJoinInput] = useState(initialJoinCode);
  const [hotspotSubMode, setHotspotSubMode] = useState<'host' | 'guest'>('host');
  const [offerInput, setOfferInput] = useState('');
  const [answerInput, setAnswerInput] = useState('');
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [scanTarget, setScanTarget] = useState<'offer' | 'answer' | null>(null);
  const [manualEntry, setManualEntry] = useState(false);
  const [useQrFallback, setUseQrFallback] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [hostGameId, setHostGameId] = useState<GameId>(() =>
    GAMES.find((game) => game.id === gameId && getGameModes(game).includes('online'))?.id ?? GAMES.find((game) => getGameModes(game).includes('online'))!.id,
  );
  const [nearbyRooms, setNearbyRooms] = useState<NearbyGameListing[]>([]);
  const [nearbySearchActive, setNearbySearchActive] = useState(false);
  const [nearbySearchLoading, setNearbySearchLoading] = useState(false);
  const [nearbySearchError, setNearbySearchError] = useState<string | null>(null);

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
        title: 'Join my PlayDeck match!',
        text: `Join Room ${roomCode} on PlayDeck:`,
        url: inviteUrl,
      });
    } catch {
      // User cancelled share sheet
    }
  };

  const handleScannedPairingQr = (value: string) => {
    const target = scanTarget;
    setScanTarget(null);
    setScanError(null);
    if (!value.startsWith('BC1:')) {
      setScanError('That QR code is not a PlayDeck local pairing code. Scan the code shown in your friend’s game.');
      return;
    }
    if (target === 'offer') onJoinHotspotOffer(value);
    if (target === 'answer') onAcceptHotspotAnswer(value);
  };

  const openScanner = (target: 'offer' | 'answer') => {
    setScanError(null);
    setScanTarget(target);
  };

  const useManualEntry = () => {
    setScanTarget(null);
    setManualEntry(true);
  };

  const isBusy = phase === 'initializing' || phase === 'connecting';

  const refreshNearbyGames = useCallback(async () => {
    setNearbySearchLoading(true);
    try {
      setNearbyRooms(await findNearbyGames());
      setNearbySearchError(null);
    } catch (error) {
      setNearbySearchActive(false);
      setNearbySearchError(error instanceof Error ? error.message : 'Nearby discovery is temporarily unavailable.');
    } finally {
      setNearbySearchLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!nearbySearchActive || tab !== 'hotspot' || hotspotSubMode !== 'guest' || useQrFallback) return;
    void refreshNearbyGames();
    const timer = window.setInterval(() => void refreshNearbyGames(), 5000);
    return () => window.clearInterval(timer);
  }, [hotspotSubMode, nearbySearchActive, refreshNearbyGames, tab, useQrFallback]);

  return (
    <div className="modal-backdrop fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <div
        ref={dialogRef}
        className="relative z-10 flex w-full max-w-xl flex-col overflow-hidden rounded-3xl shadow-2xl animate-pop-in"
        role="dialog"
        aria-modal="true"
        aria-labelledby="multiplayer-title"
        aria-describedby="multiplayer-description"
        style={{
          maxHeight: 'calc(100dvh - env(safe-area-inset-top) - env(safe-area-inset-bottom) - 1rem)',
          backgroundColor: theme.bgSurface,
          border: `1px solid ${theme.border}`,
          color: theme.textPrimary,
        }}
      >
        {/* Header */}
        <div
          className="flex shrink-0 items-start justify-between gap-3 border-b px-4 pb-4 pt-4 sm:px-6 sm:pb-5 sm:pt-6"
          style={{ borderColor: theme.border }}
        >
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
              Online rooms work over the internet. Nearby play finds friends on your Wi-Fi or hotspot, then sends moves directly between devices.
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close multiplayer window"
            className="grid min-h-11 min-w-11 shrink-0 place-items-center rounded-xl cursor-pointer"
            style={{ backgroundColor: theme.bgBoard, color: theme.textMuted }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="dialog-scroll-content min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-4 pt-4 sm:px-6 sm:pb-6 sm:pt-5">
        {/* Transport Tabs */}
        <div
          className="grid grid-cols-2 p-1 rounded-xl gap-1 mb-5"
          style={{ backgroundColor: theme.bgBoard, border: `1px solid ${theme.border}` }}
        >
          <button
            onClick={() => setTab('online')}
            disabled={phase === 'connected'}
            className="flex min-h-11 items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer"
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
            className="flex min-h-11 items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer"
            style={{
              backgroundColor: tab === 'hotspot' ? theme.bgSurface : 'transparent',
              color: tab === 'hotspot' ? theme.validHighlight : theme.textMuted,
              boxShadow: tab === 'hotspot' ? '0 2px 6px rgba(0,0,0,0.2)' : 'none',
            }}
          >
            <Wifi className="w-3.5 h-3.5" />
            <span>Nearby Wi-Fi</span>
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

        {/* TAB 2: NEARBY LOCAL PLAY */}
        {phase !== 'connected' && tab === 'hotspot' && (
          <div className="space-y-4">
            <div
              className="rounded-xl px-3.5 py-2.5 text-xs leading-relaxed"
              style={{ backgroundColor: theme.bgBoard, color: theme.textSecondary, border: `1px solid ${theme.border}` }}
            >
              <strong>Same-place play:</strong> Put both devices on the same Wi-Fi or hotspot. Internet is used only to find each other; the game connection stays direct between devices.
            </div>

            {scanError && (
              <div className="rounded-xl px-3.5 py-2.5 text-xs leading-relaxed" role="alert" style={{ backgroundColor: `${theme.captureHighlight}1A`, color: theme.captureHighlight, border: `1px solid ${theme.captureHighlight}55` }}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span>{scanError}</span>
                  <button onClick={() => { setScanError(null); openScanner(hotspotSubMode === 'host' ? 'answer' : 'offer'); }} className="shrink-0 underline">Try scanning again</button>
                </div>
              </div>
            )}

            <div className="flex gap-2">
              {(['host', 'guest'] as const).map((role) => (
                <button
                  key={role}
                  onClick={() => { setHotspotSubMode(role); setManualEntry(false); setScanTarget(null); setScanError(null); setNearbySearchActive(false); setNearbySearchError(null); }}
                  className="flex min-h-11 flex-1 items-center justify-center rounded-xl py-2 text-xs font-semibold cursor-pointer capitalize"
                  style={{
                    backgroundColor: hotspotSubMode === role ? theme.accentSoft : theme.bgBoard,
                    color: hotspotSubMode === role ? theme.accent : theme.textMuted,
                    border: `1px solid ${hotspotSubMode === role ? theme.accent + '55' : theme.border}`,
                  }}
                >
                  {role === 'host' ? 'Host a game' : 'Join a game'}
                </button>
              ))}
            </div>

            {useQrFallback ? (
              <>
                <div className="rounded-xl px-3.5 py-2.5 text-xs leading-relaxed" style={{ backgroundColor: theme.accentSoft, color: theme.textSecondary, border: `1px solid ${theme.accent}44` }}>
                  <strong style={{ color: theme.accent }}>Offline pairing:</strong> Use the QR offer and reply if the devices have no internet connection.
                </div>
            {scanTarget ? (
              <NearbyQrScanner
                theme={theme}
                onDetected={handleScannedPairingQr}
                onClose={() => setScanTarget(null)}
                onManualEntry={useManualEntry}
              />
            ) : hotspotSubMode === 'host' ? (
              <div className="space-y-4 rounded-2xl p-4" style={{ backgroundColor: theme.bgBoard, border: `1px solid ${theme.border}` }}>
                {!hotspotOfferCode ? (
                  <div className="space-y-3">
                    <div>
                      <div className="text-sm font-bold" style={{ color: theme.textPrimary }}>Create a local game</div>
                      <p className="mt-1 text-xs leading-relaxed" style={{ color: theme.textSecondary }}>Keep this screen open. Your friend can join by scanning the QR that appears here.</p>
                    </div>
                    <button onClick={onStartHotspotHost} disabled={isBusy} className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold disabled:opacity-50" style={{ backgroundColor: theme.validHighlight, color: '#FFFFFF' }}>
                      {isBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wifi className="h-4 w-4" />}
                      {isBusy ? 'Preparing nearby game…' : 'Start nearby game'}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-center gap-2 text-xs font-semibold" style={{ color: theme.validHighlight }}>
                      <span className="h-2 w-2 animate-pulse rounded-full" style={{ backgroundColor: theme.validHighlight }} />
                      Waiting for a nearby player
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-bold" style={{ color: theme.textPrimary }}>Let your friend scan this</p>
                      <p className="mt-1 text-xs" style={{ color: theme.textMuted }}>Both devices need to be on the same Wi-Fi or hotspot.</p>
                    </div>
                    <div className="flex justify-center"><QrCodeBox value={hotspotOfferCode} size={220} label="QR code for a friend to scan and join this local game" /></div>
                    <button onClick={onResetConnection} className="w-full rounded-xl px-4 py-2.5 text-xs font-semibold" style={{ backgroundColor: theme.bgSurface, color: theme.captureHighlight, border: `1px solid ${theme.border}` }}>
                      Cancel offline pairing
                    </button>
                    <div className="grid gap-2 sm:grid-cols-2">
                      <button onClick={() => openScanner('answer')} className="flex min-h-11 items-center justify-center gap-2 rounded-full px-4 py-2.5 text-xs font-semibold" style={{ backgroundColor: theme.accent, color: theme.bgApp }}>
                        <ScanLine className="h-4 w-4" /> Scan their reply
                      </button>
                      <button onClick={() => setManualEntry((open) => !open)} className="flex min-h-11 items-center justify-center gap-2 rounded-full px-4 py-2.5 text-xs font-semibold" style={{ backgroundColor: theme.bgSurface, color: theme.textSecondary, border: `1px solid ${theme.border}` }}>
                        <Copy className="h-4 w-4" /> {manualEntry ? 'Hide text fallback' : 'Text fallback'}
                      </button>
                    </div>
                    {manualEntry && (
                      <div className="space-y-2 rounded-xl p-3" style={{ backgroundColor: theme.bgSurface, border: `1px solid ${theme.border}` }}>
                        <label htmlFor="nearby-offer" className="block text-xs font-semibold" style={{ color: theme.textPrimary }}>Offer code</label>
                        <div className="flex gap-2">
                          <input id="nearby-offer" readOnly value={hotspotOfferCode} className="min-w-0 flex-1 rounded-lg px-2.5 py-2 text-[10px] font-mono" style={{ backgroundColor: theme.bgBoard, color: theme.textSecondary, border: `1px solid ${theme.border}` }} />
                          <button onClick={() => copyText(hotspotOfferCode, 'offer')} className="rounded-lg px-3 text-xs font-semibold" style={{ backgroundColor: theme.accentSoft, color: theme.accent }}>{copiedField === 'offer' ? 'Copied' : 'Copy'}</button>
                        </div>
                        <label htmlFor="nearby-answer" className="block pt-2 text-xs font-semibold" style={{ color: theme.textPrimary }}>Paste your friend&apos;s reply</label>
                        <div className="flex gap-2">
                          <input id="nearby-answer" value={answerInput} onChange={(event) => setAnswerInput(event.target.value)} placeholder="Paste reply code" className="min-w-0 flex-1 rounded-lg px-2.5 py-2 text-[10px] font-mono" style={{ backgroundColor: theme.bgBoard, color: theme.textPrimary, border: `1px solid ${theme.border}` }} />
                          <button onClick={() => answerInput.trim() && onAcceptHotspotAnswer(answerInput.trim())} disabled={!answerInput.trim()} className="rounded-lg px-3 text-xs font-bold disabled:opacity-45" style={{ backgroundColor: theme.validHighlight, color: '#FFFFFF' }}>Connect</button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4 rounded-2xl p-4" style={{ backgroundColor: theme.bgBoard, border: `1px solid ${theme.border}` }}>
                {hotspotAnswerCode ? (
                  <div className="space-y-4">
                    <div className="text-center">
                      <div className="text-sm font-bold" style={{ color: theme.textPrimary }}>Show this reply to the host</div>
                      <p className="mt-1 text-xs" style={{ color: theme.textSecondary }}>The host scans it to finish connecting. Keep this screen open.</p>
                    </div>
                    <div className="flex justify-center"><QrCodeBox value={hotspotAnswerCode} size={220} label="QR code for the host to scan and finish local pairing" /></div>
                    <button onClick={onResetConnection} className="w-full rounded-xl px-4 py-2.5 text-xs font-semibold" style={{ backgroundColor: theme.bgSurface, color: theme.captureHighlight, border: `1px solid ${theme.border}` }}>
                      Cancel offline pairing
                    </button>
                    <div className="flex justify-center">
                      <button onClick={() => setManualEntry((open) => !open)} className="flex min-h-11 items-center justify-center gap-2 rounded-full px-4 py-2.5 text-xs font-semibold" style={{ backgroundColor: theme.bgSurface, color: theme.textSecondary, border: `1px solid ${theme.border}` }}>
                        <Copy className="h-4 w-4" /> {manualEntry ? 'Hide text fallback' : 'Text fallback'}
                      </button>
                    </div>
                    {manualEntry && (
                      <div className="flex gap-2 rounded-xl p-3" style={{ backgroundColor: theme.bgSurface, border: `1px solid ${theme.border}` }}>
                        <input readOnly value={hotspotAnswerCode} aria-label="Nearby pairing reply code" className="min-w-0 flex-1 rounded-lg px-2.5 py-2 text-[10px] font-mono" style={{ backgroundColor: theme.bgBoard, color: theme.textSecondary, border: `1px solid ${theme.border}` }} />
                        <button onClick={() => copyText(hotspotAnswerCode, 'answer')} className="rounded-lg px-3 text-xs font-semibold" style={{ backgroundColor: theme.accentSoft, color: theme.accent }}>{copiedField === 'answer' ? 'Copied' : 'Copy'}</button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div>
                      <div className="text-sm font-bold" style={{ color: theme.textPrimary }}>Join a nearby game</div>
                      <p className="mt-1 text-xs leading-relaxed" style={{ color: theme.textSecondary }}>Ask the host to start a local game, then scan the QR on their screen.</p>
                    </div>
                    <button onClick={() => openScanner('offer')} disabled={isBusy} className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold disabled:opacity-50" style={{ backgroundColor: theme.validHighlight, color: '#FFFFFF' }}>
                      <Camera className="h-4 w-4" /> Scan host QR
                    </button>
                    <button onClick={() => setManualEntry((open) => !open)} className="w-full py-1 text-xs font-medium underline" style={{ color: theme.textMuted }}>{manualEntry ? 'Hide text fallback' : 'Can’t scan? Enter a code instead'}</button>
                    {manualEntry && (
                      <div className="space-y-2 rounded-xl p-3" style={{ backgroundColor: theme.bgSurface, border: `1px solid ${theme.border}` }}>
                        <label htmlFor="nearby-join-offer" className="block text-xs font-semibold" style={{ color: theme.textPrimary }}>Host&apos;s offer code</label>
                        <div className="flex gap-2">
                          <input id="nearby-join-offer" value={offerInput} onChange={(event) => setOfferInput(event.target.value)} placeholder="Paste host code" className="min-w-0 flex-1 rounded-lg px-2.5 py-2 text-[10px] font-mono" style={{ backgroundColor: theme.bgBoard, color: theme.textPrimary, border: `1px solid ${theme.border}` }} />
                          <button onClick={() => offerInput.trim() && onJoinHotspotOffer(offerInput.trim())} disabled={!offerInput.trim() || isBusy} className="rounded-lg px-3 text-xs font-bold disabled:opacity-45" style={{ backgroundColor: theme.validHighlight, color: '#FFFFFF' }}>Join</button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
                <button onClick={() => { if (transportKind === 'hotspot-direct') onResetConnection(); setUseQrFallback(false); setScanTarget(null); setScanError(null); }} className="w-full py-2 text-xs font-medium underline" style={{ color: theme.textMuted }}>
                  Back to Find nearby
                </button>
              </>
            ) : (
              <div className="space-y-4">
                {hotspotSubMode === 'host' ? (
                  nearbyHostActive ? (
                    <div className="space-y-3 rounded-2xl p-4" style={{ backgroundColor: theme.bgBoard, border: `1px solid ${theme.validHighlight}55` }}>
                      <div className="flex items-center gap-2 text-sm font-bold" style={{ color: theme.validHighlight }}>
                        <span className="h-2 w-2 animate-pulse rounded-full" style={{ backgroundColor: theme.validHighlight }} />
                        Nearby game is visible
                      </div>
                      <p className="text-xs leading-relaxed" style={{ color: theme.textSecondary }}>
                        Your {GAMES.find((game) => game.id === gameId)?.shortName ?? 'board'} is listed for players on this network. Keep this screen open while they join.
                      </p>
                      <button onClick={onResetConnection} className="min-h-11 w-full rounded-xl px-4 py-2.5 text-xs font-semibold" style={{ backgroundColor: theme.bgSurface, color: theme.captureHighlight, border: `1px solid ${theme.border}` }}>
                        Stop hosting
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3 rounded-2xl p-4" style={{ backgroundColor: theme.bgBoard, border: `1px solid ${theme.border}` }}>
                      <div>
                        <div className="text-sm font-bold" style={{ color: theme.textPrimary }}>Host a nearby game</div>
                        <p className="mt-1 text-xs leading-relaxed" style={{ color: theme.textSecondary }}>Choose a board, then friends on the same Wi-Fi or hotspot can find and join it.</p>
                      </div>
                      <label className="block text-xs font-semibold" htmlFor="nearby-host-game" style={{ color: theme.textMuted }}>Game</label>
                      <select
                        id="nearby-host-game"
                        value={hostGameId}
                        onChange={(event) => setHostGameId(event.target.value as GameId)}
                        className="w-full rounded-xl px-3 py-2.5 text-sm outline-none"
                        style={{ backgroundColor: theme.bgSurface, color: theme.textPrimary, border: `1px solid ${theme.border}` }}
                      >
                        {GAMES.filter((game) => getGameModes(game).includes('online')).map((game) => <option key={game.id} value={game.id}>{game.shortName}</option>)}
                      </select>
                      <button onClick={() => onStartNearbyHost(hostGameId)} disabled={isBusy} className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold disabled:opacity-50" style={{ backgroundColor: theme.validHighlight, color: '#FFFFFF' }}>
                        {isBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wifi className="h-4 w-4" />}
                        {isBusy ? 'Opening nearby game…' : 'Start hosting'}
                      </button>
                    </div>
                  )
                ) : (
                  <div className="space-y-3 rounded-2xl p-4" style={{ backgroundColor: theme.bgBoard, border: `1px solid ${theme.border}` }}>
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="text-sm font-bold" style={{ color: theme.textPrimary }}>Games on this network</div>
                        <p className="mt-1 text-xs" style={{ color: theme.textSecondary }}>
                          {nearbySearchActive ? 'Looking for a friend’s game…' : 'Start a search when both devices are on the same Wi-Fi or hotspot.'}
                        </p>
                      </div>
                      {nearbySearchActive && (
                        <button onClick={() => void refreshNearbyGames()} title="Refresh nearby games" aria-label="Refresh nearby games" className="grid min-h-11 min-w-11 shrink-0 place-items-center rounded-xl" style={{ backgroundColor: theme.bgSurface, color: theme.textSecondary, border: `1px solid ${theme.border}` }}>
                          <Search className={`h-4 w-4 ${nearbySearchLoading ? 'animate-pulse' : ''}`} />
                        </button>
                      )}
                    </div>

                    {!nearbySearchActive ? (
                      <>
                        <button onClick={() => { setNearbyRooms([]); setNearbySearchError(null); setNearbySearchActive(true); }} className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold" style={{ backgroundColor: theme.validHighlight, color: '#FFFFFF' }}>
                          <Search className="h-4 w-4" /> {nearbySearchError ? 'Try nearby search again' : 'Find nearby games'}
                        </button>
                        {nearbySearchError && (
                          <div role="alert" className="rounded-xl px-3 py-2.5 text-xs" style={{ color: theme.captureHighlight, backgroundColor: `${theme.captureHighlight}1A` }}>
                            {nearbySearchError}
                          </div>
                        )}
                      </>
                    ) : nearbySearchError ? (
                      <div role="alert" className="rounded-xl px-3 py-2.5 text-xs" style={{ color: theme.captureHighlight, backgroundColor: `${theme.captureHighlight}1A` }}>
                        {nearbySearchError}
                      </div>
                    ) : nearbyRooms.length === 0 ? (
                      <div role="status" aria-live="polite" className="rounded-xl px-3 py-3 text-center text-xs" style={{ color: theme.textMuted, backgroundColor: theme.bgSurface }}>
                        {nearbySearchLoading ? 'Searching…' : 'No games found yet. Ask your friend to start hosting.'}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {nearbyRooms.map((room) => {
                          const game = GAMES.find((entry) => entry.id === room.gameId);
                          return (
                            <div key={room.hostId} className="flex items-center justify-between gap-3 rounded-xl p-3" style={{ backgroundColor: theme.bgSurface, border: `1px solid ${theme.border}` }}>
                              <div className="min-w-0">
                                <div className="truncate text-sm font-semibold" style={{ color: theme.textPrimary }}>{game?.shortName ?? 'Board game'}</div>
                                <div className="mt-0.5 text-[11px]" style={{ color: theme.textMuted }}>One player is waiting</div>
                              </div>
                              <button onClick={() => { setNearbySearchActive(false); onJoinNearbyGame(room); }} disabled={isBusy} className="min-h-11 shrink-0 rounded-lg px-4 text-xs font-bold" style={{ backgroundColor: theme.accent, color: theme.bgApp }}>
                                Join
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {nearbySearchActive && (
                      <button onClick={() => { setNearbySearchActive(false); setNearbyRooms([]); }} className="w-full py-1 text-xs underline" style={{ color: theme.textMuted }}>
                        Stop searching
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
            <button onClick={() => { if (transportKind === 'nearby-discovery') onResetConnection(); setNearbySearchActive(false); setUseQrFallback(true); }} className="w-full py-2 text-xs font-medium underline" style={{ color: theme.textMuted }}>
              No internet? Use offline QR pairing
            </button>
          </div>
        )}
        </div>
      </div>
    </div>
  );
};
