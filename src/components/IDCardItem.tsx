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
      className={`relative bg-white select-none rounded-none overflow-hidden flex flex-col ${className}`}
      style={{
        width: `${widthMm}mm`,
        height: `${heightMm}mm`,
        minWidth: `${widthMm}mm`,
        minHeight: `${heightMm}mm`,
        maxWidth: `${widthMm}mm`,
        maxHeight: `${heightMm}mm`,
        border: `${0.4 * s}mm solid #000000`,
        padding: `${1.4 * s}mm ${2.5 * s}mm ${1.6 * s}mm ${2.5 * s}mm`,
        pageBreakInside: 'avoid',
        boxSizing: 'border-box',
        fontFamily: "'Cambria', 'Caladea', 'Georgia', serif",
      }}
    >
      {/* 1. TOP HEADER: Left DIC Logo | Center "ID CARD / KONTRAKTOR" | Right K3 Logo */}
      <div
        className="w-full flex items-start justify-between shrink-0"
        style={{ height: `${10.5 * s}mm` }}
      >
        {/* Left: DIC Logo */}
        <div
          className="flex items-start justify-start shrink-0"
          style={{ width: `${15.5 * s}mm`, height: `${9.2 * s}mm`, paddingTop: `${0.3 * s}mm` }}
        >
          <img
            src={settings.dicLogoUrl || '/logos/dic-logo.jpg'}
            alt="PT DIC Graphics"
            className="max-h-full max-w-full object-contain object-left-top"
          />
        </div>

        {/* Center: Title Lines raised cleanly near top margin */}
        <div
          className="flex-1 text-center flex flex-col justify-start items-center"
          style={{ paddingTop: 0, lineHeight: 1.03 }}
        >
          <div
            className="font-bold text-black uppercase tracking-normal whitespace-nowrap"
            style={{ fontSize: `${4.5 * s}mm` }}
          >
            ID CARD
          </div>
          <div
            className="font-bold text-black uppercase tracking-normal whitespace-nowrap"
            style={{
              fontSize: subTitle.length > 14 ? `${3.6 * s}mm` : `${4.5 * s}mm`,
            }}
          >
            {subTitle}
          </div>
        </div>

        {/* Right: K3 Logo */}
        <div
          className="flex items-start justify-end shrink-0"
          style={{ width: `${15.5 * s}mm`, height: `${10.2 * s}mm`, paddingTop: `${0.2 * s}mm` }}
        >
          <img
            src={settings.k3LogoUrl || '/logos/k3-logo.jpg'}
            alt="K3 Logo"
            className="max-h-full max-w-full object-contain object-right-top"
          />
        </div>
      </div>

      {/* 2. PHOTO SECTION: Clean Portrait, NO BORDER (exact same width as QR code below) */}
      <div
        className="flex justify-center items-center shrink-0"
        style={{ marginTop: `${1.8 * s}mm` }}
      >
        <div
          className="relative bg-white overflow-hidden flex items-center justify-center rounded-none border-0"
          style={{
            width: `${35.5 * s}mm`,
            height: `${37.0 * s}mm`,
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

      {/* 3. CONTRACTOR NAME: Raised slightly closer to photo with clear gap above QR code */}
      <div
        className="w-full text-center shrink-0"
        style={{
          marginTop: `${0.3 * s}mm`,
          marginBottom: `${2.6 * s}mm`,
        }}
      >
        <div
          className="font-bold text-black uppercase tracking-tight whitespace-nowrap"
          style={{
            lineHeight: 1.15,
            fontSize:
              nameStr.length > 30
                ? `${2.8 * s}mm`
                : nameStr.length > 25
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

      {/* 4. QR CODE / BARCODE: Exact same width as photo (35.5mm x 35.5mm) */}
      <div className="flex justify-center items-center shrink-0">
        <div
          className="bg-white flex items-center justify-center overflow-hidden"
          style={{
            width: `${35.5 * s}mm`,
            height: `${35.5 * s}mm`,
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

      {/* 5 & 6. BOTTOM TEXT BLOCK: Tight Company Name + ID Label & Number */}
      <div
        className="w-full shrink-0 flex flex-col items-center justify-end"
        style={{ marginTop: 'auto', paddingBottom: `${0.3 * s}mm` }}
      >
        {/* Company Name */}
        <div className="w-full text-center">
          <div
            className="font-bold text-black uppercase tracking-tight whitespace-nowrap"
            style={{
              lineHeight: 1.12,
              fontSize:
                companyStr.length > 36
                  ? `${2.2 * s}mm`
                  : companyStr.length > 30
                  ? `${2.5 * s}mm`
                  : companyStr.length > 24
                  ? `${2.9 * s}mm`
                  : `${3.4 * s}mm`,
            }}
            title={card.company}
          >
            {companyStr}
          </div>
        </div>

        {/* Bottom Row: Closer vertically to Company Name, crisp horizontal gap */}
        <div
          className="w-full text-center whitespace-nowrap"
          style={{
            lineHeight: 1.15,
            marginTop: `${0.1 * s}mm`,
            paddingLeft: `${1 * s}mm`,
            paddingRight: `${1 * s}mm`,
          }}
        >
          {(idLabelStr || idNumberStr) && (
            <>
              {idLabelStr && (
                <span
                  className="font-bold text-black uppercase tracking-tight"
                  style={{
                    marginRight: idNumberStr ? `${3.0 * s}mm` : 0,
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
                  className="font-bold text-black uppercase tracking-tight"
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
