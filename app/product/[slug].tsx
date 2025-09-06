import { Feather, Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback } from 'react';
import { Alert, ScrollView, Share, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { RootState } from '../../store';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { addToCart, removeFromCart, updateQuantity } from '../../store/slices/cartSlice';

// Импортируем UI компоненты
import ProductImageGallery from '../../components/ui/ProductImageGallery';
import ProductTabs from '../../components/ui/ProductTabs';
import StickyProductActions from '../../components/ui/StickyProductActions';

export default function ProductDetails() {
    const { slug } = useLocalSearchParams(); // Получаем slug из URL
    const router = useRouter();
    const dispatch = useAppDispatch();
    const insets = useSafeAreaInsets(); // Получаем отступы безопасной зоны

    // Получаем товар из Redux по slug
    const productSlug = Array.isArray(slug) ? slug[0] : slug || '';
    const rawProduct = useAppSelector((state: RootState) =>
        state.products.items.find((p: any) => p.slug === productSlug)
    );
    // Деструктурируем с дефолтами, чтобы не было ошибок типов
    const {
        id: productId, // Переименовываем id в productId для остального кода
        images = [],
        name = '',
        price = 0,
        old_price = null,
        discount = null,
        description = '',
        specs = {}
    } = rawProduct || {};

    const handleShare = useCallback(async () => {
        if (!slug) return;
        try {
            const productUrl = `https://bixirun.com/product/${slug}`;
            await Share.share({
                message: `Посмотри, какой товар я нашел в BIXIRUN: ${name}\n${productUrl}`,
                url: productUrl, // для iOS
                title: `Поделиться ${name}` // для Android
            });
        } catch (error: any) {
            Alert.alert('Ошибка', 'Не удалось поделиться товаром.');
        }
    }, [slug, name]);

    // Получаем состояние корзины
    const cartItems = useAppSelector((state: RootState) => state.cart.items);
    const cartItem = cartItems.find((item: any) => item.product.id === productId);
    const cartQuantity = cartItem?.quantity || 0;

    // Обработчик изменения количества в корзине
    const handleQuantityChange = useCallback((value: number) => {
        if (!productId) return; // Добавляем проверку
        if (value <= 0) {
            dispatch(removeFromCart(productId));
        } else {
            dispatch(updateQuantity({ productId, quantity: value }));
        }
    }, [dispatch, productId]);

    // Обработчик добавления в корзину
    const handleAddToCart = useCallback(() => {
        if (rawProduct) {
            dispatch(addToCart({ product: rawProduct, quantity: 1 }));
        }
    }, [dispatch, rawProduct]);

    // ВОЗВРАЩАЕМ ЛОГИКУ КНОПКИ "КУПИТЬ СЕЙЧАС"
    const handleBuyNow = useCallback(() => {
        if (!rawProduct) return;
        if (cartQuantity === 0) {
            dispatch(addToCart({ product: rawProduct, quantity: 1 }));
        }
        Alert.alert(
            "Быстрая покупка",
            "Функция быстрого оформления заказа в разработке",
            [{ text: "OK" }]
        );
    }, [dispatch, rawProduct, cartQuantity]);


    // Обработчик для алерта (пример)
    const handleInfoPress = () => {
        Alert.alert('Информация о товаре', 'Здесь может быть дополнительная информация о товаре.');
    };

    if (!rawProduct) {
        return (
            <SafeAreaView style={styles.container}>
                <Text>Товар не найден.</Text>
            </SafeAreaView>
        );
    }

    return (
        <View style={styles.container}>
            <SafeAreaView style={{ backgroundColor: '#F5F5F5' }} edges={['top']}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/products')} style={styles.headerBack}>
                        <Ionicons name="arrow-back" size={24} color="#000" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle} numberOfLines={1}>{name}</Text>
                    <TouchableOpacity onPress={handleShare} style={styles.headerAction}>
                        <Feather name="share" size={24} color="#000" />
                    </TouchableOpacity>
                </View>
            </SafeAreaView>

            <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
                <View style={styles.productCard}>
                    {/* Галерея изображений */}
                    <View style={styles.galleryContainer}>
                        <ProductImageGallery images={images} />
                    </View>

                    {/* Информация о товаре */}
                    <View style={styles.productInfo}>
                        <View style={styles.priceContainer}>
                            <Text style={styles.price}>{price} ₽</Text>
                            {old_price && (
                                <Text style={styles.oldPrice}>{old_price} ₽</Text>
                            )}
                            {price && old_price && discount && (
                                <View style={styles.discountBadge}>
                                    <Text style={styles.discountText}>-{discount}%</Text>
                                </View>
                            )}
                        </View>
                    </View>
                </View>
                {/* ВОЗВРАЩАЕМ ОБЕРТКУ ДЛЯ ТАБОВ */}
                <View style={styles.productCard}>
                    <ProductTabs description={description} specs={specs} />
                </View>
            </ScrollView>

            {/* Липкий блок с кнопками */}
            <StickyProductActions
                cartQuantity={cartQuantity}
                onQuantityChange={handleQuantityChange}
                onAddToCart={handleAddToCart}
                onBuyNow={handleBuyNow}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F5F5',
    },
    // СТИЛИ ДЛЯ ХЕДЕРА
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingBottom: 8,
        backgroundColor: '#F5F5F5',
        borderBottomColor: '#E0E0E0',
        borderBottomWidth: 1,
    },
    headerBack: {
        padding: 4,
    },
    headerTitle: {
        flex: 1,
        textAlign: 'center',
        fontSize: 18,
        fontWeight: '600',
        color: '#000',
        marginHorizontal: 12,
    },
    headerAction: {
        padding: 4,
    },
    //
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 160,
    },
    productCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        marginHorizontal: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
        overflow: 'hidden',
        marginTop: 8,
    },
    galleryContainer: {
        width: '100%',
    },
    productInfo: {
        padding: 16,
        paddingTop: 8, // Уменьшаем отступ сверху, т.к. имя убрали
    },
    priceContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    price: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1976d2',
        marginRight: 8,
    },
    oldPrice: {
        fontSize: 16,
        color: '#e74c3c', // КРАСНЫЙ ЦВЕТ
        textDecorationLine: 'line-through',
        marginLeft: 8,
    },
    discountBadge: {
        backgroundColor: '#FF5252',
        borderRadius: 4,
        paddingHorizontal: 6,
        paddingVertical: 2,
    },
    discountText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: 'bold',
    },
}); 