'use client';

import { useState, useRef, useCallback } from 'react';
import ReactCrop, { Crop, PixelCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { Button } from '@/components/ui/button';
import { X, Grid3x3 } from 'lucide-react';
import imageCompression from 'browser-image-compression';

interface ImageCropModalProps {
  isOpen: boolean;
  imageUrl: string;
  aspectRatio?: number;
  onCropComplete: (croppedFile: File) => void;
  onClose: () => void;
  title?: string;
}

export default function ImageCropModal({
  isOpen,
  imageUrl,
  aspectRatio = 1,
  onCropComplete,
  onClose,
  title = 'Crop Image',
}: ImageCropModalProps) {
  const [crop, setCrop] = useState<Crop>({
    unit: '%',
    width: 90,
    height: aspectRatio === 1 ? 90 : 67.5, // 90% for square, adjust for 4:3
    x: 5,
    y: aspectRatio === 1 ? 5 : 16.25,
  });
  const [completedCrop, setCompletedCrop] = useState<PixelCrop | null>(null);
  const [processing, setProcessing] = useState(false);
  const [showGrid, setShowGrid] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const imgRef = useRef<HTMLImageElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    imgRef.current = e.currentTarget;
  }, []);

  const getCroppedImg = async (): Promise<File | null> => {
    if (!completedCrop || !imgRef.current) {
      setErrorMessage('No crop area selected');
      return null;
    }

    const image = imgRef.current;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      setErrorMessage('Failed to get canvas context');
      return null;
    }

    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;

    // Set canvas size to the cropped dimensions
    canvas.width = completedCrop.width;
    canvas.height = completedCrop.height;

    // Draw the cropped image
    ctx.drawImage(
      image,
      completedCrop.x * scaleX,
      completedCrop.y * scaleY,
      completedCrop.width * scaleX,
      completedCrop.height * scaleY,
      0,
      0,
      completedCrop.width,
      completedCrop.height
    );

    // Store canvas ref for debugging
    canvasRef.current = canvas;

    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Canvas is empty'));
            return;
          }
          const file = new File([blob], 'cropped-image.jpg', { type: 'image/jpeg' });
          resolve(file);
        },
        'image/jpeg',
        0.95
      );
    });
  };

  const handleCropComplete = async () => {
    setProcessing(true);
    setErrorMessage('');
    
    try {
      const croppedFile = await getCroppedImg();
      if (!croppedFile) {
        throw new Error('Failed to crop image - no file generated');
      }

      console.log('Cropped file size:', croppedFile.size, 'bytes');

      // Compress the cropped image
      const compressionOptions = {
        maxSizeMB: aspectRatio === 1 ? 0.5 : 1, // Logo: 500KB, Banner: 1MB
        maxWidthOrHeight: aspectRatio === 1 ? 512 : 1920,
        useWebWorker: true,
        fileType: 'image/jpeg' as const,
      };

      const compressedFile = await imageCompression(croppedFile, compressionOptions);
      
      console.log('Compressed file size:', compressedFile.size, 'bytes');

      if (compressedFile.size === 0) {
        throw new Error('Compressed file is empty');
      }
      
      onCropComplete(compressedFile);
      onClose();
    } catch (error) {
      console.error('Error cropping image:', error);
      const errorMsg = error instanceof Error ? error.message : 'Failed to crop image';
      setErrorMessage(errorMsg);
    } finally {
      setProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
          <div>
            <h2 className="text-xl font-bold">{title}</h2>
            <p className="text-sm text-muted-foreground mt-1">
              {aspectRatio === 1 
                ? 'Crop to square (512x512 recommended)' 
                : 'Crop to 4:3 ratio for banner'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowGrid(!showGrid)}
              className={`p-2 rounded-md transition-colors ${
                showGrid 
                  ? 'bg-primary text-primary-foreground' 
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
              title={showGrid ? 'Hide grid' : 'Show grid'}
              disabled={processing}
            >
              <Grid3x3 className="h-5 w-5" />
            </button>
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground p-2"
              disabled={processing}
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Error Message */}
        {errorMessage && (
          <div className="mx-4 mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
            <p className="text-sm text-red-600 dark:text-red-400">{errorMessage}</p>
          </div>
        )}

        {/* Crop Area */}
        <div className="p-4 overflow-auto max-h-[calc(90vh-180px)]">
          <div className="relative inline-block">
            <ReactCrop
              crop={crop}
              onChange={(c) => setCrop(c)}
              onComplete={(c) => setCompletedCrop(c)}
              aspect={aspectRatio}
              className="max-w-full"
              ruleOfThirds={showGrid}
            >
              <img
                ref={imgRef}
                src={imageUrl}
                alt="Crop preview"
                onLoad={onImageLoad}
                className="max-w-full h-auto"
                crossOrigin="anonymous"
              />
            </ReactCrop>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t dark:border-gray-700 bg-muted/30">
          <div className="text-sm text-muted-foreground">
            {aspectRatio === 1 ? (
              <>1:1 ratio • Optimized to ~500KB • 512x512px</>
            ) : (
              <>4:3 ratio • Optimized to ~1MB • 1920px wide</>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={processing}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCropComplete}
              disabled={processing || !completedCrop}
            >
              {processing ? 'Processing...' : 'Crop & Save'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
