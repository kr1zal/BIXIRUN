import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
    decrementSeconds,
    nextPhase,
    pauseTimer,
    resetTimer,
    setTimerConfig,
    startTimer
} from '../store/slices/timerSlice';
import * as MediaLibrary from 'expo-media-library';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, NativeModules, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { Camera, useCameraDevice, useCameraPermission, useMicrophonePermission } from 'react-native-vision-camera';

// Не деструктурируем модуль на уровне файла — берём лениво из NativeModules
const getTimerVideoRecorder = () => (NativeModules as any).TimerVideoRecorder;

// Проверка доступности нативного модуля
const checkNativeModule = () => {
    const mod = getTimerVideoRecorder();
    if (!mod) {
        console.error('❌ TimerVideoRecorder нативный модуль не найден!');
        console.log('📱 Доступные модули:', Object.keys(NativeModules));
        return false;
    }
    console.log('✅ TimerVideoRecorder модуль найден!');
    return true;
};

// Импорт компонентов таймера
import { useTimer } from '../hooks/useTimer.ts';
import type { RootState } from '../store';
import type { TimerState } from '../store/slices/timerSlice';

// const { width, height } = Dimensions.get('window');

// Custom hook for interval
function useInterval(callback: () => void, delay: number | null) {
    const savedCallback = useRef<() => void>(callback);

    useEffect(() => {
        savedCallback.current = callback;
    }, [callback]);

    useEffect(() => {
        function tick() {
            if (savedCallback.current) {
                savedCallback.current();
            }
        }
        if (delay !== null) {
            const id = setInterval(tick, delay);
            return () => clearInterval(id);
        }
    }, [delay]);
}



export default function TimerWorkout() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const dispatch = useAppDispatch();
    const timerState = useAppSelector((state: RootState) => state.timer) as TimerState;
    const cameraRef = useRef<Camera>(null);

    // Камера
    const [facing, setFacing] = useState<'front' | 'back'>('back');
    const [isRecording, setIsRecording] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    // const [cameraReady, setCameraReady] = useState(false);
    // const [recordingStartTime, setRecordingStartTime] = useState(0);



    const { hasPermission: hasCameraPermission, requestPermission: requestCameraPermission } = useCameraPermission();
    const { hasPermission: hasMicrophonePermission, requestPermission: requestMicrophonePermission } = useMicrophonePermission();
    const [mediaLibraryPermission, requestMediaLibraryPermission] = MediaLibrary.usePermissions();

    const device = useCameraDevice(facing);

    // Используем хук таймера
    const { formatTime, getPhaseInfo, getProgressText, progress } = useTimer();

    // Проверка разрешений
    useEffect(() => {
        checkPermissions();
    }, []);

    // ✅ ИСПРАВЛЕННАЯ инициализация таймера - ОДИН раз через setTimerConfig
    useEffect(() => {
        if (__DEV__) console.log('🔧 Инициализация таймера с параметрами:', params);

        const config = {
            prep: params.prep ? Number(params.prep) : undefined,
            work: params.work ? Number(params.work) : undefined,
            rest: params.rest ? Number(params.rest) : undefined,
            cycles: params.cycles ? Number(params.cycles) : undefined,
            sets: params.sets ? Number(params.sets) : undefined,
            restBetweenSets: params.restBetweenSets ? Number(params.restBetweenSets) : undefined,
            descWork: params.descWork ? String(params.descWork) : undefined,
            descRest: params.descRest ? String(params.descRest) : undefined,
        };

        // Устанавливаем конфигурацию ОДНИМ действием
        dispatch(setTimerConfig(config));

        if (__DEV__) console.log('✅ Инициализация завершена');
    }, []); // Пустой массив зависимостей - выполняется ТОЛЬКО один раз

    // Интервал для обновления таймера
    useInterval(() => {
        if (__DEV__) console.log('⏰ Тик таймера:', {
            running: timerState.running,
            isPaused: isPaused,
            seconds: timerState.seconds,
            phase: timerState.phase
        });

        if (timerState.running && !isPaused) {
            if (__DEV__) console.log('⬇️ Уменьшаем секунды с', timerState.seconds, 'до', timerState.seconds - 1);
            dispatch(decrementSeconds());



            // Переход к следующей фазе если время истекло
            if (timerState.seconds <= 0) {
                if (__DEV__) console.log('🔔 Время истекло! Переходим к следующей фазе');
                playSound();
                dispatch(nextPhase());
            }
        } else {
            if (__DEV__) console.log('⏸️ Таймер не тикает:', { running: timerState.running, isPaused: isPaused });
        }
    }, timerState.running && !isPaused ? 1000 : null);

    const checkPermissions = async () => {
        try {
            if (!hasCameraPermission) {
                await requestCameraPermission();
            }
            if (!hasMicrophonePermission) {
                await requestMicrophonePermission();
            }
            if (!mediaLibraryPermission?.granted) {
                await requestMediaLibraryPermission();
            }
        } catch (error) {
            console.error('Ошибка разрешений:', error);
        }
    };

    // Мока для звуков - избегаем ошибок
    const playSound = useCallback(() => {
        try {
            console.log('🔊 Проигрываем звук фазы');
            // Здесь может быть реальная логика звука в будущем
            // const { sound } = await Audio.Sound.createAsync(require('@/assets/sounds/beep.mp3'));
            // await sound.playAsync();
        } catch (error) {
            console.log('🔇 Звук недоступен:', error);
        }
    }, []);

    // События камеры - согласно Context7 документации
    const onCameraInitialized = useCallback(() => {
        console.log('📷 Камера инициализирована');
    }, []);

    const onCameraStarted = useCallback(() => {
        console.log('📷 Камера запущена');
    }, []);

    const onCameraStopped = useCallback(() => {
        console.log('📷 Камера остановлена');
    }, []);

    const onCameraError = useCallback((error: unknown) => {
        console.error('❌ Ошибка камеры:', error);
        const message = error instanceof Error ? error.message : String((error as Record<string, unknown>)?.message ?? error);
        Alert.alert('Ошибка камеры', message);
    }, []);

    // ГЛАВНЫЕ КНОПКИ УПРАВЛЕНИЯ

    // 1. Кнопка СТАРТ/СТОП - АВТОМАТИЧЕСКАЯ запись видео с таймером
    const handleStartStop = useCallback(async () => {
        if (!isRecording) {
            // СТАРТ - автоматическая запись с нативным модулем
            try {
                if (__DEV__) console.log('🎬 СТАРТ: Автоматическая запись видео с таймером');

                // Проверяем разрешения
                if (!hasCameraPermission || !hasMicrophonePermission) {
                    Alert.alert(
                        'Нужны разрешения',
                        'Для записи видео с таймером нужны разрешения на камеру и микрофон. Перейдите в настройки приложения и предоставьте разрешения.',
                        [{ text: 'OK' }]
                    );
                    return;
                }

                const phaseInfo = getPhaseInfo();
                const config = {
                    timerText: formatTime(timerState.seconds),
                    phaseText: phaseInfo?.name ?? '',
                    progressText: `${timerState.currentCycle}/${timerState.cycles} • Сет ${timerState.currentSet}`,
                    progressRatio: progress,
                    fontSize: 48,
                    fontColor: '#ffffff',
                    backgroundColor: 'rgba(0,0,0,0.8)',
                    borderRadius: 10,
                    position: 'bottom-center' as const,
                    // ИСПРАВЛЕНИЕ: Передаем выбранную камеру в нативный модуль
                    cameraPosition: facing,
                    videoOrientation: 'portrait' as const,
                    // Включаем ReplayKit, чтобы избежать конфликта с VisionCamera и вернуть системный диалог записи
                    useReplayKit: true,
                };

                // Проверяем наличие нативного модуля
                if (!checkNativeModule()) {
                    throw new Error('Нативный модуль TimerVideoRecorder не найден');
                }

                // Запускаем нативную запись видео
                const result = await getTimerVideoRecorder().startRecording(config);
                if (__DEV__) console.log('✅ Запись началась:', result);

                setIsRecording(true);

                // Запускаем таймер
                dispatch(startTimer());

                Alert.alert('Запись началась', 'Видео с таймером записывается автоматически!');

            } catch (error) {
                console.error('❌ Ошибка запуска записи:', error);
                Alert.alert('Ошибка', `Не удалось начать запись: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`);
            }
        } else {
            // СТОП - автоматическое сохранение видео
            try {
                if (__DEV__) console.log('⏹️ СТОП: Автоматическое сохранение видео');

                // Останавливаем таймер
                dispatch(pauseTimer());

                // Останавливаем нативную запись
                const result = await getTimerVideoRecorder().stopRecording();
                if (__DEV__) console.log('✅ Видео автоматически сохранено:', result);

                setIsRecording(false);

                // ИСПРАВЛЕНИЕ: Правильная обработка результата
                if (result.status === 'success') {
                    Alert.alert('Готово!', 'Видео с таймером сохранено в галерею!');
                } else if (result.status === 'saved_locally') {
                    Alert.alert('Готово!', 'Видео сохранено локально (не удалось добавить в галерею)');
                } else {
                    Alert.alert('Готово!', 'Видео записано');
                }

            } catch (error) {
                console.error('❌ Ошибка сохранения видео:', error);
                Alert.alert('Ошибка', `Не удалось сохранить видео: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`);
                setIsRecording(false);
            }
        }
    }, [isRecording, timerState, dispatch, startTimer, getPhaseInfo]);

    // 2. Кнопка ПАУЗА/ДАЛЕЕ - только для таймера
    const handlePauseResume = useCallback(() => {
        if (!isRecording) return;

        try {
            if (isPaused) {
                if (__DEV__) console.log('▶️ ДАЛЕЕ: Возобновляем таймер');
                dispatch(startTimer());
                setIsPaused(false);
            } else {
                if (__DEV__) console.log('⏸️ ПАУЗА: Приостанавливаем таймер');
                dispatch(pauseTimer());
                setIsPaused(true);
            }
        } catch (error) {
            console.error('Ошибка паузы/возобновления:', error);
        }
    }, [isPaused, isRecording, dispatch]);

    // 3. Кнопка СБРОС - рефрешит таймер
    const handleReset = useCallback(() => {
        if (__DEV__) console.log('🔄 Сброс таймера');

        // Сбрасываем все состояния
        setIsRecording(false);
        setIsPaused(false);
        dispatch(resetTimer());
    }, [dispatch]);

    // 4. Переход к следующей фазе
    // const handleNext = useCallback(() => {
    //     dispatch(nextPhase());
    //     playSound();
    // }, [dispatch]);

    const handleGoHome = useCallback(() => {
        const navigateHome = () => {
            // Возвращаемся на главный экран гарантированно (сбросим модальную презентацию)
            router.replace('/main');
        };
        if (isRecording || timerState.running) {
            Alert.alert(
                'Таймер активен',
                'Остановить таймер?',
                [
                    { text: 'Отмена', style: 'cancel' },
                    {
                        text: 'Остановить',
                        style: 'destructive',
                        onPress: () => {
                            setIsRecording(false);
                            dispatch(resetTimer());
                            navigateHome();
                        }
                    }
                ]
            );
        } else {
            navigateHome();
        }
    }, [isRecording, timerState.running, dispatch, router]);

    // Новая кнопка: переход к настройкам таймера
    const handleGoToTimerSettings = useCallback(() => {
        const navigateSettings = () => {
            router.replace('/timer-settings');
        };
        if (isRecording || timerState.running) {
            Alert.alert(
                'Таймер активен',
                'Остановить таймер?',
                [
                    { text: 'Отмена', style: 'cancel' },
                    {
                        text: 'Остановить',
                        style: 'destructive',
                        onPress: () => {
                            setIsRecording(false);
                            dispatch(resetTimer());
                            navigateSettings();
                        }
                    }
                ]
            );
        } else {
            navigateSettings();
        }
    }, [isRecording, timerState.running, dispatch, router]);

    const toggleCameraFacing = useCallback(() => {
        setFacing(facing === 'back' ? 'front' : 'back');
    }, [facing]);

    // Получение информации о фазе
    const phaseInfo = getPhaseInfo();

    // Определяем текущее описание
    const currentDescription = timerState.phase === 'work' ? timerState.descWork :
        (timerState.phase === 'rest' || timerState.phase === 'restSet') ? timerState.descRest :
            undefined;

    const isTimerFinished = timerState.isFinished;

    // Обновление таймера в нативном модуле во время записи
    useEffect(() => {
        if (isRecording && getTimerVideoRecorder()) {
            try {
                const phaseInfo = getPhaseInfo();
                getTimerVideoRecorder().updateTimer({
                    timerText: formatTime(timerState.seconds),
                    phaseText: phaseInfo?.name ?? '',
                    progressText: `${timerState.currentCycle}/${timerState.cycles} • Сет ${timerState.currentSet}`,
                    progressRatio: progress,
                });
                if (__DEV__) console.log('🔄 Обновили таймер в видео:', {
                    time: formatTime(timerState.seconds),
                    phase: phaseInfo?.name ?? '',
                    progress: `${timerState.currentCycle}/${timerState.cycles} • Сет ${timerState.currentSet}`
                });
            } catch (error) {
                console.error('❌ Ошибка обновления таймера:', error);
            }
        }
    }, [isRecording, timerState.seconds, timerState.phase, timerState.currentCycle, timerState.cycles, timerState.currentSet, formatTime, getPhaseInfo]);

    // (переключение камеры реализовано в toggleCameraFacing)

    // Проверка разрешений
    if (!hasCameraPermission) {
        return (
            <View style={styles.permissionContainer}>
                <Text style={styles.permissionText}>Нужно разрешение на камеру</Text>
                <TouchableOpacity style={styles.permissionButton} onPress={requestCameraPermission}>
                    <Text style={styles.permissionButtonText}>Разрешить</Text>
                </TouchableOpacity>
            </View>
        );
    }

    if (!device) {
        return (
            <View style={styles.permissionContainer}>
                <Text style={styles.permissionText}>Камера не найдена</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Stack.Screen options={{ headerShown: false }} />

            {/* Камера в фоне */}
            <Camera
                ref={cameraRef}
                style={StyleSheet.absoluteFill}
                device={device}
                isActive
                video
                audio={!!hasMicrophonePermission}
                onInitialized={onCameraInitialized}
                onStarted={onCameraStarted}
                onStopped={onCameraStopped}
                onError={onCameraError}
            />

            {/* Верхние кнопки — оставляем видимыми для управления */}
            <View style={styles.topControls}>
                <TouchableOpacity style={styles.topButton} onPress={handleGoToTimerSettings}>
                    <Text style={styles.topButtonText}>⚙️</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.topButton} onPress={toggleCameraFacing}>
                    <Text style={styles.topButtonText}>🔄</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.topButton} onPress={handleGoHome}>
                    <Text style={styles.topButtonText}>🏠</Text>
                </TouchableOpacity>
            </View>

            {/* Индикатор записи */}
            {isRecording && (
                <View style={styles.recordingIndicator}>
                    <Text style={styles.recordingText}>
                        {isPaused ? '⏸️ ПАУЗА' : '🎬 АКТИВЕН'}
                    </Text>
                </View>
            )}

            {/* Индикатор паузы */}
            {isPaused && isRecording && (
                <View style={styles.pauseIndicator}>
                    <Text style={styles.pauseText}>⏸️ ПАУЗА</Text>
                </View>
            )}

            {/* Во время записи показываем круглый таймер по центру (как в превью) */}
            {isRecording && (
                <View style={styles.recordingTimerWrapper}>
                    <View style={styles.timerCircle}>
                        {/* @ts-expect-error react-native-svg types are valid at runtime */}
                        <Svg width={200} height={200} style={styles.progressSvg}>
                            <Circle
                                cx="100"
                                cy="100"
                                r="90"
                                stroke="rgba(255, 255, 255, 0.3)"
                                strokeWidth="8"
                                fill="transparent"
                            />
                            <Circle
                                cx="100"
                                cy="100"
                                r="90"
                                stroke="#4CAF50"
                                strokeWidth="8"
                                fill="transparent"
                                strokeDasharray={`${2 * Math.PI * 90}`}
                                strokeDashoffset={2 * Math.PI * 90 * (1 - progress)}
                                strokeLinecap="round"
                                transform="rotate(-90 100 100)"
                            />
                        </Svg>

                        <View style={styles.timerContent}>
                            <Text style={styles.timerText}>{formatTime(timerState.seconds)}</Text>
                            <Text style={styles.phaseText}>{phaseInfo?.name ?? ''}</Text>
                            <Text style={styles.progressText}>
                                Интервал {timerState.currentCycle} / Сет {timerState.currentSet}
                            </Text>
                        </View>
                    </View>
                </View>
            )}

            {/* Обычный таймер - для превью (когда НЕ записываем) */}
            {!isRecording && (
                <View style={styles.timerContainer}>
                    <View style={styles.timerCircle}>
                        {/* @ts-expect-error react-native-svg types are valid at runtime */}
                        <Svg width={200} height={200} style={styles.progressSvg}>
                            <Circle
                                cx="100"
                                cy="100"
                                r="90"
                                stroke="rgba(255, 255, 255, 0.3)"
                                strokeWidth="8"
                                fill="transparent"
                            />
                            <Circle
                                cx="100"
                                cy="100"
                                r="90"
                                stroke="#4CAF50"
                                strokeWidth="8"
                                fill="transparent"
                                strokeDasharray={`${2 * Math.PI * 90}`}
                                strokeDashoffset={2 * Math.PI * 90 * (1 - progress)}
                                strokeLinecap="round"
                                transform="rotate(-90 100 100)"
                            />
                        </Svg>

                        <View style={styles.timerContent}>
                            <Text style={styles.timerText}>{formatTime(timerState.seconds)}</Text>
                            <Text style={styles.phaseText}>{phaseInfo?.name ?? ''}</Text>
                            {currentDescription && (
                                <Text style={styles.timerDescription}>{currentDescription}</Text>
                            )}
                            <Text style={styles.progressText}>
                                Интервал {timerState.currentCycle} / Сет {timerState.currentSet}
                            </Text>
                        </View>
                    </View>
                </View>
            )}

            {/* Кнопки управления — оставляем видимыми для управления процессом */}
            <View style={styles.controlsContainer}>
                <View style={styles.allControls}>
                    {/* Кнопка СТАРТ/СТОП */}
                    <TouchableOpacity
                        style={[styles.controlButton, isRecording ? styles.stopButton : styles.startButton]}
                        onPress={handleStartStop}
                    >
                        <Text style={styles.controlButtonText}>
                            {isRecording ? '⏹️ СТОП' : '🎬 СТАРТ'}
                        </Text>
                    </TouchableOpacity>

                    {/* Кнопка ПАУЗА/ДАЛЕЕ */}
                    <TouchableOpacity
                        style={[styles.controlButton, isPaused ? styles.resumeButton : styles.pauseButton]}
                        onPress={handlePauseResume}
                    >
                        <Text style={styles.controlButtonText}>
                            {isPaused ? '▶️ ДАЛЕЕ' : '⏸️ ПАУЗА'}
                        </Text>
                    </TouchableOpacity>

                    {/* Кнопка СБРОС */}
                    <TouchableOpacity style={[styles.controlButton, styles.resetButton]} onPress={handleReset}>
                        <Text style={styles.controlButtonText}>🔄 СБРОС</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Сообщение о завершении */}
            {isTimerFinished && (
                <View style={styles.finishedOverlay}>
                    <Text style={styles.finishedText}>ТРЕНИРОВКА ЗАВЕРШЕНА!</Text>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    overlay: {
        flex: 1,
        backgroundColor: 'transparent',
    },
    permissionContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#000',
        padding: 20,
    },
    permissionText: {
        color: '#fff',
        fontSize: 18,
        textAlign: 'center',
        marginBottom: 20,
    },
    permissionButton: {
        backgroundColor: '#007AFF',
        paddingHorizontal: 30,
        paddingVertical: 15,
        borderRadius: 25,
    },
    permissionButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    topControls: {
        position: 'absolute',
        top: 50,
        right: 20,
        flexDirection: 'row',
        justifyContent: 'flex-end',
        alignItems: 'center',
        gap: 10,
        zIndex: 10,
    },
    topButton: {
        width: 50,
        height: 50,
        justifyContent: 'center',
        alignItems: 'center',
    },
    topButtonText: {
        fontSize: 24,
        textShadowColor: 'rgba(0, 0, 0, 0.8)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 3,
    },
    recordingIndicator: {
        position: 'absolute',
        top: 50,
        left: 20,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 0, 0, 0.9)',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        zIndex: 10,
    },
    recordingText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 14,
    },
    pauseIndicator: {
        position: 'absolute',
        top: 50,
        left: 20,
        backgroundColor: 'rgba(255, 193, 7, 0.9)',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        zIndex: 10,
    },
    pauseText: {
        color: '#000',
        fontWeight: 'bold',
        fontSize: 14,
    },
    timerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    timerCircle: {
        position: 'relative',
        justifyContent: 'center',
        alignItems: 'center',
    },
    progressSvg: {
        transform: [{ rotate: '-90deg' }],
    },
    timerContent: {
        position: 'absolute',
        justifyContent: 'center',
        alignItems: 'center',
    },
    timerText: {
        fontSize: 48,
        fontWeight: 'bold',
        color: '#fff',
        textShadowColor: 'rgba(0, 0, 0, 0.8)',
        textShadowOffset: { width: 2, height: 2 },
        textShadowRadius: 4,
    },
    phaseText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#fff',
        marginTop: 5,
        textShadowColor: 'rgba(0, 0, 0, 0.8)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 3,
    },
    timerDescription: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.9)',
        textAlign: 'center',
        marginTop: 4,
        textShadowColor: 'rgba(0, 0, 0, 0.8)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 3,
    },
    progressText: {
        fontSize: 12,
        color: 'rgba(255, 255, 255, 0.8)',
        textAlign: 'center',
        marginTop: 8,
        textShadowColor: 'rgba(0, 0, 0, 0.8)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 3,
    },
    controlsContainer: {
        position: 'absolute',
        bottom: 50,
        left: 20,
        right: 20,
        alignItems: 'center',
    },
    hiddenWhileRecording: {
        opacity: 0,
        pointerEvents: 'none',
    },
    controlButton: {
        flex: 1,
        paddingVertical: 15,
        borderRadius: 25,
        alignItems: 'center',
        justifyContent: 'center',
    },
    controlButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#fff',
    },
    startButton: {
        backgroundColor: 'rgba(40, 167, 69, 0.9)',
    },
    stopButton: {
        backgroundColor: 'rgba(220, 53, 69, 0.9)',
    },
    pauseButton: {
        backgroundColor: 'rgba(255, 193, 7, 0.9)',
    },
    resumeButton: {
        backgroundColor: 'rgba(40, 167, 69, 0.9)',
    },
    resetButton: {
        backgroundColor: 'rgba(108, 117, 125, 0.9)',
    },
    finishedOverlay: {
        position: 'absolute',
        top: '40%',
        left: 20,
        right: 20,
        backgroundColor: 'rgba(40, 167, 69, 0.95)',
        padding: 20,
        borderRadius: 15,
        alignItems: 'center',
    },
    finishedText: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
        textAlign: 'center',
    },
    allControls: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        gap: 10,
    },
    cameraOverlay: {
        position: 'absolute',
        bottom: 120,
        left: 20,
        right: 20,
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        padding: 15,
        borderRadius: 10,
        alignItems: 'center',
        zIndex: 1000,
    },
    recordingTimerWrapper: {
        position: 'absolute',
        top: '30%',
        left: 0,
        right: 0,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
    },
    cameraTimerText: {
        fontSize: 48,
        fontWeight: 'bold',
        color: '#fff',
        textAlign: 'center',
        textShadowColor: 'rgba(0, 0, 0, 1)',
        textShadowOffset: { width: 2, height: 2 },
        textShadowRadius: 4,
    },
    cameraPhaseText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#fff',
        marginTop: 5,
        textAlign: 'center',
        textShadowColor: 'rgba(0, 0, 0, 1)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 3,
    },
    cameraProgressText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#fff',
        marginTop: 3,
        textAlign: 'center',
        textShadowColor: 'rgba(0, 0, 0, 1)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 3,
    },
}); 