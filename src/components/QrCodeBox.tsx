import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';

interface QrCodeBoxProps {
  value: string;
  size?: number;
  className?: string;
  label?: string;
}

export const QrCodeBox: React.FC<QrCodeBoxProps> = ({ value, size = 152, className = '', label = 'QR code for the room invite' }) => {
  const [svgMarkup, setSvgMarkup] = useState<string>('');
  const [encodeError, setEncodeError] = useState(false);

  useEffect(() => {
    let active = true;
    if (!value) {
      setSvgMarkup('');
      setEncodeError(false);
      return;
    }
    setEncodeError(false);
    QRCode.toString(value, {
      type: 'svg',
      errorCorrectionLevel: 'L',
      margin: 2,
      width: size,
      color: {
        dark: '#090D16',
        light: '#FFFFFF',
      },
    })
      .then((svg) => {
        if (active) setSvgMarkup(svg);
      })
      .catch(() => {
        if (active) {
          setSvgMarkup('');
          setEncodeError(true);
        }
      });

    return () => {
      active = false;
    };
  }, [value, size]);

  if (!svgMarkup && !encodeError) return null;

  if (encodeError) {
    return (
      <div className={`rounded-xl p-3 text-center text-xs ${className}`} role="alert" aria-label={`${label}; use the text fallback`} style={{ color: '#6B463E', backgroundColor: '#FFF4EF', maxWidth: size + 16 }}>
        This QR code is too large to display. Use the text fallback instead.
      </div>
    );
  }

  return (
    <div
      className={`rounded-xl bg-white p-2 inline-flex items-center justify-center shadow-md ${className}`}
      role="img"
      aria-label={label}
      style={{ width: size + 16, height: size + 16 }}
      dangerouslySetInnerHTML={{ __html: svgMarkup }}
    />
  );
};
