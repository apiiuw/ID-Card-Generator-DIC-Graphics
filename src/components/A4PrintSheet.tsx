import React from 'react';
import { IDCard, PrintSettings } from '../types';
import { IDCardItem } from './IDCardItem';
import { getSheetGridLayout } from '../utils/sheetLayout';

interface A4PrintSheetProps {
  cards: IDCard[]; // up to layout.cardsPerPage cards for this sheet
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
  const layout = getSheetGridLayout(settings);
  const gapFrontBack = settings.gapFrontBackMm ?? 4;
  const margin = settings.marginMm ?? 10;
  const gapX = settings.gapXMm ?? 10;
  const gapY = settings.gapYMm ?? 10;

  // Pad array to match exact grid capacity (rows * cols)
  const slots: (IDCard | null)[] = Array.from(
    { length: layout.cardsPerPage },
    (_, i) => cards[i] || null
  );

  const renderCardPair = (card: IDCard | null, slotIndex: number) => {
    if (!card) {
      return (
        <div
          key={`empty-${slotIndex}`}
          className="border border-dashed border-slate-200 rounded-none flex items-center justify-center text-slate-300 text-xs font-serif"
          style={{
            width: `${(settings.cardWidthMm || 80) * 2 + gapFrontBack}mm`,
            height: `${settings.cardHeightMm || 110}mm`,
          }}
        >
          Slot Kartu #{slotIndex + 1} Kosong
        </div>
      );
    }

    return (
      <div
        key={card.id || slotIndex}
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
            height: `${settings.cardHeightMm || 110}mm`,
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

  return (
    <div
      className="a4-sheet bg-white relative mx-auto shadow-2xl print:shadow-none border border-slate-300 print:border-none overflow-hidden rounded-none flex flex-col justify-center items-center"
      style={{
        width: `${layout.pageWidthMm}mm`,
        height: `${layout.pageHeightMm}mm`,
        minWidth: `${layout.pageWidthMm}mm`,
        minHeight: `${layout.pageHeightMm}mm`,
        maxWidth: `${layout.pageWidthMm}mm`,
        maxHeight: `${layout.pageHeightMm}mm`,
        boxSizing: 'border-box',
        padding: `${margin}mm`,
        pageBreakAfter: 'always',
        breakAfter: 'page',
      }}
    >
      {/* Dynamic Grid of Card Pairs (Each Pair = Front + Back) */}
      <div
        className="flex flex-col justify-center items-center"
        style={{ gap: `${gapY}mm` }}
      >
        {Array.from({ length: layout.rows }).map((_, rowIdx) => (
          <div
            key={`row-${rowIdx}`}
            className="flex justify-center items-center"
            style={{ gap: `${gapX}mm` }}
          >
            {Array.from({ length: layout.cols }).map((__, colIdx) => {
              const slotIdx = rowIdx * layout.cols + colIdx;
              return renderCardPair(slots[slotIdx], slotIdx);
            })}
          </div>
        ))}
      </div>

      {settings.showPageNumbers && (
        <div className="absolute bottom-[2.5mm] right-[5mm] text-[8px] text-slate-400 font-sans select-none print:text-slate-400">
          Lembar {pageIndex} / {totalPages}
        </div>
      )}
    </div>
  );
};
