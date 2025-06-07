import { Ionicons } from '@expo/vector-icons';
import React, { memo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface CartSummaryProps {
    subtotal: string;
    shipping: string;
    tax: string;
    total: string;
    itemCount: number;
    onCheckout: () => void;
}

const CartSummary = ({
    subtotal,
    shipping,
    tax,
    total,
    itemCount,
    onCheckout
}: CartSummaryProps) => {
    return (
        <View style={styles.container}>
            <Text style={styles.title}>Итого</Text>

            {/* Расчет итоговой стоимости */}
            <View style={styles.row}>
                <Text style={styles.label}>Товары ({itemCount})</Text>
                <Text style={styles.value}>{subtotal} ₽</Text>
            </View>

            <View style={styles.row}>
                <Text style={styles.label}>Доставка</Text>
                <Text style={styles.value}>{shipping === '0.00' ? 'Бесплатно' : `${shipping} ₽`}</Text>
            </View>

            <View style={styles.row}>
                <Text style={styles.label}>Налог</Text>
                <Text style={styles.value}>{tax} ₽</Text>
            </View>

            <View style={[styles.row, styles.totalRow]}>
                <Text style={styles.totalLabel}>К оплате</Text>
                <Text style={styles.totalValue}>{total} ₽</Text>
            </View>

            {/* Кнопка оформления заказа */}
            <TouchableOpacity
                style={styles.checkoutButton}
                onPress={onCheckout}
                disabled={itemCount === 0}
            >
                <Ionicons name="card-outline" size={20} color="#FFFFFF" style={styles.icon} />
                <Text style={styles.checkoutButtonText}>Оформить заказ</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#FFFFFF',
        borderRadius: 8,
        padding: 16,
        marginTop: 16,
        marginBottom: 100, // Оставляем место для нижнего меню
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#212121',
        marginBottom: 16,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    label: {
        fontSize: 14,
        color: '#757575',
    },
    value: {
        fontSize: 14,
        color: '#212121',
        fontWeight: '500',
    },
    totalRow: {
        marginTop: 8,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#EEEEEE',
    },
    totalLabel: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#212121',
    },
    totalValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1976d2',
    },
    checkoutButton: {
        backgroundColor: '#1976d2',
        borderRadius: 8,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 12,
        marginTop: 16,
    },
    checkoutButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    icon: {
        marginRight: 8,
    }
});

export default memo(CartSummary); 