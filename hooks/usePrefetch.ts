import { useEffect, useRef } from 'react';
import { Image } from 'react-native';
import { router } from 'expo-router';

/**
 * Options for the prefetch hook
 */
interface PrefetchOptions {
    // Routes to prefetch
    routes?: string[];
    // Images to prefetch
    images?: Array<string | { uri: string }>;
    // Enable/disable prefetching
    enabled?: boolean;
    // Callback after prefetching completes
    onComplete?: () => void;
}

/**
 * Hook to prefetch routes and images for faster navigation and rendering
 */
export function usePrefetch({
    routes = [],
    images = [],
    enabled = true,
    onComplete
}: PrefetchOptions = {}) {
    const hasPrefetched = useRef(false);

    useEffect(() => {
        // Skip if already prefetched or disabled
        if (hasPrefetched.current || !enabled) return;

        // Set prefetched flag
        hasPrefetched.current = true;

        // Function to perform prefetching
        const doPrefetch = async () => {
            try {
                // Prefetch images first (routes might not be prefetchable in all expo-router versions)
                const imagePromises = images.map(image => {
                    const uri = typeof image === 'string' ? image : image.uri;
                    return Image.prefetch(uri);
                });

                // Wait for all image prefetching to complete
                await Promise.all(imagePromises);

                // Call completion callback if provided
                if (onComplete) onComplete();
            } catch (error) {
                console.warn('Error prefetching resources:', error);
            }
        };

        // Start prefetching
        doPrefetch();
    }, [routes, images, enabled, onComplete]);
} 