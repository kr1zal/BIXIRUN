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
    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);

    // Optimize image URL if dimensions are provided
    const optimizedSource = React.useMemo(() => {
        if (typeof source === 'object' && source.uri && width && height) {
            const pixelRatio = PixelRatio.get();
            const targetSize = getImageSizeForContainer(width, height, pixelRatio);
            const optimizedUrl = getOptimizedImageUrl(source.uri, targetSize);
            return { uri: optimizedUrl };
        }
        return source;
    }, [source, width, height]);

    return (
        <View style={[styles.container, style]}>
            <Image
                source={hasError ? { uri: placeholder } : optimizedSource}
                style={styles.image}
                contentFit={contentFit}
                transition={transition}
                onLoad={() => setIsLoading(false)}
                onError={() => {
                    setHasError(true);
                    setIsLoading(false);
                }}
                cachePolicy="memory-disk"
                priority={priority}
                placeholder={placeholder}
                recyclingKey={typeof optimizedSource === 'object' ? optimizedSource.uri : String(optimizedSource)}
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