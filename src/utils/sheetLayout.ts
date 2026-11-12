import { PrintSettings } from '../types';

export interface SheetGridLayout {
  isLandscape: boolean;
  pageWidthMm: number;
  pageHeightMm: number;
  cols: number;
  rows: number;
  cardsPerPage: number;
}

/**
 * Calculates how many Front+Back ID card pairs cleanly fit onto an A4 sheet
 * without overflow or clipping, based on the configured dimensions and orientation.
 */
export function getSheetGridLayout(settings: PrintSettings): SheetGridLayout {
  const isLandscape = settings.pageOrientation !== 'portrait';
  const pageWidthMm = isLandscape ? 297 : 210;
  const pageHeightMm = isLandscape ? 210 : 297;

  const cardW = settings.cardWidthMm || 80;
  const cardH = settings.cardHeightMm || 110;
  const gapFB = settings.gapFrontBackMm ?? 4;
  const margin = settings.marginMm ?? 10;
  const gapX = settings.gapXMm ?? 10;
  const gapY = settings.gapYMm ?? 10;
  const cutPad = settings.showCutMarks ? 3 : 0; // 1.5mm border padding each side

  const pairW = cardW * 2 + gapFB + cutPad;
  const pairH = cardH + cutPad;

  const availW = Math.max(pairW, pageWidthMm - margin * 2);
  const availH = Math.max(pairH, pageHeightMm - margin * 2);

  const cols = Math.max(1, Math.floor((availW + gapX) / (pairW + gapX)));
  const rows = Math.max(1, Math.floor((availH + gapY) / (pairH + gapY)));

  return {
    isLandscape,
    pageWidthMm,
    pageHeightMm,
    cols,
    rows,
    cardsPerPage: cols * rows,
  };
}
