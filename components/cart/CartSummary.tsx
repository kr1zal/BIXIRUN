import React, { memo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface CartSummaryProps {
    originalTotal: number;
    discount: number;
    total: number;
    itemCount: number;
    onCheckout: () => void;
}

const CartSummary = memo(({
    originalTotal,
    discount,
    total,
    itemCount,
    onCheckout
}: CartSummaryProps) => {
    return (
        <View style={styles.container}>
            <View style={styles.detailsContainer}>
                <View style={{ transform: [{ translateY: 1.5 }] }}>
                    <View style={styles.row}>
                        <Text style={styles.label}>Товары ({itemCount})</Text>
                        <Text style={styles.value}>{originalTotal} ₽</Text>
                    </View>
                    {discount > 0 && (
                        <View style={styles.row}>
                            <Text style={styles.label}>Скидка</Text>
                            <Text style={[styles.value, styles.discountValue]}>-{discount} ₽</Text>
                        </View>
                    )}
                </View>
                <View style={[styles.row, styles.totalRow]}>
                    <Text style={styles.totalLabel}>К оплате</Text>
                    <Text style={styles.totalValue}>{total} ₽</Text>
                </View>
            </View>

            <TouchableOpacity
                style={styles.checkoutButton}
                onPress={onCheckout}
                disabled={itemCount === 0}
            >
                <Text style={styles.checkoutButtonText}>Оформить</Text>
            </TouchableOpacity>
        </View>
    );
});

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: 76, // опускаем ещё на 3px
        left: 0,
        right: 0,
        backgroundColor: '#FFFFFF',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderTopLeftRadius: 15,
        borderTopRightRadius: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 10,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    detailsContainer: {
        flex: 1,
        marginRight: 12,
        transform: [{ translateY: -6.7 }], // Сдвигаем вниз на 4px
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 0.7, // Устанавливаем отступ в 0.7px
    },
    label: {
        fontSize: 12, // Уменьшаем шрифт
        color: '#757575',
    },
    value: {
        fontSize: 12, // Уменьшаем шрифт
        color: '#212121',
        fontWeight: '500',
    },
    discountValue: {
        color: '#4CAF50', // Зеленый цвет для скидки
    },
    totalRow: {
        marginBottom: 0, // Обнуляем нижний отступ для последней строки
    },
    totalLabel: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#212121',
    },
    totalValue: {
        fontSize: 16, // Уменьшаем, чтобы соответствовать кнопке
        fontWeight: 'bold',
        color: '#212121',
    },
    checkoutButton: {
        backgroundColor: '#1976d2',
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        alignSelf: 'flex-end',
        transform: [{ translateY: -9 }], // Сдвигаем вниз на 4px для центровки
    },
    checkoutButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
});

export default CartSummary; 