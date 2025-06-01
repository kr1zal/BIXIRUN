import React, { useState, useRef } from 'react';
import { View, Image, StyleSheet, Dimensions, TouchableOpacity, FlatList, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import OptimizedImage from './OptimizedImage';

interface ProductImageGalleryProps {
    images: string[];
    initialIndex?: number;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const THUMB_SIZE = 48;
const THUMB_SPACING = 8;

const ProductImageGallery = ({ images, initialIndex = 0 }: ProductImageGalleryProps) => {
    const [activeIndex, setActiveIndex] = useState(initialIndex);
    const flatListRef = useRef<FlatList>(null);
    const thumbnailsRef = useRef<FlatList>(null);
    const scrollX = useRef(new Animated.Value(0)).current;

    // Handle image change
    const handleImageChange = (index: number) => {
        setActiveIndex(index);

        // Scroll main gallery to selected image
        flatListRef.current?.scrollToIndex({
            index,
            animated: true,
        });

        // Scroll thumbnails to make active thumb visible
        thumbnailsRef.current?.scrollToIndex({
            index: Math.max(0, index - 1),
            animated: true,
            viewOffset: index === 0 ? 0 : THUMB_SIZE,
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

        // Ensure thumbnails follow
        thumbnailsRef.current?.scrollToIndex({
            index: Math.max(0, newIndex - 1),
            animated: true,
            viewOffset: newIndex === 0 ? 0 : THUMB_SIZE,
        });
    };

    // Render main gallery item
    const renderItem = ({ item }: { item: string }) => (
        <View style={styles.imageContainer}>
            <OptimizedImage
                source={{ uri: item }}
                style={styles.image}
                showLoading={true}
            />
        </View>
    );

    // Render thumbnail item
    const renderThumbItem = ({ item, index }: { item: string; index: number }) => (
        <TouchableOpacity
            onPress={() => handleImageChange(index)}
            style={[styles.thumbContainer, activeIndex === index && styles.activeThumbnail]}
        >
            <OptimizedImage
                source={{ uri: item }}
                style={styles.thumbnail}
                showLoading={false}
            />
        </TouchableOpacity>
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

    return (
        <View style={styles.container}>
            {/* Main gallery */}
            <FlatList
                ref={flatListRef}
                data={images}
                keyExtractor={(_, index) => `image-${index}`}
                renderItem={renderItem}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onScroll={handleScroll}
                onMomentumScrollEnd={handleMomentumScrollEnd}
                initialScrollIndex={initialIndex}
                getItemLayout={(_, index) => ({
                    length: SCREEN_WIDTH,
                    offset: SCREEN_WIDTH * index,
                    index,
                })}
            />

            {/* Navigation buttons */}
            {renderNavButtons()}

            {/* Pagination dots */}
            {renderPagination()}

            {/* Thumbnails row */}
            <View style={styles.thumbnailsContainer}>
                <FlatList
                    ref={thumbnailsRef}
                    data={images}
                    keyExtractor={(_, index) => `thumb-${index}`}
                    renderItem={renderThumbItem}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.thumbnailsContent}
                />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: 20,
    },
    imageContainer: {
        width: SCREEN_WIDTH,
        height: 300,
    },
    image: {
        width: SCREEN_WIDTH - 32, // Учитываем padding контейнера
        height: 300,
        borderRadius: 12,
    },
    thumbnailsContainer: {
        marginTop: 16,
    },
    thumbnailsContent: {
        paddingHorizontal: 4,
    },
    thumbContainer: {
        width: THUMB_SIZE,
        height: THUMB_SIZE,
        marginHorizontal: THUMB_SPACING,
        borderRadius: 6,
        overflow: 'hidden',
        opacity: 0.7,
    },
    activeThumbnail: {
        borderWidth: 2,
        borderColor: '#1976d2',
        opacity: 1,
    },
    thumbnail: {
        width: '100%',
        height: '100%',
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
});

export default ProductImageGallery; 