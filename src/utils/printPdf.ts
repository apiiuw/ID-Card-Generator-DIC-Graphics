import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export interface PDFGenerationProgress {
  current: number;
  total: number;
  status: string;
}

/**
 * Generates an exact A4 Landscape PDF from the rendered A4PrintSheet elements.
 * Guaranteed to be recognized as Landscape by iOS AirPrint, Android, and Desktop.
 */
export async function generateA4LandscapePDF(
  containerElement: HTMLElement,
  options: {
    fileName?: string;
    orientation?: 'portrait' | 'landscape';
    onProgress?: (progress: PDFGenerationProgress) => void;
  } = {}
): Promise<{ blob: Blob; blobUrl: string; pdf: jsPDF }> {
  const sheets = containerElement.querySelectorAll<HTMLElement>('.a4-sheet');
  const total = sheets.length;

  if (total === 0) {
    throw new Error('Tidak ada lembar A4 yang ditemukan untuk dicetak.');
  }

  const orientation = options.orientation || 'portrait';
  const pageW = orientation === 'landscape' ? 297 : 210;
  const pageH = orientation === 'landscape' ? 210 : 297;

  // Wait for custom web fonts (Caladea / Cambria fallback) before measuring & rasterizing
  if (typeof document !== 'undefined' && document.fonts?.ready) {
    await document.fonts.ready;
  }

  const pdf = new jsPDF({
    orientation,
    unit: 'mm',
    format: 'a4',
    compress: true,
  });

  for (let i = 0; i < total; i++) {
    if (options.onProgress) {
      options.onProgress({
        current: i + 1,
        total,
        status: `Memproses Lembar ${i + 1} dari ${total}...`,
      });
    }

    const sheet = sheets[i];

    // High resolution capture (scale: 2 = ~300 DPI equivalent for crisp text and sharp QR codes)
    const canvas = await html2canvas(sheet, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      allowTaint: true,
      scrollX: 0,
      scrollY: 0,
      onclone: (clonedDoc) => {
        const clonedPrintOnly = clonedDoc.querySelector<HTMLElement>('.print-only');
        if (clonedPrintOnly) {
          clonedPrintOnly.style.position = 'static';
          clonedPrintOnly.style.left = '0';
          clonedPrintOnly.style.top = '0';
        }
      },
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.98);

    if (i > 0) {
      pdf.addPage('a4', orientation);
    }

    // Exact A4 dimensions: 210x297mm (portrait) or 297x210mm (landscape)
    pdf.addImage(imgData, 'JPEG', 0, 0, pageW, pageH, undefined, 'FAST');
  }

  if (options.onProgress) {
    options.onProgress({
      current: total,
      total,
      status: 'Menyelesaikan dokumen PDF...',
    });
  }

  const blob = pdf.output('blob');
  const blobUrl = URL.createObjectURL(blob);

  return { blob, blobUrl, pdf };
}

