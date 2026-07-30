/**
 * CameraCaptureDialog - live camera capture via getUserMedia.
 *
 * Works on desktop webcams, tablets, and mobile browsers. Captures the current
 * video frame as a JPEG File and returns it through `onCapture`.
 * Requires a secure context (HTTPS or localhost) — getUserMedia is blocked otherwise.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { Camera, Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface CameraCaptureDialogProps {
  open: boolean;
  onClose: () => void;
  onCapture: (file: File) => void;
}

export function CameraCaptureDialog({
  open,
  onClose,
  onCapture,
}: Readonly<CameraCaptureDialogProps>) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');

  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }, []);

  const start = useCallback(
    async (mode: 'user' | 'environment') => {
      setError(null);
      setStarting(true);
      stop();
      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          throw new Error('unsupported');
        }
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: mode },
          audio: false,
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => undefined);
        }
      } catch (err) {
        if (err instanceof Error && err.message === 'unsupported') {
          setError('Camera is not supported on this browser.');
        } else if (
          err instanceof DOMException &&
          (err.name === 'NotAllowedError' || err.name === 'SecurityError')
        ) {
          setError('Camera permission denied. Allow camera access in your browser settings.');
        } else if (err instanceof DOMException && err.name === 'NotFoundError') {
          setError('No camera was found on this device.');
        } else {
          setError('Unable to start the camera. Please try again.');
        }
      } finally {
        setStarting(false);
      }
    },
    [stop]
  );

  useEffect(() => {
    if (open) {
      void start(facingMode);
    } else {
      stop();
    }
    return () => stop();
    // Only re-run when the dialog opens/closes; facingMode changes call start() directly.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handleCapture = useCallback(() => {
    const video = videoRef.current;
    if (!video?.videoWidth) {
      return;
    }
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return;
    }
    ctx.drawImage(video, 0, 0);
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          return;
        }
        const file = new File([blob], `camera-${Date.now()}.jpg`, {
          type: 'image/jpeg',
          lastModified: Date.now(),
        });
        onCapture(file);
        onClose();
      },
      'image/jpeg',
      0.92
    );
  }, [onCapture, onClose]);

  const switchCamera = useCallback(() => {
    const next = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(next);
    void start(next);
  }, [facingMode, start]);

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Take a photo</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div className="relative aspect-[3/4] w-full overflow-hidden rounded-lg bg-black">
            {error ? (
              <div className="text-muted-foreground absolute inset-0 flex items-center justify-center p-6 text-center text-sm">
                {error}
              </div>
            ) : (
              <>
                <video ref={videoRef} playsInline muted className="h-full w-full object-cover" />
                {starting && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-white" />
                  </div>
                )}
              </>
            )}
          </div>

          <div className="flex items-center justify-between gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={switchCamera}
              disabled={!!error || starting}
            >
              <RefreshCw className="mr-1.5 h-4 w-4" />
              Switch
            </Button>
            <Button type="button" onClick={handleCapture} disabled={!!error || starting}>
              <Camera className="mr-1.5 h-4 w-4" />
              Capture
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
