import React, { memo } from 'react';
import {
    TouchableOpacity,
    Text,
    StyleSheet,
    ActivityIndicator,
    ViewStyle,
    TextStyle
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface AddToCartButtonProps {
    onPress: () => void;
    title?: string;
    loading?: boolean;
    disabled?: boolean;
    style?: ViewStyle;
    textStyle?: TextStyle;
    showIcon?: boolean;
    size?: 'small' | 'medium' | 'large';
}

const AddToCartButton = ({
    onPress,
    title = 'Добавить в корзину',
    loading = false,
    disabled = false,
    style,
    textStyle,
    showIcon = true,
    size = 'medium'
}: AddToCartButtonProps) => {

    // Вычисляем размеры на основе заданного размера кнопки
    const buttonSizes = {
        small: {
            paddingVertical: 6,
            paddingHorizontal: 12,
            fontSize: 14,
            iconSize: 16
        },
        medium: {
            paddingVertical: 10,
            paddingHorizontal: 16,
            fontSize: 16,
            iconSize: 18
        },
        large: {
            paddingVertical: 14,
            paddingHorizontal: 20,
            fontSize: 16,
            iconSize: 20
        }
    };

    const currentSize = buttonSizes[size];

    return (
        <TouchableOpacity
            style={[
                styles.button,
                {
                    paddingVertical: currentSize.paddingVertical,
                    paddingHorizontal: currentSize.paddingHorizontal
                },
                disabled && styles.disabled,
                style
            ]}
            onPress={onPress}
            disabled={disabled || loading}
            activeOpacity={0.7}
        >
            {loading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
                <>
                    {showIcon && (
                        <Ionicons
                            name="cart"
                            size={currentSize.iconSize}
                            color="#FFFFFF"
                            style={styles.icon}
                        />
                    )}
                    <Text
                        style={[
                            styles.text,
                            { fontSize: currentSize.fontSize },
                            textStyle
                        ]}
                    >
                        {title}
                    </Text>
                </>
            )}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    button: {
        backgroundColor: '#1976d2',
        borderRadius: 8,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 1.5,
        elevation: 2,
    },
    disabled: {
        backgroundColor: '#90CAF9',
        elevation: 0,
        shadowOpacity: 0,
    },
    text: {
        color: '#FFFFFF',
        fontWeight: '600',
    },
    icon: {
        marginRight: 8,
    }
});

export default memo(AddToCartButton); 