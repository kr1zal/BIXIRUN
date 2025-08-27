import { RootState } from '../store';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
    setCycles,
    setDescRest,
    setDescWork,
    setPrep,
    setRest,
    setRestBetweenSets,
    setSets,
    setWork,
    setTimerConfig
} from '../store/slices/timerSlice';
import { Stack, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

// Импорт компонентов
import ParamRow from '../components/timer/ParamRow';
import TimerPresetSelector, { TimerPreset } from '../components/timer/TimerPresetSelector';

// Импорт функций работы с хранилищем
import {
    addTimerPreset,
    deleteTimerPreset,
    forceSyncWithCloud,
    loadTimerPresets,
    saveLastUsedTimerSettings
} from '../utils/timerStorage';

// Импорт функций Supabase
import { getCurrentUser } from '../supabaseClient';
import { getData, storeData, STORAGE_KEYS } from '../utils/storage';

const ICONS = [
    '🚶', // Подготовка
    '🏋️', // Работа
    '🧘', // Отдых
    '🔁', // Циклы
    '🔄', // Сеты
    '⏱️', // Отдых между сетами
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

    const DEFAULTS = useMemo(() => ({
        prep: 5,
        work: 60,
        rest: 20,
        cycles: 10,
        sets: 1,
        restBetweenSets: 120,
        descWork: '',
        descRest: ''
    }), []);

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

    const isDefaultConfig =
        timer.prep === DEFAULTS.prep &&
        timer.work === DEFAULTS.work &&
        timer.rest === DEFAULTS.rest &&
        timer.cycles === DEFAULTS.cycles &&
        timer.sets === DEFAULTS.sets &&
        timer.restBetweenSets === DEFAULTS.restBetweenSets &&
        (timer.descWork || '') === DEFAULTS.descWork &&
        (timer.descRest || '') === DEFAULTS.descRest;

    const handleResetToDefaults = useCallback(async () => {
        try {
            const dontAsk = await getData<boolean>(STORAGE_KEYS.TIMER_SETTINGS_DONT_ASK_RESET_CONFIRM);
            const doReset = async () => {
                dispatch(setTimerConfig(DEFAULTS));
                setActivePresetId(undefined);
            };

            if (dontAsk) {
                await doReset();
                return;
            }

            Alert.alert(
                'Восстановить значения по умолчанию?',
                '',
                [
                    { text: 'Отмена', style: 'cancel' },
                    {
                        text: 'Да',
                        style: 'destructive',
                        onPress: () => { void doReset(); }
                    },
                    {
                        text: 'Да. Больше не спрашивать',
                        onPress: async () => {
                            await storeData(STORAGE_KEYS.TIMER_SETTINGS_DONT_ASK_RESET_CONFIRM, true);
                            await doReset();
                        }
                    }
                ]
            );
        } catch (e) {
            // Фоллбек: если storage недоступен — просто сбрасываем
            dispatch(setTimerConfig(DEFAULTS));
            setActivePresetId(undefined);
        }
    }, [dispatch, DEFAULTS]);

    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
            <Stack.Screen
                options={{
                    title: 'Настройки таймера',
                    headerTitleAlign: 'center',
                }}
            />
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.presetSelectorWrapper}>
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
                </View>

                <Text style={styles.sectionTitle}>Настройка таймера</Text>
                
                <ParamRow
                    icon={ICONS[0]}
                    label="Подготовка"
                    pickerTitle="Подготовка (сек)"
                    value={timer.prep}
                    onChange={(v) => dispatch(setPrep(v))}
                />
                
                <ParamRow
                    icon={ICONS[1]}
                    label="Работа"
                    pickerTitle="Работа (сек)"
                    value={timer.work}
                    onChange={(v) => dispatch(setWork(v))}
                />
                
                <ParamRow
                    icon={ICONS[2]}
                    label="Отдых"
                    pickerTitle="Отдых (сек)"
                    value={timer.rest}
                    onChange={(v) => dispatch(setRest(v))}
                />
                
                <ParamRow
                    icon={ICONS[3]}
                    label="Циклы"
                    pickerTitle="Количество циклов"
                    value={timer.cycles}
                    onChange={(v) => dispatch(setCycles(v))}
                />
                
                <ParamRow
                    icon={ICONS[4]}
                    label="Сеты"
                    pickerTitle="Количество сетов"
                    value={timer.sets}
                    onChange={(v) => dispatch(setSets(v))}
                />
                
                <ParamRow
                    icon={ICONS[2]}
                    label="Отдых между сетами"
                    pickerTitle="Отдых между сетами (сек)"
                    value={timer.restBetweenSets}
                    onChange={(v) => dispatch(setRestBetweenSets(v))}
                />

                <View style={[styles.actionRowWrapper, !isDefaultConfig && styles.actionRowWrapperTight]}>
                    {isDefaultConfig ? (
                        <TouchableOpacity
                            style={[styles.startButton, styles.startButtonInRow, styles.actionRowPrimary]}
                            onPress={handleStartWorkout}
                        >
                            <Text style={styles.startButtonText}>Начать тренировку</Text>
                        </TouchableOpacity>
                    ) : (
                        <>
                            <TouchableOpacity
                                style={[styles.resetIconButton, styles.actionRowSecondary]}
                                onPress={handleResetToDefaults}
                                accessibilityLabel="Сбросить к значениям по умолчанию"
                            >
                                <Ionicons name="refresh-circle" size={30} color="#3b5bd6" style={styles.resetIconFlip} />
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.startButton, styles.startButtonInRow, styles.startButtonLarge, styles.actionRowPrimary]}
                                onPress={handleStartWorkout}
                            >
                                <Text style={styles.startButtonText}>Начать тренировку</Text>
                            </TouchableOpacity>
                        </>
                    )}
                </View>
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
        paddingBottom: 40,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginTop: 10,
        marginBottom: 6,
        marginLeft: 16,
        color: '#212121',
    },
    startButton: {
        backgroundColor: '#4caf50',
        paddingVertical: 16,
        paddingHorizontal: 16,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        marginHorizontal: 16,
        marginVertical: 16,
        minHeight: 60,
        ...Platform.select({
            ios: {
                shadowColor: '#2e7d32',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.18,
                shadowRadius: 4,
            },
            android: {
                elevation: 3,
            }
        })
    },
    actionRowWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: 7,
        marginTop: 6,
        marginBottom: 12,
    },
    actionRowWrapperTight: {
        // Чтобы между левой и правой кнопкой тоже было 7px
        // левая имеет marginRight: 7, правая flex:1 без внешних полей
    },
    actionRowPrimary: {
        flex: 1,
    },
    actionRowSecondary: {
        marginRight: 4,
    },
    startButtonLarge: {
        flex: 1,
        borderRadius: 8,
        paddingVertical: 16,
    },
    startButtonInRow: {
        margin: 0,
    },
    startButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    resetIconButton: {
        width: 60,
        height: 60,
        borderRadius: 16,
        borderWidth: 3,
        borderColor: '#3b5bd6',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'transparent',
        marginLeft: 0,
    },
    resetIconFlip: {
        transform: [{ scaleX: -1 }],
    },
    presetSelectorWrapper: {
        marginTop: 8,
        marginBottom: 4,
        paddingHorizontal: 0,
    },
});
