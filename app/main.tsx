import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { memo, useCallback, useEffect } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    InteractionManager,
    FlatList,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import OptimizedImage from '../components/ui/OptimizedImage';
import ImagePreloader from '../components/ui/ImagePreloader';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { useFlatListOptimization } from '../hooks/useFlatListOptimization';
import {
    ArticleItem,
    fetchArticles,
    fetchProducts,
    ProductItem,
} from '../store/slices/contentSlice';

const SCREEN_WIDTH = Dimensions.get('window').width;
const GRID_GAP = 3;
const GRID_CARD_WIDTH = (SCREEN_WIDTH - GRID_GAP * 3) / 2;
const GRID_CARD_HEIGHT = GRID_CARD_WIDTH * (5 / 4) + 80; // Рассчитанная высота для карточки
const ARTICLE_CARD_WIDTH = SCREEN_WIDTH * 0.7;

const TIMER_COVER_URL = 'https://wesrkttwjuvclvfkuxzx.supabase.co/storage/v1/object/public/images/Timer/MainTimer/main_timer.webp';

// Мемоизированная карточка товара (взято из вашего бэкапа)
const ProductGridCard = memo(({ item, onPress }: { item: ProductItem; onPress: () => void }) => {
    const imageUrl = item.images && item.images.length > 0 ? item.images[0] : undefined;
    return (
        <View style={styles.gridCard}>
            <TouchableOpacity style={{ flex: 1 }} onPress={onPress} activeOpacity={0.8}>
                {item.discount ? (
                    <View style={styles.discountBadge}>
                        <Text style={styles.discountText}>-{item.discount}%</Text>
                    </View>
                ) : null}
                <View style={styles.imageContainer}>
                    {imageUrl ? (
                        <OptimizedImage
                            source={{ uri: imageUrl }}
                            style={styles.productImage}
                            contentFit="cover"
                            width={GRID_CARD_WIDTH}
                            height={GRID_CARD_WIDTH * (4 / 5)}
                        />
                    ) : (
                        <View style={styles.imagePlaceholder} />
                    )}
                </View>
                <Text style={styles.productName} numberOfLines={1} ellipsizeMode="tail">{item.name}</Text>
                <View style={styles.priceRow}>
                    <Text style={styles.productPrice}>{item.price} ₽</Text>
                    {item.old_price && <Text style={styles.oldPrice}>{item.old_price} ₽</Text>}
                </View>
            </TouchableOpacity>
        </View>
    );
});

// Мемоизированная карточка статьи (взято из вашего бэкапа)
const ArticleCard = memo(({ item, onPress }: { item: ArticleItem; onPress: () => void }) => (
    <TouchableOpacity style={styles.articleCard} onPress={onPress} activeOpacity={0.85}>
        <View style={styles.articleImageContainer}>
            {item.cover_image_url && (
                <OptimizedImage
                    source={{ uri: item.cover_image_url }}
                    style={styles.productImage}
                    width={ARTICLE_CARD_WIDTH}
                    height={ARTICLE_CARD_WIDTH * (9 / 16)}
                />
            )}
        </View>
        <View style={styles.articleTextBlock}>
            <Text style={styles.articleTitle} numberOfLines={2} ellipsizeMode="tail">{item.title}</Text>
        </View>
    </TouchableOpacity>
));

export default function MainScreen() {
    const router = useRouter();
    const dispatch = useAppDispatch();

    const { items: products, status: productsStatus } = useAppSelector((state: { products: { items: ProductItem[]; status: 'idle' | 'loading' | 'succeeded' | 'failed' } }) => state.products);
    const { items: articles, status: articlesStatus } = useAppSelector((state: { articles: { items: ArticleItem[]; status: 'idle' | 'loading' | 'succeeded' | 'failed' } }) => state.articles);

    // ВАЖНО: вызывать хуки до любых ранних return
    const listPerf = useFlatListOptimization<ProductItem>({
        itemHeight: GRID_CARD_HEIGHT,
        columns: 2,
        removeClippedSubviews: false,
        maxToRenderPerBatch: 6,
        initialNumToRender: 8,
        windowSize: 5,
        updateCellsBatchingPeriod: 80,
    });

    // Предзагрузка первых карточек для устранения пустых плейсхолдеров после билдов
    const preloadUrls = React.useMemo(() =>
        (products || []).slice(0, 8).map((p: ProductItem) => p.images?.[0]).filter(Boolean) as string[]
    , [products]);

    useEffect(() => {
        // Откладываем сетевые запросы до окончания первого кадра/интеракций
        const task = InteractionManager.runAfterInteractions(() => {
            if (productsStatus === 'idle') {
                dispatch(fetchProducts());
            }
            if (articlesStatus === 'idle') {
                dispatch(fetchArticles());
            }
        });
        return () => task.cancel();
    }, [dispatch, productsStatus, articlesStatus]);

    const handleProductPress = useCallback((slug: string) => {
        router.replace(`/product/${slug}`);
    }, [router]);

    const handleTimerPress = useCallback(() => {
        router.replace('/timer');
    }, [router]);

    const handleArticlePress = useCallback((id: string) => {
        router.replace(`/blog/${id}`);
    }, [router]);

    const renderProduct = useCallback(({ item }: { item: ProductItem }) => (
        <ProductGridCard item={item} onPress={() => handleProductPress(item.slug)} />
    ), [handleProductPress]);

    const renderArticle = useCallback(({ item }: { item: ArticleItem }) => (
        <ArticleCard item={item} onPress={() => handleArticlePress(item.id)} />
    ), [handleArticlePress]);

    const ListHeader = () => (
        <>
            <TouchableOpacity style={styles.bigTimerBtn} onPress={handleTimerPress} activeOpacity={0.85}>
                <OptimizedImage source={{ uri: TIMER_COVER_URL }} style={styles.timerCoverImage} contentFit="cover" priority="high" />
                <View style={styles.bigTimerBtnInner}>
                    <Text style={styles.bigTimerBtnText}>Таймер</Text>
                    <Ionicons name="timer" size={48} color="#fff" style={{ marginLeft: 18 }} />
                </View>
            </TouchableOpacity>

            <Text style={styles.sectionTitle}>Новое в блоге</Text>
            {articlesStatus === 'loading' && <ActivityIndicator style={{ marginVertical: 20 }} />}
            <FlatList
                data={articles.slice(0, 5)} // Показываем 5 статей
                renderItem={renderArticle}
                keyExtractor={item => item.id}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: GRID_GAP, gap: GRID_GAP, paddingVertical: 10 }}
            />

            <Text style={styles.sectionTitle}>Популярные товары</Text>
        </>
    );

    if (productsStatus === 'loading' && products.length === 0) {
        return (
            <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#f5f5f5' }}>
            <ImagePreloader urls={preloadUrls} priority="normal" />
            <FlatList
                ListHeaderComponent={ListHeader}
                data={products}
                renderItem={renderProduct}
                keyExtractor={item => item.id}
                numColumns={2}
                contentContainerStyle={{ padding: GRID_GAP, paddingBottom: 56 }}
                columnWrapperStyle={{ gap: GRID_GAP }}
                showsVerticalScrollIndicator={false}
                {...listPerf}
            />
        </SafeAreaView>
    );
}

// Стили, адаптированные из вашего бэкапа
const styles = StyleSheet.create({
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        marginTop: 24,
        marginLeft: GRID_GAP * 2,
        marginBottom: 12
    },
    gridCard: {
        backgroundColor: '#fff',
        borderRadius: 8,
        width: GRID_CARD_WIDTH,
        marginBottom: GRID_GAP,
        borderWidth: 1,
        borderColor: '#e0e0e0',
        overflow: 'hidden'
    },
    discountBadge: {
        position: 'absolute',
        top: 8,
        left: 8,
        backgroundColor: 'rgba(255, 0, 85, 0.9)',
        borderRadius: 4,
        paddingHorizontal: 6,
        paddingVertical: 3,
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
        aspectRatio: 4 / 5,
    },
    imagePlaceholder: {
        width: '100%',
        height: '100%',
        backgroundColor: '#f0f0f0',
    },
    productName: {
        fontSize: 14,
        color: '#222',
        marginTop: 8,
        marginHorizontal: 8,
    },
    priceRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
        marginBottom: 8,
        marginHorizontal: 8,
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
    },
    articleCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        width: SCREEN_WIDTH * 0.7,
        borderWidth: 1,
        borderColor: '#e0e0e0',
        overflow: 'hidden',
    },
    articleImageContainer: {
        width: '100%',
        aspectRatio: 16 / 9,
        backgroundColor: '#f0f0f0',
    },
    articleTextBlock: {
        padding: 12,
    },
    articleTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    },
    bigTimerBtn: {
        width: 'auto',
        alignSelf: 'stretch',
        marginHorizontal: GRID_GAP,
        marginTop: GRID_GAP,
        borderRadius: 22,
        overflow: 'hidden',
        height: 540,
    },
    bigTimerBtnInner: {
        position: 'absolute',
        top: 24,
        right: 24,
        flexDirection: 'row',
        alignItems: 'center',
        zIndex: 1,
    },
    bigTimerBtnText: {
        color: '#fff',
        fontSize: 34,
        fontWeight: 'bold',
        letterSpacing: 1,
        textShadowColor: 'rgba(0, 0, 0, 0.5)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 3,
    },
    timerCoverImage: {
        ...StyleSheet.absoluteFillObject,
    },
}); 