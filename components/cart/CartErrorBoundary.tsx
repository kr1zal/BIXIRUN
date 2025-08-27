import { Ionicons } from '@expo/vector-icons';
import React, { memo, useCallback } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';

/**
 * ✅ КОМПОНЕНТ ДЛЯ ОБРАБОТКИ СОСТОЯНИЙ ЗАГРУЗКИ И ОШИБОК
 */
const CartStatusHandler = memo(() => {
    const { isLoading, error } = useSelector((state: RootState) => state.cart);

    const handleRetry = useCallback(() => {
        // Логика повторной попытки загрузки
    }, []);

    if (isLoading) {
        return (
            <View style={styles.statusContainer}>
                <ActivityIndicator size="large" color="#1976d2" />
                <Text style={styles.statusText}>Загрузка корзины...</Text>
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.statusContainer}>
                <Ionicons name="alert-circle-outline" size={48} color="#FF5252" />
                <Text style={styles.errorTitle}>Ошибка загрузки</Text>
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity
                    style={styles.retryButton}
                    onPress={handleRetry}
                >
                    <Ionicons name="refresh" size={20} color="#FFFFFF" />
                    <Text style={styles.retryButtonText}>Повторить</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return null;
});

/**
 * ✅ ОБЁРТКА ДЛЯ ОТОБРАЖЕНИЯ СОСТОЯНИЙ КОРЗИНЫ
 */
interface CartStateWrapperProps {
    children: React.ReactNode;
}

const CartStateWrapper = memo(({ children }: CartStateWrapperProps) => {
    const { isLoading, error } = useSelector((state: RootState) => state.cart);

    if (isLoading || error) {
        return <CartStatusHandler />;
    }

    return <>{children}</>;
});

const styles = StyleSheet.create({
    statusContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
        backgroundColor: '#FFFFFF',
    },
    statusText: {
        fontSize: 16,
        color: '#757575',
        marginTop: 16,
        textAlign: 'center',
    },
    errorTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#FF5252',
        marginTop: 16,
        textAlign: 'center',
    },
    errorText: {
        fontSize: 14,
        color: '#757575',
        marginTop: 8,
        textAlign: 'center',
        lineHeight: 20,
    },
    retryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1976d2',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 8,
        marginTop: 16,
    },
    retryButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 8,
    },
});

CartStatusHandler.displayName = 'CartStatusHandler';
CartStateWrapper.displayName = 'CartStateWrapper';

export default CartStateWrapper; 