import React, { useRef, useState } from 'react';
import { IDCard } from '../types';
import { ImageCropperModal } from './ImageCropperModal';
import {
  Upload,
  Crop,
  Trash2,
  Copy,
  Sparkles,
  QrCode,
  Barcode as BarcodeIcon,
  Image as ImageIcon,
  CheckCircle2,
} from 'lucide-react';

interface CardEditorProps {
  card: IDCard;
  index: number;
  onUpdate: (updated: IDCard) => void;
  onDelete: (id: string) => void;
  onDuplicate: (card: IDCard) => void;
  onApplyTitleToAll?: (title: string, idLabel: string) => void;
}

const PRESET_TITLES = [
  'KONTRAKTOR',
  'OUTSOURCE',
  'KOPKAR',
  'MAGANG',
  'BEACUKAI',
  'VISITOR',
];

const PRESET_LABELS = [
  'ID KONTRAKTOR',
  'NOMOR ID',
  'ID KOPKAR',
  'ID MAGANG',
  'NO. REGISTRASI',
];


export const CardEditor: React.FC<CardEditorProps> = ({
  card,
  index,
  onUpdate,
  onDelete,
  onDuplicate,
  onApplyTitleToAll,
}) => {
  const [cropperOpen, setCropperOpen] = useState(false);
  const [cropTarget, setCropTarget] = useState<'photo' | 'qr'>('photo');
  const [tempImageForCrop, setTempImageForCrop] = useState<string>('');
  const photoInputRef = useRef<HTMLInputElement | null>(null);
  const qrInputRef = useRef<HTMLInputElement | null>(null);

  const codeFormat = card.codeFormat || 'qr';
  const qrType = card.qrType || card.barcodeType || 'auto';
  const qrCodeUrl = card.qrCodeUrl || card.barcodeUrl || '';

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setCropTarget('photo');
      setTempImageForCrop(result);
      setCropperOpen(true);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleQrUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setCropTarget('qr');
      setTempImageForCrop(result);
      setCropperOpen(true);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 hover:shadow-md transition-shadow">
      {/* Header card indicator */}
      <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-blue-100 text-blue-700 font-bold text-xs">
            #{index + 1}
          </span>
          <span className="font-bold text-slate-800 text-sm truncate max-w-[200px]">
            {card.name || `Kartu #${index + 1}`}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => onDuplicate(card)}
            title="Duplikat kartu ini"
            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          >
            <Copy className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => onDelete(card.id)}
            title="Hapus kartu ini"
            className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="space-y-4 text-xs">
        {/* Photo Upload & Crop Section */}
        <div>
          <label className="block font-semibold text-slate-700 mb-1.5">
            Foto Kontraktor (Rapi & Tidak Gepeng)
          </label>
          <div className="flex items-center gap-3">
            {/* Thumbnail */}
            <div className="relative w-16 h-20 bg-slate-100 rounded-lg border border-slate-200 overflow-hidden flex items-center justify-center shrink-0 shadow-inner group">
              {card.photoUrl ? (
                <img
                  src={card.photoUrl}
                  alt={card.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-[10px] text-slate-400 font-medium text-center px-1">
                  Kosong
                </span>
              )}
            </div>

            <div className="flex-1 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <input
                  ref={photoInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => photoInputRef.current?.click()}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold rounded-lg transition-colors"
                >
                  <Upload className="w-3.5 h-3.5" />
                  Upload Foto
                </button>

                {card.photoUrl && (
                  <button
                    type="button"
                    onClick={() => {
                      setTempImageForCrop(card.photoUrl);
                      setCropperOpen(true);
                    }}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg transition-colors"
                    title="Crop ulang foto"
                  >
                    <Crop className="w-3.5 h-3.5" />
                    Crop Foto
                  </button>
                )}
              </div>
              <p className="text-[11px] text-slate-400">
                Otomatis dikunci rasio 3:4 pas foto agar tampilan proporsional dan tidak gepeng.
              </p>
            </div>
          </div>
        </div>

        {/* Title / Badge Banner */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block font-semibold text-slate-700">
              Judul ID Card (Bisa Berubah)
            </label>
            {onApplyTitleToAll && (
              <button
                type="button"
                onClick={() => onApplyTitleToAll(card.title, card.idLabel)}
                className="text-[11px] text-blue-600 hover:underline font-medium"
                title="Terapkan judul ini ke semua 4 kartu"
              >
                Samakan Semua
              </button>
            )}
          </div>
          <input
            type="text"
            value={card.title}
            onChange={(e) => onUpdate({ ...card, title: e.target.value })}
            placeholder="misal: ID CARD KONTRAKTOR"
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-800"
          />
          {/* Presets */}
          <div className="flex flex-wrap gap-1 mt-1.5">
            {PRESET_TITLES.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => onUpdate({ ...card, title: t })}
                className={`text-[10px] px-2 py-0.5 rounded-md border transition-colors ${
                  card.title === t
                    ? 'bg-blue-600 text-white border-blue-600 font-bold'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {t.replace('ID CARD ', '')}
              </button>
            ))}
          </div>
        </div>

        {/* Name */}
        <div>
          <label className="block font-semibold text-slate-700 mb-1">
            Nama Lengkap Kontraktor
          </label>
          <input
            type="text"
            value={card.name}
            onChange={(e) => onUpdate({ ...card, name: e.target.value.toUpperCase() })}
            placeholder="NAMA LENGKAP"
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold text-slate-800 uppercase"
          />
        </div>

        {/* Company / Vendor */}
        <div>
          <label className="block font-semibold text-slate-700 mb-1">
            Perusahaan / Vendor / Departemen
          </label>
          <input
            type="text"
            value={card.company}
            onChange={(e) => onUpdate({ ...card, company: e.target.value })}
            placeholder="PT. KAIZEN GLOBAL INDONESIA"
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-800"
          />
        </div>

        {/* ID Label & ID Number */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Label ID (Bisa Berubah)
            </label>
            <input
              type="text"
              value={card.idLabel}
              onChange={(e) => onUpdate({ ...card, idLabel: e.target.value })}
              placeholder="ID KONTRAKTOR"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-800"
            />
            {/* Presets */}
            <div className="flex flex-wrap gap-1 mt-1">
              {PRESET_LABELS.slice(0, 3).map((l) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => onUpdate({ ...card, idLabel: l })}
                  className="text-[9px] text-slate-500 hover:text-blue-600 underline"
                >
                  {l}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Nomor ID
            </label>
            <input
              type="text"
              value={card.idNumber}
              onChange={(e) => onUpdate({ ...card, idNumber: e.target.value })}
              placeholder="26090378"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono font-bold text-blue-700"
            />
          </div>
        </div>

        {/* QR Code Section (Only QR Code, Barcode removed) */}
        <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between mb-2.5">
            <span className="font-bold text-slate-800 flex items-center gap-1.5 text-xs">
              <QrCode className="w-4 h-4 text-blue-600" />
              QR Code Identitas
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 mb-3">
            <button
              type="button"
              onClick={() =>
                onUpdate({
                  ...card,
                  codeFormat: 'qr',
                  qrType: 'auto',
                })
              }
              className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg text-xs font-semibold border transition-all ${
                qrType === 'auto'
                  ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              Auto dari Nomor ID
            </button>

            <button
              type="button"
              onClick={() => {
                onUpdate({
                  ...card,
                  codeFormat: 'qr',
                  qrType: 'upload',
                });
                if (!qrCodeUrl) {
                  qrInputRef.current?.click();
                }
              }}
              className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg text-xs font-semibold border transition-all ${
                qrType === 'upload'
                  ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5" />
              Upload QR Code
            </button>
          </div>

          <input
            ref={qrInputRef}
            type="file"
            accept="image/*"
            onChange={handleQrUpload}
            className="hidden"
          />

          {qrType === 'auto' ? (
            <p className="text-[11px] text-slate-500 flex items-center gap-1.5 bg-white p-2.5 rounded-lg border border-slate-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                QR Code otomatis digenerate dari Nomor ID ({card.idNumber || '00000000'}).
              </span>
            </p>
          ) : (
            <div className="bg-white p-2.5 rounded-lg border border-slate-200 space-y-2">
              {qrCodeUrl ? (
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-10 h-10 bg-slate-50 border border-slate-200 rounded p-0.5 flex items-center justify-center shrink-0">
                      <img
                        src={qrCodeUrl}
                        alt="Uploaded QR Code"
                        className="max-w-full max-h-full object-contain"
                      />
                    </div>
                    <span className="text-[11px] text-emerald-700 font-semibold truncate">
                      ✓ Gambar QR Code Terpasang
                    </span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        setCropTarget('qr');
                        setTempImageForCrop(qrCodeUrl);
                        setCropperOpen(true);
                      }}
                      className="flex items-center gap-1 px-2 py-1 text-[11px] bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium rounded transition-colors"
                      title="Sesuaikan crop 1:1 gambar QR Code"
                    >
                      <Crop className="w-3 h-3" /> Crop
                    </button>
                    <button
                      type="button"
                      onClick={() => qrInputRef.current?.click()}
                      className="px-2.5 py-1 text-[11px] bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded transition-colors"
                    >
                      Ganti
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        onUpdate({
                          ...card,
                          qrType: 'auto',
                          qrCodeUrl: '',
                        })
                      }
                      className="px-2 py-1 text-[11px] text-red-600 hover:bg-red-50 rounded transition-colors"
                      title="Hapus gambar dan kembali ke auto generate"
                    >
                      Reset
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => qrInputRef.current?.click()}
                  className="w-full py-2.5 px-3 border border-dashed border-blue-400 bg-blue-50/50 hover:bg-blue-50 text-blue-700 font-semibold rounded-lg text-xs flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Upload className="w-3.5 h-3.5" />
                  Pilih File Gambar QR Code
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Cropper Modal */}
      <ImageCropperModal
        isOpen={cropperOpen}
        imageSrc={tempImageForCrop}
        onClose={() => setCropperOpen(false)}
        onCropComplete={(cropped) => {
          if (cropTarget === 'qr') {
            onUpdate({
              ...card,
              qrType: 'upload',
              qrCodeUrl: cropped,
              barcodeType: 'upload',
              barcodeUrl: cropped,
            });
          } else {
            onUpdate({
              ...card,
              photoUrl: cropped,
            });
          }
        }}
        aspectRatio={cropTarget === 'qr' ? 1 : 3 / 4}
        lockAspectRatio={cropTarget === 'qr'}
        title={cropTarget === 'qr' ? 'Sesuaikan Gambar QR Code (1:1)' : undefined}
        description={
          cropTarget === 'qr'
            ? 'Geser, zoom, atau putar agar area QR Code pas di dalam kotak 1:1'
            : undefined
        }
        applyLabel={cropTarget === 'qr' ? 'Terapkan QR Code' : undefined}
        outputWidth={cropTarget === 'qr' ? 600 : 480}
        outputHeight={cropTarget === 'qr' ? 600 : 640}
        outputFormat={cropTarget === 'qr' ? 'image/png' : 'image/jpeg'}
      />
    </div>
  );
};
