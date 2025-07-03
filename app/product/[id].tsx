import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { RootState } from '../store';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { addToCart, removeFromCart, updateQuantity } from '../store/slices/cartSlice';

// Импортируем UI компоненты
import AddToCartButton from '../../components/ui/AddToCartButton';
import ProductImageGallery from '../../components/ui/ProductImageGallery';
import ProductTabs from '../../components/ui/ProductTabs';
import QuantitySelector from '../../components/ui/QuantitySelector';

export default function ProductDetails() {
    const { id } = useLocalSearchParams();
    const [localQuantity, setLocalQuantity] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();
    const dispatch = useAppDispatch();
    const [activeIndex, setActiveIndex] = useState(0);
    const [galleryHeight, setGalleryHeight] = useState(0);

    // Получаем товар из Redux по id
    const productId = Array.isArray(id) ? id[0] : id || '';
    const rawProduct = useAppSelector((state: RootState) =>
        state.products.items.find((p: any) => p.id === productId)
    );
    // Деструктурируем с дефолтами, чтобы не было ошибок типов
    const {
        images = [],
        name = '',
        price = 0,
        old_price = null,
        discount = null,
        description = '',
        specs = {}
    } = rawProduct || {};

    // Получаем состояние корзины (для проверки, есть ли уже товар в корзине)
    const cartItems = useAppSelector((state: RootState) => state.cart.items);
    const cartItem = cartItems.find((item: any) => item.product.id === productId);
    const isInCart = !!cartItem;
    const cartQuantity = cartItem?.quantity || 0;

    // Обработчик изменения количества
    const handleQuantityChange = useCallback((value: number) => {
        if (isInCart) {
            if (value <= 0) {
                dispatch(removeFromCart(productId));
            } else {
                dispatch(updateQuantity({ productId, quantity: value }));
            }
        } else {
            setLocalQuantity(value);
        }
    }, [isInCart, dispatch, productId]);

    // Обработчик добавления в корзину
    const handleAddToCart = useCallback(() => {
        if (!rawProduct) return;
        setIsLoading(true);
        setTimeout(() => {
            dispatch(addToCart({
                product: {
                    id: rawProduct.id,
                    name: rawProduct.name,
                    price: rawProduct.price,
                    old_price: rawProduct.old_price,
                    discount: rawProduct.discount,
                    images: rawProduct.images
                },
                quantity: localQuantity
            }));
            setIsLoading(false);
            Alert.alert(
                "Товар добавлен",
                `${rawProduct.name} успешно добавлен в корзину`,
                [
                    { text: "Продолжить покупки", style: "cancel" },
                    { text: "Перейти в корзину", onPress: () => router.replace('/cart') }
                ]
            );
        }, 800);
    }, [dispatch, rawProduct, localQuantity, router]);

    // Обработчик перехода в корзину
    const handleGoToCart = useCallback(() => {
        router.replace('/cart');
    }, [router]);

    if (!rawProduct) {
        return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <Text>Товар не найден</Text>
        </View>;
    }

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
            {/* Кнопка назад */}
            <TouchableOpacity
                style={styles.backButton}
                onPress={() => router.back()}
                activeOpacity={0.7}
            >
                <Ionicons name="arrow-back" size={24} color="#1976d2" />
                <Text style={styles.backText}>Назад</Text>
            </TouchableOpacity>

            {/* Галерея изображений */}
            <View style={styles.galleryContainer}>
                <ProductImageGallery images={images} />
            </View>
            {/* Информация о товаре */}
            <View style={[styles.productInfo, { marginTop: galleryHeight ? 12 : 0 }]}>
                <Text style={styles.name}>{name}</Text>
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
                {/* Секция добавления в корзину */}
                <View style={styles.addToCartSection}>
                    <QuantitySelector
                        value={isInCart ? cartQuantity : localQuantity}
                        onChange={handleQuantityChange}
                        min={1}
                        max={99}
                        style={styles.quantitySelector}
                    />
                    {isInCart ? (
                        <AddToCartButton
                            title="Перейти в корзину"
                            onPress={handleGoToCart}
                            showIcon={false}
                            style={styles.goToCartButton}
                        />
                    ) : (
                        <AddToCartButton
                            onPress={handleAddToCart}
                            loading={isLoading}
                            style={styles.addToCartButton}
                        />
                    )}
                </View>
            </View>
            {/* Табы с информацией о продукте */}
            <ProductTabs
                description={description}
                specifications={specs}
                reviews={[]}
            />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff'
    },
    scrollContent: {
        paddingBottom: 48,
        paddingHorizontal: 16,
    },
    galleryContainer: {
        marginTop: 32,
        width: '100%',
        marginBottom: 0,
    },
    productInfo: {
        padding: 16,
        marginTop: 48,
    },
    name: {
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 12,
        color: '#212121'
    },
    priceContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    price: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1976d2',
        marginRight: 8,
    },
    oldPrice: {
        fontSize: 16,
        color: '#9E9E9E',
        textDecorationLine: 'line-through',
        marginRight: 8,
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
    addToCartSection: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    quantitySelector: {
        marginRight: 16,
        width: 120,
    },
    addToCartButton: {
        flex: 1,
    },
    goToCartButton: {
        flex: 1,
        backgroundColor: '#66BB6A',
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
    activeThumb: {
        borderColor: '#1976d2',
    },
    thumbnail: {
        width: '100%',
        height: '100%',
    },
    thumbnailsContent: {
        paddingHorizontal: 4,
    },
    backButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
    },
    backText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1976d2',
        marginLeft: 8,
    },
}); 