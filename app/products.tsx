import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect } from 'react';
import { Dimensions, FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFlatListOptimization } from '../hooks/useFlatListOptimization';
import { useMemoizedHandlers } from '../hooks/useMemoizedHandlers';
import { RootState } from './store';
import { useAppDispatch, useAppSelector } from './store/hooks';
import { addToCart, removeFromCart, updateQuantity } from './store/slices/cartSlice';
import { ProductItem, fetchProducts, setViewMode } from './store/slices/productsSlice';

const SCREEN_WIDTH = Dimensions.get('window').width;
const GRID_MARGIN = 6;
const GRID_COLUMN_COUNT = 2;
const GRID_GAP = 2;
const GRID_CARD_WIDTH = (SCREEN_WIDTH - GRID_GAP * 3) / 2;

// Constants for optimizing FlatList
const GRID_CARD_HEIGHT = 230; // Approximate height of grid card
const LIST_CARD_HEIGHT = 120; // Approximate height of list card

// Type for card component props
type CardProps = {
    item: ProductItem;
    onPress: () => void;
};

const QuantityCounter = ({ quantity, onDecrement, onIncrement }: { quantity: number, onDecrement: () => void, onIncrement: () => void }) => (
    <View style={styles.counterContainer}>
        <TouchableOpacity onPress={onDecrement} style={styles.counterBtn}>
            <Text style={styles.counterBtnText}>-</Text>
        </TouchableOpacity>
        <Text style={styles.counterValue}>{quantity}</Text>
        <TouchableOpacity onPress={onIncrement} style={styles.counterBtn}>
            <Text style={styles.counterBtnText}>+</Text>
        </TouchableOpacity>
    </View>
);

const QuantityCartButton = ({ quantity, onIncrement, onDecrement }: { quantity: number, onIncrement: () => void, onDecrement: () => void }) => {
    const router = useRouter();
    return (
        <View style={styles.cartRow}>
            <TouchableOpacity onPress={() => router.push('/cart')} style={styles.cartSquare}>
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

    // Галерея картинок
    const renderImage = () => {
        if (item.images && item.images.length > 0) {
            return (
                <View style={styles.imageContainer}>
                    <Image source={{ uri: item.images[0] }} style={styles.productImage} resizeMode="contain" />
                </View>
            );
        } else {
            return <View style={styles.imagePlaceholder}></View>;
        }
    };

    return (
        <View style={styles.gridCard}>
            <TouchableOpacity style={{ flex: 1 }} onPress={onPress} activeOpacity={0.8}>
                {item.price && item.old_price && (
                    <View style={styles.discountBadge}>
                        <Text style={styles.discountText}>-{item.discount}%</Text>
                    </View>
                )}
                <View style={styles.imageContainer}>{renderImage()}</View>
                <Text style={styles.productName} numberOfLines={1} ellipsizeMode="tail">{item.name}</Text>
                <View style={styles.priceRow}>
                    <Text style={styles.productPrice}>{item.price} ₽</Text>
                    {item.old_price && <Text style={styles.oldPrice}>{item.old_price} ₽</Text>}
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

// Memoized list item component
const ListItem = React.memo(({ item, onPress }: CardProps) => {
    const dispatch = useAppDispatch();
    const cartItems = useAppSelector((state: RootState) => state.cart.items);
    const cartItem = cartItems.find(i => i.product.id === item.id);
    const quantity = cartItem?.quantity || 0;

    // Галерея картинок
    const renderImage = () => {
        if (item.images && item.images.length > 0) {
            return <Image source={{ uri: item.images[0] }} style={styles.productImage} resizeMode="cover" />;
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

export default function ProductsScreen() {
    const router = useRouter();
    const dispatch = useAppDispatch();
    const { items, viewMode, status } = useAppSelector((state: RootState) => state.products);

    // Determine FlatList optimization params based on view mode
    const gridOptimization = useFlatListOptimization<ProductItem>({
        itemHeight: GRID_CARD_HEIGHT,
        columns: 2
    });

    const listOptimization = useFlatListOptimization<ProductItem>({
        itemHeight: LIST_CARD_HEIGHT
    });

    // Get correct optimization based on current view mode
    const flatListOptimization = viewMode === 'grid' ? gridOptimization : listOptimization;

    useEffect(() => {
        // Load products on component mount
        if (status === 'idle') {
            dispatch(fetchProducts());
        }
    }, [dispatch, status]);

    // Create memoized handlers
    const handlers = useMemoizedHandlers({
        handleCardPress: (id: string) => {
            router.replace(`/product/${id}`);
        },
        toggleViewMode: (mode: 'grid' | 'list') => {
            dispatch(setViewMode(mode));
        }
    }, [router, dispatch]);

    // Memoized render item functions for FlatList
    const renderGridItem = useCallback(({ item }: { item: ProductItem }) => (
        <GridItem
            item={item}
            onPress={() => handlers.handleCardPress(item.id)}
        />
    ), [handlers.handleCardPress]);

    const renderListItem = useCallback(({ item }: { item: ProductItem }) => (
        <ListItem
            item={item}
            onPress={() => handlers.handleCardPress(item.id)}
        />
    ), [handlers.handleCardPress]);

    // Memoized keyExtractor for FlatList optimization
    const keyExtractor = useCallback((item: ProductItem) => item.id, []);

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#f5f5f5' }} edges={['top', 'left', 'right']}>
            {status === 'loading' ? (
                <View style={styles.loadingContainer}>
                    <Text>Loading products...</Text>
                </View>
            ) : (
                <FlatList
                    data={items}
                    renderItem={viewMode === 'grid' ? renderGridItem : renderListItem}
                    keyExtractor={keyExtractor}
                    numColumns={viewMode === 'grid' ? 2 : 1}
                    key={viewMode}
                    contentContainerStyle={styles.listContainer}
                    columnWrapperStyle={viewMode === 'grid' ? styles.gridRow : undefined}
                    {...flatListOptimization}
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
        paddingHorizontal: 2,
        paddingTop: 2,
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
        marginBottom: 2,
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
        height: 200,
        backgroundColor: '#fff',
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        margin: 0,
        padding: 0,
        overflow: 'hidden',
    },
    listImageContainer: {
        width: 100,
        height: 100,
        borderRadius: 4,
        overflow: 'hidden',
        position: 'relative',
    },
    imagePlaceholder: {
        width: '100%',
        height: '100%',
        backgroundColor: '#f0f0f0',
    },
    productName: {
        fontSize: 14,
        marginBottom: 2,
        color: '#222',
        marginTop: 3,
        paddingLeft: 4,
    },
    priceRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 2,
        marginTop: 3,
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
    productImage: {
        width: '100%',
        height: '100%',
        borderRadius: 8,
        resizeMode: 'contain',
    },
    addToCartBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#1976d2',
        borderRadius: 6,
        paddingVertical: 8,
        paddingHorizontal: 12,
        marginTop: 4,
        alignSelf: 'stretch',
    },
    addToCartBtnText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
        marginLeft: 8,
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
});

export { fetchProducts, default as productsReducer } from './store/slices/productsSlice';

