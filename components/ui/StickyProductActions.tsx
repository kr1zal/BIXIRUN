import { Ionicons } from '@expo/vector-icons';
import React, { memo, useCallback, useState } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface StickyProductActionsProps {
    onAddToCart: () => void;
    onBuyNow: () => void;
    onQuantityChange: (value: number) => void;
    cartQuantity: number;
    disabled?: boolean;
}

const StickyProductActions = memo(({
    onAddToCart,
    onBuyNow,
    onQuantityChange,
    cartQuantity,
    disabled = false
}: StickyProductActionsProps) => {
    const insets = useSafeAreaInsets();
    const [scaleAnim] = useState(new Animated.Value(1));

    // Проверяем, есть ли товар в корзине
    const isInCart = cartQuantity > 0;

    // Обработчики для количества
    const handleDecrease = useCallback(() => {
        if (cartQuantity > 0) {
            onQuantityChange(cartQuantity - 1);
        }
    }, [cartQuantity, onQuantityChange]);

    const handleIncrease = useCallback(() => {
        if (cartQuantity < 99) {
            onQuantityChange(cartQuantity + 1);
        }
    }, [cartQuantity, onQuantityChange]);

    // Обработчик с анимацией для добавления в корзину
    const handleAddToCartWithAnimation = useCallback(() => {
        // Микроанимация нажатия
        Animated.sequence([
            Animated.timing(scaleAnim, { toValue: 0.95, duration: 100, useNativeDriver: true }),
            Animated.timing(scaleAnim, { toValue: 1, duration: 100, useNativeDriver: true }),
        ]).start();

        onAddToCart();
    }, [onAddToCart, scaleAnim]);

    // Вычисляем корректную позицию bottom
    // Держим блок действий выше кастомного таббара: 72px + безопасная зона
    const _bottomPosition = insets.bottom + 80; // +8

    return (
        // Используем вычисленное значение для `bottom`
        <View style={[styles.container, { bottom: insets.bottom + 47 }]}>
            <View style={styles.actionsSection}>
                {/* Кнопка "Купить сейчас" */}
                <TouchableOpacity
                    style={[styles.buyNowButton, disabled && styles.disabledButton]}
                    onPress={onBuyNow}
                    disabled={disabled}
                    activeOpacity={0.8}
                >
                    <Text style={[styles.buyNowText, disabled && styles.disabledText]}>
                        Купить сейчас
                    </Text>
                </TouchableOpacity>

                {/* Правая секция: кнопка "В корзину" или селектор количества */}
                <View style={styles.rightSection}>
                    {isInCart ? (
                        // Селектор количества, если товар в корзине
                        <View style={styles.quantitySelector}>
                            <TouchableOpacity
                                style={styles.quantityButton}
                                onPress={handleDecrease}
                            >
                                <Ionicons
                                    name="remove"
                                    size={18}
                                    color="#1976d2"
                                />
                            </TouchableOpacity>

                            <View style={styles.quantityValueContainer}>
                                <Text style={styles.quantityValue}>{cartQuantity}</Text>
                            </View>

                            <TouchableOpacity
                                style={styles.quantityButton}
                                onPress={handleIncrease}
                                disabled={cartQuantity >= 99}
                            >
                                <Ionicons
                                    name="add"
                                    size={18}
                                    color={cartQuantity >= 99 ? '#BDBDBD' : '#1976d2'}
                                />
                            </TouchableOpacity>
                        </View>
                    ) : (
                        // Кнопка "В корзину", если товара нет в корзине
                        <Animated.View style={[{ flex: 1, transform: [{ scale: scaleAnim }] }]}>
                            <TouchableOpacity
                                style={[styles.addToCartButton, disabled && styles.disabledButton]}
                                onPress={handleAddToCartWithAnimation}
                                disabled={disabled}
                                activeOpacity={0.8}
                            >
                                <Ionicons
                                    name="cart"
                                    size={18}
                                    color="#FFFFFF"
                                />
                                <Text style={[styles.addToCartText, disabled && styles.disabledText]}>
                                    В корзину
                                </Text>
                            </TouchableOpacity>
                        </Animated.View>
                    )}
                </View>
            </View>
        </View>
    );
});

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        left: 0,
        right: 0,
        // `bottom` выставляем динамически из компонента, а здесь тяним белый фон до таббара
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 15,
        borderTopRightRadius: 15,
        padding: 12,
        // Добавляем paddingBottom, чтобы контент не прилипал к низу на Android
        paddingBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 10,
        zIndex: 1000,
    },
    actionsSection: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    buyNowButton: {
        backgroundColor: '#FF6B35',
        borderRadius: 8,
        paddingHorizontal: 16,
        paddingVertical: 12,
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        height: 45,
    },
    buyNowText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    rightSection: {
        flex: 1,
        // alignItems: 'stretch', // Убираем, так как flex будет на дочерних элементах
    },
    quantitySelector: {
        flex: 1, // Добавляем flex: 1
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E0E0E0',
        borderRadius: 8,
        overflow: 'hidden',
        height: 45,
        backgroundColor: '#FFFFFF',
    },
    quantityButton: {
        width: 45,
        height: 45,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F5F5F5',
    },
    quantityValueContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        minHeight: 45,
    },
    quantityValue: {
        fontSize: 16,
        fontWeight: '600',
        color: '#212121',
    },
    addToCartButton: {
        flex: 1, // Добавляем flex: 1
        backgroundColor: '#1976d2',
        borderRadius: 8,
        paddingHorizontal: 16,
        paddingVertical: 12,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        height: 45,
        position: 'relative',
    },
    addToCartText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 8,
    },
    disabledButton: {
        backgroundColor: '#BDBDBD',
        opacity: 0.6,
    },
    disabledText: {
        color: '#9E9E9E',
    },
});

export default StickyProductActions; 