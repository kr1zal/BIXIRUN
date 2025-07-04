import { Ionicons } from '@expo/vector-icons';
import React, { useRef, useState } from 'react';
import { Animated, Dimensions, FlatList, StyleSheet, TouchableOpacity, View } from 'react-native';
import OptimizedImage from './OptimizedImage';

interface ProductImageGalleryProps {
    images: string[];
    initialIndex?: number;
    onGalleryHeightCalculated?: (height: number) => void;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GALLERY_HEIGHT = SCREEN_WIDTH * (5 / 4); // Высота для формата 4:5
const THUMB_SIZE = 48;
const THUMB_SPACING = 8;
const MINIATURES_HEIGHT = THUMB_SIZE + THUMB_SPACING * 2;

const ProductImageGallery = ({ images, initialIndex = 0 }: ProductImageGalleryProps) => {
    const [activeIndex, setActiveIndex] = useState(initialIndex);
    const flatListRef = useRef<FlatList>(null);
    const scrollX = useRef(new Animated.Value(0)).current;

    // Handle image change
    const handleImageChange = (index: number) => {
        setActiveIndex(index);
        flatListRef.current?.scrollToIndex({
            index,
            animated: true,
        });
    };

    // Handle main image scroll end
    const handleScroll = Animated.event(
        [{ nativeEvent: { contentOffset: { x: scrollX } } }],
        { useNativeDriver: false }
    );

    const handleMomentumScrollEnd = (event: any) => {
        const newIndex = Math.round(event.nativeEvent.contentOffset.x / SCREEN_WIDTH);
        setActiveIndex(newIndex);
    };

    // Render main gallery item
    const renderItem = ({ item, index }: { item: string; index: number }) => (
        <View style={styles.imageContainer}>
            <OptimizedImage
                source={{ uri: item }}
                style={styles.image}
                contentFit="contain"
                priority={index === activeIndex ? 'high' : 'normal'}
            />
        </View>
    );

    // Render navigation buttons
    const renderNavButtons = () => (
        <>
            {activeIndex > 0 && (
                <TouchableOpacity
                    style={[styles.navButton, styles.prevButton]}
                    onPress={() => handleImageChange(activeIndex - 1)}
                >
                    <Ionicons name="chevron-back" size={24} color="#fff" />
                </TouchableOpacity>
            )}

            {activeIndex < images.length - 1 && (
                <TouchableOpacity
                    style={[styles.navButton, styles.nextButton]}
                    onPress={() => handleImageChange(activeIndex + 1)}
                >
                    <Ionicons name="chevron-forward" size={24} color="#fff" />
                </TouchableOpacity>
            )}
        </>
    );

    // Pagination dots
    const renderPagination = () => (
        <View style={styles.pagination}>
            {images.map((_, index) => (
                <View
                    key={index}
                    style={[
                        styles.paginationDot,
                        activeIndex === index && styles.activePaginationDot
                    ]}
                />
            ))}
        </View>
    );

    // Render thumbnails under gallery
    const renderThumbItem = ({ item, index }: { item: string; index: number }) => (
        <TouchableOpacity
            onPress={() => handleImageChange(index)}
            style={[
                styles.thumbContainer,
                activeIndex === index && styles.activeThumbnail
            ]}
        >
            <OptimizedImage
                source={{ uri: item }}
                style={styles.thumbnail}
                contentFit="cover"
                priority="low"
            />
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            {/* Main gallery */}
            <FlatList
                ref={flatListRef}
                data={images}
                keyExtractor={(_, index) => `image-${index}`}
                renderItem={renderItem}
                horizontal
                // ✅ ИСПРАВЛЕНО: Заменяем pagingEnabled на snapToInterval для точной фиксации
                snapToInterval={SCREEN_WIDTH}
                snapToAlignment="start"
                disableIntervalMomentum={true}
                decelerationRate="fast"
                showsHorizontalScrollIndicator={false}
                onScroll={handleScroll}
                onMomentumScrollEnd={handleMomentumScrollEnd}
                initialScrollIndex={activeIndex}
                getItemLayout={(_, index) => ({
                    length: SCREEN_WIDTH,
                    offset: SCREEN_WIDTH * index,
                    index,
                })}
                // Предзагрузка соседних изображений
                initialNumToRender={3}
                maxToRenderPerBatch={2}
                windowSize={3}
            />

            {/* Navigation buttons */}
            {renderNavButtons()}

            {/* Pagination dots */}
            {renderPagination()}

            {/* Thumbnails row under gallery */}
            {images.length > 1 && (
                <View style={styles.thumbnailsContainer}>
                    <FlatList
                        data={images}
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        keyExtractor={(_, index) => `thumb-${index}`}
                        renderItem={renderThumbItem}
                        contentContainerStyle={styles.thumbnailsContent}
                        style={{}}
                        initialNumToRender={5}
                        windowSize={5}
                        removeClippedSubviews={true}
                    />
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: SCREEN_WIDTH,
        height: GALLERY_HEIGHT + MINIATURES_HEIGHT,
        backgroundColor: '#fff',
        marginTop: 24,
        marginBottom: 0,
        position: 'relative',
    },
    imageContainer: {
        width: SCREEN_WIDTH,
        height: GALLERY_HEIGHT,
        justifyContent: 'center',
        alignItems: 'center',
        aspectRatio: 4 / 5, // Формат 4:5
    },
    image: {
        width: SCREEN_WIDTH,
        height: GALLERY_HEIGHT,
        backgroundColor: 'transparent',
        aspectRatio: 4 / 5, // Формат 4:5
    },
    navButton: {
        position: 'absolute',
        top: '50%',
        marginTop: -20,
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    prevButton: {
        left: 10,
    },
    nextButton: {
        right: 10,
    },
    pagination: {
        position: 'absolute',
        bottom: 10,
        flexDirection: 'row',
        justifyContent: 'center',
        width: '100%',
    },
    paginationDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: 'rgba(255, 255, 255, 0.5)',
        margin: 3,
    },
    activePaginationDot: {
        backgroundColor: '#fff',
        width: 10,
        height: 10,
        borderRadius: 5,
    },
    thumbnailsContainer: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        height: MINIATURES_HEIGHT,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2,
    },
    thumbnailsContent: {
        paddingHorizontal: 4,
    },
    thumbContainer: {
        width: 48,
        height: 48,
        marginHorizontal: 6,
        borderRadius: 6,
        overflow: 'hidden',
        borderWidth: 2,
        borderColor: 'transparent',
    },
    activeThumbnail: {
        borderColor: '#1976d2',
    },
    thumbnail: {
        width: '100%',
        height: '100%',
        aspectRatio: 9 / 16, // Миниатюры тоже в формате 9:16
    },
});

export default ProductImageGallery; 