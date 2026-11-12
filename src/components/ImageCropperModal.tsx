import React, { useEffect, useRef, useState } from 'react';
import Cropper from 'cropperjs';
import { RotateCw, ZoomIn, ZoomOut, FlipHorizontal, Check, X, RefreshCw } from 'lucide-react';

interface ImageCropperModalProps {
  isOpen: boolean;
  imageSrc: string;
  onCropComplete: (croppedDataUrl: string) => void;
  onClose: () => void;
  aspectRatio?: number; // 3/4 = 0.75 for standard portrait, 1 for square QR
  lockAspectRatio?: boolean;
  title?: string;
  description?: string;
  applyLabel?: string;
  outputWidth?: number;
  outputHeight?: number;
  outputFormat?: 'image/jpeg' | 'image/png';
}

export const ImageCropperModal: React.FC<ImageCropperModalProps> = ({
  isOpen,
  imageSrc,
  onCropComplete,
  onClose,
  aspectRatio = 3 / 4,
  lockAspectRatio = false,
  title = 'Sesuaikan & Crop Foto',
  description = 'Atur posisi, perbesar, dan potong foto agar rapi dan tidak gepeng pada ID card.',
  applyLabel = 'Terapkan Foto',
  outputWidth = 480,
  outputHeight = 640,
  outputFormat = 'image/jpeg',
}) => {
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const cropperInstance = useRef<Cropper | null>(null);
  const [selectedRatio, setSelectedRatio] = useState<number | undefined>(aspectRatio);

  useEffect(() => {
    if (isOpen) {
      setSelectedRatio(aspectRatio);
      setScaleX(1);
    }
  }, [isOpen, aspectRatio]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      if (!dialog.open) {
        dialog.showModal();
      }
    } else {
      if (dialog.open) {
        dialog.close();
      }
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !imageSrc || !imageRef.current) return;

    if (cropperInstance.current) {
      cropperInstance.current.destroy();
    }

    const cropper = new Cropper(imageRef.current, {
      aspectRatio: selectedRatio,
      viewMode: 1,
      dragMode: 'move',
      autoCropArea: 0.9,
      restore: false,
      guides: true,
      center: true,
      highlight: false,
      cropBoxMovable: true,
      cropBoxResizable: true,
      toggleDragModeOnDblclick: false,
    });

    cropperInstance.current = cropper;

    return () => {
      cropper.destroy();
      cropperInstance.current = null;
    };
  }, [isOpen, imageSrc, selectedRatio]);

  const handleApply = () => {
    if (!cropperInstance.current) return;
    const canvas = cropperInstance.current.getCroppedCanvas({
      width: outputWidth,
      height: outputHeight,
      fillColor: '#ffffff',
      imageSmoothingEnabled: true,
      imageSmoothingQuality: 'high',
    });
    if (canvas) {
      const croppedUrl =
        outputFormat === 'image/png'
          ? canvas.toDataURL('image/png')
          : canvas.toDataURL('image/jpeg', 0.92);
      onCropComplete(croppedUrl);
      onClose();
    }
  };

  const handleRotate = () => {
    cropperInstance.current?.rotate(90);
  };

  const handleZoom = (ratio: number) => {
    cropperInstance.current?.zoom(ratio);
  };

  const [scaleX, setScaleX] = useState(1);
  const handleFlip = () => {
    const newScale = scaleX === 1 ? -1 : 1;
    cropperInstance.current?.scaleX(newScale);
    setScaleX(newScale);
  };

  const handleReset = () => {
    cropperInstance.current?.reset();
    setScaleX(1);
  };

  const handleRatioChange = (ratio: number | undefined) => {
    setSelectedRatio(ratio);
    cropperInstance.current?.setAspectRatio(ratio || NaN);
  };

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      aria-labelledby="cropper-dialog-title"
      className="p-0 rounded-2xl shadow-2xl backdrop:bg-slate-900/60 backdrop:backdrop-blur-sm bg-white max-w-2xl w-full m-auto overflow-hidden border border-slate-200"
      style={{ overscrollBehavior: 'contain' }}
    >
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
        <div>
          <h2 id="cropper-dialog-title" className="text-lg font-bold text-slate-800">
            {title}
          </h2>
          <p className="text-xs text-slate-500">
            {description}
          </p>
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

      <div className="p-6">
        {/* Cropper Container */}
        <div className="relative w-full h-80 bg-slate-900 rounded-xl overflow-hidden flex items-center justify-center">
          <img
            ref={imageRef}
            src={imageSrc}
            alt="Crop preview"
            className="max-h-full max-w-full block"
          />
        </div>

        {/* Controls Toolbar */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm">
          {lockAspectRatio ? (
            <div className="flex items-center gap-1.5 bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-xl">
              <span className="text-xs font-bold text-blue-700">
                🔒 Rasio Terkunci 1:1 (Kotak)
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
              <span className="text-xs font-semibold px-2 text-slate-500">Rasio:</span>
              <button
                type="button"
                onClick={() => handleRatioChange(3 / 4)}
                className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors ${
                  selectedRatio === 3 / 4
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-700 hover:bg-slate-200'
                }`}
              >
                3:4 (Pas Foto)
              </button>
              <button
                type="button"
                onClick={() => handleRatioChange(1)}
                className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors ${
                  selectedRatio === 1
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-700 hover:bg-slate-200'
                }`}
              >
                1:1 (Kotak)
              </button>
              <button
                type="button"
                onClick={() => handleRatioChange(undefined)}
                className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors ${
                  selectedRatio === undefined
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-700 hover:bg-slate-200'
                }`}
              >
                Bebas
              </button>
            </div>
          )}

          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => handleZoom(0.1)}
              className="p-1.5 text-slate-700 hover:text-blue-600 hover:bg-white rounded-lg transition-colors"
              title="Perbesar"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => handleZoom(-0.1)}
              className="p-1.5 text-slate-700 hover:text-blue-600 hover:bg-white rounded-lg transition-colors"
              title="Perkecil"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleRotate}
              className="p-1.5 text-slate-700 hover:text-blue-600 hover:bg-white rounded-lg transition-colors"
              title="Putar 90°"
            >
              <RotateCw className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleFlip}
              className="p-1.5 text-slate-700 hover:text-blue-600 hover:bg-white rounded-lg transition-colors"
              title="Cermin Horizontal"
            >
              <FlipHorizontal className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="p-1.5 text-slate-700 hover:text-blue-600 hover:bg-white rounded-lg transition-colors"
              title="Reset"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 px-6 py-4 bg-slate-50 border-t border-slate-200">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200 rounded-xl transition-colors"
        >
          Batal
        </button>
        <button
          type="button"
          onClick={handleApply}
          className="flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm transition-colors"
        >
          <Check className="w-4 h-4" />
          {applyLabel}
        </button>
      </div>
    </dialog>
  );
};

