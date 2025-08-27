import { Ionicons } from '@expo/vector-icons';
import Checkbox from 'expo-checkbox';
import React, { memo, useCallback } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { CartItem as CartItemType } from '../../store/slices/cartSlice';
import OptimizedImage from '../ui/OptimizedImage';
import QuantitySelector from '../ui/QuantitySelector';

interface CartItemProps {
    item: CartItemType;
    onRemove: (productId: string) => void;
    onUpdateQuantity: (productId: string, quantity: number) => void;
    onToggleSelect: (productId: string) => void; // Добавлено
}

const CartItem = ({ item, onRemove, onUpdateQuantity, onToggleSelect }: CartItemProps) => {
    const { product, quantity, selected } = item; // Достаем selected
    const totalPrice = Math.round(parseFloat(product.price) * quantity);

    // Мемоизируем обработчик обновления количества
    const handleQuantityChange = useCallback((newQuantity: number) => {
        onUpdateQuantity(product.id, newQuantity);
    }, [product.id, onUpdateQuantity]);

    // Мемоизируем обработчик удаления товара
    const handleRemove = useCallback(() => {
        onRemove(product.id);
    }, [product.id, onRemove]);

    const handleToggleSelect = useCallback(() => {
        onToggleSelect(product.id);
    }, [product.id, onToggleSelect]);

    return (
        <View style={[styles.container, !selected && styles.containerDisabled]}>
            <View style={styles.leftContainer}>
                {/* Изображение товара с чекбоксом поверх */}
                <View style={styles.imageWrapper}>
                    <OptimizedImage
                        source={{ uri: item.product.images?.[0] || '' }}
                        style={styles.image}
                        contentFit="cover"
                        priority="normal"
                    />
                    <View style={[
                        styles.checkboxOverlay,
                        // 1. Фон теперь полностью совпадает с фоном карточки
                        { backgroundColor: selected ? '#FFFFFF' : '#F5F5F5' }
                    ]}>
                        <Checkbox
                            value={selected}
                            onValueChange={handleToggleSelect}
                            color={selected ? '#1976d2' : '#8D8D8D'} // Цвет самого чекбокса для контраста
                            style={styles.checkbox}
                        />
                    </View>
                </View>

                {/* Информация о товаре и управление */}
                <View style={styles.infoContainer}>
                    <Text style={styles.productName} numberOfLines={1} ellipsizeMode="tail">{product.name}</Text>
                    <View style={styles.priceContainer}>
                        <Text style={styles.productPrice}>{Math.round(parseFloat(product.price))} ₽ / шт.</Text>
                        {product.old_price && (
                            <Text style={styles.oldProductPrice}>{Math.round(parseFloat(product.old_price))} ₽</Text>
                        )}
                    </View>
                    <View style={styles.controlsRow}>
                        <QuantitySelector
                            value={quantity}
                            onChange={handleQuantityChange}
                            min={1}
                            max={99}
                        />
                        <TouchableOpacity
                            style={styles.removeButton}
                            onPress={handleRemove}
                        >
                            <Ionicons name="trash-outline" size={20} color="#8D8D8D" />
                        </TouchableOpacity>
                    </View>
                </View>
            </View>

            {/* Общая стоимость товара */}
            <View style={styles.totalContainer}>
                <Text style={styles.totalPrice}>{totalPrice} ₽</Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start', // Выравниваем по верху для лучшего вида
        padding: 12,
        backgroundColor: 'transparent', // Фон теперь прозрачный, так как он на родительском контейнере
        borderBottomWidth: 1, // Добавляем разделитель между товарами
        borderBottomColor: '#F0F0F0', // Цвет разделителя
        marginHorizontal: 4, // Небольшой внутренний отступ
    },
    containerDisabled: {
        backgroundColor: 'rgba(245, 245, 245, 0.5)', // Слегка затемняем, но оставляем прозрачность
    },
    leftContainer: {
        flexDirection: 'row',
        flex: 1, // Занимает доступное пространство слева
    },
    imageWrapper: {
        width: 80,
        height: 80,
        marginRight: 12,
        position: 'relative',
    },
    image: {
        width: '100%',
        height: '100%',
        borderRadius: 4,
    },
    checkboxOverlay: {
        position: 'absolute',
        top: -1,  // Сдвигаем вверх на 1px
        left: -1, // Сдвигаем влево на 1px
        zIndex: 1,
        padding: 3.3, // Уменьшаем фон на 0.7px
        borderTopLeftRadius: 4,
        borderBottomRightRadius: 8,
        shadowColor: "#000",
        shadowOffset: { width: 1, height: 1 },
        shadowOpacity: 0.15,
        shadowRadius: 1.5,
        elevation: 2,
    },
    checkbox: {
        width: 22,
        height: 22,
        borderRadius: 6,
    },
    infoContainer: {
        flex: 1,
        justifyContent: 'space-between', // Распределяем контент по вертикали
    },
    productName: {
        fontSize: 16,
        fontWeight: '500',
        color: '#212121',
        marginBottom: 4,
    },
    priceContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    productPrice: {
        fontSize: 14,
        color: '#212121', // Сделаем текущую цену более заметной
        fontWeight: '500',
    },
    oldProductPrice: {
        fontSize: 13,
        color: '#e74c3c', // КРАСНЫЙ ЦВЕТ
        textDecorationLine: 'line-through',
        marginLeft: 8,
    },
    controlsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 'auto', // Прижимаем к низу
    },
    removeButton: {
        padding: 8,
        marginLeft: 16, // Отступ от селектора
    },
    totalContainer: {
        justifyContent: 'flex-start',
        alignItems: 'flex-end',
        paddingTop: 4, // Небольшой отступ сверху для выравнивания
    },
    totalPrice: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#212121',
    },
});

export default memo(CartItem); 