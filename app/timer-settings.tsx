import { RootState } from '@/app/store';
import { useAppDispatch, useAppSelector } from '@/app/store/hooks';
import {
    setCycles,
    setDescRest,
    setDescWork,
    setPrep,
    setRest,
    setRestBetweenSets,
    setSets,
    setWork,
    toggleAuto
} from '@/app/store/slices/timerSlice';
import { Stack, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Импорт компонентов
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

export default function TimerSettingsScreen() {
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
        // Сохраняем только если таймер не запущен и находится в начальной фазе
        if (!timer.running && timer.phase === 'prep') {
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
    }, [user, router]);

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
    }, [dispatch]);

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

    // Обработчик запуска тренировки
    const handleStartWorkout = useCallback(() => {
        // Переходим к экрану тренировки, передавая настройки через параметры
        router.push({
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
        });
    }, [router, timer]);

    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
            <Stack.Screen
                options={{
                    title: 'Настройки таймера',
                    headerTitleAlign: 'center',
                }}
            />
            <ScrollView contentContainerStyle={styles.scrollContent}>
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
                    onPress={handleStartWorkout}
                >
                    <Text style={styles.startButtonText}>Начать тренировку</Text>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    scrollContent: {
        paddingBottom: 120,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginTop: 24,
        marginBottom: 16,
        marginLeft: 16,
        color: '#212121',
    },
    optionsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
        marginHorizontal: 16,
        paddingVertical: 12,
        paddingHorizontal: 16,
        backgroundColor: '#fff',
        borderRadius: 8,
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
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
        justifyContent: 'center',
    },
    toggleButtonActive: {
        backgroundColor: '#4caf50',
    },
    toggleIndicator: {
        width: 16,
        height: 16,
        borderRadius: 8,
        backgroundColor: '#fff',
        transform: [{ translateX: 0 }],
    },
    toggleIndicatorActive: {
        transform: [{ translateX: 20 }],
    },
    startButton: {
        backgroundColor: '#4caf50',
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
        margin: 16,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
    },
    startButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
});
