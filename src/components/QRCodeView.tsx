import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';

interface QRCodeViewProps {
  value: string;
  qrType: 'auto' | 'upload';
  qrCodeUrl?: string;
  size?: number; // size in px
  className?: string;
}

export const QRCodeView: React.FC<QRCodeViewProps> = ({
  value,
  qrType,
  qrCodeUrl,
  size = 120,
  className = '',
}) => {
  const [svgMarkup, setSvgMarkup] = useState<string>('');

  useEffect(() => {
    if (qrType === 'auto') {
      const cleanValue = (value || '00000000').trim();
      QRCode.toString(cleanValue, {
        type: 'svg',
        margin: 0,
        color: {
          dark: '#000000',
          light: '#ffffff',
        },
        errorCorrectionLevel: 'M',
      })
        .then((svg) => {
          setSvgMarkup(svg);
        })
        .catch((err) => {
          console.error('QR code generation failed:', err);
        });
    }
  }, [value, qrType]);

  if (qrType === 'upload' && qrCodeUrl) {
    return (
      <div className={`flex items-center justify-center overflow-hidden ${className}`}>
        <img
          src={qrCodeUrl}
          alt={`QR Code ${value}`}
          className="max-h-full max-w-full object-contain"
        />
      </div>
    );
  }

  return (
    <div
      className={`flex items-center justify-center overflow-hidden ${className}`}
      dangerouslySetInnerHTML={{ __html: svgMarkup }}
    />
  );
};

