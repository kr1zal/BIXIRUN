import React, { useCallback, useMemo } from 'react';
import { View, FlatList, StyleSheet, Text, Alert, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Stack } from 'expo-router';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../src/store';
import {
    removeFromCart,
    updateQuantity,
    selectCartTotal,
    selectCartItemsCount,
    clearCart
} from '../src/store/slices/cartSlice';
import { Ionicons } from '@expo/vector-icons';

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
        <View style={styles.container}>
            <Stack.Screen
                options={{
                    title: 'Корзина',
                    headerBackTitle: 'Назад',
                    headerRight: !isCartEmpty ? () => (
                        <TouchableOpacity
                            onPress={handleClearCart}
                            style={styles.clearButton}
                        >
                            <Ionicons name="trash-outline" size={18} color="#FF5252" />
                            <Text style={styles.clearButtonText}>Очистить</Text>
                        </TouchableOpacity>
                    ) : undefined
                }}
            />

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
        flex: 1,
        backgroundColor: '#F5F5F5',
    },
    listContent: {
        padding: 16,
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