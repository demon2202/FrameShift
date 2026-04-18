import React, { useState, useCallback } from 'react';
import { X, Check, RotateCcw } from 'lucide-react';
import Cropper from 'react-easy-crop';

interface ImageEditorProps {
    imageSrc: string;
    aspectRatio?: number | 'original'; // width / height
    onSave: (editedImage: string) => void;
    onCancel: () => void;
    circular?: boolean; // For profile pics
}

// Helper to create a canvas with the cropped image
const getCroppedImg = async (
    imageSrc: string,
    pixelCrop: { width: number; height: number; x: number; y: number },
    rotation: number = 0,
    circular: boolean = false
): Promise<string> => {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        img.addEventListener('load', () => resolve(img));
        img.addEventListener('error', (error) => reject(error));
        img.src = imageSrc;
    });

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
        throw new Error('No 2d context');
    }

    // calculate bounding box of the rotated image
    const rotRad = (rotation * Math.PI) / 180;
    const { width: bBoxWidth, height: bBoxHeight } = {
        width:
            Math.abs(Math.cos(rotRad) * image.width) +
            Math.abs(Math.sin(rotRad) * image.height),
        height:
            Math.abs(Math.sin(rotRad) * image.width) +
            Math.abs(Math.cos(rotRad) * image.height),
    };

    // set canvas size to match the bounding box
    canvas.width = bBoxWidth;
    canvas.height = bBoxHeight;

    // translate canvas context to a central location to allow rotating and flipping around the center
    ctx.translate(bBoxWidth / 2, bBoxHeight / 2);
    ctx.rotate(rotRad);

    // draw image
    ctx.drawImage(image, -image.width / 2, -image.height / 2);

    // extracted cropped image
    const data = ctx.getImageData(
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height
    );

    // set canvas width to final desired crop size - this will clear existing context
    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;

    // paste generated rotate image at the top left corner
    ctx.putImageData(data, 0, 0);

    // Scale down if the image is too large to prevent browser hang and huge base64 strings
    const MAX_SIZE = 1200;
    if (canvas.width > MAX_SIZE || canvas.height > MAX_SIZE) {
        const ratio = Math.min(MAX_SIZE / canvas.width, MAX_SIZE / canvas.height);
        const newWidth = canvas.width * ratio;
        const newHeight = canvas.height * ratio;
        
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = canvas.width;
        tempCanvas.height = canvas.height;
        tempCanvas.getContext('2d')?.putImageData(data, 0, 0);

        canvas.width = newWidth;
        canvas.height = newHeight;
        // Re-get context because changing width/height clears it
        const newCtx = canvas.getContext('2d');
        if (newCtx) {
            newCtx.drawImage(tempCanvas, 0, 0, newWidth, newHeight);
        }
    }

    // As Base64 string
    // Apply circular mask if needed
    if (circular) {
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = canvas.width;
        tempCanvas.height = canvas.height;
        const tempCtx = tempCanvas.getContext('2d');
        if (tempCtx) {
            tempCtx.drawImage(canvas, 0, 0);
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.beginPath();
            ctx.arc(canvas.width / 2, canvas.height / 2, canvas.width / 2, 0, Math.PI * 2);
            ctx.closePath();
            ctx.clip();
            ctx.drawImage(tempCanvas, 0, 0);
        }
    }

    return canvas.toDataURL('image/jpeg', 0.9);
};

export const ImageEditor: React.FC<ImageEditorProps> = ({ imageSrc, aspectRatio = 1, onSave, onCancel, circular = false }) => {
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [rotation, setRotation] = useState(0);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);

    const onCropComplete = useCallback((croppedArea: any, croppedAreaPixels: any) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);

    const handleSave = async () => {
        if (!croppedAreaPixels || isLoading) return;
        setIsLoading(true);
        try {
            const croppedImage = await getCroppedImg(
                imageSrc,
                croppedAreaPixels,
                rotation,
                circular
            );
            onSave(croppedImage);
        } catch (e) {
            console.error('Error cropping image', e);
        } finally {
            setIsLoading(false);
        }
    };

    const currentAspectRatio = aspectRatio === 'original' ? undefined : aspectRatio;

    return (
        <div className="fixed inset-0 z-[70] bg-black/95 flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-2xl flex justify-between items-center mb-4 z-10">
                <h3 className="text-cream font-bold uppercase tracking-widest">Edit Image</h3>
                <button onClick={onCancel} className="text-cream/60 hover:text-white">
                    <X size={24} />
                </button>
            </div>

            {/* Editor Viewport */}
            <div className="relative w-full max-w-2xl h-[60vh] bg-black/50 border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
                <Cropper
                    image={imageSrc}
                    crop={crop}
                    zoom={zoom}
                    rotation={rotation}
                    aspect={currentAspectRatio}
                    onCropChange={setCrop}
                    onCropComplete={onCropComplete}
                    onZoomChange={setZoom}
                    onRotationChange={setRotation}
                    cropShape={circular ? 'round' : 'rect'}
                    showGrid={true}
                />
            </div>

            {/* Controls */}
            <div className="mt-8 w-full max-w-md space-y-6 z-10">
                <div className="flex flex-col gap-2">
                    <label className="text-xs text-cream/60 uppercase tracking-widest font-mono">Zoom</label>
                    <input
                        type="range"
                        value={zoom}
                        min={1}
                        max={3}
                        step={0.1}
                        aria-labelledby="Zoom"
                        onChange={(e) => setZoom(Number(e.target.value))}
                        className="w-full accent-neon-lime h-1 bg-white/20 rounded-full appearance-none cursor-pointer"
                    />
                </div>
                
                <div className="flex flex-col gap-2">
                    <label className="text-xs text-cream/60 uppercase tracking-widest font-mono">Rotation</label>
                    <input
                        type="range"
                        value={rotation}
                        min={0}
                        max={360}
                        step={1}
                        aria-labelledby="Rotation"
                        onChange={(e) => setRotation(Number(e.target.value))}
                        className="w-full accent-neon-lime h-1 bg-white/20 rounded-full appearance-none cursor-pointer"
                    />
                </div>

                <div className="flex justify-center gap-4 pt-4">
                    <button 
                        onClick={() => setRotation(r => r - 90)}
                        className="p-3 rounded-full bg-white/10 text-cream hover:bg-white/20 transition-colors"
                        title="Rotate -90deg"
                    >
                        <RotateCcw size={20} />
                    </button>
                    <button 
                        onClick={handleSave}
                        disabled={isLoading}
                        className="px-8 py-3 bg-neon-lime text-olive-dark font-black uppercase tracking-widest rounded-full hover:bg-white transition-colors flex items-center gap-2 disabled:opacity-50"
                    >
                        {isLoading ? (
                            <span className="w-5 h-5 border-2 border-olive-dark/20 border-t-olive-dark rounded-full animate-spin"></span>
                        ) : (
                            <Check size={20} />
                        )}
                        {isLoading ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </div>
            
            <div className="mt-4 text-xs text-cream/40 font-mono uppercase z-10">
                Drag to Pan • Pinch or use slider to Zoom
            </div>
        </div>
    );
};
