import React, { useRef, useState, useEffect } from 'react';
import { Camera, RefreshCw, X, AlertTriangle, CheckCircle } from 'lucide-react';

interface CameraCaptureProps {
  onImageCaptured: (file: File) => void;
  onClose: () => void;
}

export const CameraCapture: React.FC<CameraCaptureProps> = ({ onImageCaptured, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState<boolean>(true);

  useEffect(() => {
    let activeStream: MediaStream | null = null;

    const startCamera = async () => {
      try {
        setIsInitializing(true);
        setErrorMsg(null);
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error('Camera access API is not supported in this browser.');
        }

        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } }
        });
        activeStream = mediaStream;
        setStream(mediaStream);

        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          videoRef.current.play();
        }
      } catch (err: any) {
        setErrorMsg(err.message || 'Unable to access system camera. Ensure camera permissions are granted.');
      } finally {
        setIsInitializing(false);
      }
    };

    startCamera();

    return () => {
      if (activeStream) {
        activeStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const handleCapture = () => {
    if (!videoRef.current) return;

    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], `camera_capture_${Date.now()}.jpg`, { type: 'image/jpeg' });
        // Stop camera
        if (stream) {
          stream.getTracks().forEach((track) => track.stop());
        }
        onImageCaptured(file);
      }
    }, 'image/jpeg', 0.92);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-emerald-600" />
            <h3 className="font-semibold text-slate-800 text-sm">Optical Waste Camera Capture</h3>
          </div>
          <button
            onClick={() => {
              if (stream) stream.getTracks().forEach((t) => t.stop());
              onClose();
            }}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 flex flex-col items-center">
          {errorMsg ? (
            <div className="p-6 text-center">
              <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto mb-3">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h4 className="font-semibold text-slate-800 mb-1">Camera Stream Unavailable</h4>
              <p className="text-xs text-slate-500 max-w-xs mx-auto mb-4">{errorMsg}</p>
              <button
                onClick={() => {
                  if (stream) stream.getTracks().forEach((t) => t.stop());
                  onClose();
                }}
                className="px-4 py-2 bg-slate-800 text-white rounded-lg text-xs font-medium hover:bg-slate-900 transition"
              >
                Return to File Upload
              </button>
            </div>
          ) : (
            <>
              <div className="relative w-full aspect-4/3 bg-black rounded-xl overflow-hidden shadow-inner flex items-center justify-center">
                {isInitializing && (
                  <div className="text-white text-xs flex items-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" />
                    Connecting to optical sensor...
                  </div>
                )}
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover ${isInitializing ? 'hidden' : 'block'}`}
                />
                <div className="absolute inset-4 border-2 border-emerald-400/40 rounded-lg pointer-events-none border-dashed flex items-center justify-center">
                  <span className="text-[11px] text-emerald-300/80 bg-slate-950/60 px-2 py-0.5 rounded-sm">
                    Position specimen in frame
                  </span>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between w-full">
                <button
                  onClick={() => {
                    if (stream) stream.getTracks().forEach((t) => t.stop());
                    onClose();
                  }}
                  className="px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCapture}
                  disabled={isInitializing}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-emerald-600/30 flex items-center gap-2 transition disabled:opacity-50"
                >
                  <CheckCircle className="w-4 h-4" />
                  Capture Frame & Classify
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
