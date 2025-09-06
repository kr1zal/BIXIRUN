import { Image } from 'expo-image';
import { useEffect } from 'react';

interface ImagePreloaderProps {
    urls: string[];
    priority?: 'low' | 'normal' | 'high';
}

/**
 * Invisible component that preloads images in the background
 * for better user experience when scrolling through lists
 */
export const ImagePreloader = ({ urls, priority = 'low' }: ImagePreloaderProps) => {
    useEffect(() => {
        // Preload images using expo-image
        urls.forEach(url => {
            if (url) {
                Image.prefetch(url, 'memory-disk');
            }
        });
    }, [urls, priority]);

    // This component doesn't render anything
    return null;
};

export default ImagePreloader; 