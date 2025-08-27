import React, { useCallback, useRef, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Modal, FlatList, ViewToken, Animated, Easing, Platform } from 'react-native';

type ParamRowProps = {
    icon: string;
    label: string;
    value: number;
    onChange: (v: number) => void;
    desc?: string;
    onDescChange?: (v: string) => void;
    min?: number;
    max?: number;
    pickerTitle?: string; // Текст заголовка в барабане (если нужен отдельный от label)
};

/**
 * Компонент строки параметра таймера с кнопками +/- и описанием
 */
const HIT_SLOP_LARGE = { top: 10, bottom: 10, left: 10, right: 10 } as const;
const WHEEL_ITEM_HEIGHT = 44;

const ParamRow = React.memo(({
    icon,
    label,
    value,
    onChange,
    desc = '',
    onDescChange,
    min = 0,
    max = 999,
    pickerTitle
}: ParamRowProps) => {
    const handleIncrease = useCallback(() => onChange(Math.min(max, value + 1)), [value, onChange, max]);
    const handleDecrease = useCallback(() => onChange(Math.max(min, value - 1)), [value, onChange, min]);
    const handleDescChange = useCallback((text: string) => onDescChange && onDescChange(text), [onDescChange]);

    // Поддержка авто-удержания для +/−
    const holdTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const holdIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const currentValueRef = useRef<number>(value);

    // Синхронизируем актуальное значение в рефе, чтобы избежать «застывшего» value в замыкании
    useEffect(() => {
        currentValueRef.current = value;
    }, [value]);

    const stopHold = useCallback(() => {
        if (holdTimeoutRef.current) {
            clearTimeout(holdTimeoutRef.current);
            holdTimeoutRef.current = null;
        }
        if (holdIntervalRef.current) {
            clearInterval(holdIntervalRef.current);
            holdIntervalRef.current = null;
        }
    }, []);

    const startHold = useCallback((mode: 'inc' | 'dec') => {
        // Небольшая задержка, чтобы короткий тап не запускал авто-прокрутку
        holdTimeoutRef.current = setTimeout(() => {
            holdIntervalRef.current = setInterval(() => {
                if (mode === 'inc') {
                    const next = Math.min(max, currentValueRef.current + 1);
                    if (next !== currentValueRef.current) {
                        currentValueRef.current = next;
                        onChange(next);
                    }
                } else {
                    const next = Math.max(min, currentValueRef.current - 1);
                    if (next !== currentValueRef.current) {
                        currentValueRef.current = next;
                        onChange(next);
                    }
                }
            }, 100);
        }, 350);
    }, [max, min, onChange]);

    useEffect(() => {
        return () => stopHold();
    }, [stopHold]);

    // Анимации для ± (scale) и pressed-state фон/бордер
    const decScale = useRef(new Animated.Value(1)).current;
    const incScale = useRef(new Animated.Value(1)).current;
    const AnimatedTouchable = useMemo(() => Animated.createAnimatedComponent(TouchableOpacity), []);
    const [decPressed, setDecPressed] = useState(false);
    const [incPressed, setIncPressed] = useState(false);

    const animateIn = useCallback((val: Animated.Value) => {
        Animated.timing(val, {
            toValue: 0.93,
            duration: 90,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
        }).start();
    }, []);

    const animateOut = useCallback((val: Animated.Value) => {
        Animated.spring(val, {
            toValue: 1,
            velocity: 0.5,
            bounciness: 8,
            useNativeDriver: true,
        }).start();
    }, []);

    // Анимация «плашки» строки (лёгкий пульс)
    const rowScale = useRef(new Animated.Value(1)).current;
    const [rowPressed, setRowPressed] = useState(false);
    const pulseRowIn = useCallback(() => {
        setRowPressed(true);
        Animated.timing(rowScale, {
            toValue: 0.995,
            duration: 90,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
        }).start();
    }, [rowScale]);
    const pulseRowOut = useCallback(() => {
        setRowPressed(false);
        Animated.spring(rowScale, {
            toValue: 1,
            velocity: 0.4,
            bounciness: 6,
            useNativeDriver: true,
        }).start();
    }, [rowScale]);

    // Барабан-пикер по долгому тапу на значении
    const [pickerVisible, setPickerVisible] = useState(false);
    const [candidate, setCandidate] = useState<number>(value);
    const items = useMemo(() => {
        const length = Math.max(0, max - min + 1);
        return Array.from({ length }, (_, i) => min + i);
    }, [min, max]);
    const listRef = useRef<FlatList<number> | null>(null);

    const openPicker = useCallback(() => {
        setCandidate(value);
        setPickerVisible(true);
        // Прокрутка к текущему значению после кадра
        setTimeout(() => {
            try {
                const index = Math.min(items.length - 1, Math.max(0, value - min));
                listRef.current?.scrollToIndex({ index, animated: false });
            } catch (_e) {
                // ignore scroll error (index out of range)
            }
        }, 0);
    }, [value, min, items.length]);

    const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
        if (!viewableItems || viewableItems.length === 0) return;
        // Ищем ближайший к центру элемент
        const centerItem = viewableItems.reduce((prev, cur) => {
            const p = Math.abs(((prev as any)?.index ?? 0) - ((listRef.current as any)?._scrollMetrics?.offset ?? 0) / WHEEL_ITEM_HEIGHT);
            const c = Math.abs(((cur as any)?.index ?? 0) - ((listRef.current as any)?._scrollMetrics?.offset ?? 0) / WHEEL_ITEM_HEIGHT);
            return c < p ? cur : prev;
        }, viewableItems[0]);
        const idx = (centerItem as any)?.index ?? 0;
        const next = items[Math.min(items.length - 1, Math.max(0, idx))];
        if (typeof next === 'number') setCandidate(next);
    }).current;

    const handleConfirmPicker = useCallback(() => {
        onChange(candidate);
        setPickerVisible(false);
    }, [candidate, onChange]);

    const handleCancelPicker = useCallback(() => {
        setPickerVisible(false);
    }, []);

    return (
        <Animated.View style={[styles.paramRow, rowPressed && styles.paramRowPressed, { transform: [{ scale: rowScale }] }]}>
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
            <AnimatedTouchable
                onPress={handleDecrease}
                onPressIn={() => { startHold('dec'); setDecPressed(true); animateIn(decScale); pulseRowIn(); }}
                onPressOut={() => { stopHold(); setDecPressed(false); animateOut(decScale); pulseRowOut(); }}
                style={[styles.pmBtn, decPressed && styles.pmBtnPressed, { transform: [{ scale: decScale }] }]}
                hitSlop={HIT_SLOP_LARGE}
                activeOpacity={1}
            >
                <Text style={[styles.pmText, decPressed && styles.pmTextPressed]}>-</Text>
            </AnimatedTouchable>
            <TouchableOpacity onLongPress={openPicker} activeOpacity={0.6}>
                <Text style={styles.value}>{value}</Text>
            </TouchableOpacity>
            <AnimatedTouchable
                onPress={handleIncrease}
                onPressIn={() => { startHold('inc'); setIncPressed(true); animateIn(incScale); pulseRowIn(); }}
                onPressOut={() => { stopHold(); setIncPressed(false); animateOut(incScale); pulseRowOut(); }}
                style={[styles.pmBtn, incPressed && styles.pmBtnPressed, { transform: [{ scale: incScale }] }]}
                hitSlop={HIT_SLOP_LARGE}
                activeOpacity={1}
            >
                <Text style={[styles.pmText, incPressed && styles.pmTextPressed]}>+</Text>
            </AnimatedTouchable>

            {/* Модальное окно барабана */}
            <Modal visible={pickerVisible} transparent animationType="fade" onRequestClose={handleCancelPicker}>
                <View style={styles.pickerOverlay}>
                    <View style={styles.pickerCard}>
                        <Text style={styles.pickerTitle}>{pickerTitle ?? label}</Text>
                        <View style={styles.wheelContainer}>
                            <FlatList
                                ref={(r) => (listRef.current = r as any)}
                                data={items}
                                keyExtractor={(n) => String(n)}
                                renderItem={({ item }) => (
                                    <View style={styles.wheelItem}><Text style={styles.wheelItemText}>{item}</Text></View>
                                )}
                                getItemLayout={(_, index) => ({ length: WHEEL_ITEM_HEIGHT, offset: WHEEL_ITEM_HEIGHT * index, index })}
                                snapToInterval={WHEEL_ITEM_HEIGHT}
                                decelerationRate="fast"
                                showsVerticalScrollIndicator={false}
                                onMomentumScrollEnd={(e) => {
                                    const idx = Math.round(e.nativeEvent.contentOffset.y / WHEEL_ITEM_HEIGHT);
                                    const next = items[Math.min(items.length - 1, Math.max(0, idx))];
                                    setCandidate(next);
                                }}
                                onViewableItemsChanged={onViewableItemsChanged}
                                viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
                                contentContainerStyle={{ paddingVertical: WHEEL_ITEM_HEIGHT * 2 }}
                            />
                            <View pointerEvents="none" style={styles.wheelHighlight} />
                        </View>
                        <View style={styles.pickerActions}>
                            <TouchableOpacity style={[styles.pickerBtn, styles.pickerCancel]} onPress={handleCancelPicker}>
                                <Text style={styles.pickerBtnText}>Отмена</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.pickerBtn, styles.pickerConfirm]} onPress={handleConfirmPicker}>
                                <Text style={[styles.pickerBtnText, styles.pickerConfirmText]}>Выбрать</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </Animated.View>
    );
});

const styles = StyleSheet.create({
    paramRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
        backgroundColor: '#FFFFFF',
        padding: 12,
        borderRadius: 8,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.08,
                shadowRadius: 1.5,
            },
            android: {
                elevation: 1,
            }
        })
    },
    paramRowPressed: {
        backgroundColor: '#f8f9ff',
        ...Platform.select({
            ios: {
                shadowOpacity: 0.16,
                shadowRadius: 2,
            },
            android: {
                elevation: 2,
            }
        })
    },
    icon: {
        fontSize: 30,
        marginRight: 12,
        width: 30,
        textAlign: 'center',
    },
    label: {
        fontSize: 18,
        fontWeight: '500',
        color: '#333',
    },
    value: {
        fontSize: 22,
        fontWeight: 'bold',
        width: 56,
        textAlign: 'center',
    },
    pmBtn: {
        width: 60,
        height: 60,
        borderRadius: 16,
        backgroundColor: 'transparent',
        borderWidth: 3,
        borderColor: '#3b5bd6',
        alignItems: 'center',
        justifyContent: 'center',
        marginHorizontal: 8,
        ...Platform.select({
            ios: {
                shadowColor: '#3b5bd6',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.15,
                shadowRadius: 3,
            },
            android: {
                elevation: 2,
            }
        })
    },
    pmBtnPressed: {
        backgroundColor: '#eef2ff',
        borderColor: '#2f49c8',
        ...Platform.select({
            ios: {
                shadowOpacity: 0.25,
                shadowRadius: 4,
            },
            android: {
                elevation: 3,
            }
        })
    },
    pmText: {
        fontSize: 32,
        color: '#555',
        fontWeight: 'bold',
        lineHeight: 32,
        textAlign: 'center',
    },
    pmTextPressed: {
        color: '#2f49c8',
    },
    pickerOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    pickerCard: {
        width: '100%',
        borderRadius: 12,
        backgroundColor: '#fff',
        padding: 16,
    },
    pickerTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 12,
        textAlign: 'center',
    },
    wheelContainer: {
        height: WHEEL_ITEM_HEIGHT * 5,
        overflow: 'hidden',
        position: 'relative',
    },
    wheelItem: {
        height: WHEEL_ITEM_HEIGHT,
        justifyContent: 'center',
        alignItems: 'center',
    },
    wheelItemText: {
        fontSize: 18,
        color: '#333',
    },
    wheelHighlight: {
        position: 'absolute',
        left: 0,
        right: 0,
        top: WHEEL_ITEM_HEIGHT * 2,
        height: WHEEL_ITEM_HEIGHT,
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: '#ddd',
        backgroundColor: 'rgba(0,0,0,0.04)'
    },
    pickerActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 12,
    },
    pickerBtn: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    pickerCancel: {
        backgroundColor: '#f5f5f5',
        marginRight: 8,
    },
    pickerConfirm: {
        backgroundColor: '#3b5bd6',
        marginLeft: 8,
    },
    pickerBtnText: {
        fontSize: 16,
        color: '#333',
        fontWeight: '600',
    },
    pickerConfirmText: {
        color: '#fff',
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