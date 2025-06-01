import { useFlatListOptimization } from '@/hooks/useFlatListOptimization';
import { useMemoizedHandlers } from '@/hooks/useMemoizedHandlers';
import { RootState } from '@/src/store';
import { useAppDispatch, useAppSelector } from '@/src/store/hooks';
import { ProductItem, fetchProducts, setViewMode } from '@/src/store/slices/productsSlice';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect } from 'react';
import { Dimensions, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const SCREEN_WIDTH = Dimensions.get('window').width;
const GRID_MARGIN = 6;
const GRID_COLUMN_COUNT = 2;
const GRID_CARD_WIDTH = (SCREEN_WIDTH - (GRID_COLUMN_COUNT + 1) * GRID_MARGIN * 2) / GRID_COLUMN_COUNT;

// Constants for optimizing FlatList
const GRID_CARD_HEIGHT = 230; // Approximate height of grid card
const LIST_CARD_HEIGHT = 120; // Approximate height of list card

// Type for card component props
type CardProps = {
    item: ProductItem;
    onPress: () => void;
};

// Memoized grid item component
const GridItem = React.memo(({ item, onPress }: CardProps) => (
    <TouchableOpacity
        style={styles.gridCard}
        onPress={onPress}
    >
        <View style={styles.discountBadge}>
            <Text style={styles.discountText}>-{item.discount}%</Text>
        </View>
        <View style={styles.imageContainer}>
            <View style={styles.imagePlaceholder}></View>
        </View>
        <Text style={styles.productName} numberOfLines={2}>{item.name}</Text>
        <View style={styles.priceRow}>
            <Text style={styles.productPrice}>${item.price}</Text>
            <Text style={styles.oldPrice}>${item.old_price}</Text>
        </View>
    </TouchableOpacity>
));

// Memoized list item component
const ListItem = React.memo(({ item, onPress }: CardProps) => (
    <TouchableOpacity
        style={styles.listCard}
        onPress={onPress}
    >
        <View style={styles.listImageContainer}>
            <View style={styles.discountBadge}>
                <Text style={styles.discountText}>-{item.discount}%</Text>
            </View>
            <View style={styles.imagePlaceholder}></View>
        </View>
        <View style={styles.listContent}>
            <Text style={styles.productName} numberOfLines={2}>{item.name}</Text>
            <View style={styles.priceRow}>
                <Text style={styles.productPrice}>${item.price}</Text>
                <Text style={styles.oldPrice}>${item.old_price}</Text>
            </View>
        </View>
    </TouchableOpacity>
));

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
            <View style={styles.header}>
                <Text style={styles.title}>Все товары</Text>
                <View style={styles.viewToggle}>
                    <TouchableOpacity
                        style={[styles.viewBtn, viewMode === 'grid' && styles.activeViewBtn]}
                        onPress={() => handlers.toggleViewMode('grid')}
                    >
                        <Ionicons name="grid" size={20} color={viewMode === 'grid' ? "#1976d2" : "#888"} />
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.viewBtn, viewMode === 'list' && styles.activeViewBtn]}
                        onPress={() => handlers.toggleViewMode('list')}
                    >
                        <Ionicons name="list" size={20} color={viewMode === 'list' ? "#1976d2" : "#888"} />
                    </TouchableOpacity>
                </View>
            </View>

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
                    key={viewMode} // Important for proper recreation when changing mode
                    contentContainerStyle={styles.listContainer}
                    columnWrapperStyle={viewMode === 'grid' ? styles.gridRow : undefined}

                    // Apply all optimized props from our custom hook
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
        padding: 8,
        paddingBottom: 100, // Space for navigation menu
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    gridRow: {
        justifyContent: 'space-between',
    },
    gridCard: {
        backgroundColor: '#fff',
        borderRadius: 8,
        padding: 8,
        width: GRID_CARD_WIDTH,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    listCard: {
        backgroundColor: '#fff',
        borderRadius: 8,
        padding: 8,
        marginBottom: 12,
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
        height: 150,
        marginBottom: 8,
        borderRadius: 4,
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
        marginBottom: 6,
        color: '#222',
    },
    priceRow: {
        flexDirection: 'row',
        alignItems: 'center',
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
}); 