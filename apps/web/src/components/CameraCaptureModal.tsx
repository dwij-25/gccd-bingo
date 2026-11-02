import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, Camera, SwitchCamera, AlertCircle, RefreshCw } from 'lucide-react';

interface CameraCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  tileTitle: string;
  onCapture: (dataUrl: string) => void;
}

export const CameraCaptureModal: React.FC<CameraCaptureModalProps> = ({
  isOpen,
  onClose,
  tileTitle,
  onCapture
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [isInitializing, setIsInitializing] = useState(true);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);

  // Clean stop all video tracks
  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        try {
          track.stop();
        } catch {
          // ignore
        }
      });
      streamRef.current = null;
    }
  }, []);

  // Initialize camera stream
  const startCamera = useCallback(async (mode: 'environment' | 'user') => {
    setIsInitializing(true);
    setIsCapturing(false);
    setCameraError(null);
    stopStream();

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera access is not supported on this browser.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: mode },
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
        audio: false
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        try {
          await videoRef.current.play();
        } catch {
          // play error
        }
      }
      setIsInitializing(false);
    } catch (err: any) {
      setIsInitializing(false);
      const msg = err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError'
        ? 'Camera permission was denied. Please allow camera access in your browser settings to click your photo.'
        : (err.message || 'Unable to open camera.');
      setCameraError(msg);
    }
  }, [stopStream]);

  // Start stream when modal opens; clean up when closed
  useEffect(() => {
    if (isOpen) {
      setIsCapturing(false);
      startCamera(facingMode);
    } else {
      setIsCapturing(false);
      stopStream();
    }
    return () => {
      setIsCapturing(false);
      stopStream();
    };
  }, [isOpen, facingMode, startCamera, stopStream]);

  if (!isOpen) return null;

  // Snap the photo from live stream
  const handleShutterClick = () => {
    if (!videoRef.current || isCapturing) return;

    setIsCapturing(true);

    try {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      const width = video.videoWidth || 1280;
      const height = video.videoHeight || 720;
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Could not access canvas context');

      // Flip horizontally if front camera for natural selfie view
      if (facingMode === 'user') {
        ctx.translate(width, 0);
        ctx.scale(-1, 1);
      }

      ctx.drawImage(video, 0, 0, width, height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.92);

      // Stop stream tracks
      stopStream();

      // Immediately pass captured image to crop adjuster
      onCapture(dataUrl);
    } catch (err: any) {
      alert('Failed to click photo: ' + (err.message || 'Unknown camera error'));
    } finally {
      setIsCapturing(false);
    }
  };

  const handleToggleCamera = () => {
    setFacingMode(prev => (prev === 'environment' ? 'user' : 'environment'));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-xs animate-fadeIn">
      <div className="w-full max-w-md bg-white border-3 border-google-dark rounded-3xl p-4 sm:p-5 shadow-brutal-lg flex flex-col relative max-h-[95vh] overflow-hidden">
        {/* Top Header */}
        <div className="flex items-center justify-between pb-3 mb-2 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-google-blue/10 text-google-blue rounded-lg border border-google-blue">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-xs sm:text-sm text-google-dark">
                Click Picture at this moment
              </h3>
              <p className="text-[11px] font-semibold text-google-grey truncate max-w-[220px] sm:max-w-xs">
                {tileTitle}
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              setIsCapturing(false);
              stopStream();
              onClose();
            }}
            className="p-1.5 rounded-full hover:bg-gray-100 transition cursor-pointer"
            aria-label="Close Camera"
          >
            <X className="w-5 h-5 text-google-dark" />
          </button>
        </div>

        {/* Live Camera Viewfinder */}
        <div className="relative w-full aspect-[324/290] bg-black rounded-2xl overflow-hidden border-2 border-google-dark shadow-inner flex items-center justify-center">
          {cameraError ? (
            <div className="p-5 text-center flex flex-col items-center justify-center gap-3">
              <AlertCircle className="w-8 h-8 text-google-red" />
              <p className="text-xs text-white/90 font-medium leading-relaxed">
                {cameraError}
              </p>
              <button
                type="button"
                onClick={() => startCamera(facingMode)}
                className="px-4 py-2 bg-google-blue text-white text-xs font-bold border-2 border-white rounded-xl shadow-brutal hover:bg-blue-600 transition flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Try Camera Again</span>
              </button>
            </div>
          ) : (
            <>
              <video
                ref={videoRef}
                playsInline
                autoPlay
                muted
                className={`w-full h-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
              />

              {/* Viewfinder Target Guidelines */}
              <div className="absolute inset-4 border border-white/40 rounded-xl pointer-events-none flex flex-col justify-between p-2">
                <div className="flex justify-between">
                  <div className="w-4 h-4 border-t-2 border-l-2 border-white" />
                  <div className="w-4 h-4 border-t-2 border-r-2 border-white" />
                </div>
                <div className="flex justify-between">
                  <div className="w-4 h-4 border-b-2 border-l-2 border-white" />
                  <div className="w-4 h-4 border-b-2 border-r-2 border-white" />
                </div>
              </div>

              {isInitializing && (
                <div className="absolute inset-0 bg-black/75 flex flex-col items-center justify-center gap-2 text-white">
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span className="text-xs font-bold">Opening camera...</span>
                </div>
              )}
            </>
          )}
        </div>

        {/* Camera Controls Bar (Strictly Live Shutter & Switch Camera, ZERO upload options) */}
        <div className="flex items-center justify-between gap-4 pt-4 px-2">
          {/* Switch Camera Button (Front / Rear) */}
          <div className="w-12 flex justify-start">
            {!cameraError && (
              <button
                type="button"
                onClick={handleToggleCamera}
                disabled={isInitializing || isCapturing}
                className="p-2.5 bg-gray-100 hover:bg-gray-200 border-2 border-google-dark rounded-full transition shadow-xs cursor-pointer disabled:opacity-50"
                title={`Switch to ${facingMode === 'environment' ? 'Front (Selfie)' : 'Rear'} camera`}
                aria-label="Switch Camera"
              >
                <SwitchCamera className="w-4 h-4 text-google-dark" />
              </button>
            )}
          </div>

          {/* Big Center Shutter Button */}
          <div className="flex-1 flex justify-center">
            <button
              type="button"
              disabled={isInitializing || Boolean(cameraError) || isCapturing}
              onClick={handleShutterClick}
              className="w-16 h-16 rounded-full bg-google-red hover:bg-red-600 active:scale-95 border-4 border-google-dark shadow-brutal flex items-center justify-center transition disabled:opacity-50 cursor-pointer group"
              title="Click photo now"
              aria-label="Click photo"
            >
              <div className="w-11 h-11 rounded-full border-2 border-white bg-white/20 group-hover:bg-white/40 transition flex items-center justify-center">
                <div className="w-4 h-4 rounded-full bg-white" />
              </div>
            </button>
          </div>

          {/* Balance spacer: right side has NO upload button */}
          <div className="w-12" />
        </div>

        <div className="text-center mt-3 text-[10px] text-google-grey font-medium">
          Photos must be clicked in real time at the event.
        </div>
      </div>
    </div>
  );
};
