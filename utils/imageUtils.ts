/**
 * Image optimization utilities for better performance
 */

export interface ImageSize {
    width: number;
    height: number;
}

/**
 * Generate optimized image URL with proper sizing
 * For services like Supabase Storage or Cloudinary
 */
export const getOptimizedImageUrl = (
    originalUrl: string,
    targetSize: ImageSize,
    quality: number = 80
): string => {
    // If URL contains Supabase storage, add transformation parameters
    if (originalUrl.includes('supabase')) {
        const url = new URL(originalUrl);
        url.searchParams.set('width', targetSize.width.toString());
        url.searchParams.set('height', targetSize.height.toString());
        url.searchParams.set('quality', quality.toString());
        try {
            // Платформенная оптимизация: WebP только для Android
            // Импортируем Platform лениво через require, чтобы избежать завязки на RN в вебе/скриптах
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            const { Platform } = require('react-native');
            if (Platform?.OS === 'android') {
                url.searchParams.set('format', 'webp');
                // Android: немного сильнее сжимаем
                url.searchParams.set('quality', Math.min(quality, 75).toString());
            }
        } catch {
            // Ignore Platform detection errors (e.g., non-RN environment)
        }
        return url.toString();
    }

    // For other services, return original URL
    // In production, you might want to use a service like Cloudinary
    return originalUrl;
};

/**
 * Common image sizes for different use cases
 */
export const IMAGE_SIZES = {
    THUMBNAIL: { width: 150, height: 150 },
    CARD: { width: 300, height: 300 },
    GALLERY: { width: 800, height: 600 },
    FULL: { width: 1200, height: 900 },
} as const;

/**
 * Get appropriate image size based on container dimensions
 */
export const getImageSizeForContainer = (
    containerWidth: number,
    containerHeight: number,
    pixelRatio: number = 2
): ImageSize => {
    let ratio = pixelRatio;
    try {
        // На Android ограничиваем до 2x, чтобы не тянуть 3x+ в сетке
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const { Platform } = require('react-native');
        if (Platform?.OS === 'android') {
            ratio = Math.min(pixelRatio, 2);
        }
    } catch {
        // Ignore Platform detection errors (e.g., non-RN environment)
    }
    return {
        width: Math.ceil(containerWidth * ratio),
        height: Math.ceil(containerHeight * ratio),
    };
}; 