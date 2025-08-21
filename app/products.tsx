import { Ionicons } from '@expo/vector-icons';
import { createSelector } from '@reduxjs/toolkit';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo } from 'react';
import { Dimensions, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';
import ImagePreloader from '../components/ui/ImagePreloader';
import OptimizedImage from '../components/ui/OptimizedImage';
import { useFlatListOptimization } from '../hooks/useFlatListOptimization';
import { RootState } from '../store';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { addToCart, CartItem, removeFromCart, updateQuantity } from '../store/slices/cartSlice';
import {
    fetchProducts,
    FilterCategory,
    ProductItem,
    selectActiveFilter,
    selectFilteredProducts,
    selectProductsStatus,
    selectViewMode,
    setFilter
} from '../store/slices/contentSlice';

const SCREEN_WIDTH = Dimensions.get('window').width;
const GRID_GAP = 3;
const GRID_CARD_WIDTH = (SCREEN_WIDTH - GRID_GAP * 3) / 2;

// Constants for optimizing FlatList
const GRID_CARD_HEIGHT = GRID_CARD_WIDTH * (5 / 4) + 80; // Формат 4:5 + место для текста, цены и кнопки
const LIST_CARD_HEIGHT = 120; // Approximate height of list card

// Type for card component props
type CardProps = {
    item: ProductItem;
    onPress: () => void;
};

// ✅ МЕМОИЗИРОВАННЫЙ СЕЛЕКТОР ДЛЯ КОРЗИНЫ
const makeSelectCartItem = () =>
    createSelector(
        [(state: RootState) => state.cart.items, (state: RootState, productId: string) => productId],
        (cartItems, productId) => cartItems.find((item: CartItem) => item.product.id === productId)
    );

// ✅ КЭШИРУЕМ СЕЛЕКТОРЫ ДЛЯ КАЖДОГО ТОВАРА
const cartSelectors = new Map<string, ReturnType<typeof makeSelectCartItem>>();

const getCartItemSelector = (productId: string) => {
    if (!cartSelectors.has(productId)) {
        cartSelectors.set(productId, makeSelectCartItem());
    }
    return cartSelectors.get(productId)!;
};

// Удален неиспользуемый компонент QuantityCounter



// ✅ МЕМОИЗИРОВАННЫЙ КОМПОНЕНТ ГАЛЕРЕИ ИЗОБРАЖЕНИЙ
const GalleryImage = React.memo(({ imageUrl, isActive }: { imageUrl: string; isActive: boolean }) => (
    <View style={styles.galleryImageContainer}>
        <OptimizedImage
            source={{ uri: imageUrl }}
            style={styles.galleryImage}
            contentFit="cover"
            priority={isActive ? 'high' : 'normal'}
        />
    </View>
), (prevProps, nextProps) => {
    return prevProps.imageUrl === nextProps.imageUrl && prevProps.isActive === nextProps.isActive;
});
GalleryImage.displayName = 'GalleryImage';

// ✅ МЕМОИЗИРОВАННЫЙ КОМПОНЕНТ ПАГИНАЦИИ
const PaginationDots = React.memo(({ images, activeIndex }: { images: string[]; activeIndex: number }) => {
    if (!images || images.length <= 1) return null;

    return (
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
}, (prevProps, nextProps) => {
    return prevProps.activeIndex === nextProps.activeIndex && prevProps.images.length === nextProps.images.length;
});
PaginationDots.displayName = 'PaginationDots';

// ✅ МЕМОИЗИРОВАННЫЙ КОМПОНЕНТ ГАЛЕРЕИ
const ProductGallery = React.memo(({
    images,
    activeIndex,
    onIndexChange,
    onPress
}: {
    images: string[];
    activeIndex: number;
    onIndexChange: (index: number) => void;
    onPress: () => void;
}) => {
    const flatListRef = React.useRef<FlatList>(null);

    // ✅ ОПТИМИЗИРОВАННЫЙ обработчик скролла изображений
    const handleImageScroll = useCallback((event: any) => {
        const newIndex = Math.round(event.nativeEvent.contentOffset.x / GRID_CARD_WIDTH);
        if (newIndex !== activeIndex && newIndex >= 0 && newIndex < images.length) {
            onIndexChange(newIndex);
        }
    }, [activeIndex, onIndexChange, images.length]);

    // ✅ НОВЫЙ: Обработчик для плавного обновления во время скролла
    const handleScrollProgress = useCallback((event: any) => {
        const offsetX = event.nativeEvent.contentOffset.x;
        const newIndex = Math.round(offsetX / GRID_CARD_WIDTH);
        if (newIndex !== activeIndex && newIndex >= 0 && newIndex < images.length) {
            onIndexChange(newIndex);
        }
    }, [activeIndex, onIndexChange, images.length]);

    // ✅ ОПТИМИЗИРОВАННЫЙ рендер одного изображения в галерее
    const renderGalleryImage = useCallback(({ item: imageUrl, index }: { item: string; index: number }) => (
        <GalleryImage imageUrl={imageUrl} isActive={index === activeIndex} />
    ), [activeIndex]);

    // ✅ ОПТИМИЗИРОВАННЫЙ keyExtractor для галереи
    const galleryKeyExtractor = useCallback((_: string, index: number) => `gallery-img-${index}`, []);

    // ✅ ОПТИМИЗИРОВАННЫЙ getItemLayout для галереи
    const galleryGetItemLayout = useCallback((_: any, index: number) => ({
        length: GRID_CARD_WIDTH,
        offset: GRID_CARD_WIDTH * index,
        index,
    }), []);

    // ✅ Создаем жесты для одновременной работы тапа и свайпа
    const tapGesture = React.useMemo(() =>
        Gesture.Tap()
            .maxDuration(200)          // Уменьшаем время для быстрого тапа
            .maxDistance(5)            // Уменьшаем дистанцию для точного тапа
            .runOnJS(true)
            .onEnd((_event, success) => {
                if (success) {
                    onPress();
                }
            })
        , [onPress]);

    // ✅ ИСПРАВЛЕНО: Настраиваем Pan жест для работы с snapToInterval
    const panGesture = React.useMemo(() =>
        Gesture.Pan()
            .activeOffsetX([-15, 15])  // Увеличиваем порог для активации
            .failOffsetY([-15, 15])    // Увеличиваем порог для отмены
            .minDistance(10)           // Минимальная дистанция для активации
        , []);

    // ✅ ИСПРАВЛЕНО: Возвращаем Simultaneous с правильными настройками
    const composedGesture = React.useMemo(() =>
        Gesture.Simultaneous(tapGesture, panGesture)
        , [tapGesture, panGesture]);

    return (
        <>
            <GestureDetector gesture={composedGesture}>
                <View style={styles.imageContainer}>
                    {images && images.length > 0 ? (
                        <View style={styles.galleryContainer}>
                            <FlatList
                                ref={flatListRef}
                                data={images}
                                renderItem={renderGalleryImage}
                                keyExtractor={galleryKeyExtractor}
                                horizontal
                                // ✅ ИСПРАВЛЕНО: Заменяем pagingEnabled на snapToInterval для точной фиксации
                                snapToInterval={GRID_CARD_WIDTH}
                                snapToAlignment="start"
                                disableIntervalMomentum={true}
                                decelerationRate="fast"
                                showsHorizontalScrollIndicator={false}
                                onMomentumScrollEnd={handleImageScroll}
                                onScroll={handleScrollProgress}
                                getItemLayout={galleryGetItemLayout}
                                // ✅ КРИТИЧЕСКИЕ ОПТИМИЗАЦИИ ДЛЯ ПРОИЗВОДИТЕЛЬНОСТИ
                                initialNumToRender={1}
                                maxToRenderPerBatch={1}
                                windowSize={3}
                                removeClippedSubviews={true}
                                scrollEventThrottle={16}
                                // ✅ ДОПОЛНИТЕЛЬНЫЕ ОПТИМИЗАЦИИ ДЛЯ ГАЛЕРЕИ
                                bounces={false}
                                overScrollMode="never"
                                nestedScrollEnabled={false}
                            />
                        </View>
                    ) : (
                        <View style={styles.imagePlaceholder} />
                    )}
                </View>
            </GestureDetector>

            {/* ✅ Пагинация под картинкой */}
            <PaginationDots images={images} activeIndex={activeIndex} />
        </>
    );
}, (prevProps, nextProps) => {
    return (
        prevProps.activeIndex === nextProps.activeIndex &&
        prevProps.images.length === nextProps.images.length &&
        prevProps.onPress === nextProps.onPress &&
        prevProps.onIndexChange === nextProps.onIndexChange
    );
});
ProductGallery.displayName = 'ProductGallery';

// ✅ МЕМОИЗИРОВАННЫЙ КОМПОНЕНТ ИНФОРМАЦИИ О ТОВАРЕ
const ProductInfo = React.memo(({ item, onPress }: { item: ProductItem; onPress: () => void }) => (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8} style={styles.textSection}>
        <View style={styles.priceRow}>
            <Text style={styles.productPrice}>{item.price} ₽</Text>
            {item.old_price && <Text style={styles.oldPrice}>{item.old_price} ₽</Text>}
            {item.price && item.old_price && item.discount && <Text style={styles.discountPrice}>-{Math.abs(item.discount)}%</Text>}
        </View>
        <Text style={styles.productName} numberOfLines={1} ellipsizeMode="tail">{item.name}</Text>
    </TouchableOpacity>
), (prevProps, nextProps) => {
    return (
        prevProps.item.id === nextProps.item.id &&
        prevProps.item.price === nextProps.item.price &&
        prevProps.item.name === nextProps.item.name &&
        prevProps.item.old_price === nextProps.item.old_price &&
        prevProps.item.discount === nextProps.item.discount &&
        prevProps.onPress === nextProps.onPress
    );
});
ProductInfo.displayName = 'ProductInfo';

// ✅ МЕМОИЗИРОВАННЫЙ КОМПОНЕНТ КНОПОК КОРЗИНЫ
const CartButtons = React.memo(({
    quantity,
    onIncrement,
    onDecrement,
    onAddToCart
}: {
    quantity: number;
    onIncrement: () => void;
    onDecrement: () => void;
    onAddToCart: () => void;
}) => {
    const router = useRouter();

    // ✅ Мемоизированный callback для перехода в корзину
    const handleCartPress = useCallback(() => {
        router.replace('/cart');
    }, [router]);

    if (quantity > 0) {
        return (
            <View style={styles.cartButtonContainer}>
                <TouchableOpacity onPress={onDecrement} style={styles.quantityButtonMinus}>
                    <Text style={styles.quantityButtonText}>-</Text>
                </TouchableOpacity>
                <Text style={styles.quantityDisplay}>{quantity}</Text>
                <TouchableOpacity onPress={onIncrement} style={styles.quantityButton}>
                    <Text style={styles.quantityButtonText}>+</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleCartPress} style={styles.cartIconButtonRight}>
                    <Ionicons name="cart" size={18} color="#1976d2" />
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <TouchableOpacity style={styles.addToCartBtn} onPress={onAddToCart} activeOpacity={0.85}>
            <Ionicons name="cart" size={18} color="#fff" />
            <Text style={styles.addToCartBtnText}>В корзину</Text>
        </TouchableOpacity>
    );
}, (prevProps, nextProps) => {
    return (
        prevProps.quantity === nextProps.quantity &&
        prevProps.onIncrement === nextProps.onIncrement &&
        prevProps.onDecrement === nextProps.onDecrement &&
        prevProps.onAddToCart === nextProps.onAddToCart
    );
});
CartButtons.displayName = 'CartButtons';

// Memoized grid item component
const GridItem = React.memo(({ item, onPress }: CardProps) => {
    const dispatch = useAppDispatch();

    // ✅ ИСПРАВЛЕНО: Используем мемоизированный селектор
    const selectCartItem = useMemo(() => getCartItemSelector(item.id), [item.id]);
    const cartItem = useAppSelector(state => selectCartItem(state, item.id));
    const quantity = cartItem?.quantity || 0;

    // ✅ Состояние для отслеживания активного изображения
    const [activeImageIndex, setActiveImageIndex] = React.useState(0);

    // ✅ Мемоизированные callback'и для корзины
    const handleIncrement = useCallback(() => {
        dispatch(updateQuantity({ productId: item.id, quantity: quantity + 1 }));
    }, [dispatch, item.id, quantity]);

    const handleDecrement = useCallback(() => {
        if (quantity === 1) {
            dispatch(removeFromCart(item.id));
        } else {
            dispatch(updateQuantity({ productId: item.id, quantity: quantity - 1 }));
        }
    }, [dispatch, item.id, quantity]);

    const handleAddToCart = useCallback(() => {
        dispatch(addToCart({ product: item, quantity: 1 }));
    }, [dispatch, item]);

    // ✅ Мемоизированный обработчик изменения индекса
    const handleIndexChange = useCallback((newIndex: number) => {
        setActiveImageIndex(newIndex);
    }, []);

    return (
        <View style={styles.gridCard}>
            {/* ✅ ОПТИМИЗИРОВАННАЯ ГАЛЕРЕЯ ИЗОБРАЖЕНИЙ */}
            <ProductGallery
                images={item.images || []}
                activeIndex={activeImageIndex}
                onIndexChange={handleIndexChange}
                onPress={onPress}
            />

            {/* Текстовая часть с TouchableOpacity */}
            <ProductInfo
                item={item}
                onPress={onPress}
            />

            {/* ✅ Кнопки корзины с мемоизированными callback'ами */}
            <CartButtons
                quantity={quantity}
                onIncrement={handleIncrement}
                onDecrement={handleDecrement}
                onAddToCart={handleAddToCart}
            />
        </View>
    );
}, (prevProps, nextProps) => {
    return (
        prevProps.item.id === nextProps.item.id &&
        prevProps.item.price === nextProps.item.price &&
        prevProps.item.name === nextProps.item.name &&
        prevProps.item.images?.length === nextProps.item.images?.length &&
        prevProps.onPress === nextProps.onPress
    );
});
GridItem.displayName = 'GridItem';

// Memoized list item component
const ListItem = React.memo(({ item, onPress }: CardProps) => {
    const dispatch = useAppDispatch();

    // ✅ ИСПРАВЛЕНО: Используем мемоизированный селектор
    const selectCartItem = useMemo(() => getCartItemSelector(item.id), [item.id]);
    const cartItem = useAppSelector(state => selectCartItem(state, item.id));
    const quantity = cartItem?.quantity || 0;

    // ✅ Мемоизированные callback'и для корзины
    const handleIncrement = useCallback(() => {
        dispatch(updateQuantity({ productId: item.id, quantity: quantity + 1 }));
    }, [dispatch, item.id, quantity]);

    const handleDecrement = useCallback(() => {
        if (quantity === 1) {
            dispatch(removeFromCart(item.id));
        } else {
            dispatch(updateQuantity({ productId: item.id, quantity: quantity - 1 }));
        }
    }, [dispatch, item.id, quantity]);

    const handleAddToCart = useCallback(() => {
        dispatch(addToCart({ product: item, quantity: 1 }));
    }, [dispatch, item]);

    return (
        <View style={styles.listCard}>
            <TouchableOpacity onPress={onPress} activeOpacity={0.8} style={styles.listImageContainer}>
                <OptimizedImage
                    source={{ uri: item.images?.[0] || '' }}
                    style={styles.productImage}
                    contentFit="cover"
                    priority="normal"
                />
            </TouchableOpacity>

            <View style={styles.listContent}>
                <TouchableOpacity onPress={onPress} activeOpacity={0.8} style={styles.textSection}>
                    <Text style={styles.productName} numberOfLines={2} ellipsizeMode="tail">
                        {item.name}
                    </Text>
                    <View style={styles.priceRow}>
                        <Text style={styles.productPrice}>{item.price} ₽</Text>
                        {item.old_price && <Text style={styles.oldPrice}>{item.old_price} ₽</Text>}
                        {item.discount && <Text style={styles.discountPrice}>-{Math.abs(item.discount)}%</Text>}
                    </View>
                </TouchableOpacity>

                {/* ✅ Кнопки корзины с мемоизированными callback'ами */}
                <CartButtons
                    quantity={quantity}
                    onIncrement={handleIncrement}
                    onDecrement={handleDecrement}
                    onAddToCart={handleAddToCart}
                />
            </View>
        </View>
    );
}, (prevProps, nextProps) => {
    return (
        prevProps.item.id === nextProps.item.id &&
        prevProps.item.price === nextProps.item.price &&
        prevProps.item.name === nextProps.item.name &&
        prevProps.item.images?.[0] === nextProps.item.images?.[0] &&
        prevProps.onPress === nextProps.onPress
    );
});
ListItem.displayName = 'ListItem';

// Компонент фильтров
const FilterBar = React.memo(({ activeFilter, onFilterChange }: {
    activeFilter: FilterCategory,
    onFilterChange: (filter: FilterCategory) => void
}) => {
    const filters = [
        { key: 'all', label: 'Все', icon: 'grid-outline' },
        { key: 'supplements', label: 'Добавки', icon: 'nutrition-outline' },
        { key: 'equipment', label: 'Оборудование', icon: 'barbell-outline' },
        { key: 'clothing', label: 'Одежда', icon: 'shirt-outline' }
    ] as const;

    return (
        <View style={styles.filterContainer}>
            {filters.map((filter) => (
                <TouchableOpacity
                    key={filter.key}
                    style={[
                        styles.filterButton,
                        activeFilter === filter.key && styles.filterButtonActive
                    ]}
                    onPress={() => {
                        const t0 = Date.now();
                        onFilterChange(filter.key);
                        if (__DEV__) console.log('⏱️ [FILTER] tap →', filter.key);
                        requestAnimationFrame(() => {
                            const dt = Date.now() - t0;
                            if (__DEV__) console.log('✅ [FILTER] first frame →', filter.key, `${dt} ms`);
                        });
                    }}
                    activeOpacity={1}
                >
                    <Ionicons
                        name={filter.icon as any}
                        size={20}
                        color={activeFilter === filter.key ? '#fff' : '#666'}
                    />
                </TouchableOpacity>
            ))}
        </View>
    );
});

export default function ProductsScreen() {
    const router = useRouter();
    const dispatch = useAppDispatch();

    // Используем мемоизированные селекторы
    const filteredItems = useAppSelector(selectFilteredProducts);
    const status = useAppSelector(selectProductsStatus);
    const activeFilter = useAppSelector(selectActiveFilter);
    const viewMode = useAppSelector(selectViewMode);

    const cartItems = useAppSelector((state: RootState) => state.cart.items);

    // Предзагрузка изображений для лучшей производительности
    const imageUrls = useMemo(() => {
        return filteredItems
            .slice(0, 20) // Предзагружаем первые 20 изображений
            .map(item => item.images?.[0])
            .filter(Boolean) as string[];
    }, [filteredItems]);

    // Determine FlatList optimization params based on view mode
    const gridOptimization = useFlatListOptimization<ProductItem>({
        itemHeight: GRID_CARD_HEIGHT,
        columns: 2
    });

    const listOptimization = useFlatListOptimization<ProductItem>({
        itemHeight: LIST_CARD_HEIGHT
    });

    // flatListOptimization удален, параметры заданы напрямую в FlatList

    useEffect(() => {
        // Load products on component mount
        if (status === 'idle') {
            dispatch(fetchProducts());
        }
    }, [dispatch, status]);

    // Memoized handlers
    const handleCardPress = useCallback((slug: string) => {
        router.push(`/product/${slug}`);
    }, [router]);

    const handleFilterChange = useCallback((filter: FilterCategory) => {
        dispatch(setFilter(filter));
    }, [dispatch]);

    // Memoized render item functions for FlatList
    const renderGridItem = useCallback(({ item }: { item: ProductItem }) => (
        <GridItem
            item={item}
            onPress={() => handleCardPress(item.slug)}
        />
    ), [handleCardPress]);

    const renderListItem = useCallback(({ item }: { item: ProductItem }) => (
        <ListItem
            item={item}
            onPress={() => handleCardPress(item.slug)}
        />
    ), [handleCardPress]);

    // Memoized keyExtractor for FlatList optimization
    const keyExtractor = useCallback((item: ProductItem) => item.id, []);

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#f5f5f5' }} edges={['top', 'left', 'right']}>
            {/* Предзагрузка изображений в фоне */}
            <ImagePreloader urls={imageUrls} priority="low" />

            <FilterBar
                activeFilter={activeFilter}
                onFilterChange={handleFilterChange}
            />
            {status === 'loading' ? (
                <View style={styles.loadingContainer}>
                    <Text>Loading products...</Text>
                </View>
            ) : (
                <FlatList
                    data={filteredItems}
                    renderItem={viewMode === 'grid' ? renderGridItem : renderListItem}
                    keyExtractor={keyExtractor}
                    numColumns={viewMode === 'grid' ? 2 : 1}
                    key={`${viewMode}-${activeFilter}`}
                    contentContainerStyle={viewMode === 'grid' ? styles.gridContainer : styles.listContainer}
                    columnWrapperStyle={viewMode === 'grid' ? { marginBottom: 0, gap: GRID_GAP } : undefined}
                    showsVerticalScrollIndicator={false}
                    // ✅ ИСПРАВЛЕНО: Настройки для устранения подергивания в конце каталога
                    removeClippedSubviews={false}  // Отключаем для стабильности в конце списка
                    maxToRenderPerBatch={viewMode === 'grid' ? 4 : 6}  // Увеличиваем батч
                    initialNumToRender={viewMode === 'grid' ? 6 : 8}   // Увеличиваем начальный рендер
                    windowSize={5}  // Увеличиваем окно рендера для стабильности
                    updateCellsBatchingPeriod={100}  // Увеличиваем период для плавности
                    scrollEventThrottle={16}
                    getItemLayout={viewMode === 'grid' ?
                        (_, index) => ({
                            length: GRID_CARD_HEIGHT,
                            offset: GRID_CARD_HEIGHT * Math.floor(index / 2),
                            index,
                        }) :
                        (_, index) => ({
                            length: LIST_CARD_HEIGHT,
                            offset: LIST_CARD_HEIGHT * index,
                            index,
                        })
                    }
                    // ✅ ДОПОЛНИТЕЛЬНЫЕ ОПТИМИЗАЦИИ ДЛЯ СТАБИЛЬНОСТИ
                    disableIntervalMomentum={true}
                    legacyImplementation={false}
                    maintainVisibleContentPosition={{
                        minIndexForVisible: 0,
                        autoscrollToTopThreshold: 10
                    }}
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#1976d2',
    },
    viewToggle: {
        flexDirection: 'row',
        backgroundColor: '#eee',
        borderRadius: 8,
        padding: 4,
    },
    viewBtn: {
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 6,
    },
    activeViewBtn: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    listContainer: {
        paddingHorizontal: GRID_GAP,
        paddingTop: GRID_GAP,
        paddingBottom: 90,  // Уменьшено с 120 до 90 для оптимального расстояния до меню
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    gridRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 0,
        gap: GRID_GAP,
    },
    gridCard: {
        backgroundColor: '#fff',
        borderRadius: 8,
        padding: 0,
        width: GRID_CARD_WIDTH,
        marginBottom: GRID_GAP,
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    listCard: {
        backgroundColor: '#fff',
        borderRadius: 8,
        padding: 8,
        marginBottom: 6,
        flexDirection: 'row',
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    listContent: {
        flex: 1,
        paddingLeft: 12,
        justifyContent: 'center',
    },
    discountBadge: {
        position: 'absolute',
        top: 5,
        left: 5,
        backgroundColor: 'rgba(255, 0, 85, 0.9)',
        borderRadius: 3,
        padding: 4,
        zIndex: 1,
    },
    discountText: {
        color: 'white',
        fontSize: 12,
        fontWeight: 'bold',
    },
    imageContainer: {
        width: '100%',
        backgroundColor: '#fff',
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        margin: 0,
        padding: 0,
        overflow: 'hidden',
        aspectRatio: 4 / 5,
    },
    listImageContainer: {
        width: 100,
        height: 100 * (5 / 4),
        borderRadius: 4,
        overflow: 'hidden',
        position: 'relative',
        aspectRatio: 4 / 5,
    },
    imagePlaceholder: {
        width: '100%',
        height: '100%',
        backgroundColor: '#f0f0f0',
    },
    productName: {
        fontSize: 14,
        marginBottom: 1,
        color: '#222',
        marginTop: 1,
        paddingLeft: 4,
    },
    priceRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 1,
        marginTop: 1,
        paddingLeft: 4,
    },
    productPrice: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1976d2',
    },
    oldPrice: {
        fontSize: 14,
        color: '#e74c3c', // КРАСНЫЙ ЦВЕТ
        textDecorationLine: 'line-through',
        marginLeft: 8,
    },
    discountPrice: {
        fontSize: 12,
        color: '#ff0055',
        fontWeight: 'bold',
        marginLeft: 6,
    },
    productImage: {
        width: '100%',
        height: '100%',
        borderRadius: 8,
    },
    addToCartBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#1976d2',
        borderRadius: 6,
        paddingVertical: 8,
        paddingHorizontal: 12,
        marginTop: 2,
        alignSelf: 'stretch',
        height: 36, // Фиксированная высота - такая же как у белой кнопки
    },
    addToCartBtnText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#fff',
    },

    // ✅ ТОЧНОЕ ПОЗИЦИОНИРОВАНИЕ ЭЛЕМЕНТОВ В БЕЛОЙ КНОПКЕ
    cartButtonContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 6,
        borderWidth: 1,
        borderColor: '#1976d2',
        paddingVertical: 8,
        paddingHorizontal: 0, // Убираем общий отступ, используем индивидуальные
        marginTop: 2,
        alignSelf: 'stretch',
        height: 36,
        position: 'relative',
    },
    // ✅ КНОПКА "-" В ЛЕВОМ УГЛУ
    quantityButtonMinus: {
        width: 48,
        height: 24,
        borderRadius: 3,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#1976d2',
        marginLeft: 8, // 8px от левого края
        marginRight: 4, // 4px до счетчика
    },
    // ✅ КНОПКА "+" В ЦЕНТРЕ
    quantityButton: {
        width: 48,
        height: 24,
        borderRadius: 3,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#1976d2',
        marginLeft: 4, // 4px от счетчика
    },
    quantityButtonText: {
        fontSize: 14,
        color: '#1976d2',
        fontWeight: 'bold',
        textAlign: 'center',
    },
    quantityDisplay: {
        color: '#1976d2',
        fontWeight: 'bold',
        fontSize: 16,
        textAlign: 'center',
        flex: 1, // Занимает все оставшееся место между кнопками
    },
    // ✅ ИКОНКА КОРЗИНЫ В ПРАВОМ УГЛУ (ЗЕРКАЛЬНО)
    cartIconButtonRight: {
        width: 24,
        height: 24,
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 6, // 6px от кнопки "+"
        marginRight: 8, // 8px от правого края
    },
    filterContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    filterButton: {
        alignItems: 'center',
        justifyContent: 'center',
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#f5f5f5',
        marginRight: 8,
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    filterButtonActive: {
        backgroundColor: '#1976d2',
        borderColor: '#1976d2',
    },
    filterText: {
        color: '#666',
        fontSize: 14,
        fontWeight: '500',
        marginLeft: 4,
    },
    filterTextActive: {
        color: '#fff',
    },
    galleryImage: {
        width: '100%',
        height: '100%',
        borderRadius: 8,
        aspectRatio: 4 / 5,
    },
    textSection: {
        paddingHorizontal: 4,
        paddingVertical: 2,
    },
    gridContainer: {
        paddingHorizontal: GRID_GAP,
        paddingTop: GRID_GAP,
        paddingBottom: 90,  // Уменьшено с 120 до 90 для оптимального расстояния до меню
    },
    galleryContainer: {
        width: '100%',
        height: '100%',
        backgroundColor: '#fff',
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        margin: 0,
        padding: 0,
        overflow: 'hidden',
        aspectRatio: 4 / 5,
    },
    galleryImageContainer: {
        width: GRID_CARD_WIDTH,
        height: '100%',
        backgroundColor: '#fff',
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        margin: 0,
        padding: 0,
        overflow: 'hidden',
        aspectRatio: 4 / 5,
    },
    pagination: {
        flexDirection: 'row',
        justifyContent: 'center',
        paddingVertical: 2,
        paddingHorizontal: 4,
    },
    paginationDot: {
        width: 3,
        height: 3,
        borderRadius: 1.5,
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        margin: 1,
    },
    activePaginationDot: {
        backgroundColor: '#000',
        width: 3,
        height: 3,
        borderRadius: 1.5,
    },
});

