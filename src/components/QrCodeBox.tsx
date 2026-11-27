import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';

interface QrCodeBoxProps {
  value: string;
  size?: number;
  className?: string;
}

export const QrCodeBox: React.FC<QrCodeBoxProps> = ({ value, size = 152, className = '' }) => {
  const [svgMarkup, setSvgMarkup] = useState<string>('');

  useEffect(() => {
    let active = true;
    if (!value) {
      setSvgMarkup('');
      return;
    }
    QRCode.toString(value, {
      type: 'svg',
      margin: 1,
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
        if (active) setSvgMarkup('');
      });

    return () => {
      active = false;
    };
  }, [value, size]);

  if (!svgMarkup) return null;

  return (
    <div
      className={`rounded-xl bg-white p-2 inline-flex items-center justify-center shadow-md ${className}`}
      role="img"
      aria-label="QR code for the room invite"
      style={{ width: size + 16, height: size + 16 }}
      dangerouslySetInnerHTML={{ __html: svgMarkup }}
    />
  );
};
