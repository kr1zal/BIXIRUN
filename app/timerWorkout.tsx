import ProgressCircle from '@/components/timer/ProgressCircle';
import { Ionicons } from '@expo/vector-icons';
import { Camera, CameraView } from 'expo-camera';
import * as MediaLibrary from 'expo-media-library';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { playBeep } from './utils/sound';

export default function TimerWorkoutScreen() {
    const router = useRouter();
    // Получаем параметры из route
    const params = useLocalSearchParams();
    // Инициализируем локальное состояние таймера из params
    const [timerState, setTimerState] = useState({
        prep: Number(params.prep) || 2,
        work: Number(params.work) || 60,
        rest: Number(params.rest) || 0,
        cycles: Number(params.cycles) || 8,
        sets: Number(params.sets) || 1,
        restBetweenSets: Number(params.restBetweenSets) || 0,
        descWork: params.descWork ? String(params.descWork) : '',
        descRest: params.descRest ? String(params.descRest) : ''
    });
    const [timer, setTimer] = useState({
        phase: 'prep',
        seconds: Number(params.prep) || 2,
        intervalIdx: 0,
        setIdx: 0,
        running: false
    });
    const cameraRef = useRef(null);
    const [hasPermission, setHasPermission] = useState<boolean | null>(null);
    const [isRecording, setIsRecording] = useState(false);
    const [cameraReady, setCameraReady] = useState(false);
    const [videoTimer, setVideoTimer] = useState(0);
    const [intervalId, setIntervalId] = useState<any>(null);
    const [facing, setFacing] = useState<'front' | 'back'>('back');

    // Camera permissions
    useEffect(() => {
        (async () => {
            const { status: cameraStatus } = await Camera.requestCameraPermissionsAsync();
            const { status: audioStatus } = await Camera.requestMicrophonePermissionsAsync();
            const { status: mediaStatus } = await MediaLibrary.requestPermissionsAsync();
            setHasPermission(cameraStatus === 'granted' && audioStatus === 'granted' && mediaStatus === 'granted');
            if (!(cameraStatus === 'granted' && audioStatus === 'granted' && mediaStatus === 'granted')) {
                Alert.alert('Нет доступа', 'Для записи видео нужны разрешения на камеру, микрофон и галерею');
            }
        })();
    }, []);

    // Таймерный тик + звук
    useEffect(() => {
        if (!timer.running) return;
        const id = setInterval(() => {
            if (timer.seconds > 0) {
                setTimer((prev) => ({ ...prev, seconds: prev.seconds - 1 }));
            } else {
                // Переход по фазам
                let nextPhase = timer.phase;
                let nextSeconds = 0;
                let nextIntervalIdx = timer.intervalIdx;
                let nextSetIdx = timer.setIdx;
                if (timer.phase === 'prep') {
                    nextPhase = 'work';
                    nextSeconds = timerState.work;
                    nextIntervalIdx = 1;
                } else if (timer.phase === 'work') {
                    if (timerState.cycles > 1 && timer.intervalIdx < timerState.cycles) {
                        nextPhase = 'rest';
                        nextSeconds = timerState.rest;
                    } else if (timerState.sets > 1 && timer.setIdx < timerState.sets - 1) {
                        nextPhase = 'restSet';
                        nextSeconds = timerState.restBetweenSets;
                    } else {
                        nextPhase = 'done';
                        nextSeconds = 0;
                    }
                    nextIntervalIdx = timer.intervalIdx + 1;
                } else if (timer.phase === 'rest') {
                    nextPhase = 'work';
                    nextSeconds = timerState.work;
                } else if (timer.phase === 'restSet') {
                    nextSetIdx = timer.setIdx + 1;
                    nextIntervalIdx = 1;
                    nextPhase = 'work';
                    nextSeconds = timerState.work;
                } else if (timer.phase === 'done') {
                    setTimer((prev) => ({ ...prev, running: false }));
                    return;
                }
                setTimer({
                    ...timer,
                    phase: nextPhase,
                    seconds: nextSeconds,
                    intervalIdx: nextIntervalIdx,
                    setIdx: nextSetIdx,
                });
                playBeep().catch(console.error);
            }
        }, 1000);
        return () => clearInterval(id);
    }, [timer.running, timer.seconds]);

    // Видео запись
    const startRecording = async () => {
        if (!cameraRef.current) return;
        setIsRecording(true);
        setVideoTimer(0);
        const id = setInterval(() => setVideoTimer((t) => t + 1), 1000);
        setIntervalId(id);
        try {
            const video = await (cameraRef.current as any).recordAsync({
                quality: '720p',
                maxDuration: 600,
                mute: false,
            });
            if (intervalId) clearInterval(intervalId);
            setIsRecording(false);
            setVideoTimer(0);
            try {
                await MediaLibrary.saveToLibraryAsync(video.uri);
                Alert.alert('Видео сохранено', 'Тренировка записана и сохранена в галерею');
            } catch (e) {
                Alert.alert('Ошибка', 'Не удалось сохранить видео');
            }
        } catch (e) {
            setIsRecording(false);
            if (intervalId) clearInterval(intervalId);
            Alert.alert('Ошибка', 'Не удалось начать запись');
        }
    };

    const stopRecording = async () => {
        if (!cameraRef.current) return;
        try {
            await (cameraRef.current as any).stopRecording();
        } catch (e) {
            Alert.alert('Ошибка', 'Не удалось остановить запись');
        }
    };

    // Старт тренировки (таймер + видео)
    const handleStart = () => {
        setTimer({
            phase: 'prep',
            seconds: timerState.prep,
            intervalIdx: 0,
            setIdx: 0,
            running: true
        });
        startRecording();
    };

    // Функция для вычисления максимального значения для текущей фазы
    const getMaxValue = () => {
        switch (timer.phase) {
            case 'prep': return timerState.prep;
            case 'work': return timerState.work;
            case 'rest': return timerState.rest;
            case 'restSet': return timerState.restBetweenSets;
            default: return 1;
        }
    };
    const maxValue = getMaxValue();
    const progress = maxValue > 0 ? 1 - timer.seconds / maxValue : 1;

    // Обновлённая кнопка стоп
    const handleStop = async () => {
        setTimer({
            phase: 'prep',
            seconds: timerState.prep,
            intervalIdx: 0,
            setIdx: 0,
            running: false
        });
        setIsRecording(false);
        setVideoTimer(0);
        if (isRecording && cameraRef.current) {
            try {
                await (cameraRef.current as any).stopRecording();
                // Видео сохранится автоматически, если нет — можно добавить Alert для ручного сохранения
            } catch (e) {
                Alert.alert('Ошибка', 'Не удалось остановить запись');
            }
        }
    };

    // Пауза таймера
    const handlePause = () => {
        setTimer((prev) => ({ ...prev, running: false }));
    };
    // Продолжить таймер
    const handleResume = () => {
        setTimer((prev) => ({ ...prev, running: true }));
    };
    // Сброс таймера и остановка видео
    const handleReset = async () => {
        setTimer({
            phase: 'prep',
            seconds: timerState.prep,
            intervalIdx: 0,
            setIdx: 0,
            running: false
        });
        setIsRecording(false);
        setVideoTimer(0);
        if (isRecording && cameraRef.current) {
            try {
                await (cameraRef.current as any).stopRecording();
            } catch (e) {
                // ignore
            }
        }
    };

    if (hasPermission === null) {
        return <View style={styles.center}><Text>Запрашиваем разрешения...</Text></View>;
    }
    if (hasPermission === false) {
        return <View style={styles.center}><Text>Нет доступа к камере/микрофону/галерее</Text></View>;
    }

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#f8f9fa' }}>
            <View style={{ flex: 1 }}>
                <View style={{ flex: 2, position: 'relative' }}>
                    {/* @ts-ignore */}
                    <CameraView
                        ref={cameraRef}
                        style={{ flex: 1 }}
                        facing={facing}
                        ratio="16:9"
                        onCameraReady={() => setCameraReady(true)}
                    />
                    <TouchableOpacity
                        style={{ position: 'absolute', top: 24, right: 24, backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 24, padding: 8, zIndex: 10 }}
                        onPress={() => setFacing(facing === 'back' ? 'front' : 'back')}
                    >
                        <Ionicons name="camera-reverse-outline" size={28} color="#fff" />
                    </TouchableOpacity>
                </View>
                <View style={{ flex: 3, backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, marginTop: -24, padding: 16, alignItems: 'center' }}>
                    {/* Таймер UI */}
                    <Text style={{ fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 8 }}>
                        {timer.phase === 'prep' ? 'Подготовка' : timer.phase === 'work' ? 'Работа' : timer.phase === 'rest' ? 'Отдых' : timer.phase === 'restSet' ? 'Отдых между сетами' : 'Завершено'}
                    </Text>
                    {(timer.phase !== 'done') && (
                        <Text style={{ fontSize: 16, color: '#888', textAlign: 'center', marginBottom: 8 }}>
                            {`Интервал ${timer.intervalIdx || 1}/${timerState.cycles}  Сет ${timer.setIdx + 1}/${timerState.sets}`}
                        </Text>
                    )}
                    {/* Время сверху */}
                    <Text style={{ fontSize: 40, fontWeight: 'bold', textAlign: 'center', marginBottom: 8 }}>
                        {String(timer.seconds).padStart(2, '0')}
                    </Text>
                    {/* Круговой прогресс */}
                    <ProgressCircle progress={progress} size={160} stroke={10} color="#e53935" showPercentage={true} />
                    {/* Кнопки управления */}
                    <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 24, gap: 12 }}>
                        {/* Старт */}
                        {!timer.running && timer.phase !== 'done' && (
                            <TouchableOpacity style={styles.startButton} onPress={handleStart}>
                                <Text style={styles.startButtonText}>Старт</Text>
                            </TouchableOpacity>
                        )}
                        {/* Пауза */}
                        {timer.running && (
                            <TouchableOpacity style={styles.pauseButton} onPress={handlePause}>
                                <Text style={styles.pauseButtonText}>Пауза</Text>
                            </TouchableOpacity>
                        )}
                        {/* Продолжить */}
                        {!timer.running && timer.phase !== 'done' && timer.phase !== 'prep' && (
                            <TouchableOpacity style={styles.startButton} onPress={handleResume}>
                                <Text style={styles.startButtonText}>Продолжить</Text>
                            </TouchableOpacity>
                        )}
                        {/* Стоп */}
                        {timer.running && (
                            <TouchableOpacity style={styles.stopButton} onPress={handleStop}>
                                <Text style={styles.stopButtonText}>Стоп</Text>
                            </TouchableOpacity>
                        )}
                        {/* Сброс */}
                        <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
                            <Text style={styles.resetButtonText}>Сброс</Text>
                        </TouchableOpacity>
                    </View>
                    {/* Кнопки перехода */}
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 24, width: '100%' }}>
                        <TouchableOpacity style={styles.navButton} onPress={() => router.replace('/')}>
                            <Text style={styles.navButtonText}>На главную</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.navButton} onPress={() => router.replace('/timer')}>
                            <Text style={styles.navButtonText}>К настройке таймера</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    startButton: {
        backgroundColor: '#4caf50',
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
        margin: 8,
    },
    startButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    stopButton: {
        backgroundColor: '#e53935',
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
        margin: 8,
    },
    stopButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    pauseButton: {
        backgroundColor: '#ff9800',
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
        margin: 8,
    },
    pauseButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    resetButton: {
        backgroundColor: '#9e9e9e',
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
        margin: 8,
    },
    resetButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    navButton: {
        backgroundColor: '#4caf50',
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
        margin: 8,
    },
    navButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
}); 