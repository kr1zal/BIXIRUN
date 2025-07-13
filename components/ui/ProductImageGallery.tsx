import React, { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
    Extrapolate,
    interpolate,
    useAnimatedScrollHandler,
    useAnimatedStyle,
    useSharedValue,
} from 'react-native-reanimated';
import OptimizedImage from './OptimizedImage';

interface ProductImageGalleryProps {
    images: string[];
    initialIndex?: number;
    onGalleryHeightCalculated?: (height: number) => void;
}

const ProductImageGallery = ({ images, initialIndex = 0 }: ProductImageGalleryProps) => {
    const [galleryWidth, setGalleryWidth] = useState(0);
    const scrollX = useSharedValue(initialIndex * galleryWidth);

    const galleryHeight = useMemo(() => galleryWidth * (5 / 4), [galleryWidth]);

    const handleLayout = (event: any) => {
        const { width } = event.nativeEvent.layout;
        if (width > 0 && width !== galleryWidth) {
            setGalleryWidth(width);
            scrollX.value = initialIndex * width;
        }
    };

    const scrollHandler = useAnimatedScrollHandler({
        onScroll: (event) => {
            scrollX.value = event.contentOffset.x;
        },
    });

    const renderItem = ({ item, index }: { item: string; index: number }) => (
        <View style={{ width: galleryWidth, height: galleryHeight }}>
            <OptimizedImage
                source={{ uri: item }}
                style={styles.image}
                contentFit="cover"
            />
        </View>
    );

    const Pagination = () => (
        <View style={styles.paginationContainer}>
            <View style={styles.paginationContent}>
                {images.map((_, index) => {
                    const animatedStyle = useAnimatedStyle(() => {
                        const width = interpolate(
                            scrollX.value,
                            [(index - 1) * galleryWidth, index * galleryWidth, (index + 1) * galleryWidth],
                            [6, 20, 6],
                            Extrapolate.CLAMP
                        );
                        const opacity = interpolate(
                            scrollX.value,
                            [(index - 1) * galleryWidth, index * galleryWidth, (index + 1) * galleryWidth],
                            [0.5, 1, 0.5],
                            Extrapolate.CLAMP
                        );
                        return {
                            width,
                            opacity,
                        };
                    });
                    return <Animated.View key={index} style={[styles.paginationDot, animatedStyle]} />;
                })}
            </View>
        </View>
    );

    return (
        <View style={{ height: galleryWidth ? galleryHeight : 300 }} onLayout={handleLayout}>
            {galleryWidth > 0 && (
                <>
                    <Animated.FlatList
                        data={images}
                        keyExtractor={(_, index) => `image-${index}`}
                        renderItem={renderItem}
                        horizontal
                        pagingEnabled
                        showsHorizontalScrollIndicator={false}
                        onScroll={scrollHandler}
                        scrollEventThrottle={16}
                        initialScrollIndex={initialIndex}
                        getItemLayout={(_, index) => ({
                            length: galleryWidth,
                            offset: galleryWidth * index,
                            index,
                        })}
                    />
                    <Pagination />
                </>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    image: {
        width: '100%',
        height: '100%',
    },
    paginationContainer: {
        position: 'absolute',
        bottom: 15,
        left: 0,
        right: 0,
        alignItems: 'center',
    },
    paginationContent: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderRadius: 10,
        paddingHorizontal: 8,
        paddingVertical: 6,
    },
    paginationDot: {
        height: 6,
        borderRadius: 3,
        backgroundColor: '#000',
        marginHorizontal: 3,
    },
});

export default ProductImageGallery; 