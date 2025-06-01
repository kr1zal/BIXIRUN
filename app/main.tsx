import React, { useState, useEffect, useCallback, memo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Dimensions, ScrollView, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

// Типы данных
type ProductItem = {
    id: string;
    name: string;
    price: string;
    oldPrice: string;
    discount: number;
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
}));

const mockArticles: ArticleItem[] = Array.from({ length: 5 }, (_, i) => ({
    id: i + '',
    title: `Статья ${i + 1}`,
    preview: 'Краткое описание статьи...'
}));

const SCREEN_WIDTH = Dimensions.get('window').width;
const GRID_MARGIN = 6;
const GRID_COLUMN_COUNT = 2;
const GRID_CARD_WIDTH = (SCREEN_WIDTH - (GRID_COLUMN_COUNT + 1) * GRID_MARGIN * 2) / GRID_COLUMN_COUNT;
// Константа для высоты карточки
const GRID_CARD_HEIGHT = 230;

// Мемоизированный компонент карточки товара
const ProductCard = memo(({ item, onPress }: { item: ProductItem; onPress: () => void }) => (
    <TouchableOpacity style={styles.productCard} onPress={onPress}>
        <View style={styles.discountBadge}>
            <Text style={styles.discountText}>-{item.discount}%</Text>
        </View>
        <View style={styles.imageContainer}>
            <View style={styles.imagePlaceholder}></View>
        </View>
        <Text style={styles.productName} numberOfLines={2}>{item.name}</Text>
        <View style={styles.priceRow}>
            <Text style={styles.productPrice}>${item.price}</Text>
            <Text style={styles.oldPrice}>${item.oldPrice}</Text>
        </View>
    </TouchableOpacity>
));

// Мемоизированный компонент карточки статьи
const ArticleCard = memo(({ item, onPress }: { item: ArticleItem; onPress: () => void }) => (
    <TouchableOpacity style={styles.articleCard} onPress={onPress}>
        <Text style={styles.articleTitle}>{item.title}</Text>
        <Text style={styles.articlePreview}>{item.preview}</Text>
    </TouchableOpacity>
));

export default function MainScreen() {
    const router = useRouter();
    const [popular, setPopular] = useState<ProductItem[]>(mockProducts.slice(0, 6));
    const [articles, setArticles] = useState<ArticleItem[]>([]);

    useEffect(() => {
        // Здесь будет fetch с /blog, пока моки
        setArticles(mockArticles);
    }, []);

    // Мемоизируем обработчики нажатий
    const handleProductPress = useCallback((id: string) => {
        router.replace(`/product/${id}`);
    }, [router]);

    const handleTimerPress = useCallback(() => {
        router.replace('/timer' as any);
    }, [router]);

    const handleArticlePress = useCallback((id: string) => {
        router.replace(`/blog/${id}` as any);
    }, [router]);

    // Мемоизированные рендеры для FlatList
    const renderProduct = useCallback(({ item }: { item: ProductItem }) => (
        <ProductCard
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

    // getItemLayout для оптимизации FlatList
    const getProductItemLayout = useCallback((data: any, index: number) => ({
        length: GRID_CARD_HEIGHT,
        offset: GRID_CARD_HEIGHT * index,
        index,
    }), []);

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#f5f5f5' }}>
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
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
                <Text style={styles.sectionTitle}>Популярные товары</Text>
                <FlatList
                    data={popular}
                    renderItem={renderProduct}
                    keyExtractor={item => item.id}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ paddingHorizontal: 8, gap: 8 }}
                    nestedScrollEnabled={true}
                    removeClippedSubviews={true}
                    initialNumToRender={4}
                    maxToRenderPerBatch={4}
                    getItemLayout={getProductItemLayout}
                />
                <Text style={styles.sectionTitle}>Статьи</Text>
                <FlatList
                    data={articles}
                    renderItem={renderArticle}
                    keyExtractor={item => item.id}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ paddingHorizontal: 8, gap: 8 }}
                    nestedScrollEnabled={true}
                    removeClippedSubviews={true}
                    initialNumToRender={3}
                    maxToRenderPerBatch={3}
                />

                {/* Add extra content to demonstrate scrolling */}
                <View style={styles.extraContent}>
                    <Text style={styles.sectionTitle}>Рекомендуемые товары</Text>
                    <FlatList
                        data={mockProducts.slice(6, 11)}
                        renderItem={renderProduct}
                        keyExtractor={item => item.id}
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={{ paddingHorizontal: 8, gap: 8 }}
                        nestedScrollEnabled={true}
                        removeClippedSubviews={true}
                        initialNumToRender={4}
                        maxToRenderPerBatch={4}
                        getItemLayout={getProductItemLayout}
                    />
                </View>
            </ScrollView>
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
    productCard: {
        backgroundColor: '#fff',
        borderRadius: 8,
        padding: 8,
        width: GRID_CARD_WIDTH,
        marginHorizontal: GRID_MARGIN,
        borderWidth: 1,
        borderColor: '#e0e0e0',
        height: GRID_CARD_HEIGHT - 20, // Учитываем padding и margin
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
    imagePlaceholder: {
        width: '100%',
        height: '100%',
        backgroundColor: '#f0f0f0',
    },
    productName: {
        fontSize: 13,
        color: '#333',
        marginBottom: 4,
        height: 36,
    },
    priceRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    productPrice: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#333',
    },
    oldPrice: {
        fontSize: 12,
        color: '#999',
        textDecorationLine: 'line-through',
        marginLeft: 6,
    },
    articleCard: {
        backgroundColor: '#fff',
        borderRadius: 8,
        padding: 12,
        width: GRID_CARD_WIDTH * 1.5, // Немного шире, чем карточка товара
        marginHorizontal: GRID_MARGIN,
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    articleTitle: { fontSize: 15, fontWeight: 'bold', color: '#1976d2' },
    articlePreview: { fontSize: 13, color: '#555', marginTop: 4 },
    bigTimerBtn: {
        width: '92%',
        alignSelf: 'center',
        marginTop: 18,
        marginBottom: 10,
        borderRadius: 22,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#3a9db5',
        height: Dimensions.get('window').height / 4.2,
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
    extraContent: {
        marginTop: 20,
        marginBottom: 30,
    },
}); 