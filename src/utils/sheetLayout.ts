import { PrintSettings } from '../types';

export interface SheetGridLayout {
  isLandscape: boolean;
  pageWidthMm: number;
  pageHeightMm: number;
  cols: number;
  rows: number;
  cardsPerPage: number;
  fitScale: number;
  effectiveCardWidthMm: number;
  effectiveCardHeightMm: number;
  effectiveGapFrontBackMm: number;
  effectiveGapXMm: number;
  effectiveGapYMm: number;
}

/**
 * Calculates the A4 sheet layout and proportional fit scale.
 * - In Landscape (default): Always lays out 2×2 = 4 Front+Back card pairs per A4 Landscape sheet (297×210 mm),
 *   proportionally fitting the configured card size (e.g. 80×110 mm at 8:11 ratio) so all 4 pairs fit neatly.
 * - In Portrait: Lays out cards at 100% unscaled size (1×2 = 2 pairs for 80×110 mm).
 */
export function getSheetGridLayout(settings: PrintSettings): SheetGridLayout {
  const isLandscape = settings.pageOrientation !== 'portrait';
  const pageWidthMm = isLandscape ? 297 : 210;
  const pageHeightMm = isLandscape ? 210 : 297;

  const cardW = settings.cardWidthMm || 55;
  const cardH = settings.cardHeightMm || 92;
  const gapFB = settings.gapFrontBackMm ?? 2;
  const margin = settings.marginMm ?? 8;
  const gapX = settings.gapXMm ?? 6;
  const gapY = settings.gapYMm ?? 6;
  const cutPad = settings.showCutMarks ? 3 : 0; // 1.5mm padding each side

  const availW = Math.max(50, pageWidthMm - margin * 2);
  const availH = Math.max(50, pageHeightMm - margin * 2);

  if (isLandscape) {
    // Target 2×2 = 4 pairs per A4 Landscape sheet (matching Excel Print Preview)
    const cols = 2;
    const rows = 2;
    const totalUnscaledW = cols * (cardW * 2 + gapFB + cutPad) + (cols - 1) * gapX;
    const totalUnscaledH = rows * (cardH + cutPad) + (rows - 1) * gapY;

    const fitScale = Math.min(1, availW / totalUnscaledW, availH / totalUnscaledH);

    return {
      isLandscape,
      pageWidthMm,
      pageHeightMm,
      cols,
      rows,
      cardsPerPage: 4,
      fitScale,
      effectiveCardWidthMm: cardW * fitScale,
      effectiveCardHeightMm: cardH * fitScale,
      effectiveGapFrontBackMm: gapFB * fitScale,
      effectiveGapXMm: gapX * fitScale,
      effectiveGapYMm: gapY * fitScale,
    };
  }

  const pairW = cardW * 2 + gapFB + cutPad;
  const pairH = cardH + cutPad;

  const cols = Math.max(1, Math.floor((availW + gapX) / (pairW + gapX)));
  const rows = Math.max(1, Math.floor((availH + gapY) / (pairH + gapY)));

  return {
    isLandscape,
    pageWidthMm,
    pageHeightMm,
    cols,
    rows,
    cardsPerPage: cols * rows,
    fitScale: 1,
    effectiveCardWidthMm: cardW,
    effectiveCardHeightMm: cardH,
    effectiveGapFrontBackMm: gapFB,
    effectiveGapXMm: gapX,
    effectiveGapYMm: gapY,
  };
}
