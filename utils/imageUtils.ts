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
    return {
        width: Math.ceil(containerWidth * pixelRatio),
        height: Math.ceil(containerHeight * pixelRatio),
    };
}; 