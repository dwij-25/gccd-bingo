import React, { useState, useCallback, useEffect } from 'react';
import Cropper from 'react-easy-crop';
import type { Point, Area } from 'react-easy-crop';
import { RotateCw, Check, X, RefreshCw, ZoomIn, ZoomOut } from 'lucide-react';

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

// Generate cropped data URL using HTML5 canvas
async function getCroppedImg(
  imageSrc: string,
  pixelCrop: Area,
  rotation = 0
): Promise<string> {
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = imageSrc;
  });

  const canvas = document.createElement('canvas');
  const targetWidth = 324;
  const targetHeight = 290;
  canvas.width = targetWidth;
  canvas.height = targetHeight;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas context error');

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // Draw rotated & cropped region
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

  return canvas.toDataURL('image/jpeg', 0.88);
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
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setCrop(initialCropData?.crop || { x: 0, y: 0 });
      setZoom(initialCropData?.zoom || 1);
      setRotation(initialCropData?.rotation || 0);
      setCroppedAreaPixels(null);
      setIsProcessing(false);
    }
  }, [isOpen, imageSrc, initialCropData]);

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
  };

  const handleConfirm = async () => {
    setIsProcessing(true);
    try {
      const croppedDataUrl = await getCroppedImg(
        imageSrc,
        croppedAreaPixels || { x: 0, y: 0, width: 324, height: 290 },
        rotation
      );

      const cropParams: CropData = {
        crop,
        zoom,
        rotation,
        mode: 'fill',
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-black/85 backdrop-blur-xs animate-fadeIn">
      <div className="w-full h-full sm:h-auto sm:max-w-lg bg-white border-0 sm:border-3 sm:border-google-dark rounded-none sm:rounded-3xl p-4 sm:p-6 shadow-brutal-lg flex flex-col justify-between overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 pb-2.5 sm:pb-3 mb-2 flex-shrink-0">
          <div>
            <h3 className="font-extrabold text-sm sm:text-base text-google-dark">
              Adjust & Position Photo
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

        {/* Stable, Fixed Crop Viewport - The container NEVER resizes on zoom */}
        <div
          style={{
            height: '340px',
            minHeight: '300px',
            width: '100%',
            position: 'relative',
            touchAction: 'none'
          }}
          className="w-full bg-gray-900 rounded-2xl overflow-hidden border-2 border-google-dark shadow-inner my-2 flex-shrink-0 select-none"
        >
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            rotation={rotation}
            aspect={324 / 290}
            cropSize={{ width: 260, height: 233 }}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onRotationChange={setRotation}
            onCropComplete={onCropComplete}
            showGrid={true}
            zoomSpeed={0.6}
            minZoom={1}
            maxZoom={3}
            classes={{
              cropAreaClassName: '!rounded-2xl !border-3 !border-white !shadow-[0_0_0_9999px_rgba(0,0,0,0.65)] pointer-events-none'
            }}
          />
        </div>

        {/* Intuitive Controls Bar */}
        <div className="space-y-3 mt-2 sm:mt-3 flex-shrink-0">
          {/* Zoom Controls with Clear +/- Buttons */}
          <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl p-2">
            <button
              type="button"
              onClick={() => setZoom(z => Math.max(1, +(z - 0.25).toFixed(2)))}
              className="w-8 h-8 rounded-lg bg-white border border-gray-300 font-black text-sm flex items-center justify-center hover:bg-gray-100 active:scale-95 transition cursor-pointer"
              title="Zoom Out"
              aria-label="Zoom Out"
            >
              <ZoomOut className="w-4 h-4 text-google-grey" />
            </button>

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

            <button
              type="button"
              onClick={() => setZoom(z => Math.min(3, +(z + 0.25).toFixed(2)))}
              className="w-8 h-8 rounded-lg bg-white border border-gray-300 font-black text-sm flex items-center justify-center hover:bg-gray-100 active:scale-95 transition cursor-pointer"
              title="Zoom In"
              aria-label="Zoom In"
            >
              <ZoomIn className="w-4 h-4 text-google-grey" />
            </button>

            <span className="text-xs font-mono font-bold w-10 text-right text-google-dark">
              {zoom.toFixed(1)}x
            </span>
          </div>

          {/* Action Buttons: Rotate, Reset, Cancel, Save */}
          <div className="flex items-center justify-between gap-2 pt-1">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleRotate}
                className="px-3 py-2 bg-gray-100 border border-gray-300 rounded-xl text-xs font-extrabold flex items-center gap-1.5 hover:bg-gray-200 active:scale-95 transition cursor-pointer"
                title="Rotate 90 degrees"
              >
                <RotateCw className="w-3.5 h-3.5 text-google-blue" />
                <span>Rotate</span>
              </button>

              <button
                type="button"
                onClick={handleReset}
                className="p-2 text-google-grey hover:text-google-dark bg-gray-100 rounded-xl border border-gray-200 transition cursor-pointer"
                title="Reset position and zoom"
                aria-label="Reset"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isProcessing}
                className="px-3.5 py-2 text-xs font-bold text-google-grey hover:text-google-dark transition cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleConfirm}
                disabled={isProcessing}
                className="px-5 py-2.5 bg-google-green text-white font-black text-xs sm:text-sm border-2 border-google-dark rounded-xl shadow-brutal hover:bg-green-600 active:shadow-none transition flex items-center gap-1.5 cursor-pointer"
              >
                {isProcessing ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Save Photo</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <p className="text-[10px] text-google-grey text-center font-medium">
            Drag photo to reposition • Use +/- or slider to zoom
          </p>
        </div>
      </div>
    </div>
  );
};
