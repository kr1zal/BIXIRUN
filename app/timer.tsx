import { RootState } from '@/app/store';
import { useAppDispatch, useAppSelector } from '@/app/store/hooks';
import {
    decrementSeconds,
    nextPhase,
    pauseTimer,
    resetTimer,
    setCycles,
    setDescRest,
    setDescWork,
    setPrep,
    setRest,
    setRestBetweenSets,
    setSets,
    setWork,
    startTimer,
    toggleAuto
} from '@/app/store/slices/timerSlice';
import { Audio } from 'expo-av';
import { Stack, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, Vibration, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Импорт наших новых компонентов
import ParamRow from '@/components/timer/ParamRow';
import TimerPresetSelector, { TimerPreset } from '@/components/timer/TimerPresetSelector';

// Импорт функций работы с хранилищем
import {
    addTimerPreset,
    deleteTimerPreset,
    forceSyncWithCloud,
    loadTimerPresets,
    saveLastUsedTimerSettings
} from './utils/timerStorage';

// Импорт функций Supabase
import { getCurrentUser } from './supabaseClient';

const ICONS = [
    '🚶', // preparation
    '🏋️', // work
    '🧘', // rest
    '🔁', // cycles
    '🔄', // sets
    '⏱️', // timer
];

// Custom hook for interval
function useInterval(callback: () => void, delay: number | null) {
    const savedCallback = useRef(callback);

    useEffect(() => {
        savedCallback.current = callback;
    }, [callback]);

    useEffect(() => {
        if (delay !== null) {
            const id = setInterval(() => savedCallback.current(), delay);
            return () => clearInterval(id);
        }
    }, [delay]);
}

export default function TimerScreen() {
    const dispatch = useAppDispatch();
    const timer = useAppSelector((state: RootState) => state.timer);
    const router = useRouter();

    // Состояние для пресетов таймера
    const [presets, setPresets] = useState<TimerPreset[]>([]);
    const [activePresetId, setActivePresetId] = useState<string | undefined>(undefined);
    const [syncing, setSyncing] = useState(false);
    const [user, setUser] = useState<any>(null);

    // Проверяем, авторизован ли пользователь
    useEffect(() => {
        const checkUser = async () => {
            try {
                const currentUser = await getCurrentUser();
                setUser(currentUser);
            } catch (error: any) {
                if (error?.name === 'AuthSessionMissingError' || error?.message?.includes('Auth session missing')) {
                    setUser(null); // Нет сессии — не логируем ошибку
                } else {
                    console.error('Error checking user:', error);
                }
            }
        };

        checkUser();
    }, []);

    // Загрузка пресетов при монтировании
    useEffect(() => {
        const loadPresets = async () => {
            try {
                const savedPresets = await loadTimerPresets();
                setPresets(savedPresets);
            } catch (error) {
                console.error('Failed to load timer presets:', error);
                Alert.alert('Ошибка', 'Не удалось загрузить сохраненные пресеты');
            }
        };

        loadPresets();
    }, []);

    // Сохранение текущих настроек при изменении
    useEffect(() => {
        // Сохраняем только если таймер не запущен и находится в начальной фазе или завершен
        if (!timer.running && (timer.phase === 'prep' || timer.phase === 'done')) {
            const settings = {
                prep: timer.prep,
                work: timer.work,
                rest: timer.rest,
                cycles: timer.cycles,
                sets: timer.sets,
                restBetweenSets: timer.restBetweenSets,
                descWork: timer.descWork,
                descRest: timer.descRest
            };

            saveLastUsedTimerSettings(settings).catch(error => {
                console.error('Failed to save timer settings:', error);
            });
        }
    }, [
        timer.prep,
        timer.work,
        timer.rest,
        timer.cycles,
        timer.sets,
        timer.restBetweenSets,
        timer.descWork,
        timer.descRest,
        timer.running,
        timer.phase
    ]);

    // Timer logic
    useInterval(() => {
        if (timer.running) {
            if (timer.seconds > 0) {
                dispatch(decrementSeconds());
            } else {
                // Move to next phase when current phase is complete
                dispatch(nextPhase());

                // Vibrate when changing phases
                if (Platform.OS === 'ios' || Platform.OS === 'android') {
                    Vibration.vibrate(500);
                }

                // Play sound
                playSound().catch(console.error);
            }
        }
    }, timer.running ? 1000 : null);

    // Function to play sound
    async function playSound() {
        try {
            const { sound } = await Audio.Sound.createAsync(
                require('@/assets/sounds/beep.mp3')
            );
            await sound.playAsync();
        } catch (error) {
            console.error('Error playing sound:', error);
        }
    }

    // Get phase name and color
    function getPhaseInfo() {
        switch (timer.phase) {
            case 'prep': return { name: 'Подготовка', color: '#fb8c00' };
            case 'work': return { name: 'Работа', color: '#e53935' };
            case 'rest': return { name: 'Отдых', color: '#43a047' };
            case 'restSet': return { name: 'Отдых между сетами', color: '#1e88e5' };
            case 'done': return { name: 'Завершено', color: '#8e24aa' };
        }
    }

    // Format time as MM:SS
    function formatTime(secs: number) {
        const minutes = Math.floor(secs / 60);
        const seconds = secs % 60;
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    // Get progress description
    function getProgressText() {
        if (timer.phase === 'done') return 'Тренировка завершена';

        const currentInterval = timer.intervalIdx === 0 ? '' : `Интервал ${timer.intervalIdx}/${timer.cycles}`;
        const currentSet = timer.sets <= 1 ? '' : `Сет ${timer.setIdx + 1}/${timer.sets}`;

        return [currentInterval, currentSet].filter(Boolean).join(' • ');
    }

    // Calculate current progress (0-1)
    function calculateProgress() {
        // Получаем максимальное значение для текущей фазы
        let maxValue = 1;
        switch (timer.phase) {
            case 'prep': maxValue = timer.prep; break;
            case 'work': maxValue = timer.work; break;
            case 'rest': maxValue = timer.rest; break;
            case 'restSet': maxValue = timer.restBetweenSets; break;
            case 'done': return 1; // Если тренировка завершена, прогресс 100%
        }

        // Вычисляем прогресс от 0 до 1
        return timer.seconds / Math.max(1, maxValue);
    }

    // Handle continue/pause
    const handlePlayPause = useCallback(() => {
        if (timer.running) {
            dispatch(pauseTimer());
        } else {
            dispatch(startTimer());
        }
    }, [timer.running, dispatch]);

    // Handle next phase
    const handleNext = useCallback(() => {
        dispatch(nextPhase());
    }, [dispatch]);

    // Handle reset
    const handleReset = useCallback(() => {
        dispatch(resetTimer());
    }, [dispatch]);

    // Обработчик синхронизации пресетов таймера
    const handleSyncPresets = useCallback(async () => {
        try {
            // Если пользователь не авторизован, предлагаем перейти на страницу профиля
            if (!user) {
                Alert.alert(
                    'Синхронизация недоступна',
                    'Для синхронизации пресетов необходимо войти в аккаунт',
                    [
                        {
                            text: 'Отмена',
                            style: 'cancel'
                        },
                        {
                            text: 'Перейти к профилю',
                            onPress: () => {
                                router.replace('/profile');
                            }
                        }
                    ]
                );
                return;
            }

            setSyncing(true);
            const syncedPresets = await forceSyncWithCloud(true);
            setPresets(syncedPresets);
            Alert.alert('Успех', `Синхронизировано ${syncedPresets.length} пресетов`);
        } catch (error) {
            console.error('Failed to sync presets:', error);
            Alert.alert('Ошибка', 'Не удалось синхронизировать пресеты');
        } finally {
            setSyncing(false);
        }
    }, [user]);

    // Обработчики для пресетов
    const handleSelectPreset = useCallback((preset: TimerPreset) => {
        dispatch(setPrep(preset.prep));
        dispatch(setWork(preset.work));
        dispatch(setRest(preset.rest));
        dispatch(setCycles(preset.cycles));
        dispatch(setSets(preset.sets));
        dispatch(setRestBetweenSets(preset.restBetweenSets));

        if (preset.descWork) {
            dispatch(setDescWork(preset.descWork));
        }

        if (preset.descRest) {
            dispatch(setDescRest(preset.descRest));
        }

        setActivePresetId(preset.id);

        // Reset timer if it was running
        if (timer.running || timer.phase !== 'prep') {
            dispatch(resetTimer());
        }
    }, [dispatch, timer.running, timer.phase]);

    const handleSavePreset = useCallback(async (preset: TimerPreset) => {
        try {
            const updatedPresets = await addTimerPreset(preset);
            setPresets(updatedPresets);
            setActivePresetId(preset.id);
            Alert.alert('Успех', 'Пресет сохранен');
        } catch (error) {
            console.error('Failed to save preset:', error);
            Alert.alert('Ошибка', 'Не удалось сохранить пресет');
        }
    }, []);

    const handleDeletePreset = useCallback(async (presetId: string) => {
        try {
            const updatedPresets = await deleteTimerPreset(presetId);
            setPresets(updatedPresets);

            if (activePresetId === presetId) {
                setActivePresetId(undefined);
            }
        } catch (error) {
            console.error('Failed to delete preset:', error);
            Alert.alert('Ошибка', 'Не удалось удалить пресет');
        }
    }, [activePresetId]);

    // Текущие настройки для сохранения пресета
    const currentSettings = {
        prep: timer.prep,
        work: timer.work,
        rest: timer.rest,
        cycles: timer.cycles,
        sets: timer.sets,
        restBetweenSets: timer.restBetweenSets,
        descWork: timer.descWork,
        descRest: timer.descRest
    };

    // Component returned
    const phaseInfo = getPhaseInfo();

    // Определяем текущее описание в зависимости от фазы
    const currentDescription = timer.phase === 'work' ? timer.descWork :
        (timer.phase === 'rest' || timer.phase === 'restSet') ? timer.descRest :
            undefined;

    // Явно определяем флаг завершения таймера
    const isTimerFinished = timer.phase === 'done';

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#f8f9fa' }} edges={['top', 'left', 'right']}>
            <Stack.Screen
                options={{
                    title: 'Интервальный таймер',
                    headerTitleAlign: 'center',
                }}
            />
            <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
                <TimerPresetSelector
                    presets={presets}
                    activePresetId={activePresetId}
                    onSelectPreset={handleSelectPreset}
                    onSavePreset={handleSavePreset}
                    onDeletePreset={handleDeletePreset}
                    onSyncPresets={handleSyncPresets}
                    isSyncing={syncing}
                    currentSettings={currentSettings}
                />
                <Text style={styles.sectionTitle}>Настройка таймера</Text>
                <ParamRow
                    icon={ICONS[0]}
                    label="Подготовка (сек)"
                    value={timer.prep}
                    onChange={(v) => dispatch(setPrep(v))}
                />
                <ParamRow
                    icon={ICONS[1]}
                    label="Работа (сек)"
                    value={timer.work}
                    onChange={(v) => dispatch(setWork(v))}
                    desc={timer.descWork}
                    onDescChange={(v) => dispatch(setDescWork(v))}
                />
                <ParamRow
                    icon={ICONS[2]}
                    label="Отдых (сек)"
                    value={timer.rest}
                    onChange={(v) => dispatch(setRest(v))}
                    desc={timer.descRest}
                    onDescChange={(v) => dispatch(setDescRest(v))}
                />
                <ParamRow
                    icon={ICONS[3]}
                    label="Количество циклов"
                    value={timer.cycles}
                    onChange={(v) => dispatch(setCycles(v))}
                />
                <ParamRow
                    icon={ICONS[4]}
                    label="Количество сетов"
                    value={timer.sets}
                    onChange={(v) => dispatch(setSets(v))}
                />
                <ParamRow
                    icon={ICONS[2]}
                    label="Отдых между сетами (сек)"
                    value={timer.restBetweenSets}
                    onChange={(v) => dispatch(setRestBetweenSets(v))}
                />
                <View style={styles.optionsRow}>
                    <Text style={styles.optionsLabel}>Автоматический режим</Text>
                    <TouchableOpacity
                        style={[
                            styles.toggleButton,
                            timer.auto && styles.toggleButtonActive
                        ]}
                        onPress={() => dispatch(toggleAuto())}
                    >
                        <View style={[
                            styles.toggleIndicator,
                            timer.auto && styles.toggleIndicatorActive
                        ]} />
                    </TouchableOpacity>
                </View>
                <TouchableOpacity
                    style={styles.startButton}
                    onPress={() => router.push({
                        pathname: '/timerWorkout',
                        params: {
                            prep: timer.prep,
                            work: timer.work,
                            rest: timer.rest,
                            cycles: timer.cycles,
                            sets: timer.sets,
                            restBetweenSets: timer.restBetweenSets,
                            descWork: timer.descWork,
                            descRest: timer.descRest
                        }
                    })}
                >
                    <Text style={styles.startButtonText}>Начать тренировку</Text>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginTop: 24,
        marginBottom: 16,
        marginLeft: 16,
    },
    startButton: {
        backgroundColor: '#4caf50',
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
        margin: 16,
        marginHorizontal: 16,
    },
    startButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    activeWorkoutContainer: {
        padding: 16,
    },
    optionsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
        marginHorizontal: 16,
    },
    optionsLabel: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#212121',
    },
    toggleButton: {
        width: 40,
        height: 20,
        borderRadius: 10,
        backgroundColor: '#ccc',
        padding: 2,
    },
    toggleButtonActive: {
        backgroundColor: '#4caf50',
    },
    toggleIndicator: {
        width: 16,
        height: 16,
        borderRadius: 8,
        backgroundColor: '#fff',
    },
    toggleIndicatorActive: {
        backgroundColor: '#fff',
        transform: [{ translateX: 20 }],
    },
}); 