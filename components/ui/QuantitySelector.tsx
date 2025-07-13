import React, { useCallback, memo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface QuantitySelectorProps {
    value: number;
    onChange: (value: number) => void;
    min?: number;
    max?: number;
    style?: any;
}

const QuantitySelector = ({
    value,
    onChange,
    min = 1,
    max = 99,
    style
}: QuantitySelectorProps) => {

    // Мемоизированные обработчики для уменьшения и увеличения количества
    const handleDecrease = useCallback(() => {
        if (value > min) {
            onChange(value - 1);
        }
    }, [value, min, onChange]);

    const handleIncrease = useCallback(() => {
        if (value < max) {
            onChange(value + 1);
        }
    }, [value, max, onChange]);

    return (
        <View style={[styles.container, style]}>
            <TouchableOpacity
                style={[styles.button, value <= min && styles.buttonDisabled]}
                onPress={handleDecrease}
                disabled={value <= min}
            >
                <Ionicons name="remove" size={20} color={value <= min ? '#BDBDBD' : '#1976d2'} />
            </TouchableOpacity>

            <View style={styles.valueContainer}>
                <Text style={styles.value}>{value}</Text>
            </View>

            <TouchableOpacity
                style={[styles.button, value >= max && styles.buttonDisabled]}
                onPress={handleIncrease}
                disabled={value >= max}
            >
                <Ionicons name="add" size={20} color={value >= max ? '#BDBDBD' : '#1976d2'} />
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E0E0E0',
        borderRadius: 8,
        overflow: 'hidden',
        height: 40,
    },
    button: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F5F5F5',
    },
    buttonDisabled: {
        backgroundColor: '#EEEEEE',
    },
    valueContainer: {
        minWidth: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
    },
    value: {
        fontSize: 16,
        fontWeight: '500',
        color: '#212121',
    },
});

// Используем мемоизацию для предотвращения лишних ререндеров
export default memo(QuantitySelector); 