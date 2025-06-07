import React, { useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import ProgressCircle from './ProgressCircle';

type TimerDisplayProps = {
    time: string; // Formatted time string (MM:SS)
    phase: string;
    phaseColor: string;
    progress: number;
    progressText: string;
    description?: string;
    onPause?: () => void;
    onResume?: () => void;
    onNext?: () => void;
    onReset?: () => void;
    running: boolean;
    isFinished: boolean;
};

/**
 * Компонент отображения таймера с кнопками управления
 */
const TimerDisplay = React.memo(({
    time,
    phase,
    phaseColor,
    progress,
    progressText,
    description,
    onPause,
    onResume,
    onNext,
    onReset,
    running,
    isFinished
}: TimerDisplayProps) => {
    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={[styles.phase, { color: phaseColor }]}>{phase}</Text>
                <Text style={styles.progress}>{progressText}</Text>
            </View>

            <View style={styles.display}>
                <Text style={styles.time}>{time}</Text>
                <ProgressCircle
                    progress={progress}
                    size={240}
                    color={phaseColor}
                />
            </View>

            {description && (
                <View style={styles.description}>
                    <Text style={styles.descText}>{description}</Text>
                </View>
            )}

            <View style={styles.controls}>
                {!isFinished && (
                    <>
                        {running ? (
                            <TouchableOpacity
                                style={[styles.button, styles.pauseButton]}
                                onPress={onPause}
                            >
                                <Text style={styles.buttonText}>Пауза</Text>
                            </TouchableOpacity>
                        ) : (
                            <TouchableOpacity
                                style={[styles.button, styles.resumeButton]}
                                onPress={onResume}
                            >
                                <Text style={styles.buttonText}>Продолжить</Text>
                            </TouchableOpacity>
                        )}

                        <TouchableOpacity
                            style={[styles.button, styles.nextButton]}
                            onPress={onNext}
                        >
                            <Text style={styles.buttonText}>Следующий</Text>
                        </TouchableOpacity>
                    </>
                )}

                <TouchableOpacity
                    style={[styles.button, styles.resetButton]}
                    onPress={onReset}
                >
                    <Text style={styles.buttonText}>
                        {isFinished ? 'Начать заново' : 'Сбросить'}
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
});

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 20,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
        marginHorizontal: 16,
        marginTop: 16,
    },
    header: {
        alignItems: 'center',
        marginBottom: 16,
    },
    phase: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    progress: {
        fontSize: 16,
        color: '#666',
    },
    display: {
        alignItems: 'center',
        marginBottom: 24,
    },
    time: {
        fontSize: 48,
        fontWeight: 'bold',
        fontVariant: ['tabular-nums'],
        marginBottom: 16,
    },
    description: {
        backgroundColor: '#f5f5f5',
        padding: 12,
        borderRadius: 8,
        marginBottom: 24,
    },
    descText: {
        fontSize: 16,
        color: '#555',
        textAlign: 'center',
    },
    controls: {
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    button: {
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
        marginHorizontal: 4,
    },
    pauseButton: {
        backgroundColor: '#f57c00',
    },
    resumeButton: {
        backgroundColor: '#4caf50',
    },
    nextButton: {
        backgroundColor: '#2196f3',
    },
    resetButton: {
        backgroundColor: '#9e9e9e',
    },
    buttonText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
});

export default TimerDisplay; 