import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Camera, SwitchCamera, X, AlertCircle, RefreshCw } from 'lucide-react';

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
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [isInitializing, setIsInitializing] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Stop camera tracks helper
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
      setStream(null);
    }
  }, []);

  // Start camera stream
  const startCamera = useCallback(async (mode: 'environment' | 'user') => {
    setIsInitializing(true);
    setCameraError(null);

    // Stop existing stream first
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera access is not supported by your browser. Please use Chrome/Safari on mobile or https.');
      }

      // High-resolution video constraint
      const constraints: MediaStreamConstraints = {
        audio: false,
        video: {
          facingMode: { ideal: mode },
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      };

      let newStream: MediaStream;
      try {
        newStream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch (e) {
        // Fallback to basic video constraint if ideal failed
        newStream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: true
        });
      }

      streamRef.current = newStream;
      setStream(newStream);

      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
        videoRef.current.setAttribute('playsinline', 'true');
        await videoRef.current.play().catch(() => {
          // auto-play policy catch
        });
      }
    } catch (err: any) {
      let msg = 'Could not access camera. Please allow camera permissions.';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        msg = 'Camera permission denied. Please allow camera access in your browser site settings.';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        msg = 'No camera found on this device.';
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        msg = 'Camera is currently in use by another application.';
      } else if (err.message) {
        msg = err.message;
      }
      setCameraError(msg);
    } finally {
      setIsInitializing(false);
    }
  }, []);

  // When modal opens/closes or facingMode changes
  useEffect(() => {
    if (isOpen) {
      startCamera(facingMode);
    } else {
      stopStream();
      setCameraError(null);
      setIsCapturing(false);
    }

    return () => {
      stopStream();
    };
  }, [isOpen, facingMode, startCamera, stopStream]);

  if (!isOpen) return null;

  // Capture frame directly from video element
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-5 bg-black sm:bg-black/85 backdrop-blur-xs animate-fadeIn">
      <div className="w-full h-full sm:h-auto sm:max-w-md bg-white sm:border-3 sm:border-google-dark sm:rounded-3xl p-3.5 sm:p-5 shadow-brutal-lg flex flex-col justify-between relative overflow-hidden">
        {/* Top Header */}
        <div className="flex items-center justify-between pb-2.5 sm:pb-3 mb-1 border-b border-gray-200 flex-shrink-0">
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

        {/* Live Camera Viewfinder (Full-height extended vision view on mobile) */}
        <div className="relative flex-1 w-full min-h-[300px] sm:min-h-0 sm:aspect-[324/290] bg-black rounded-2xl overflow-hidden border-2 border-google-dark shadow-inner flex items-center justify-center my-2">
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
              <div className="absolute inset-4 sm:inset-6 border border-white/40 rounded-xl pointer-events-none flex flex-col justify-between p-3">
                <div className="flex justify-between">
                  <div className="w-5 h-5 border-t-2 border-l-2 border-white" />
                  <div className="w-5 h-5 border-t-2 border-r-2 border-white" />
                </div>
                <div className="flex justify-between">
                  <div className="w-5 h-5 border-b-2 border-l-2 border-white" />
                  <div className="w-5 h-5 border-b-2 border-r-2 border-white" />
                </div>
              </div>

              {isInitializing && (
                <div className="absolute inset-0 bg-black/75 flex flex-col items-center justify-center gap-2 text-white">
                  <div className="w-7 h-7 border-3 border-white border-t-transparent rounded-full animate-spin" />
                  <span className="text-xs font-bold">Opening camera...</span>
                </div>
              )}
            </>
          )}
        </div>

        {/* Camera Controls Bar (Strictly Live Shutter & Switch Camera, ZERO upload options) */}
        <div className="flex-shrink-0 pt-2 pb-1 sm:pt-4 px-2">
          <div className="flex items-center justify-between gap-4">
            {/* Switch Camera Button (Front / Rear) */}
            <div className="w-12 flex justify-start">
              {!cameraError && (
                <button
                  type="button"
                  onClick={handleToggleCamera}
                  disabled={isInitializing || isCapturing}
                  className="p-3 bg-gray-100 hover:bg-gray-200 border-2 border-google-dark rounded-full transition shadow-xs cursor-pointer disabled:opacity-50"
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

          <div className="text-center mt-2.5 text-[10px] text-google-grey font-medium">
            Photos must be clicked in real time at the event.
          </div>
        </div>
      </div>
    </div>
  );
};
