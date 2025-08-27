import { Image } from 'expo-image';
import React, { memo, useState } from 'react';
import { PixelRatio, StyleSheet, View, ViewStyle } from 'react-native';
import { getImageSizeForContainer, getOptimizedImageUrl } from '../../utils/imageUtils';

interface OptimizedImageProps {
    source: { uri: string } | number;
    style?: ViewStyle;
    placeholder?: string;
    contentFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
    transition?: number;
    priority?: 'low' | 'normal' | 'high';
    width?: number;
    height?: number;
}

/**
 * Optimized image component that:
 * 1. Uses expo-image for better performance and caching
 * 2. Handles loading states with placeholder
 * 3. Provides fallback on error
 * 4. Is memoized to prevent unnecessary re-renders
 * 5. Supports priority loading for critical images
 * 6. Automatically optimizes image sizes for better performance
 */
const OptimizedImage = memo(({
    source,
    style,
    placeholder = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2VlZSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTRweCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkxvYWRpbmc8L3RleHQ+PC9zdmc+',
    contentFit = 'cover',
    transition = 200,
    priority = 'normal',
    width,
    height
}: OptimizedImageProps) => {
    const [hasError, setHasError] = useState(false);
    const [fallbackOriginalUrl, setFallbackOriginalUrl] = useState<string | null>(null);

    // Optimize image URL if dimensions are provided
    const computedSource: { uri: string } | number | undefined = React.useMemo(() => {
        if (typeof source === 'number') return source;
        if (typeof source === 'object' && source.uri) {
            const original = source.uri;
            if (fallbackOriginalUrl) return { uri: fallbackOriginalUrl };
            if (width && height) {
                const pixelRatio = PixelRatio.get();
                const targetSize = getImageSizeForContainer(width, height, pixelRatio);
                const optimizedUrl = getOptimizedImageUrl(original, targetSize);
                return { uri: optimizedUrl };
            }
            return { uri: original };
        }
        return undefined as unknown as number;
    }, [source, width, height, fallbackOriginalUrl]);

    return (
        <View style={[styles.container, style]}>
            <Image
                source={hasError ? { uri: placeholder } : (computedSource as { uri: string } | number)}
                style={styles.image}
                contentFit={contentFit}
                transition={transition}
                onError={() => {
                    // Первый фэйл → пытаемся загрузить оригинальный URL без оптимизаций
                    if (!fallbackOriginalUrl && typeof source === 'object' && source.uri) {
                        setFallbackOriginalUrl(source.uri);
                        setHasError(false);
                        return;
                    }
                    setHasError(true);
                }}
                cachePolicy="memory-disk"
                priority={priority}
                placeholder={placeholder}
                recyclingKey={typeof computedSource === 'object' ? (computedSource as { uri: string }).uri : String(computedSource)}
            />
        </View>
    );
});

const styles = StyleSheet.create({
    container: {
        overflow: 'hidden',
    },
    image: {
        width: '100%',
        height: '100%',
    },
});

export default OptimizedImage; 