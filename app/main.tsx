import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { memo, useCallback, useEffect, useState } from 'react';
import { Dimensions, FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { fetchProducts } from './products';
import { useAppDispatch, useAppSelector } from './store/hooks';

// Типы данных
type ProductItem = {
    id: string;
    name: string;
    price: string;
    oldPrice?: string;
    old_price?: string;
    discount: number;
    images?: string[];
};

type ArticleItem = {
    id: string;
    title: string;
    preview: string;
};

// Уменьшаем количество тестовых элементов
const mockProducts: ProductItem[] = Array.from({ length: 30 }, (_, i) => ({
    id: i + '',
    name: `Product ${i + 1}`,
    price: (Math.random() * 100).toFixed(2),
    oldPrice: ((Math.random() * 100) + 50).toFixed(2),
    discount: Math.floor(Math.random() * 70) + 10,
    images: [],
}));

const mockArticles: ArticleItem[] = Array.from({ length: 5 }, (_, i) => ({
    id: i + '',
    title: `Статья ${i + 1}`,
    preview: 'Краткое описание статьи...'
}));

const SCREEN_WIDTH = Dimensions.get('window').width;
const GRID_MARGIN = 6;
const GRID_COLUMN_COUNT = 2;
const GRID_GAP = 8;
const GRID_CARD_WIDTH = (SCREEN_WIDTH - GRID_GAP * 3) / 2;
const GRID_CARD_HEIGHT = 230;

// Мемоизированный компонент карточки товара
const ProductGridCard = memo(({ item, onPress }: { item: ProductItem; onPress: () => void }) => {
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
        </View>
    );
});

// Мемоизированный компонент карточки статьи
const ARTICLE_CARD_HEIGHT = GRID_CARD_HEIGHT * 1.5;
const ArticleCard = memo(({ item, onPress }: { item: ArticleItem; onPress: () => void }) => (
    <TouchableOpacity style={styles.articleCard} onPress={onPress} activeOpacity={0.85}>
        <View style={styles.articleImageContainer}>
            <View style={styles.articleImagePlaceholder} />
        </View>
        <View style={styles.articleTextBlock}>
            <Text style={styles.articleTitle} numberOfLines={1} ellipsizeMode="tail">{item.title}</Text>
        </View>
    </TouchableOpacity>
));

export default function MainScreen() {
    const router = useRouter();
    const [articles, setArticles] = useState<ArticleItem[]>([]);
    const dispatch = useAppDispatch();
    const { items, status } = useAppSelector(state => state.products);

    useEffect(() => {
        setArticles(mockArticles);
    }, []);

    useEffect(() => {
        if (status === 'idle') dispatch(fetchProducts());
    }, [dispatch, status]);

    const handleProductPress = useCallback((id: string) => {
        router.replace(`/product/${id}`);
    }, [router]);

    const handleTimerPress = useCallback(() => {
        router.replace('/timer' as any);
    }, [router]);

    const handleArticlePress = useCallback((id: string) => {
        router.replace(`/blog/${id}` as any);
    }, [router]);

    const renderProduct = useCallback(({ item }: { item: ProductItem }) => (
        <ProductGridCard
            item={item}
            onPress={() => handleProductPress(item.id)}
        />
    ), [handleProductPress]);

    const renderArticle = useCallback(({ item }: { item: ArticleItem }) => (
        <ArticleCard
            item={item}
            onPress={() => handleArticlePress(item.id)}
        />
    ), [handleArticlePress]);

    const getProductItemLayout = useCallback((data: any, index: number) => ({
        length: GRID_CARD_HEIGHT,
        offset: GRID_CARD_HEIGHT * index,
        index,
    }), []);

    // Новый header для FlatList
    const ListHeader = () => (
        <>
            <TouchableOpacity
                style={styles.bigTimerBtn}
                onPress={handleTimerPress}
                activeOpacity={0.85}
            >
                <LinearGradient
                    colors={['#43cea2', '#185a9d']}
                    style={styles.bigTimerBtnInner}
                >
                    <Ionicons name="timer" size={48} color="#fff" style={{ marginRight: 18 }} />
                    <Text style={styles.bigTimerBtnText}>Таймер</Text>
                </LinearGradient>
            </TouchableOpacity>
            <Text style={styles.sectionTitle}>Статьи</Text>
            <View style={styles.articlesHeaderRow}>
                <Text style={styles.sectionTitle}></Text>
                <TouchableOpacity style={styles.allArticlesBtn} onPress={() => router.replace('/blog')}>
                    <Text style={styles.allArticlesBtnText}>Все статьи</Text>
                </TouchableOpacity>
            </View>
            <FlatList
                data={articles}
                renderItem={renderArticle}
                keyExtractor={item => item.id}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 8, gap: 8 }}
                nestedScrollEnabled={false}
                removeClippedSubviews={true}
                initialNumToRender={3}
                maxToRenderPerBatch={3}
                style={{ marginBottom: 8 }}
            />
            <Text style={styles.sectionTitle}>Товары</Text>
        </>
    );

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#f5f5f5' }}>
            <FlatList
                ListHeaderComponent={ListHeader}
                data={items}
                renderItem={renderProduct}
                keyExtractor={item => item.id}
                numColumns={2}
                contentContainerStyle={{ padding: GRID_GAP, paddingBottom: 100 }}
                columnWrapperStyle={{ marginBottom: 0 }}
                removeClippedSubviews={true}
                initialNumToRender={5}
                maxToRenderPerBatch={5}
                getItemLayout={getProductItemLayout}
                showsVerticalScrollIndicator={false}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    scrollContent: {
        paddingBottom: 100, // Add padding to ensure content doesn't get hidden behind footer
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1976d2',
        marginTop: 16,
        marginLeft: 16,
        marginBottom: 8
    },
    gridCard: {
        backgroundColor: '#fff',
        borderRadius: 8,
        padding: 0,
        width: GRID_CARD_WIDTH,
        marginBottom: GRID_GAP,
        marginRight: GRID_GAP,
        borderWidth: 1,
        borderColor: '#e0e0e0',
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
    articleCard: {
        backgroundColor: '#fff',
        borderRadius: 8,
        padding: 0,
        width: GRID_CARD_WIDTH * 1.5,
        marginHorizontal: GRID_MARGIN,
        borderWidth: 1,
        borderColor: '#e0e0e0',
        overflow: 'hidden',
        flexDirection: 'column',
        height: ARTICLE_CARD_HEIGHT,
    },
    articleImageContainer: {
        width: '100%',
        height: ARTICLE_CARD_HEIGHT * 0.55,
        backgroundColor: '#f0f0f0',
        alignItems: 'stretch',
        justifyContent: 'center',
        padding: 0,
        margin: 0,
    },
    articleImagePlaceholder: {
        width: '100%',
        height: '100%',
        backgroundColor: '#e0e0e0',
        borderRadius: 8,
    },
    articleTextBlock: {
        flex: 1,
        justifyContent: 'center',
        padding: 0,
    },
    articleTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#1976d2',
        marginTop: 3,
        marginBottom: 2,
        paddingLeft: 4,
    },
    articlePreview: {
        fontSize: 15,
        color: '#555',
        lineHeight: 22,
    },
    bigTimerBtn: {
        width: '92%',
        alignSelf: 'center',
        marginTop: 18,
        marginBottom: 10,
        borderRadius: 22,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#3a9db5',
        height: Dimensions.get('window').height * 0.5, // 50% экрана
    },
    bigTimerBtnInner: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        borderRadius: 22,
        paddingHorizontal: 18,
    },
    bigTimerBtnText: {
        color: '#fff',
        fontSize: 34,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
    articlesHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
        marginRight: 16,
        marginBottom: 2,
    },
    allArticlesBtn: {
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 8,
        backgroundColor: '#e3f2fd',
    },
    allArticlesBtnText: {
        color: '#1976d2',
        fontWeight: 'bold',
        fontSize: 14,
    },
}); 