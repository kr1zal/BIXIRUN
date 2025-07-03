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
    startTimer
} from '@/app/store/slices/timerSlice';
import * as MediaLibrary from 'expo-media-library';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Dimensions, NativeModules, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { Camera, useCameraDevice, useCameraPermission, useMicrophonePermission } from 'react-native-vision-camera';

const { TimerVideoRecorder } = NativeModules;

// Проверка доступности нативного модуля
const checkNativeModule = () => {
    if (!TimerVideoRecorder) {
        console.error('❌ TimerVideoRecorder нативный модуль не найден!');
        console.log('📱 Доступные модули:', Object.keys(NativeModules));
        return false;
    }
    console.log('✅ TimerVideoRecorder модуль найден!');
    return true;
};

// Импорт компонентов таймера
import { useTimer } from '@/hooks/useTimer';

const { width, height } = Dimensions.get('window');

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
    const timerState = useAppSelector((state) => state.timer);
    const cameraRef = useRef<Camera>(null);

    // Камера
    const [facing, setFacing] = useState<'front' | 'back'>('back');
    const [isRecording, setIsRecording] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [cameraReady, setCameraReady] = useState(false);
    const [recordingStartTime, setRecordingStartTime] = useState(0);



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

    // Инициализация таймера с параметрами из URL - ТОЛЬКО ОДИН РАЗ
    useEffect(() => {
        console.log('🔧 Инициализация таймера с параметрами:', params);

        if (params.prep) {
            console.log('⏱️ Устанавливаем prep:', params.prep);
            dispatch(setPrep(Number(params.prep)));
        }
        if (params.work) {
            console.log('💪 Устанавливаем work:', params.work);
            dispatch(setWork(Number(params.work)));
        }
        if (params.rest) {
            console.log('😴 Устанавливаем rest:', params.rest);
            dispatch(setRest(Number(params.rest)));
        }
        if (params.cycles) {
            console.log('🔄 Устанавливаем cycles:', params.cycles);
            dispatch(setCycles(Number(params.cycles)));
        }
        if (params.sets) {
            console.log('📊 Устанавливаем sets:', params.sets);
            dispatch(setSets(Number(params.sets)));
        }
        if (params.restBetweenSets) {
            console.log('⏳ Устанавливаем restBetweenSets:', params.restBetweenSets);
            dispatch(setRestBetweenSets(Number(params.restBetweenSets)));
        }
        if (params.descWork) {
            console.log('📝 Устанавливаем descWork:', params.descWork);
            dispatch(setDescWork(String(params.descWork)));
        }
        if (params.descRest) {
            console.log('📝 Устанавливаем descRest:', params.descRest);
            dispatch(setDescRest(String(params.descRest)));
        }

        // Сбрасываем таймер ТОЛЬКО при первой загрузке
        console.log('🔄 Сбрасываем таймер ТОЛЬКО при первой загрузке');
        dispatch(resetTimer());

        console.log('✅ Инициализация завершена');
    }, []); // УБИРАЕМ params и dispatch из зависимостей!

    // Интервал для обновления таймера
    useInterval(() => {
        console.log('⏰ Тик таймера:', {
            running: timerState.running,
            isPaused: isPaused,
            seconds: timerState.seconds,
            phase: timerState.phase
        });

        if (timerState.running && !isPaused) {
            console.log('⬇️ Уменьшаем секунды с', timerState.seconds, 'до', timerState.seconds - 1);
            dispatch(decrementSeconds());



            // Переход к следующей фазе если время истекло
            if (timerState.seconds <= 0) {
                console.log('🔔 Время истекло! Переходим к следующей фазе');
                playSound();
                dispatch(nextPhase());
            }
        } else {
            console.log('⏸️ Таймер не тикает:', { running: timerState.running, isPaused: isPaused });
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
        } catch (error: any) {
            console.error('Ошибка разрешений:', error);
        }
    };

    // Мока для звуков - избегаем ошибок
    const playSound = useCallback(async () => {
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
        setCameraReady(true);
    }, []);

    const onCameraStarted = useCallback(() => {
        console.log('📷 Камера запущена');
    }, []);

    const onCameraStopped = useCallback(() => {
        console.log('📷 Камера остановлена');
    }, []);

    const onCameraError = useCallback((error: any) => {
        console.error('❌ Ошибка камеры:', error);
        Alert.alert('Ошибка камеры', error.message);
    }, []);

    // ГЛАВНЫЕ КНОПКИ УПРАВЛЕНИЯ

    // 1. Кнопка СТАРТ/СТОП - АВТОМАТИЧЕСКАЯ запись видео с таймером
    const handleStartStop = useCallback(async () => {
        // Проверяем нативный модуль
        if (!checkNativeModule()) {
            Alert.alert(
                'Функция в разработке',
                'Нативный модуль записи видео с таймером еще не готов.\n\nВременно используйте запись экрана:\n1. Откройте Пункт управления\n2. Нажмите кнопку записи экрана 🔴\n3. Вернитесь в приложение и запустите таймер',
                [{ text: 'Понятно' }]
            );
            return;
        }

        if (!isRecording) {
            // СТАРТ - автоматическая запись с нативным модулем
            try {
                console.log('🎬 СТАРТ: Автоматическая запись видео с таймером');

                const phaseInfo = getPhaseInfo();
                const config = {
                    timerText: formatTime(timerState.seconds),
                    phaseText: phaseInfo.name,
                    progressText: `${timerState.intervalIdx}/${timerState.cycles} • Сет ${timerState.setIdx + 1}`,
                    fontSize: 48,
                    fontColor: '#ffffff',
                    backgroundColor: 'rgba(0,0,0,0.8)',
                    borderRadius: 10,
                    position: 'bottom-center' as const
                };

                // Запускаем нативную запись видео с таймером
                await TimerVideoRecorder.startRecording(config);

                // Запускаем таймер
                dispatch(startTimer());
                setIsRecording(true);
                setIsPaused(false);
                setRecordingStartTime(Date.now());

                console.log('✅ Автоматическая запись началась!');

            } catch (error) {
                console.error('❌ Ошибка запуска записи:', error);
                Alert.alert('Ошибка', 'Не удалось начать запись видео');
            }
        } else {
            // СТОП - автоматическое сохранение
            try {
                console.log('⏹️ СТОП: Автоматическое сохранение видео');

                // Останавливаем нативную запись
                const videoPath = await TimerVideoRecorder.stopRecording();

                // Останавливаем таймер
                dispatch(pauseTimer());
                setIsRecording(false);
                setIsPaused(false);

                const recordingDuration = Math.floor((Date.now() - recordingStartTime) / 1000);
                Alert.alert(
                    'Видео сохранено! 🎉',
                    `Запись ${formatTime(recordingDuration)} с таймером сохранена в галерею!\n\n📱 ${videoPath}`,
                    [{ text: 'Отлично!' }]
                );

                console.log('✅ Видео автоматически сохранено:', videoPath);

            } catch (error) {
                console.error('❌ Ошибка остановки записи:', error);
                Alert.alert('Ошибка', 'Не удалось сохранить видео');
                setIsRecording(false);
            }
        }
    }, [isRecording, dispatch, timerState, recordingStartTime, formatTime, getPhaseInfo]);

    // 2. Кнопка ПАУЗА/ДАЛЕЕ - только для таймера
    const handlePauseResume = useCallback(async () => {
        if (!isRecording) return;

        try {
            if (isPaused) {
                console.log('▶️ ДАЛЕЕ: Возобновляем таймер');
                dispatch(startTimer());
                setIsPaused(false);
            } else {
                console.log('⏸️ ПАУЗА: Приостанавливаем таймер');
                dispatch(pauseTimer());
                setIsPaused(true);
            }
        } catch (error) {
            console.error('Ошибка паузы/возобновления:', error);
        }
    }, [isPaused, isRecording, dispatch]);

    // 3. Кнопка СБРОС - рефрешит таймер
    const handleReset = useCallback(async () => {
        console.log('🔄 Сброс таймера');

        // Сбрасываем все состояния
        setIsRecording(false);
        setIsPaused(false);
        dispatch(resetTimer());
    }, [dispatch]);

    // 4. Переход к следующей фазе
    const handleNext = useCallback(() => {
        dispatch(nextPhase());
        playSound();
    }, [dispatch]);

    const handleGoHome = useCallback(() => {
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
                            router.replace('/');
                        }
                    }
                ]
            );
        } else {
            router.replace('/');
        }
    }, [isRecording, timerState.running, dispatch, router]);

    const toggleCameraFacing = useCallback(() => {
        setFacing(facing === 'back' ? 'front' : 'back');
    }, [facing]);

    // Получение информации о фазе
    const phaseInfo = getPhaseInfo();
    const progressText = getProgressText();

    // Определяем текущее описание
    const currentDescription = timerState.phase === 'work' ? timerState.descWork :
        (timerState.phase === 'rest' || timerState.phase === 'restSet') ? timerState.descRest :
            undefined;

    const isTimerFinished = timerState.phase === 'done';

    // Обновление таймера в нативном модуле во время записи
    useEffect(() => {
        if (isRecording && TimerVideoRecorder) {
            try {
                const phaseInfo = getPhaseInfo();
                TimerVideoRecorder.updateTimer({
                    timerText: formatTime(timerState.seconds),
                    phaseText: phaseInfo.name,
                    progressText: `${timerState.intervalIdx}/${timerState.cycles} • Сет ${timerState.setIdx + 1}`
                });
                console.log('🔄 Обновили таймер в видео:', {
                    time: formatTime(timerState.seconds),
                    phase: phaseInfo.name,
                    progress: `${timerState.intervalIdx}/${timerState.cycles} • Сет ${timerState.setIdx + 1}`
                });
            } catch (error) {
                console.error('❌ Ошибка обновления таймера:', error);
            }
        }
    }, [isRecording, timerState.seconds, timerState.phase, timerState.intervalIdx, timerState.cycles, timerState.setIdx, formatTime, getPhaseInfo]);

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
                isActive={true}
                video={true}
                audio={true}
                onInitialized={onCameraInitialized}
                onStarted={onCameraStarted}
                onStopped={onCameraStopped}
                onError={onCameraError}
            />

            {/* Верхние кнопки - ОБЕ В ПРАВОМ ВЕРХНЕМ УГЛУ */}
            <View style={styles.topControls}>
                <TouchableOpacity style={styles.topButton} onPress={toggleCameraFacing}>
                    <Text style={styles.topButtonText}>🔄</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.topButton} onPress={handleGoHome}>
                    <Text style={styles.topButtonText}>🏠</Text>
                </TouchableOpacity>
            </View>

            {/* Сообщение о записи */}
            {isRecording && (
                <View style={styles.recordingInfo}>
                    <Text style={styles.recordingInfoText}>
                        🎬 Таймер активен{'\n'}
                        📱 Запустите запись экрана в Пункте управления
                    </Text>
                </View>
            )}

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

            {/* ВСТРОЕННЫЙ ТАЙМЕР В КАМЕРУ - ТОЛЬКО ВО ВРЕМЯ ЗАПИСИ */}
            {isRecording && (
                <View style={styles.cameraOverlay}>
                    <Text style={styles.cameraTimerText}>{formatTime(timerState.seconds)}</Text>
                    <Text style={styles.cameraPhaseText}>{phaseInfo.name}</Text>
                    <Text style={styles.cameraProgressText}>
                        {timerState.intervalIdx}/{timerState.cycles} • Сет {timerState.setIdx + 1}
                    </Text>
                </View>
            )}

            {/* Обычный таймер - для превью (когда НЕ записываем) */}
            {!isRecording && (
                <View style={styles.timerContainer}>
                    <View style={styles.timerCircle}>
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
                            <Text style={styles.phaseText}>{phaseInfo.name}</Text>
                            {currentDescription && (
                                <Text style={styles.timerDescription}>{currentDescription}</Text>
                            )}
                            <Text style={styles.progressText}>
                                Интервал {timerState.intervalIdx} / Сет {timerState.setIdx + 1}
                            </Text>
                        </View>
                    </View>
                </View>
            )}

            {/* Кнопки управления - ВСЕ ВСЕГДА ВИДНЫ */}
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
    recordingInfo: {
        position: 'absolute',
        top: 120,
        left: 20,
        right: 20,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        padding: 12,
        borderRadius: 10,
        zIndex: 5,
    },
    recordingInfoText: {
        color: '#fff',
        fontSize: 13,
        textAlign: 'center',
        fontWeight: '500',
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