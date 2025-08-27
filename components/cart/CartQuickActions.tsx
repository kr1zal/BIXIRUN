import { Ionicons } from '@expo/vector-icons';
import React, { memo, useCallback } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useCart } from '../../hooks/useCart';

/**
 * ✅ ВЫСОКОПРОИЗВОДИТЕЛЬНЫЙ КОМПОНЕНТ ДЛЯ БЫСТРЫХ ДЕЙСТВИЙ
 * Мемоизирован для предотвращения лишних ререндеров
 */
const CartQuickActions = memo(() => {
    const {
        cartSummary,
        allItemsSelected,
        toggleSelectAll,
        clearCart
    } = useCart();

    const handleToggleSelectAll = useCallback(() => {
        toggleSelectAll(!allItemsSelected);
    }, [toggleSelectAll, allItemsSelected]);

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

    return (
        <View style={styles.container}>
            <View style={styles.leftSection}>
                <TouchableOpacity
                    style={styles.selectAllButton}
                    onPress={handleToggleSelectAll}
                >
                    <Ionicons
                        name={allItemsSelected ? "checkbox" : "square-outline"}
                        size={22}
                        color={allItemsSelected ? "#1976d2" : "#8D8D8D"}
                    />
                    <Text style={styles.selectAllText}>
                        {allItemsSelected ? "Убрать все" : "Выбрать все"}
                    </Text>
                </TouchableOpacity>

                <Text style={styles.selectedInfo}>
                    {cartSummary.selectedItemsCount} из {cartSummary.itemCount} выбрано
                </Text>
            </View>

            <TouchableOpacity
                style={styles.clearButton}
                onPress={handleClearCart}
            >
                <Ionicons name="trash-outline" size={18} color="#FF5252" />
                <Text style={styles.clearButtonText}>Очистить</Text>
            </TouchableOpacity>
        </View>
    );
});

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    leftSection: {
        flex: 1,
    },
    selectAllButton: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    selectAllText: {
        marginLeft: 8,
        fontSize: 16,
        fontWeight: '500',
        color: '#212121',
    },
    selectedInfo: {
        fontSize: 12,
        color: '#757575',
        marginLeft: 30,
    },
    clearButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 8,
        borderRadius: 6,
        backgroundColor: '#FFF5F5',
    },
    clearButtonText: {
        color: '#FF5252',
        fontSize: 14,
        marginLeft: 4,
        fontWeight: '500',
    },
});

CartQuickActions.displayName = 'CartQuickActions';

export default CartQuickActions; 