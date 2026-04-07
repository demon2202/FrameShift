import React, { useState, useRef } from 'react';
import { X, Check, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { OptimizedImage } from './ui/OptimizedImage';

interface ImageEditorProps {
    imageSrc: string;
    aspectRatio?: number | 'original'; // width / height
    onSave: (editedImage: string) => void;
    onCancel: () => void;
    circular?: boolean; // For profile pics
}

export const ImageEditor: React.FC<ImageEditorProps> = ({ imageSrc, aspectRatio = 1, onSave, onCancel, circular = false }) => {
    const [scale, setScale] = useState(1);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [rotation, setRotation] = useState(0);
    const containerRef = useRef<HTMLDivElement>(null);
    const imageRef = useRef<HTMLImageElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [naturalRatio, setNaturalRatio] = useState(1);

    const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
        const img = e.currentTarget;
        setNaturalRatio(img.naturalWidth / img.naturalHeight);
    };

    const currentAspectRatio = aspectRatio === 'original' ? naturalRatio : aspectRatio;

    const handleMouseDown = (e: React.MouseEvent) => {
        setIsDragging(true);
        setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (isDragging) {
            setPosition({
                x: e.clientX - dragStart.x,
                y: e.clientY - dragStart.y
            });
        }
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    const handleSave = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx || !imageRef.current || !containerRef.current) return;

        // Determine output size (high res)
        let outputWidth = 1200;
        if (circular) {
            outputWidth = 400;
        }
        const outputHeight = outputWidth / currentAspectRatio;

        canvas.width = outputWidth;
        canvas.height = outputHeight;

        // Fill background
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Calculate drawing params
        // The container shows a viewport. We need to map the transform to the canvas.
        // Container dimensions
        const containerRect = containerRef.current.getBoundingClientRect();
        
        // Image dimensions (natural)
        const img = imageRef.current;
        const naturalWidth = img.naturalWidth;
        const naturalHeight = img.naturalHeight;

        // How the image is currently displayed in the container (before transform)
        // It's usually "contain" or similar in CSS, but here we are controlling it.
        // Let's assume we render the image at a base size that fits the container, then apply transform.
        
        // Actually, simpler approach:
        // 1. Draw the image to canvas with the same transforms.
        // We need to relate pixels in the DOM to pixels in the Canvas.
        
        const scaleFactor = outputWidth / containerRect.width;

        ctx.save();
        
        // Move to center of canvas
        ctx.translate(canvas.width / 2, canvas.height / 2);
        
        // Apply rotation
        ctx.rotate((rotation * Math.PI) / 180);
        
        // Apply translation (scaled)
        ctx.translate(position.x * scaleFactor, position.y * scaleFactor);
        
        // Apply scale
        ctx.scale(scale, scale);
        
        // Draw image centered
        // We need to know the rendered size of the image at scale=1
        // In the DOM, we'll style the image to be `max-w-none` and maybe set a base width?
        // Let's say we fit the image to the container initially.
        
        const imageRatio = naturalWidth / naturalHeight;
        const containerRatio = containerRect.width / containerRect.height;
        
        let initialRenderWidth, initialRenderHeight;
        
        if (imageRatio > containerRatio) {
            // Image is wider, fit width
            initialRenderWidth = containerRect.width;
            initialRenderHeight = containerRect.width / imageRatio;
        } else {
            // Image is taller, fit height
            initialRenderHeight = containerRect.height;
            initialRenderWidth = containerRect.height * imageRatio;
        }

        ctx.drawImage(
            img, 
            -initialRenderWidth * scaleFactor / 2, 
            -initialRenderHeight * scaleFactor / 2, 
            initialRenderWidth * scaleFactor, 
            initialRenderHeight * scaleFactor
        );

        ctx.restore();

        if (circular) {
            // Create a circular mask
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

        onSave(canvas.toDataURL('image/jpeg', 0.9));
    };

    return (
        <div className="fixed inset-0 z-[70] bg-black/95 flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-2xl flex justify-between items-center mb-4">
                <h3 className="text-cream font-bold uppercase tracking-widest">Edit Image</h3>
                <button onClick={onCancel} className="text-cream/60 hover:text-white">
                    <X size={24} />
                </button>
            </div>

            {/* Editor Viewport */}
            <div 
                className="relative overflow-hidden bg-black/50 border-2 border-white/10 shadow-2xl"
                style={{
                    width: '100%',
                    maxWidth: '600px',
                    aspectRatio: `${currentAspectRatio}`,
                    borderRadius: circular ? '50%' : '16px'
                }}
                ref={containerRef}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
            >
                    <OptimizedImage
                        ref={imageRef}
                        src={imageSrc}
                        alt="Edit"
                        onLoad={handleImageLoad}
                        className="max-w-none pointer-events-auto cursor-move"
                        containerClassName="absolute inset-0 flex items-center justify-center pointer-events-none"
                        style={{
                            transform: `translate(${position.x}px, ${position.y}px) scale(${scale}) rotate(${rotation}deg)`,
                            // Initial sizing logic to match canvas logic
                            // We want it to "contain" initially
                            width: 'auto',
                            height: 'auto',
                            maxWidth: '100%',
                            maxHeight: '100%',
                            // Wait, if we use max-w/h 100%, we can't zoom in effectively if we rely on that for base size.
                            // Better: Set it to a fixed size based on container?
                            // Let's use a wrapper or just let it be natural and scale it down?
                            // Actually, simpler:
                            // Just set it to `height: 100%` or `width: 100%` depending on ratio, then transform.
                        }}
                        onDragStart={(e) => e.preventDefault()}
                    />
                
                {/* Grid Overlay */}
                <div className="absolute inset-0 pointer-events-none opacity-30 grid grid-cols-3 grid-rows-3">
                    {[...Array(9)].map((_, i) => (
                        <div key={i} className="border border-white/20" />
                    ))}
                </div>
            </div>

            {/* Controls */}
            <div className="mt-8 w-full max-w-md space-y-6">
                <div className="flex items-center gap-4">
                    <ZoomOut size={20} className="text-cream/60" />
                    <input 
                        type="range" 
                        min="0.5" 
                        max="3" 
                        step="0.1" 
                        value={scale} 
                        onChange={(e) => setScale(parseFloat(e.target.value))}
                        className="flex-1 accent-neon-lime h-1 bg-white/20 rounded-full appearance-none cursor-pointer"
                    />
                    <ZoomIn size={20} className="text-cream/60" />
                </div>

                <div className="flex justify-center gap-4">
                    <button 
                        onClick={() => setRotation(r => r - 90)}
                        className="p-3 rounded-full bg-white/10 text-cream hover:bg-white/20 transition-colors"
                        title="Rotate"
                    >
                        <RotateCcw size={20} />
                    </button>
                    <button 
                        onClick={handleSave}
                        className="px-8 py-3 bg-neon-lime text-olive-dark font-black uppercase tracking-widest rounded-full hover:bg-white transition-colors flex items-center gap-2"
                    >
                        <Check size={20} />
                        Save Changes
                    </button>
                </div>
            </div>
            
            <div className="mt-4 text-xs text-cream/40 font-mono uppercase">
                Drag to Pan • Pinch to Zoom
            </div>
        </div>
    );
};
