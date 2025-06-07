import React, { useState, memo } from 'react';
import { Image, ImageProps, View, StyleSheet, ActivityIndicator } from 'react-native';

interface OptimizedImageProps extends ImageProps {
    fallbackColor?: string;
    showLoading?: boolean;
}

/**
 * Optimized image component that:
 * 1. Handles loading states with placeholder
 * 2. Provides fallback on error
 * 3. Is memoized to prevent unnecessary re-renders
 */
const OptimizedImage = memo(({
    source,
    style,
    resizeMode = 'cover',
    fallbackColor = '#f0f0f0',
    showLoading = true,
    ...props
}: OptimizedImageProps) => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    const handleLoad = () => setLoading(false);
    const handleError = () => {
        setLoading(false);
        setError(true);
    };

    return (
        <View style={[styles.container, style]}>
            {/* Fallback/placeholder */}
            <View
                style={[
                    StyleSheet.absoluteFill,
                    { backgroundColor: fallbackColor }
                ]}
            />

            {/* Loading indicator */}
            {loading && showLoading && (
                <ActivityIndicator
                    style={StyleSheet.absoluteFill}
                    color="#1976d2"
                    size="small"
                />
            )}

            {/* Actual image */}
            {!error && (
                <Image
                    source={source}
                    style={[
                        StyleSheet.absoluteFill,
                        styles.image,
                        { opacity: loading ? 0 : 1 }
                    ]}
                    resizeMode={resizeMode}
                    onLoad={handleLoad}
                    onError={handleError}
                    {...props}
                />
            )}
        </View>
    );
});

const styles = StyleSheet.create({
    container: {
        overflow: 'hidden',
        backgroundColor: 'transparent',
    },
    image: {
        width: '100%',
        height: '100%',
    },
});

export default OptimizedImage; 