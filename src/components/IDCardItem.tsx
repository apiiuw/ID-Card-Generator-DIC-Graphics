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
  // Base mm dimensions (Default: 80mm x 110mm = 8cm x 11cm)
  const widthMm = settings.cardWidthMm || 80;
  const heightMm = settings.cardHeightMm || 110;

  // Proportional scale factor relative to the standard 80mm x 110mm layout
  const s = Math.min(widthMm / 80, heightMm / 110);

  // BACK SIDE (Safety Rules K3) - Clean border matching front card
  if (side === 'back') {
    return (
      <div
        onClick={onClick}
        className={`relative bg-white select-none rounded-none overflow-hidden flex flex-col ${className}`}
        style={{
          width: `${widthMm}mm`,
          height: `${heightMm}mm`,
          minWidth: `${widthMm}mm`,
          minHeight: `${heightMm}mm`,
          maxWidth: `${widthMm}mm`,
          maxHeight: `${heightMm}mm`,
          border: `${0.4 * s}mm solid #000000`,
          padding: `${2 * s}mm`,
          pageBreakInside: 'avoid',
          boxSizing: 'border-box',
        }}
      >
        <div className="w-full h-full flex items-center justify-center overflow-hidden">
          <img
            src={settings.cardBackImage || '/logos/card-back.png'}
            alt="ID Card Back - K3 Safety Rules"
            className="w-full h-full object-contain block"
            loading="eager"
          />
        </div>
      </div>
    );
  }

  // Parse card title (e.g. "ID CARD KONTRAKTOR" -> "KONTRAKTOR")
  const rawTitle = (card.title || 'KONTRAKTOR').trim();
  const subTitle = rawTitle.toUpperCase().startsWith('ID CARD')
    ? rawTitle.substring(7).trim() || 'KONTRAKTOR'
    : rawTitle;

  const qrType = card.qrType || card.barcodeType || 'auto';
  const qrCodeUrl = card.qrCodeUrl || card.barcodeUrl || '';

  const nameStr = (card.name || '').trim();
  const companyStr = (card.company || '').trim();
  const idLabelStr = (card.idLabel || '').trim();
  const idNumberStr = (card.idNumber || '').trim();
  const totalIdChars = idLabelStr.length + idNumberStr.length;

  // FRONT SIDE: Exact match to 8cm x 11cm contractor ID card & Excel Cambria layout
  return (
    <div
      onClick={onClick}
      className={`relative bg-white select-none rounded-none overflow-hidden flex flex-col justify-between ${className}`}
      style={{
        width: `${widthMm}mm`,
        height: `${heightMm}mm`,
        minWidth: `${widthMm}mm`,
        minHeight: `${heightMm}mm`,
        maxWidth: `${widthMm}mm`,
        maxHeight: `${heightMm}mm`,
        border: `${0.4 * s}mm solid #000000`,
        padding: `${2 * s}mm ${2.5 * s}mm ${1.6 * s}mm ${2.5 * s}mm`,
        pageBreakInside: 'avoid',
        boxSizing: 'border-box',
        fontFamily: "'Cambria', 'Caladea', 'Georgia', serif",
      }}
    >
      {/* 1. TOP HEADER: Left DIC Logo | Center "ID CARD / KONTRAKTOR" | Right K3 Logo */}
      <div
        className="w-full flex items-start justify-between shrink-0"
        style={{ height: `${11.5 * s}mm` }}
      >
        {/* Left: DIC Logo */}
        <div
          className="flex items-start justify-start shrink-0"
          style={{ width: `${15.5 * s}mm`, height: `${9.5 * s}mm` }}
        >
          <img
            src={settings.dicLogoUrl || '/logos/dic-logo.jpg'}
            alt="PT DIC Graphics"
            className="max-h-full max-w-full object-contain object-left-top"
          />
        </div>

        {/* Center: Title Lines directly between logos */}
        <div
          className="flex-1 text-center flex flex-col justify-start items-center"
          style={{ paddingTop: `${0.2 * s}mm`, lineHeight: 1.06 }}
        >
          <div
            className="font-bold text-black uppercase tracking-normal whitespace-nowrap"
            style={{ fontSize: `${4.8 * s}mm` }}
          >
            ID CARD
          </div>
          <div
            className="font-bold text-black uppercase tracking-normal whitespace-nowrap"
            style={{
              fontSize: subTitle.length > 14 ? `${3.8 * s}mm` : `${4.8 * s}mm`,
            }}
          >
            {subTitle}
          </div>
        </div>

        {/* Right: K3 Logo */}
        <div
          className="flex items-start justify-end shrink-0"
          style={{ width: `${15.5 * s}mm`, height: `${10.5 * s}mm` }}
        >
          <img
            src={settings.k3LogoUrl || '/logos/k3-logo.jpg'}
            alt="K3 Logo"
            className="max-h-full max-w-full object-contain object-right-top"
          />
        </div>
      </div>

      {/* 2. PHOTO SECTION: Clean Portrait, NO BORDER */}
      <div
        className="flex justify-center items-center shrink-0"
        style={{ marginTop: `${1.0 * s}mm` }}
      >
        <div
          className="relative bg-white overflow-hidden flex items-center justify-center rounded-none border-0"
          style={{
            width: `${35.5 * s}mm`,
            height: `${38.5 * s}mm`,
          }}
        >
          {card.photoUrl ? (
            <img
              src={card.photoUrl}
              alt={card.name}
              className="w-full h-full object-cover object-top block border-0"
              loading="eager"
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-slate-400 p-2 w-full h-full bg-slate-50">
              <User className="w-8 h-8 opacity-40 mb-1" />
              <span
                className="font-sans font-semibold text-center"
                style={{ fontSize: `${2.2 * s}mm` }}
              >
                Pas Foto
              </span>
            </div>
          )}
        </div>
      </div>

      {/* 3. CONTRACTOR NAME: Cambria Bold Centered tightly between Photo and Barcode */}
      <div
        className="text-center shrink-0 flex items-center justify-center leading-none"
        style={{
          marginTop: `${0.8 * s}mm`,
          marginBottom: `${0.6 * s}mm`,
          minHeight: `${5.0 * s}mm`,
        }}
      >
        <div
          className="font-bold text-black uppercase tracking-tight whitespace-nowrap overflow-hidden text-ellipsis max-w-full"
          style={{
            fontSize:
              nameStr.length > 26
                ? `${3.2 * s}mm`
                : nameStr.length > 20
                ? `${3.8 * s}mm`
                : `${4.5 * s}mm`,
          }}
          title={card.name}
        >
          {nameStr}
        </div>
      </div>

      {/* 4. QR CODE / BARCODE: Centered & Large (matching right Excel template) */}
      <div className="flex justify-center items-center shrink-0">
        <div
          className="bg-white flex items-center justify-center overflow-hidden"
          style={{
            width: `${38.0 * s}mm`,
            height: `${38.0 * s}mm`,
          }}
        >
          <QRCodeView
            value={idNumberStr || '00000000'}
            qrType={qrType}
            qrCodeUrl={qrCodeUrl}
            size={280}
            className="w-full h-full"
          />
        </div>
      </div>

      {/* 5 & 6. BOTTOM TEXT BLOCK: Company Name + ID Label & Number */}
      <div
        className="w-full shrink-0 flex flex-col items-center justify-end"
        style={{ marginTop: `${0.8 * s}mm` }}
      >
        {/* Company Name */}
        <div
          className="text-center w-full flex items-center justify-center leading-tight"
          style={{ minHeight: `${3.8 * s}mm` }}
        >
          <div
            className="font-bold text-black uppercase tracking-tight whitespace-nowrap overflow-hidden text-ellipsis max-w-full"
            style={{
              fontSize:
                companyStr.length > 32
                  ? `${2.5 * s}mm`
                  : companyStr.length > 25
                  ? `${2.9 * s}mm`
                  : `${3.4 * s}mm`,
            }}
            title={card.company}
          >
            {companyStr}
          </div>
        </div>

        {/* Bottom Row: Smaller ID Label + Spacing + Larger ": ID_NUMBER" */}
        <div
          className="w-full flex items-baseline justify-center leading-none whitespace-nowrap overflow-hidden"
          style={{
            minHeight: `${4.2 * s}mm`,
            gap: `${4.2 * s}mm`,
            paddingLeft: `${1 * s}mm`,
            paddingRight: `${1 * s}mm`,
          }}
        >
          {(idLabelStr || idNumberStr) && (
            <>
              {idLabelStr && (
                <span
                  className="font-bold text-black uppercase tracking-tight shrink-0"
                  style={{
                    fontSize:
                      totalIdChars > 30
                        ? `${2.2 * s}mm`
                        : `${2.7 * s}mm`,
                  }}
                >
                  {idLabelStr}
                </span>
              )}
              {idNumberStr && (
                <span
                  className="font-bold text-black uppercase tracking-tight shrink-0"
                  style={{
                    fontSize:
                      totalIdChars > 30
                        ? `${2.9 * s}mm`
                        : `${3.75 * s}mm`,
                  }}
                >
                  {idLabelStr ? `: ${idNumberStr}` : idNumberStr}
                </span>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
