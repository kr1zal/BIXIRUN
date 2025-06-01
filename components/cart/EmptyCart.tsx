import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

interface EmptyCartProps {
    onStartShopping: () => void;
}

const EmptyCart = ({ onStartShopping }: EmptyCartProps) => {
    return (
        <View style={styles.container}>
            <Ionicons name="cart-outline" size={80} color="#BDBDBD" style={styles.icon} />
            <Text style={styles.title}>Ваша корзина пуста</Text>
            <Text style={styles.subtitle}>
                Добавьте товары в корзину, чтобы оформить заказ
            </Text>
            <TouchableOpacity
                style={styles.button}
                onPress={onStartShopping}
            >
                <Text style={styles.buttonText}>Начать покупки</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    icon: {
        marginBottom: 24,
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#424242',
        marginBottom: 12,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 16,
        color: '#757575',
        marginBottom: 24,
        textAlign: 'center',
        lineHeight: 22,
    },
    button: {
        backgroundColor: '#1976d2',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 8,
    },
    buttonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
});

export default EmptyCart; 