import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ImageOff, Loader2 } from 'lucide-react';

interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  className?: string;
  containerClassName?: string;
  showSkeleton?: boolean;
  layoutId?: string;
}

export const OptimizedImage = React.forwardRef<HTMLImageElement, OptimizedImageProps>(({
  src,
  alt,
  className = '',
  containerClassName = '',
  showSkeleton = true,
  ...props
}, ref) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  return (
    <div className={`relative overflow-hidden ${containerClassName}`}>
      {showSkeleton && isLoading && (
        <div className="absolute inset-0 bg-neutral-200 dark:bg-neutral-800 animate-pulse z-10 flex items-center justify-center">
            <Loader2 className="w-6 h-6 text-neutral-400 animate-spin opacity-50" />
        </div>
      )}
      
      {hasError ? (
        <div className="absolute inset-0 bg-neutral-100 dark:bg-neutral-900 flex flex-col items-center justify-center text-neutral-400 z-20 border border-neutral-200 dark:border-neutral-800 overflow-hidden">
           <img 
                src={`https://picsum.photos/seed/${encodeURIComponent(alt)}/800/1000?blur=2`} 
                className="w-full h-full object-cover opacity-50 grayscale"
                alt="Fallback"
           />
           <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/20 backdrop-blur-[2px]">
                <ImageOff size={24} className="mb-2 text-white/50" />
                <span className="text-[10px] uppercase tracking-widest font-mono text-white/50">Image Unavailable</span>
           </div>
        </div>
      ) : (
        <motion.img
            ref={ref}
            src={src}
            alt={alt}
            initial={{ opacity: 0, scale: 1.1, filter: 'blur(10px)' }}
            animate={{ 
                opacity: isLoading ? 0 : 1, 
                scale: isLoading ? 1.1 : 1, 
                filter: isLoading ? 'blur(10px)' : 'blur(0px)' 
            }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className={`${className}`}
            onLoad={(e) => {
                setIsLoading(false);
                if (props.onLoad) props.onLoad(e);
            }}
            onError={(e) => {
                setIsLoading(false);
                setHasError(true);
                if (props.onError) props.onError(e);
            }}
            loading="lazy"
            decoding="async"
            referrerPolicy="no-referrer"
            {...props as any}
        />
      )}
    </div>
  );
});

OptimizedImage.displayName = 'OptimizedImage';
