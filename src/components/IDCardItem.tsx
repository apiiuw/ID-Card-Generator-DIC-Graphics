import React from 'react';
import { IDCard, PrintSettings } from '../types';
import { QRCodeView } from './QRCodeView';
import { User } from 'lucide-react';

interface IDCardItemProps {
  card: IDCard;
  settings: PrintSettings;
  side?: 'front' | 'back';
  isPrint?: boolean;
  className?: string;
  onClick?: () => void;
}

export const IDCardItem: React.FC<IDCardItemProps> = ({
  card,
  settings,
  side = 'front',
  className = '',
  onClick,
}) => {
  // Base mm dimensions
  const widthMm = settings.cardWidthMm || 54;
  const heightMm = settings.cardHeightMm || 86;

  // BACK SIDE (Safety Rules K3) - Properly padded so image never sticks to outer black border
  if (side === 'back') {
    return (
      <div
        onClick={onClick}
        className={`relative bg-white select-none rounded-none overflow-hidden border-2 border-black flex flex-col p-[2.2mm] ${className}`}
        style={{
          width: `${widthMm}mm`,
          height: `${heightMm}mm`,
          minWidth: `${widthMm}mm`,
          minHeight: `${heightMm}mm`,
          maxWidth: `${widthMm}mm`,
          maxHeight: `${heightMm}mm`,
          pageBreakInside: 'avoid',
          boxSizing: 'border-box',
        }}
      >
        <div className="w-full h-full flex items-center justify-center overflow-hidden">
          <img
            src={settings.cardBackImage || '/logos/card-back.png'}
            alt="ID Card Back - K3 Safety Rules"
            className="max-w-full max-h-full object-contain block"
            loading="eager"
          />
        </div>
      </div>
    );
  }

  // Parse card title (e.g. if user types "ID CARD KONTRAKTOR" or just "KONTRAKTOR")
  const rawTitle = (card.title || '').trim();
  const subTitle = rawTitle.toUpperCase().startsWith('ID CARD')
    ? rawTitle.substring(7).trim()
    : rawTitle;

  const qrType = card.qrType || card.barcodeType || 'auto';
  const qrCodeUrl = card.qrCodeUrl || card.barcodeUrl || '';

  // FRONT SIDE (Strictly matching the example template in TEMPLATE_ID_CARD_KONTRAKTOR.xlsx)
  return (
    <div
      onClick={onClick}
      className={`relative bg-white select-none rounded-none overflow-hidden border-2 border-black flex flex-col justify-between p-[2.2mm] ${className}`}
      style={{
        width: `${widthMm}mm`,
        height: `${heightMm}mm`,
        minWidth: `${widthMm}mm`,
        minHeight: `${heightMm}mm`,
        maxWidth: `${widthMm}mm`,
        maxHeight: `${heightMm}mm`,
        pageBreakInside: 'avoid',
        boxSizing: 'border-box',
        fontFamily: "'Cambria', 'Georgia', serif",
      }}
    >
      {/* 1. TOP HEADER: LOGOS & TITLE */}
      <div className="w-full shrink-0">
        {/* Logos Row: DIC Logo (Left) and K3 Logo (Right) */}
        <div className="flex items-center justify-between px-[0.5mm] pt-[0.2mm]">
          {/* DIC Logo */}
          <div className="h-[6.8mm] flex items-center justify-start max-w-[21mm]">
            <img
              src={settings.dicLogoUrl || '/logos/dic-logo.jpg'}
              alt="PT DIC Graphics"
              className="max-h-full max-w-full object-contain"
            />
          </div>

          {/* K3 Logo */}
          <div className="h-[7.2mm] flex items-center justify-end max-w-[15mm]">
            <img
              src={settings.k3LogoUrl || '/logos/k3-logo.jpg'}
              alt="K3 Logo"
              className="max-h-full max-w-full object-contain"
            />
          </div>
        </div>

        {/* Title Lines (Exact Cambria Bold style from Excel template) */}
        <div className="text-center mt-[0.8mm] leading-[1.05]">
          <div className="font-bold text-black uppercase tracking-normal text-[3.6mm]">
            ID CARD
          </div>
          <div className="font-bold text-black uppercase tracking-normal text-[3.6mm]">
            {subTitle}
          </div>
        </div>
      </div>

      {/* 2. PHOTO SECTION: Strictly Proportional 3:4 & Compact */}
      <div className="flex justify-center my-[0.4mm] shrink-0">
        <div
          className="relative bg-white border-[0.35mm] border-black overflow-hidden flex items-center justify-center rounded-none"
          style={{
            width: '19.5mm',
            height: '25.5mm', // neat 3:4 compact portrait photo ratio
          }}
        >
          {card.photoUrl ? (
            <img
              src={card.photoUrl}
              alt={card.name}
              className="w-full h-full object-cover object-top block"
              loading="eager"
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-slate-400 p-1">
              <User className="w-5 h-5 opacity-40 mb-0.5" />
              <span className="text-[1.6mm] font-sans font-semibold text-center">
                Pas Foto 3x4
              </span>
            </div>
          )}
        </div>
      </div>

      {/* 3. CONTRACTOR NAME: Cambria Bold Centered */}
      <div className="text-center px-[0.5mm] shrink-0 leading-tight min-h-[3.6mm] flex items-center justify-center">
        <div
          className="font-bold text-black uppercase tracking-tight line-clamp-1"
          style={{
            fontSize: (card.name || '').length > 22 ? '2.5mm' : '3.0mm',
          }}
          title={card.name}
        >
          {card.name || ''}
        </div>
      </div>

      {/* 4. QR CODE / BARCODE: Centered & Significantly Enlarged */}
      <div className="flex justify-center items-center my-[0.4mm] shrink-0">
        <div className="w-[25.5mm] h-[25.5mm] bg-white flex items-center justify-center overflow-hidden">
          <QRCodeView
            value={card.idNumber || '00000000'}
            qrType={qrType}
            qrCodeUrl={qrCodeUrl}
            size={220}
            className="w-full h-full"
          />
        </div>
      </div>

      {/* 5. COMPANY / VENDOR NAME: Cambria Bold Centered */}
      <div className="text-center px-[0.5mm] shrink-0 leading-tight min-h-[3mm] flex items-center justify-center">
        <div
          className="font-bold text-black uppercase tracking-tight line-clamp-1"
          style={{
            fontSize: (card.company || '').length > 26 ? '1.9mm' : '2.3mm',
          }}
          title={card.company}
        >
          {card.company || ''}
        </div>
      </div>

      {/* 6. BOTTOM ROW: ID LABEL & NUMBER (Strictly 1 Single Line) */}
      <div className="text-center px-[0.5mm] pb-[0.2mm] shrink-0 leading-none min-h-[3mm] flex items-center justify-center">
        {(card.idLabel || card.idNumber) ? (
          <div
            className="font-bold text-black tracking-tight whitespace-nowrap flex items-center justify-center gap-1 overflow-hidden"
            style={{
              fontSize:
                (card.idLabel || '').length + (card.idNumber || '').length > 22
                  ? '1.85mm'
                  : (card.idLabel || '').length + (card.idNumber || '').length > 18
                  ? '2.05mm'
                  : '2.25mm',
            }}
          >
            {card.idLabel && <span className="uppercase shrink-0">{card.idLabel}</span>}
            {card.idLabel && card.idNumber && <span className="shrink-0">:</span>}
            {card.idNumber && <span className="shrink-0">{card.idNumber}</span>}
          </div>
        ) : null}
      </div>
    </div>
  );
};
