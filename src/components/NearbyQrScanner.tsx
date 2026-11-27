import React, { useEffect, useRef, useState } from 'react';
import type QrScanner from 'qr-scanner';
import { Camera, CameraOff, X } from 'lucide-react';
import { ThemePalette } from '../types/game';

interface NearbyQrScannerProps {
  theme: ThemePalette;
  onDetected: (value: string) => void;
  onClose: () => void;
  onManualEntry: () => void;
}

function cameraErrorMessage(error: unknown): string {
  if (error instanceof DOMException && error.name === 'NotAllowedError') {
    return 'Camera access is blocked. Allow camera access for BoardCraft in your browser settings, or use the text fallback.';
  }
  if (error instanceof DOMException && error.name === 'NotFoundError') {
    return 'No camera was found on this device. Use the text fallback to pair.';
  }
  if (!window.isSecureContext) {
    return 'Camera scanning needs a secure page. Open BoardCraft over HTTPS or localhost.';
  }
  return 'The camera could not start. Check that another app is not using it, then try again or use the text fallback.';
}

export const NearbyQrScanner: React.FC<NearbyQrScannerProps> = ({ theme, onDetected, onClose, onManualEntry }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const onDetectedRef = useRef(onDetected);
  const [error, setError] = useState<string | null>(null);
  onDetectedRef.current = onDetected;

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let active = true;
    let consumed = false;
    let scanner: QrScanner | null = null;
    void import('qr-scanner').then(({ default: QrScannerModule }) => {
      if (!active) return;
      scanner = new QrScannerModule(video, (result) => {
        if (!active || consumed) return;
        consumed = true;
        scanner?.stop();
        onDetectedRef.current(result.data);
      }, {
        preferredCamera: 'environment',
        maxScansPerSecond: 8,
        returnDetailedScanResult: true,
        highlightScanRegion: true,
      });
      return scanner.start();
    }).catch((reason: unknown) => {
      if (active) setError(cameraErrorMessage(reason));
    });

    return () => {
      active = false;
      scanner?.stop();
      scanner?.destroy();
    };
  }, []);

  return (
    <section className="space-y-3 rounded-2xl p-4" style={{ backgroundColor: theme.bgBoard, border: `1px solid ${theme.border}` }} aria-label="Scan a nearby pairing QR code">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="flex items-center gap-2 text-sm font-bold" style={{ color: theme.textPrimary }}>
            <Camera className="h-4 w-4" style={{ color: theme.validHighlight }} />
            Scan the pairing QR
          </h3>
          <p className="mt-1 text-xs" style={{ color: theme.textSecondary }}>
            Point the rear camera at your friend&apos;s QR code. Camera access is used only while scanning.
          </p>
        </div>
        <button onClick={onClose} aria-label="Close QR scanner" className="rounded-full p-2" style={{ color: theme.textMuted, backgroundColor: theme.bgSurface }}>
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="relative mx-auto w-full max-w-sm overflow-hidden rounded-2xl bg-black aspect-[4/3]">
        <video ref={videoRef} className="h-full w-full object-cover" autoPlay muted playsInline aria-label="Camera preview for scanning a QR code" />
        <div className="pointer-events-none absolute inset-[14%] rounded-2xl border-2 border-white/80 shadow-[0_0_0_999px_rgba(0,0,0,.18)]" aria-hidden="true" />
        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/85 p-5 text-center" role="alert">
            <CameraOff className="h-6 w-6" style={{ color: theme.captureHighlight }} />
            <p className="text-xs leading-relaxed text-white">{error}</p>
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="flex items-center gap-1.5 text-[11px]" style={{ color: theme.textMuted }}>
          <span className="h-1.5 w-1.5 animate-pulse rounded-full" style={{ backgroundColor: error ? theme.captureHighlight : theme.validHighlight }} />
          {error ? 'Scanner unavailable' : 'Waiting for a QR code'}
        </span>
        <button onClick={onManualEntry} className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-semibold" style={{ color: theme.textSecondary, backgroundColor: theme.bgSurface, border: `1px solid ${theme.border}` }}>
          <CameraOff className="h-3.5 w-3.5" />
          Use text instead
        </button>
      </div>
    </section>
  );
};
