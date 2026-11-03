import React from 'react';
import { IDCard, PrintSettings } from '../types';
import { IDCardItem } from './IDCardItem';

interface A4PrintSheetProps {
  cards: IDCard[]; // up to 4 cards for this sheet
  pageIndex: number;
  totalPages: number;
  settings: PrintSettings;
}

export const A4PrintSheet: React.FC<A4PrintSheetProps> = ({
  cards,
  settings,
  pageIndex = 1,
  totalPages = 1,
}) => {
  // Pad up to 4 cards if fewer provided
  const fourCards: (IDCard | null)[] = [
    cards[0] || null,
    cards[1] || null,
    cards[2] || null,
    cards[3] || null,
  ];

  const isLandscape = settings.pageOrientation !== 'portrait';
  const gapFrontBack = settings.gapFrontBackMm ?? 6;

  const renderCardPair = (card: IDCard | null, slotIndex: number) => {
    if (!card) {
      return (
        <div
          className="border border-dashed border-slate-200 rounded-none flex items-center justify-center text-slate-300 text-xs font-serif"
          style={{
            width: `${settings.cardWidthMm * 2 + gapFrontBack}mm`,
            height: `${settings.cardHeightMm}mm`,
          }}
        >
          Slot Kartu #{slotIndex + 1} Kosong
        </div>
      );
    }

    return (
      <div
        className={`relative rounded-none bg-white flex items-center transition-all ${
          settings.showCutMarks
            ? 'p-[1.5mm] border border-dashed border-slate-300'
            : 'p-0 border-transparent'
        }`}
      >
        {/* Front Side */}
        <IDCardItem
          card={card}
          settings={settings}
          side="front"
          isPrint={true}
          className="rounded-none shrink-0"
        />

        {/* Spacing gap between Front and Back with subtle dashed line */}
        <div
          className="relative flex items-center justify-center shrink-0"
          style={{
            width: `${gapFrontBack}mm`,
            height: `${settings.cardHeightMm}mm`,
          }}
        >
          {settings.showFoldMarks && (
            <div className="w-0 h-full border-r border-dashed border-slate-300" />
          )}
        </div>

        {/* Back Side */}
        <IDCardItem
          card={card}
          settings={settings}
          side="back"
          isPrint={true}
          className="rounded-none shrink-0"
        />
      </div>
    );
  };

  const margin = settings.marginMm ?? 10;
  const gapX = settings.gapXMm ?? 14;
  const gapY = settings.gapYMm ?? 10;

  return (
    <div
      className="a4-sheet bg-white relative mx-auto shadow-2xl print:shadow-none border border-slate-300 print:border-none overflow-hidden rounded-none flex flex-col justify-center items-center"
      style={{
        width: isLandscape ? '297mm' : '210mm',
        height: isLandscape ? '210mm' : '297mm',
        minWidth: isLandscape ? '297mm' : '210mm',
        minHeight: isLandscape ? '210mm' : '297mm',
        maxWidth: isLandscape ? '297mm' : '210mm',
        maxHeight: isLandscape ? '210mm' : '297mm',
        boxSizing: 'border-box',
        padding: `${margin}mm`,
        pageBreakAfter: 'always',
        breakAfter: 'page',
      }}
    >
      {/* 2x2 Grid of Card Pairs (Each Pair = Front + Back) */}
      <div
        className="flex flex-col justify-center items-center"
        style={{
          gap: `${gapY}mm`,
        }}
      >
        {/* ROW 1: Card 0 and Card 1 */}
        <div
          className="flex justify-center items-center"
          style={{
            gap: `${gapX}mm`,
          }}
        >
          {renderCardPair(fourCards[0], 0)}
          {renderCardPair(fourCards[1], 1)}
        </div>

        {/* ROW 2: Card 2 and Card 3 */}
        <div
          className="flex justify-center items-center"
          style={{
            gap: `${gapX}mm`,
          }}
        >
          {renderCardPair(fourCards[2], 2)}
          {renderCardPair(fourCards[3], 3)}
        </div>
      </div>

      {settings.showPageNumbers && (
        <div className="absolute bottom-[2.5mm] right-[5mm] text-[8px] text-slate-400 font-sans select-none print:text-slate-400">
          Lembar {pageIndex} / {totalPages}
        </div>
      )}
    </div>
  );
};
