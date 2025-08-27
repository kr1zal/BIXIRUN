import { Ionicons } from '@expo/vector-icons';
import Checkbox from 'expo-checkbox';
import { useRouter } from 'expo-router';
import React, { useCallback, useMemo } from 'react';
import { Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

// ✅ ЗАМЕНЯЕМ МНОЖЕСТВЕННЫЕ СЕЛЕКТОРЫ НА ОПТИМИЗИРОВАННЫЙ ХУК
import { useCart } from '../hooks/useCart';
import { CartItem as CartItemType } from '../store/slices/cartSlice';

// Импортируем компоненты
import CartItem from '../components/cart/CartItem';
import CartSummary from '../components/cart/CartSummary';
import EmptyCart from '../components/cart/EmptyCart';

export default function CartScreen() {
    const router = useRouter();

    // ✅ ИСПОЛЬЗУЕМ ОПТИМИЗИРОВАННЫЙ ХУК ВМЕСТО МНОЖЕСТВЕННЫХ СЕЛЕКТОРОВ
    const {
        cartItems,
        isEmpty,
        allItemsSelected,
        cartSummary,
        removeFromCart,
        updateQuantity,
        toggleItemSelected,
        toggleSelectAll,
        clearCart,
    } = useCart();

    // Обработчики для компонентов - теперь используем методы из хука
    const handleRemoveItem = useCallback((productId: string) => {
        removeFromCart(productId);
    }, [removeFromCart]);

    const handleUpdateQuantity = useCallback((productId: string, quantity: number) => {
        updateQuantity(productId, quantity);
    }, [updateQuantity]);

    const handleToggleItem = useCallback((productId: string) => {
        toggleItemSelected(productId);
    }, [toggleItemSelected]);

    const handleToggleSelectAll = useCallback(() => {
        toggleSelectAll(!allItemsSelected);
    }, [toggleSelectAll, allItemsSelected]);

    const handleCheckout = useCallback(() => {
        // Переход на экран оформления заказа (моки YooKassa)
        router.push('/checkout' as never);
    }, [router]);

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
                    onPress: () => clearCart(),
                    style: "destructive"
                }
            ]
        );
    }, [clearCart]);

    // Мемоизируем рендер-функцию для FlatList, чтобы избежать лишних перерисовок
    const renderItem = useCallback(({ item }: { item: CartItemType }) => (
        <CartItem
            item={item}
            onRemove={handleRemoveItem}
            onUpdateQuantity={handleUpdateQuantity}
            onToggleSelect={handleToggleItem}
        />
    ), [handleRemoveItem, handleUpdateQuantity, handleToggleItem]);

    // Мемоизируем keyExtractor для стабильности
    const keyExtractor = useCallback((item: CartItemType) => item.product.id, []);

    // ✅ ОПТИМИЗАЦИИ FLATLIST ДЛЯ ПРОИЗВОДИТЕЛЬНОСТИ
    // Фиксированная высота элементов для getItemLayout
    const ITEM_HEIGHT = 108; // Высота CartItem (padding + content)

    // Мемоизируем getItemLayout для виртуализации
    const getItemLayout = useCallback((_data: unknown, index: number) => ({
        length: ITEM_HEIGHT,
        offset: ITEM_HEIGHT * index,
        index,
    }), []);

    // Дополнительные оптимизации для FlatList
    const flatListOptimizations = useMemo(() => ({
        windowSize: 10,           // Количество экранов для рендеринга
        maxToRenderPerBatch: 5,   // Максимум элементов за один батч
        updateCellsBatchingPeriod: 100, // Интервал обновления в мс
        initialNumToRender: 10,   // Начальное количество элементов
        removeClippedSubviews: true, // Удаляем элементы вне экрана
        scrollEventThrottle: 16,  // Частота событий скролла
    }), []);

    // Типизированная обёртка над expo-checkbox для строгого линтера
    const ExpoCheckboxWrapper: React.FC<{
        value: boolean;
        onValueChange: (value: boolean) => void;
        color?: string;
        style?: unknown;
    }> = (props) => React.createElement(Checkbox as unknown as React.ComponentType<any>, props as any);

    return (
        <View style={[styles.container, { flex: 1, paddingTop: 50, position: 'relative' }]}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Корзина</Text>
            </View>
            {isEmpty ? (
                <EmptyCart onStartShopping={handleStartShopping} />
            ) : (
                <>
                    <View style={styles.listContainer}>
                        <View style={styles.selectAllContainer}>
                            <View style={styles.selectAllCheckbox}>
                                <ExpoCheckboxWrapper
                                    value={allItemsSelected}
                                    onValueChange={handleToggleSelectAll}
                                    color={allItemsSelected ? '#1976d2' : undefined}
                                    style={styles.mainCheckbox} // Применяем стиль для скругления
                                />
                                <Text style={styles.selectAllText}>Выбрать все</Text>
                            </View>
                            <TouchableOpacity
                                onPress={handleClearCart}
                                style={styles.clearButton}
                            >
                                <Ionicons name="trash-outline" size={18} color="#FF5252" />
                                <Text style={styles.clearButtonText}>Очистить</Text>
                            </TouchableOpacity>
                        </View>
                        <FlatList
                            data={cartItems}
                            keyExtractor={keyExtractor}
                            renderItem={renderItem}
                            contentContainerStyle={styles.listContent}
                            showsVerticalScrollIndicator={false}
                            // ✅ ОПТИМИЗАЦИИ ПРОИЗВОДИТЕЛЬНОСТИ
                            getItemLayout={getItemLayout}
                            {...flatListOptimizations}
                        />
                    </View>

                    {/* CartSummary теперь вне FlatList для "липкого" позиционирования */}
                    <CartSummary
                        originalTotal={cartSummary.originalTotal}
                        discount={cartSummary.discount}
                        total={cartSummary.total}
                        itemCount={cartSummary.itemCount}
                        onCheckout={handleCheckout}
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
    listContainer: {
        flex: 1, // Растягиваем контейнер на всю доступную высоту
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 15, // Скругляем только верхние углы
        borderTopRightRadius: 15,
        marginHorizontal: 8, // Небольшие отступы по бокам для эффекта карточки
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
    },
    listContent: {
        paddingBottom: 180, // Увеличили отступ снизу, чтобы было место для CartSummary
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 16,
        paddingHorizontal: 16,
        backgroundColor: '#F5F5F5', // Фон как у основного контейнера
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    clearButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 8,
    },
    clearButtonText: {
        color: '#FF5252',
        fontSize: 14,
        marginLeft: 4,
        fontWeight: '500',
    },
    selectAllContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 12,
        paddingVertical: 12,
        backgroundColor: 'transparent', // Фон теперь прозрачный
        borderBottomWidth: 1, // Добавляем разделительную линию
        borderBottomColor: '#F0F0F0', // Цвет линии как у товаров
    },
    selectAllCheckbox: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    mainCheckbox: {
        width: 22,
        height: 22,
        borderRadius: 6, // Скругление как у чекбоксов на товарах
    },
    selectAllText: {
        marginLeft: 12,
        fontSize: 16,
        fontWeight: '500',
    },
});

