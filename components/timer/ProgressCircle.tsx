import React from 'react';
import { View, Text } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

type ProgressCircleProps = {
    progress: number;
    size?: number;
    stroke?: number;
    color?: string;
    showPercentage?: boolean;
};

/**
 * Круговой индикатор прогресса
 * @param progress Значение прогресса от 0 до 1
 * @param size Размер компонента
 * @param stroke Толщина линии
 * @param color Цвет активной линии
 * @param showPercentage Показывать ли процент в центре
 */
const ProgressCircle = React.memo(({
    progress,
    size = 120,
    stroke = 10,
    color = '#1976d2',
    showPercentage = true
}: ProgressCircleProps) => {
    const radius = (size - stroke) / 2;
    const circ = 2 * Math.PI * radius;
    const dash = circ * progress;

    return (
        <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
            <View style={{ position: 'absolute' }}>
                <Svg width={size} height={size}>
                    <Circle
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        stroke="#ececec"
                        strokeWidth={stroke}
                        fill="none"
                    />
                    <Circle
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        stroke={color}
                        strokeWidth={stroke}
                        fill="none"
                        strokeDasharray={`${dash},${circ - dash}`}
                        strokeLinecap="round"
                    />
                </Svg>
            </View>
            {showPercentage && (
                <Text style={{ fontSize: 32, fontWeight: 'bold', color }}>
                    {Math.ceil(progress * 100)}%
                </Text>
            )}
        </View>
    );
});

export default ProgressCircle; 