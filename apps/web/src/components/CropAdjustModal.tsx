import React, { useState, useCallback } from 'react';
import Cropper, { Point, Area } from 'react-easy-crop';
import { X, RotateCw, ZoomIn, ZoomOut, Check, RefreshCw, Maximize2, Minimize2 } from 'lucide-react';
import { TILE_ASPECT, TILE_SLOT_WIDTH, TILE_SLOT_HEIGHT } from '../lib/templateConfig.js';

export interface CropData {
  crop: Point;
  zoom: number;
  rotation: number;
  mode: 'fill' | 'fit';
  croppedAreaPixels?: Area;
}

interface CropAdjustModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageSrc: string;
  tileTitle: string;
  initialCropData?: CropData | null;
  onConfirmCrop: (croppedDataUrl: string, cropData: CropData) => Promise<void>;
}

// Helper to create the cropped image from pixel coordinates
async function getCroppedImg(
  imageSrc: string,
  pixelCrop: Area,
  rotation = 0,
  mode: 'fill' | 'fit' = 'fill'
): Promise<string> {
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = imageSrc;
  });

  const canvas = document.createElement('canvas');
  const targetWidth = 972;  // 3x resolution of 324x290 slot
  const targetHeight = 870;
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get canvas context');

  // Fill background if letterboxing in "fit" mode
  ctx.fillStyle = '#1E1E1E';
  ctx.fillRect(0, 0, targetWidth, targetHeight);

  // High quality interpolation
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  if (mode === 'fit') {
    // Draw contained with letterbox
    const hRatio = targetWidth / image.width;
    const vRatio = targetHeight / image.height;
    const ratio = Math.min(hRatio, vRatio);
    const centerShiftX = (targetWidth - image.width * ratio) / 2;
    const centerShiftY = (targetHeight - image.height * ratio) / 2;

    ctx.save();
    ctx.translate(targetWidth / 2, targetHeight / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.translate(-targetWidth / 2, -targetHeight / 2);
    ctx.drawImage(
      image,
      0,
      0,
      image.width,
      image.height,
      centerShiftX,
      centerShiftY,
      image.width * ratio,
      image.height * ratio
    );
    ctx.restore();
  } else {
    // Draw cropped area
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = image.width;
    tempCanvas.height = image.height;
    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx) throw new Error('Temp context error');

    tempCtx.save();
    tempCtx.translate(image.width / 2, image.height / 2);
    tempCtx.rotate((rotation * Math.PI) / 180);
    tempCtx.translate(-image.width / 2, -image.height / 2);
    tempCtx.drawImage(image, 0, 0);
    tempCtx.restore();

    ctx.drawImage(
      tempCanvas,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      targetWidth,
      targetHeight
    );
  }

  return canvas.toDataURL('image/jpeg', 0.85);
}

export const CropAdjustModal: React.FC<CropAdjustModalProps> = ({
  isOpen,
  onClose,
  imageSrc,
  tileTitle,
  initialCropData,
  onConfirmCrop
}) => {
  const [crop, setCrop] = useState<Point>(initialCropData?.crop || { x: 0, y: 0 });
  const [zoom, setZoom] = useState(initialCropData?.zoom || 1);
  const [rotation, setRotation] = useState(initialCropData?.rotation || 0);
  const [mode, setMode] = useState<'fill' | 'fit'>(initialCropData?.mode || 'fill');
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const onCropComplete = useCallback((_croppedArea: Area, currentCroppedAreaPixels: Area) => {
    setCroppedAreaPixels(currentCroppedAreaPixels);
  }, []);

  if (!isOpen) return null;

  const handleRotate = () => {
    setRotation(prev => (prev + 90) % 360);
  };

  const handleReset = () => {
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setRotation(0);
    setMode('fill');
  };

  const handleConfirm = async () => {
    if (!croppedAreaPixels && mode === 'fill') return;
    setIsProcessing(true);
    try {
      const croppedDataUrl = await getCroppedImg(
        imageSrc,
        croppedAreaPixels || { x: 0, y: 0, width: 324, height: 290 },
        rotation,
        mode
      );

      const cropParams: CropData = {
        crop,
        zoom,
        rotation,
        mode,
        croppedAreaPixels: croppedAreaPixels || undefined
      };

      onClose();
      await onConfirmCrop(croppedDataUrl, cropParams);
    } catch (err) {
      console.error('Failed to crop image:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-black sm:bg-black/80 backdrop-blur-xs animate-fadeIn">
      <div className="w-full h-full sm:h-auto sm:max-w-lg bg-white sm:border-3 sm:border-google-dark sm:rounded-3xl p-3.5 sm:p-6 shadow-brutal-lg flex flex-col justify-between max-h-full sm:max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 pb-2.5 sm:pb-3 mb-1 flex-shrink-0">
          <div>
            <h3 className="font-extrabold text-sm sm:text-base text-google-dark">
              Crop & Position Photo
            </h3>
            <p className="text-xs text-google-grey truncate max-w-[260px] sm:max-w-xs">
              {tileTitle}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-gray-100 transition cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-google-dark" />
          </button>
        </div>

        {/* Cropper Frame with Rounded Mask Preview */}
        <div className="relative flex-1 w-full min-h-[280px] sm:min-h-0 sm:h-80 bg-gray-900 rounded-2xl overflow-hidden border-2 border-google-dark shadow-inner my-2">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            rotation={rotation}
            aspect={TILE_ASPECT}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onRotationChange={setRotation}
            onCropComplete={onCropComplete}
            showGrid={true}
            cropShape="rect"
            classes={{
              cropAreaClassName: '!rounded-[22px] !border-3 !border-google-blue !shadow-[0_0_0_9999px_rgba(0,0,0,0.65)]'
            }}
          />
        </div>

        {/* Controls Bar */}
        <div className="space-y-3 mt-2 sm:mt-4 flex-shrink-0">
          {/* Zoom Slider */}
          <div className="flex items-center gap-3">
            <ZoomOut className="w-4 h-4 text-google-grey" />
            <input
              type="range"
              min={1}
              max={3}
              step={0.05}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="flex-1 accent-google-blue cursor-pointer h-2 bg-gray-200 rounded-lg"
              aria-label="Zoom slider"
            />
            <ZoomIn className="w-4 h-4 text-google-grey" />
            <span className="text-xs font-mono font-bold w-10 text-right text-google-dark">{zoom.toFixed(1)}x</span>
          </div>

          {/* Action Buttons: Rotate, Fit/Fill, Reset */}
          <div className="flex items-center justify-between gap-2 pt-1">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleRotate}
                className="px-3 py-1.5 bg-gray-100 border border-gray-300 rounded-xl text-xs font-bold flex items-center gap-1.5 hover:bg-gray-200 transition cursor-pointer"
                title="Rotate 90 degrees"
              >
                <RotateCw className="w-3.5 h-3.5 text-google-blue" />
                <span>Rotate</span>
              </button>

              <button
                type="button"
                onClick={() => setMode(m => (m === 'fill' ? 'fit' : 'fill'))}
                className="px-3 py-1.5 bg-gray-100 border border-gray-300 rounded-xl text-xs font-bold flex items-center gap-1.5 hover:bg-gray-200 transition cursor-pointer"
                title={mode === 'fill' ? "Switch to Fit (Letterbox)" : "Switch to Fill (Cover)"}
              >
                {mode === 'fill' ? (
                  <>
                    <Minimize2 className="w-3.5 h-3.5 text-google-yellow" />
                    <span>Fit</span>
                  </>
                ) : (
                  <>
                    <Maximize2 className="w-3.5 h-3.5 text-google-green" />
                    <span>Fill</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleReset}
                className="p-1.5 text-google-grey hover:text-google-dark transition cursor-pointer"
                title="Reset crop settings"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isProcessing}
                className="px-4 py-2 text-xs font-bold text-google-grey hover:text-google-dark transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={isProcessing}
                className="px-5 py-2 bg-google-green text-white font-extrabold text-xs sm:text-sm border-2 border-google-dark rounded-xl shadow-brutal hover:bg-green-600 active:shadow-none transition flex items-center gap-1.5 cursor-pointer"
              >
                {isProcessing ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Apply & Save</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
