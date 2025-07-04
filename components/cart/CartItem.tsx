import { Ionicons } from '@expo/vector-icons';
import React, { memo, useCallback } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { CartItem as CartItemType } from '../../app/store/slices/cartSlice';
import OptimizedImage from '../ui/OptimizedImage';
import QuantitySelector from '../ui/QuantitySelector';

interface CartItemProps {
    item: CartItemType;
    onRemove: (productId: string) => void;
    onUpdateQuantity: (productId: string, quantity: number) => void;
}

const CartItem = ({ item, onRemove, onUpdateQuantity }: CartItemProps) => {
    const { product, quantity } = item;
    const totalPrice = (parseFloat(product.price) * quantity).toFixed(2);

    // Мемоизируем обработчик обновления количества
    const handleQuantityChange = useCallback((newQuantity: number) => {
        onUpdateQuantity(product.id, newQuantity);
    }, [product.id, onUpdateQuantity]);

    // Мемоизируем обработчик удаления товара
    const handleRemove = useCallback(() => {
        onRemove(product.id);
    }, [product.id, onRemove]);

    // Рендер действия удаления при свайпе
    const renderRightActions = useCallback((progress: Animated.AnimatedInterpolation<number>) => {
        const trans = progress.interpolate({
            inputRange: [0, 1],
            outputRange: [80, 0],
        });

        return (
            <Animated.View
                style={[
                    styles.deleteAction,
                    {
                        transform: [{ translateX: trans }],
                    },
                ]}
            >
                <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={handleRemove}
                >
                    <Ionicons name="trash" size={22} color="#FFFFFF" />
                    <Text style={styles.deleteText}>Удалить</Text>
                </TouchableOpacity>
            </Animated.View>
        );
    }, [handleRemove]);

    return (
        <Swipeable
            renderRightActions={renderRightActions}
            friction={2}
            rightThreshold={40}
        >
            <View style={styles.container}>
                {/* Изображение товара */}
                <View style={styles.imageContainer}>
                    <OptimizedImage
                        source={{ uri: item.product.images?.[0] || '' }}
                        style={styles.image}
                        contentFit="cover"
                        priority="normal"
                    />
                </View>

                {/* Информация о товаре */}
                <View style={styles.infoContainer}>
                    <Text style={styles.productName} numberOfLines={1} ellipsizeMode="tail">{product.name}</Text>
                    <Text style={styles.productPrice}>{product.price} ₽</Text>

                    <View style={styles.actionsContainer}>
                        {/* Селектор количества */}
                        <QuantitySelector
                            value={quantity}
                            onChange={handleQuantityChange}
                            min={1}
                            max={99}
                            style={styles.quantitySelector}
                        />

                        {/* Кнопка удаления */}
                        <TouchableOpacity
                            style={styles.removeButton}
                            onPress={handleRemove}
                        >
                            <Ionicons name="trash-outline" size={18} color="#FF5252" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Общая стоимость товара */}
                <View style={styles.totalContainer}>
                    <Text style={styles.totalPrice}>{totalPrice} ₽</Text>
                </View>
            </View>
        </Swipeable>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        padding: 12,
        backgroundColor: '#FFFFFF',
        borderRadius: 8,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    imageContainer: {
        width: 90,
        height: 90,
        marginRight: 12,
    },
    image: {
        width: 90,
        height: 90,
        borderRadius: 4,
    },
    infoContainer: {
        flex: 1,
        marginRight: 12,
    },
    productName: {
        fontSize: 16,
        fontWeight: '500',
        color: '#212121',
        marginBottom: 4,
    },
    productPrice: {
        fontSize: 14,
        color: '#1976d2',
        fontWeight: 'bold',
        marginBottom: 8,
    },
    actionsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        minWidth: 140,
        maxWidth: 160,
        justifyContent: 'space-between',
    },
    quantitySelector: {
        height: 36,
        maxWidth: 120,
    },
    removeButton: {
        padding: 8,
        marginLeft: 8,
    },
    totalContainer: {
        justifyContent: 'center',
        alignItems: 'flex-end',
        minWidth: 70,
    },
    totalPrice: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#212121',
    },
    deleteAction: {
        backgroundColor: '#FF5252',
        justifyContent: 'center',
        alignItems: 'center',
        width: 80,
        borderTopRightRadius: 8,
        borderBottomRightRadius: 8,
        alignSelf: 'center',
        paddingTop: 4,
        paddingBottom: 2,
    },
    deleteButton: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
    },
    deleteText: {
        color: '#FFFFFF',
        fontSize: 12,
        marginTop: 4,
    },
});

export default memo(CartItem); 