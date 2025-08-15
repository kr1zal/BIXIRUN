import React, { useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';

type ParamRowProps = {
    icon: string;
    label: string;
    value: number;
    onChange: (v: number) => void;
    desc?: string;
    onDescChange?: (v: string) => void;
    min?: number;
    max?: number;
};

/**
 * Компонент строки параметра таймера с кнопками +/- и описанием
 */
const ParamRow = React.memo(({
    icon,
    label,
    value,
    onChange,
    desc = '',
    onDescChange,
    min = 0,
    max = 999
}: ParamRowProps) => {
    const handleIncrease = useCallback(() => onChange(Math.min(max, value + 1)), [value, onChange, max]);
    const handleDecrease = useCallback(() => onChange(Math.max(min, value - 1)), [value, onChange, min]);
    const handleDescChange = useCallback((text: string) => onDescChange && onDescChange(text), [onDescChange]);

    return (
        <View style={styles.paramRow}>
            <Text style={styles.icon}>{icon}</Text>
            <View style={{ flex: 1 }}>
                <Text style={styles.label}>{label}</Text>
                {onDescChange && (
                    <TextInput
                        style={styles.descInput}
                        placeholder="Добавить описание"
                        value={desc}
                        onChangeText={handleDescChange}
                        editable={!!onDescChange}
                    />
                )}
            </View>
            <TouchableOpacity onPress={handleDecrease} style={styles.pmBtn}>
                <Text style={styles.pmText}>-</Text>
            </TouchableOpacity>
            <Text style={styles.value}>{value}</Text>
            <TouchableOpacity onPress={handleIncrease} style={styles.pmBtn}>
                <Text style={styles.pmText}>+</Text>
            </TouchableOpacity>
        </View>
    );
});

const styles = StyleSheet.create({
    paramRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        backgroundColor: '#FFFFFF',
        padding: 12,
        borderRadius: 8,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 1.5,
    },
    icon: {
        fontSize: 24,
        marginRight: 12,
        width: 30,
        textAlign: 'center',
    },
    label: {
        fontSize: 16,
        fontWeight: '500',
        color: '#333',
    },
    value: {
        fontSize: 18,
        fontWeight: 'bold',
        width: 40,
        textAlign: 'center',
    },
    pmBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#f0f0f0',
        alignItems: 'center',
        justifyContent: 'center',
        marginHorizontal: 8,
    },
    pmText: {
        fontSize: 24,
        color: '#555',
        fontWeight: 'bold',
        lineHeight: 24,
    },
    descInput: {
        marginTop: 4,
        fontSize: 14,
        color: '#666',
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
        padding: 2,
    },
});

export default ParamRow; 