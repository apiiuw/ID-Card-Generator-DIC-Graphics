import React, { useState, useEffect } from 'react';
import { IDCard } from '../types';
import { Printer, X, CheckSquare, Square, Layers, FileText, FileDown, Sparkles } from 'lucide-react';

interface PrintPageModalProps {
  isOpen: boolean;
  onClose: () => void;
  totalPages: number;
  cardPages: IDCard[][];
  currentPreviewPage: number;
  onConfirmPrint: (selectedPageIndices: number[]) => void;
  onPrintPDF: (selectedPageIndices: number[]) => void;
  isGeneratingPDF?: boolean;
  pdfProgress?: { current: number; total: number; status: string } | null;
}

export const PrintPageModal: React.FC<PrintPageModalProps> = ({
  isOpen,
  onClose,
  totalPages,
  cardPages,
  currentPreviewPage,
  onConfirmPrint,
  onPrintPDF,
  isGeneratingPDF = false,
  pdfProgress = null,
}) => {
  const [printScope, setPrintScope] = useState<'all' | 'current' | 'custom'>('all');
  const [selectedPages, setSelectedPages] = useState<number[]>([]);

  // Initialize selected pages when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedPages(Array.from({ length: totalPages }, (_, i) => i));
      setPrintScope('all');
    }
  }, [isOpen, totalPages]);

  if (!isOpen) return null;

  const handleTogglePage = (index: number) => {
    if (selectedPages.includes(index)) {
      if (selectedPages.length === 1) {
        alert('Minimal 1 halaman harus dipilih untuk dicetak.');
        return;
      }
      setSelectedPages(selectedPages.filter((i) => i !== index));
    } else {
      setSelectedPages([...selectedPages, index].sort((a, b) => a - b));
    }
  };

  const handleSelectAll = () => {
    setSelectedPages(Array.from({ length: totalPages }, (_, i) => i));
  };

  const handleDeselectAll = () => {
    // Keep at least current
    setSelectedPages([currentPreviewPage]);
  };

  const getPagesToPrint = () => {
    if (printScope === 'all') {
      return Array.from({ length: totalPages }, (_, i) => i);
    } else if (printScope === 'current') {
      return [currentPreviewPage];
    } else {
      return selectedPages;
    }
  };

  const handleExecutePrint = () => {
    const pages = getPagesToPrint();
    if (pages.length === 0) {
      alert('Silakan pilih minimal 1 halaman untuk dicetak.');
      return;
    }
    onConfirmPrint(pages);
  };

  const handleExecutePrintPDF = () => {
    const pages = getPagesToPrint();
    if (pages.length === 0) {
      alert('Silakan pilih minimal 1 halaman untuk dicetak.');
      return;
    }
    onPrintPDF(pages);
  };

  // Calculate total cards in chosen pages
  const activePageSelection =
    printScope === 'all'
      ? Array.from({ length: totalPages }, (_, i) => i)
      : printScope === 'current'
      ? [currentPreviewPage]
      : selectedPages;

  const totalCardsToPrint = activePageSelection.reduce((acc, pageIdx) => {
    return acc + (cardPages[pageIdx]?.length || 0);
  }, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
              <Printer className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold">Pilih Halaman yang Ingin Dicetak</h3>
              <p className="text-[11px] text-slate-400">
                1 Lembar Kertas A4 = 4 ID Card Depan & Belakang Lengkap
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Radio Options */}
          <div className="space-y-2.5">
            <label
              className={`p-3.5 border rounded-2xl cursor-pointer flex items-start gap-3 transition-all ${
                printScope === 'all'
                  ? 'border-blue-500 bg-blue-50/40 text-blue-950 ring-2 ring-blue-500/10'
                  : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
              }`}
            >
              <input
                type="radio"
                name="printScope"
                checked={printScope === 'all'}
                onChange={() => setPrintScope('all')}
                className="mt-0.5 text-blue-600 focus:ring-blue-500"
              />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold">Cetak Semua Lembar</span>
                  <span className="text-[11px] font-semibold bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                    {totalPages} Lembar A4
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Mencetak seluruh halaman yang ada dalam folder ini sekaligus.
                </p>
              </div>
            </label>

            <label
              className={`p-3.5 border rounded-2xl cursor-pointer flex items-start gap-3 transition-all ${
                printScope === 'current'
                  ? 'border-blue-500 bg-blue-50/40 text-blue-950 ring-2 ring-blue-500/10'
                  : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
              }`}
            >
              <input
                type="radio"
                name="printScope"
                checked={printScope === 'current'}
                onChange={() => setPrintScope('current')}
                className="mt-0.5 text-blue-600 focus:ring-blue-500"
              />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold">
                    Hanya Lembar yang Sedang Aktif (Lembar {currentPreviewPage + 1})
                  </span>
                  <span className="text-[11px] font-semibold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full">
                    1 Lembar
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Hanya mencetak 4 ID Card pada lembar aktif yang sedang dilihat di layar.
                </p>
              </div>
            </label>

            <label
              className={`p-3.5 border rounded-2xl cursor-pointer flex items-start gap-3 transition-all ${
                printScope === 'custom'
                  ? 'border-blue-500 bg-blue-50/40 text-blue-950 ring-2 ring-blue-500/10'
                  : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
              }`}
            >
              <input
                type="radio"
                name="printScope"
                checked={printScope === 'custom'}
                onChange={() => setPrintScope('custom')}
                className="mt-0.5 text-blue-600 focus:ring-blue-500"
              />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold">Pilih Lembar Manual</span>
                  <span className="text-[11px] font-semibold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                    Pilih Bebas
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Tentukan lembar ke berapa saja yang ingin dicetak dengan centang.
                </p>
              </div>
            </label>
          </div>

          {/* Checklist when printScope === 'custom' */}
          {printScope === 'custom' && (
            <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50 space-y-3">
              <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-200">
                <span className="font-bold text-slate-700">Daftar Lembar A4:</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSelectAll}
                    className="text-blue-600 hover:underline font-semibold cursor-pointer"
                  >
                    Pilih Semua
                  </button>
                  <span className="text-slate-300">•</span>
                  <button
                    type="button"
                    onClick={handleDeselectAll}
                    className="text-slate-500 hover:underline font-medium cursor-pointer"
                  >
                    Reset
                  </button>
                </div>
              </div>

              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {Array.from({ length: totalPages }).map((_, idx) => {
                  const isChecked = selectedPages.includes(idx);
                  const cardsOnPage = cardPages[idx] || [];
                  const names = cardsOnPage.map((c) => c.name || 'Tanpa Nama').slice(0, 3).join(', ');
                  const extraCount = cardsOnPage.length > 3 ? ` +${cardsOnPage.length - 3}` : '';

                  return (
                    <label
                      key={idx}
                      onClick={() => handleTogglePage(idx)}
                      className={`flex items-start gap-3 p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                        isChecked
                          ? 'border-blue-400 bg-white shadow-2xs font-semibold text-slate-800'
                          : 'border-slate-200 bg-slate-100/70 text-slate-500'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}} // handled by parent onClick
                        className="mt-0.5 rounded text-blue-600 focus:ring-blue-500"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span>Lembar {idx + 1}</span>
                          <span className="text-[10px] text-slate-400">
                            {cardsOnPage.length} Kartu
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 truncate font-normal mt-0.5">
                          {names}
                          {extraCount}
                        </p>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {/* Print Summary Banner */}
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-3.5 flex items-center justify-between text-xs text-blue-900">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-600 shrink-0" />
              <span>
                Total yang akan dicetak: <strong>{activePageSelection.length} Lembar A4</strong>
              </span>
            </div>
            <span className="font-bold bg-white px-2.5 py-1 rounded-lg border border-blue-200">
              {totalCardsToPrint} ID Card
            </span>
          </div>

          {/* Tablet & Print Orientation Tip */}
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3.5 text-[11px] text-amber-900 flex items-start gap-2.5">
            <span className="text-base leading-none">📱</span>
            <div className="space-y-1">
              <div className="font-bold text-amber-950 flex items-center gap-1">
                <span>Tips Cetak di iPad / Tablet:</span>
              </div>
              <p className="leading-relaxed text-amber-900/90">
                Pilih tombol <strong className="text-blue-700">"Cetak PDF Landscape"</strong> agar kertas otomatis berorientasi Landscape di sistem AirPrint tablet Anda dan ukuran kartu <strong>100% presisi sesuai milimeter</strong> (tidak mengecil/terpotong).
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2.5">
          <button
            type="button"
            onClick={onClose}
            disabled={isGeneratingPDF}
            className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
          >
            Batal
          </button>

          <div className="flex items-center gap-2">
            {/* Standard Browser Print */}
            <button
              type="button"
              onClick={handleExecutePrint}
              disabled={isGeneratingPDF}
              className="flex items-center gap-1.5 px-3.5 py-2.5 bg-white border border-slate-300 hover:bg-slate-100 active:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl shadow-2xs transition-all cursor-pointer disabled:opacity-50"
              title="Cetak langsung menggunakan dialog print bawaan browser"
            >
              <Printer className="w-3.5 h-3.5 text-slate-500" />
              <span>Cetak Browser</span>
            </button>

            {/* High Precision A4 Landscape PDF Print */}
            <button
              type="button"
              onClick={handleExecutePrintPDF}
              disabled={isGeneratingPDF}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-500/20 transition-all cursor-pointer disabled:opacity-60"
            >
              {isGeneratingPDF ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>{pdfProgress?.status || 'Memproses PDF...'}</span>
                </>
              ) : (
                <>
                  <FileDown className="w-4 h-4" />
                  <span>Cetak PDF Landscape (100% Pas)</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

