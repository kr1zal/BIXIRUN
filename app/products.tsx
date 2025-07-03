import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo } from 'react';
import { Dimensions, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';
import ImagePreloader from '../components/ui/ImagePreloader';
import OptimizedImage from '../components/ui/OptimizedImage';
import { useFlatListOptimization } from '../hooks/useFlatListOptimization';
import { RootState } from './store';
import { useAppDispatch, useAppSelector } from './store/hooks';
import { addToCart, removeFromCart, updateQuantity } from './store/slices/cartSlice';
import { FilterCategory, ProductItem, fetchProducts, selectActiveFilter, selectFilteredProducts, selectProductsStatus, selectViewMode, setFilter } from './store/slices/productsSlice';

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

// Удален неиспользуемый компонент QuantityCounter

const QuantityCartButton = ({ quantity, onIncrement, onDecrement }: { quantity: number, onIncrement: () => void, onDecrement: () => void }) => {
    const router = useRouter();
    return (
        <View style={styles.cartRow}>
            <TouchableOpacity onPress={() => router.replace('/cart')} style={styles.cartSquare}>
                <Ionicons name="cart" size={20} color="#1976d2" />
            </TouchableOpacity>
            <TouchableOpacity onPress={onDecrement} style={styles.cartSquare}>
                <Text style={styles.counterBtnText}>-</Text>
            </TouchableOpacity>
            <Text style={styles.cartQuantity}>{quantity}</Text>
            <TouchableOpacity onPress={onIncrement} style={styles.cartSquare}>
                <Text style={styles.counterBtnText}>+</Text>
            </TouchableOpacity>
        </View>
    );
};

// Memoized grid item component
const GridItem = React.memo(({ item, onPress }: CardProps) => {
    const dispatch = useAppDispatch();
    const cartItems = useAppSelector((state: RootState) => state.cart.items);
    const cartItem = cartItems.find(i => i.product.id === item.id);
    const quantity = cartItem?.quantity || 0;

    // Состояние для отслеживания активного изображения
    const [activeImageIndex, setActiveImageIndex] = React.useState(0);
    const flatListRef = React.useRef<FlatList>(null);

    // Обработчик скролла изображений
    const handleImageScroll = React.useCallback((event: any) => {
        const newIndex = Math.round(event.nativeEvent.contentOffset.x / GRID_CARD_WIDTH);
        setActiveImageIndex(newIndex);
    }, []);

    // Рендер одного изображения в галерее
    const renderGalleryImage = React.useCallback(({ item: imageUrl }: { item: string }) => (
        <View style={styles.galleryImageContainer}>
            <OptimizedImage
                source={{ uri: imageUrl }}
                style={styles.galleryImage}
                contentFit="cover"
            />
        </View>
    ), []);

    // Рендер пагинации (точек)
    const renderPagination = React.useCallback(() => {
        if (!item.images || item.images.length <= 1) return null;

        return (
            <View style={styles.pagination}>
                {item.images.map((_, index) => (
                    <View
                        key={index}
                        style={[
                            styles.paginationDot,
                            activeImageIndex === index && styles.activePaginationDot
                        ]}
                    />
                ))}
            </View>
        );
    }, [item.images, activeImageIndex]);

    // Создаем жесты для одновременной работы тапа и свайпа
    const tapGesture = React.useMemo(() =>
        Gesture.Tap()
            .maxDuration(250)
            .maxDistance(10)
            .runOnJS(true)
            .onEnd((_event, success) => {
                if (success) {
                    onPress();
                }
            })
        , [onPress]);

    // Создаем Pan жест для FlatList свайпа
    const panGesture = React.useMemo(() =>
        Gesture.Pan()
            .activeOffsetX([-10, 10])
            .failOffsetY([-10, 10])
        , []);

    // Комбинируем жесты
    const composedGesture = React.useMemo(() =>
        Gesture.Simultaneous(tapGesture, panGesture)
        , [tapGesture, panGesture]);

    return (
        <View style={styles.gridCard}>
            {/* Галерея изображений с GestureDetector для одновременной работы тапа и свайпа */}
            <GestureDetector gesture={composedGesture}>
                <View style={styles.imageContainer}>
                    {item.images && item.images.length > 0 ? (
                        <View style={styles.galleryContainer}>
                            <FlatList
                                ref={flatListRef}
                                data={item.images}
                                renderItem={renderGalleryImage}
                                keyExtractor={(_, index) => `image-${index}`}
                                horizontal
                                pagingEnabled
                                showsHorizontalScrollIndicator={false}
                                onMomentumScrollEnd={handleImageScroll}
                                style={styles.galleryFlatList}
                                getItemLayout={(_, index) => ({
                                    length: GRID_CARD_WIDTH,
                                    offset: GRID_CARD_WIDTH * index,
                                    index,
                                })}
                            />
                        </View>
                    ) : (
                        <View style={styles.imagePlaceholder} />
                    )}
                </View>
            </GestureDetector>

            {/* Пагинация под картинкой */}
            {renderPagination()}

            {/* Текстовая часть с TouchableOpacity */}
            <TouchableOpacity onPress={onPress} activeOpacity={0.8} style={styles.textSection}>
                <View style={styles.priceRow}>
                    <Text style={styles.productPrice}>{item.price} ₽</Text>
                    {item.old_price && <Text style={styles.oldPrice}>{item.old_price} ₽</Text>}
                    {item.price && item.old_price && item.discount && <Text style={styles.discountPrice}>-{Math.abs(item.discount)}%</Text>}
                </View>
                <Text style={styles.productName} numberOfLines={1} ellipsizeMode="tail">{item.name}</Text>
            </TouchableOpacity>

            {/* Кнопки корзины */}
            {quantity > 0 ? (
                <QuantityCartButton
                    quantity={quantity}
                    onIncrement={() => dispatch(updateQuantity({ productId: item.id, quantity: quantity + 1 }))}
                    onDecrement={() => quantity === 1 ? dispatch(removeFromCart(item.id)) : dispatch(updateQuantity({ productId: item.id, quantity: quantity - 1 }))}
                />
            ) : (
                <TouchableOpacity style={styles.addToCartBtn} onPress={() => dispatch(addToCart({ product: item, quantity: 1 }))} activeOpacity={0.85}>
                    <Ionicons name="cart" size={18} color="#fff" />
                    <Text style={styles.addToCartBtnText}>В корзину</Text>
                </TouchableOpacity>
            )}
        </View>
    );
});
GridItem.displayName = 'GridItem';

// Memoized list item component
const ListItem = React.memo(({ item, onPress }: CardProps) => {
    const dispatch = useAppDispatch();
    const cartItems = useAppSelector((state: RootState) => state.cart.items);
    const cartItem = cartItems.find(i => i.product.id === item.id);
    const quantity = cartItem?.quantity || 0;

    // Галерея картинок
    const renderImage = () => {
        if (item.images && item.images.length > 0) {
            return (
                <OptimizedImage
                    source={{ uri: item.images[0] }}
                    style={styles.productImage}
                    contentFit="contain"
                    priority="high"
                />
            );
        } else {
            return <View style={styles.imagePlaceholder}></View>;
        }
    };

    return (
        <View style={styles.listCard}>
            <TouchableOpacity style={{ flex: 1, flexDirection: 'row' }} onPress={onPress} activeOpacity={0.8}>
                <View style={styles.listImageContainer}>
                    {item.price && item.old_price && (
                        <View style={styles.discountBadge}>
                            <Text style={styles.discountText}>-{item.discount}%</Text>
                        </View>
                    )}
                    {renderImage()}
                </View>
                <View style={styles.listContent}>
                    <Text style={styles.productName} numberOfLines={1} ellipsizeMode="tail">{item.name}</Text>
                    <View style={styles.priceRow}>
                        <Text style={styles.productPrice}>{item.price} ₽</Text>
                        {item.old_price && <Text style={styles.oldPrice}>{item.old_price} ₽</Text>}
                        {item.price && item.old_price && item.discount && <Text style={styles.discountPrice}>-{Math.abs(item.discount)}%</Text>}
                    </View>
                </View>
            </TouchableOpacity>
            {quantity > 0 ? (
                <QuantityCartButton
                    quantity={quantity}
                    onIncrement={() => dispatch(updateQuantity({ productId: item.id, quantity: quantity + 1 }))}
                    onDecrement={() => quantity === 1 ? dispatch(removeFromCart(item.id)) : dispatch(updateQuantity({ productId: item.id, quantity: quantity - 1 }))}
                />
            ) : (
                <TouchableOpacity style={styles.addToCartBtn} onPress={() => dispatch(addToCart({ product: item, quantity: 1 }))} activeOpacity={0.85}>
                    <Ionicons name="cart" size={18} color="#fff" />
                    <Text style={styles.addToCartBtnText}>В корзину</Text>
                </TouchableOpacity>
            )}
        </View>
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
                    onPress={() => onFilterChange(filter.key)}
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
    const handleCardPress = useCallback((id: string) => {
        router.replace(`/product/${id}`);
    }, [router]);

    const handleFilterChange = useCallback((filter: FilterCategory) => {
        dispatch(setFilter(filter));
    }, [dispatch]);

    // Memoized render item functions for FlatList
    const renderGridItem = useCallback(({ item }: { item: ProductItem }) => (
        <GridItem
            item={item}
            onPress={() => handleCardPress(item.id)}
        />
    ), [handleCardPress]);

    const renderListItem = useCallback(({ item }: { item: ProductItem }) => (
        <ListItem
            item={item}
            onPress={() => handleCardPress(item.id)}
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
                    // Оптимизация производительности
                    removeClippedSubviews={true}
                    maxToRenderPerBatch={viewMode === 'grid' ? 4 : 8}
                    initialNumToRender={viewMode === 'grid' ? 6 : 10}
                    windowSize={5}
                    updateCellsBatchingPeriod={100}
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
        paddingBottom: 80,
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
        fontSize: 12,
        color: '#888',
        textDecorationLine: 'line-through',
        marginLeft: 6,
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
    },
    addToCartBtnText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#fff',
    },
    counterContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f3e6ff',
        borderRadius: 16,
        paddingVertical: 10,
        paddingHorizontal: 18,
        marginTop: 4,
        alignSelf: 'stretch',
        minHeight: 48,
        minWidth: 120,
    },
    counterBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
        marginHorizontal: 4,
        borderWidth: 1,
        borderColor: '#d1b3ff',
    },
    counterBtnText: {
        fontSize: 16,
        color: '#1976d2',
        fontWeight: 'bold',
        textAlign: 'center',
    },
    counterValue: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#a259ff',
        minWidth: 28,
        textAlign: 'center',
    },
    cartRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 8,
        marginBottom: 2,
        alignSelf: 'stretch',
    },
    cartSquare: {
        width: 26,
        height: 26,
        borderRadius: 5,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
        marginHorizontal: 2,
        borderWidth: 1,
        borderColor: '#1976d2',
    },
    cartQuantity: {
        color: '#1976d2',
        fontWeight: 'bold',
        fontSize: 16,
        marginHorizontal: 8,
        minWidth: 20,
        textAlign: 'center',
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
    galleryContainer: {
        width: '100%',
        height: '100%',
        position: 'relative',
    },
    galleryImageContainer: {
        width: GRID_CARD_WIDTH,
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    galleryImage: {
        width: '100%',
        height: '100%',
        borderRadius: 8,
        aspectRatio: 4 / 5,
    },
    galleryFlatList: {
        width: '100%',
        height: '100%',
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
    textSection: {
        paddingHorizontal: 4,
        paddingVertical: 2,
    },
    gridContainer: {
        paddingHorizontal: GRID_GAP,
        paddingTop: GRID_GAP,
        paddingBottom: 80,
    },
});

