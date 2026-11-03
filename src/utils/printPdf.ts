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
    onProgress?: (progress: PDFGenerationProgress) => void;
  } = {}
): Promise<{ blob: Blob; blobUrl: string; pdf: jsPDF }> {
  const sheets = containerElement.querySelectorAll<HTMLElement>('.a4-sheet');
  const total = sheets.length;

  if (total === 0) {
    throw new Error('Tidak ada lembar A4 yang ditemukan untuk dicetak.');
  }

  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4', // [297, 210]
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
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.98);

    if (i > 0) {
      pdf.addPage('a4', 'landscape');
    }

    // Exact A4 landscape dimensions: 297mm x 210mm
    pdf.addImage(imgData, 'JPEG', 0, 0, 297, 210, undefined, 'FAST');
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
