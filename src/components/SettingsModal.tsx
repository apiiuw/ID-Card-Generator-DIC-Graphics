import React, { useRef, useEffect } from 'react';
import { PrintSettings } from '../types';
import { X, Sliders, Sparkles, RefreshCw, Scissors, FoldHorizontal } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: PrintSettings;
  onSaveSettings: (settings: PrintSettings) => void;
  onExportBackup?: () => void;
  onImportBackup?: (jsonStr: string) => void;
  onResetDefaults?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
}) => {
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const backImageInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (isOpen) {
      if (!dialog.open) dialog.showModal();
    } else {
      if (dialog.open) dialog.close();
    }
  }, [isOpen]);

  const parseNumber = (val: string, fallback: number) => {
    const clean = val.replace(',', '.');
    const parsed = parseFloat(clean);
    return isNaN(parsed) ? fallback : parsed;
  };

  const handleBackImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      onSaveSettings({
        ...settings,
        cardBackImage: result,
      });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      aria-labelledby="settings-dialog-title"
      className="p-0 rounded-2xl shadow-2xl backdrop:bg-slate-900/60 backdrop:backdrop-blur-sm bg-white max-w-lg w-full m-auto overflow-hidden border border-slate-200"
      style={{ overscrollBehavior: 'contain' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/80">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-blue-100 text-blue-700 rounded-lg">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <h2 id="settings-dialog-title" className="text-base font-bold text-slate-800 leading-none">
              Pengaturan Cetak & ID Card
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Atur dimensi kartu, garis panduan, dan gambar belakang.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200 transition-colors"
          title="Tutup"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Body Content */}
      <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
        {/* Format Cetak Banner */}
        <div className="p-3.5 rounded-xl border border-blue-200 bg-blue-50/70">
          <div className="font-bold text-blue-900 flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-blue-600" />
              Format 1 Lembar A4 (Landscape)
            </span>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-blue-600 text-white">
              4 ID Card Lengkap
            </span>
          </div>
          <p className="text-[11px] text-blue-800 mt-1 leading-relaxed">
            1 lembar kertas A4 langsung mencetak 4 ID Card lengkap (Sisi Depan & Belakang berdampingan).
          </p>
        </div>

        {/* Ukuran Kartu Fisik */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-800 text-xs">
              Ukuran Dimensi Kartu (Milimeter)
            </span>
            <button
              type="button"
              onClick={() =>
                onSaveSettings({
                  ...settings,
                  cardWidthMm: 54,
                  cardHeightMm: 86,
                })
              }
              className="text-[11px] text-blue-600 hover:underline font-semibold"
            >
              Reset ke Standar (54 x 86 mm)
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-600 font-medium mb-1">
                Lebar Kartu (mm)
              </label>
              <input
                type="text"
                value={settings.cardWidthMm}
                onChange={(e) =>
                  onSaveSettings({
                    ...settings,
                    cardWidthMm: parseNumber(e.target.value, 54),
                  })
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white font-mono font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-slate-600 font-medium mb-1">
                Tinggi / Panjang Kartu (mm)
              </label>
              <input
                type="text"
                value={settings.cardHeightMm}
                onChange={(e) =>
                  onSaveSettings({
                    ...settings,
                    cardHeightMm: parseNumber(e.target.value, 86),
                  })
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white font-mono font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-600 font-medium mb-1">
              Jarak Renggang Depan-Belakang (mm)
            </label>
            <div className="flex items-center gap-3">
              <input
                type="text"
                value={settings.gapFrontBackMm ?? 6}
                onChange={(e) =>
                  onSaveSettings({
                    ...settings,
                    gapFrontBackMm: parseNumber(e.target.value, 6),
                  })
                }
                className="w-24 px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white font-mono font-bold text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-[11px] text-slate-500">
                Jarak jeda antara sisi depan dan belakang.
              </span>
            </div>
          </div>
        </div>

        {/* Aktif & Nonaktif Garis Panduan / Grid */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
          <span className="block font-bold text-slate-800 text-xs">
            Garis Panduan Potong & Lipat (Grid)
          </span>

          <label className="flex items-center justify-between p-2.5 bg-white rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-50 transition-colors">
            <div className="flex items-center gap-2.5">
              <Scissors className="w-4 h-4 text-blue-600" />
              <div>
                <span className="font-semibold text-slate-800 block text-xs">
                  Garis Panduan Potong Luar (Crop Marks)
                </span>
                <span className="text-[11px] text-slate-500 block">
                  Garis putus-putus pembatas luar sekeliling kartu.
                </span>
              </div>
            </div>
            <input
              type="checkbox"
              checked={settings.showCutMarks}
              onChange={(e) =>
                onSaveSettings({
                  ...settings,
                  showCutMarks: e.target.checked,
                })
              }
              className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
            />
          </label>

          <label className="flex items-center justify-between p-2.5 bg-white rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-50 transition-colors">
            <div className="flex items-center gap-2.5">
              <FoldHorizontal className="w-4 h-4 text-blue-600" />
              <div>
                <span className="font-semibold text-slate-800 block text-xs">
                  Garis Lipat Tengah (Fold Line)
                </span>
                <span className="text-[11px] text-slate-500 block">
                  Garis putus-putus di celah tengah antara depan dan belakang.
                </span>
              </div>
            </div>
            <input
              type="checkbox"
              checked={settings.showFoldMarks}
              onChange={(e) =>
                onSaveSettings({
                  ...settings,
                  showFoldMarks: e.target.checked,
                })
              }
              className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
            />
          </label>
        </div>

        {/* Gambar Belakang Kartu (K3 Safety Rules) */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
          <label className="block font-bold text-slate-800 mb-2">
            Gambar Bagian Belakang Kartu (K3 Safety Rules)
          </label>
          <div className="flex items-center gap-4">
            <div className="w-12 h-16 bg-white rounded border border-slate-300 p-1 overflow-hidden shrink-0 shadow-xs flex items-center justify-center">
              <img
                src={settings.cardBackImage || '/logos/card-back.png'}
                alt="Belakang ID Card"
                className="max-w-full max-h-full object-contain"
              />
            </div>
            <div className="space-y-1.5 flex-1">
              <input
                ref={backImageInputRef}
                type="file"
                accept="image/*"
                onChange={handleBackImageUpload}
                className="hidden"
              />
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => backImageInputRef.current?.click()}
                  className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold rounded-lg text-xs transition-colors"
                >
                  Ganti File Gambar
                </button>
                {settings.cardBackImage !== '/logos/card-back.png' && (
                  <button
                    type="button"
                    onClick={() =>
                      onSaveSettings({
                        ...settings,
                        cardBackImage: '/logos/card-back.png',
                      })
                    }
                    className="p-1.5 text-slate-500 hover:text-red-600 rounded"
                    title="Kembalikan ke standar K3 DIC"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <p className="text-[11px] text-slate-500">
                Otomatis disesuaikan di tengah kartu dan tidak menempel ke garis tepi.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-end px-6 py-4 bg-slate-50 border-t border-slate-200">
        <button
          type="button"
          onClick={onClose}
          className="px-6 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors shadow-sm"
        >
          Selesai & Simpan
        </button>
      </div>
    </dialog>
  );
};
