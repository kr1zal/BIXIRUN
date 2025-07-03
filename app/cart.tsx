import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useMemo } from 'react';
import { Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../app/store';
import {
    clearCart,
    removeFromCart,
    selectCartItemsCount,
    selectCartTotal,
    updateQuantity
} from './store/slices/cartSlice';

// Импортируем компоненты
import CartItem from '../components/cart/CartItem';
import CartSummary from '../components/cart/CartSummary';
import EmptyCart from '../components/cart/EmptyCart';

export default function CartScreen() {
    const router = useRouter();
    const dispatch = useDispatch();

    // Получаем данные из Redux
    const cartItems = useSelector((state: RootState) => state.cart.items);
    const cartTotal = useSelector(selectCartTotal);
    const itemCount = useSelector(selectCartItemsCount);

    // Проверяем, пуста ли корзина
    const isCartEmpty = cartItems.length === 0;

    // Мемоизированные значения для CartSummary
    const summaryData = useMemo(() => {
        const subtotal = cartTotal;
        const tax = (parseFloat(subtotal) * 0.05).toFixed(2); // 5% налог
        const shipping = itemCount >= 3 || parseFloat(subtotal) > 50 ? '0.00' : '5.00';
        const total = (parseFloat(subtotal) + parseFloat(tax) + parseFloat(shipping)).toFixed(2);

        return { subtotal, tax, shipping, total };
    }, [cartTotal, itemCount]);

    // Обработчики для компонентов
    const handleRemoveItem = useCallback((productId: string) => {
        dispatch(removeFromCart(productId));
    }, [dispatch]);

    const handleUpdateQuantity = useCallback((productId: string, quantity: number) => {
        dispatch(updateQuantity({ productId, quantity }));
    }, [dispatch]);

    const handleCheckout = useCallback(() => {
        Alert.alert(
            "Оформление заказа",
            "Функция оформления заказа в разработке",
            [{ text: "OK" }]
        );
    }, []);

    const handleStartShopping = useCallback(() => {
        router.replace('/products');
    }, [router]);

    // Обработчик очистки корзины
    const handleClearCart = useCallback(() => {
        Alert.alert(
            "Очистить корзину",
            "Вы уверены, что хотите удалить все товары из корзины?",
            [
                { text: "Отмена", style: "cancel" },
                {
                    text: "Очистить",
                    onPress: () => dispatch(clearCart()),
                    style: "destructive"
                }
            ]
        );
    }, [dispatch]);

    return (
        <View style={[styles.container, { flex: 1, paddingTop: 50, paddingBottom: 80, position: 'relative' }]}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Корзина</Text>
                {!isCartEmpty && (
                    <TouchableOpacity
                        onPress={handleClearCart}
                        style={styles.clearButton}
                    >
                        <Ionicons name="trash-outline" size={18} color="#FF5252" />
                        <Text style={styles.clearButtonText}>Очистить</Text>
                    </TouchableOpacity>
                )}
            </View>
            {isCartEmpty ? (
                <EmptyCart onStartShopping={handleStartShopping} />
            ) : (
                <>
                    <FlatList
                        data={cartItems}
                        keyExtractor={(item) => item.product.id}
                        renderItem={({ item }) => (
                            <CartItem
                                item={item}
                                onRemove={handleRemoveItem}
                                onUpdateQuantity={handleUpdateQuantity}
                            />
                        )}
                        contentContainerStyle={styles.listContent}
                        showsVerticalScrollIndicator={false}
                        style={{ flex: 1 }}
                        ListFooterComponent={
                            <CartSummary
                                subtotal={summaryData.subtotal}
                                shipping={summaryData.shipping}
                                tax={summaryData.tax}
                                total={summaryData.total}
                                itemCount={itemCount}
                                onCheckout={handleCheckout}
                            />
                        }
                    />
                </>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#F5F5F5',
        overflow: 'visible',
    },
    listContent: {
        padding: 16,
        paddingTop: 20,
        paddingBottom: 100,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    clearButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
    },
    clearButtonText: {
        color: '#FF5252',
        fontSize: 14,
        marginLeft: 4,
    },
});

