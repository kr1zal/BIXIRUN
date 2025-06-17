import ProgressCircle from '@/components/timer/ProgressCircle';
import { useTimer } from '@/hooks/useTimer';
import { Ionicons } from '@expo/vector-icons';
import { CameraType, CameraView, useCameraPermissions, useMicrophonePermissions } from 'expo-camera';
import * as MediaLibrary from 'expo-media-library';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function TimerWorkoutScreen() {
    const router = useRouter();

    // Используем единый хук для таймера
    const { timer, start, pause, reset, progress, getPhaseInfo } = useTimer();

    // Используем правильные хуки для разрешений
    const [cameraPermission, requestCameraPermission] = useCameraPermissions();
    const [microphonePermission, requestMicrophonePermission] = useMicrophonePermissions();
    const [mediaLibraryPermission, requestMediaLibraryPermission] = MediaLibrary.usePermissions();

    const [facing, setFacing] = useState<CameraType>('back');
    const [isRecording, setIsRecording] = useState(false);
    const [videoTimer, setVideoTimer] = useState(0);
    const [cameraReady, setCameraReady] = useState(false);
    const cameraRef = useRef<any>(null);

    // Запрос разрешений при загрузке
    useEffect(() => {
        if (!cameraPermission?.granted) {
            requestCameraPermission();
        }
        if (!microphonePermission?.granted) {
            requestMicrophonePermission();
        }
        if (!mediaLibraryPermission?.granted) {
            requestMediaLibraryPermission();
        }
    }, []);

    // Проверяем все разрешения
    const hasAllPermissions = cameraPermission?.granted &&
        microphonePermission?.granted &&
        mediaLibraryPermission?.granted;

    // Таймер для видео
    useEffect(() => {
        if (!isRecording) return;

        const id = setInterval(() => {
            setVideoTimer(prev => prev + 1);
        }, 1000);

        return () => clearInterval(id);
    }, [isRecording]);

    // Видео запись с правильным сохранением
    const startRecording = async () => {
        if (!cameraRef.current || !cameraReady) {
            Alert.alert('Ошибка', 'Камера не готова');
            return;
        }

        try {
            setIsRecording(true);
            setVideoTimer(0);

            // Просто начинаем запись, сохранение будет в stopRecording
            await (cameraRef.current as any).recordAsync({
                quality: '720p',
                maxDuration: 3600, // 1 час максимум
                mute: false,
            });

        } catch (error) {
            console.error('Recording error:', error);
            Alert.alert('Ошибка', 'Не удалось начать запись видео');
            setIsRecording(false);
            setVideoTimer(0);
        }
    };

    const stopRecording = async () => {
        if (!cameraRef.current || !isRecording) return;

        try {
            // Останавливаем запись и получаем видео
            const video = await (cameraRef.current as any).stopRecording();

            // Сохраняем видео в галерею
            if (video?.uri) {
                try {
                    const asset = await MediaLibrary.saveToLibraryAsync(video.uri);
                    Alert.alert(
                        'Видео сохранено',
                        'Тренировка записана и сохранена в галерею',
                        [{ text: 'OK' }]
                    );
                    console.log('Video saved:', asset);
                } catch (saveError) {
                    console.error('Save error:', saveError);
                    Alert.alert('Ошибка', 'Не удалось сохранить видео в галерею');
                }
            }
        } catch (error) {
            console.error('Stop recording error:', error);
            Alert.alert('Ошибка', 'Не удалось остановить запись');
        } finally {
            setIsRecording(false);
            setVideoTimer(0);
        }
    };

    // Старт тренировки (таймер + видео)
    const handleStart = () => {
        start();
        startRecording();
    };

    // Остановка таймера и видео
    const handleStop = async () => {
        reset();
        if (isRecording) {
            await stopRecording();
        }
    };

    // Пауза таймера
    const handlePause = () => {
        pause();
    };

    // Продолжить таймер
    const handleResume = () => {
        start();
    };

    // Сброс таймера и остановка видео
    const handleReset = async () => {
        reset();
        if (isRecording) {
            await stopRecording();
        }
    };

    // Проверка разрешений
    if (!cameraPermission || !microphonePermission || !mediaLibraryPermission) {
        return <View style={styles.center}><Text>Загрузка разрешений...</Text></View>;
    }

    if (!hasAllPermissions) {
        return (
            <View style={styles.center}>
                <Text style={{ textAlign: 'center', marginBottom: 20 }}>
                    Для записи тренировки нужны разрешения на камеру, микрофон и галерею
                </Text>
                {!cameraPermission.granted && (
                    <TouchableOpacity
                        style={styles.permissionButton}
                        onPress={requestCameraPermission}
                    >
                        <Text style={styles.permissionButtonText}>Разрешить камеру</Text>
                    </TouchableOpacity>
                )}
                {!microphonePermission.granted && (
                    <TouchableOpacity
                        style={styles.permissionButton}
                        onPress={requestMicrophonePermission}
                    >
                        <Text style={styles.permissionButtonText}>Разрешить микрофон</Text>
                    </TouchableOpacity>
                )}
                {!mediaLibraryPermission.granted && (
                    <TouchableOpacity
                        style={styles.permissionButton}
                        onPress={requestMediaLibraryPermission}
                    >
                        <Text style={styles.permissionButtonText}>Разрешить галерею</Text>
                    </TouchableOpacity>
                )}
            </View>
        );
    }

    const phaseInfo = getPhaseInfo();

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#f8f9fa' }}>
            <View style={{ flex: 1 }}>
                <View style={{ flex: 2, position: 'relative' }}>
                    <CameraView
                        ref={cameraRef}
                        style={{ flex: 1 }}
                        facing={facing}
                        onCameraReady={() => setCameraReady(true)}
                    />
                    <TouchableOpacity
                        style={{ position: 'absolute', top: 24, right: 24, backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 24, padding: 8, zIndex: 10 }}
                        onPress={() => setFacing(facing === 'back' ? 'front' : 'back')}
                    >
                        <Ionicons name="camera-reverse-outline" size={28} color="#fff" />
                    </TouchableOpacity>

                    {/* Индикатор записи */}
                    {isRecording && (
                        <View style={{ position: 'absolute', top: 24, left: 24, backgroundColor: 'rgba(255,0,0,0.8)', borderRadius: 12, padding: 8, flexDirection: 'row', alignItems: 'center' }}>
                            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#fff', marginRight: 8 }} />
                            <Text style={{ color: '#fff', fontSize: 14, fontWeight: 'bold' }}>
                                {Math.floor(videoTimer / 60)}:{(videoTimer % 60).toString().padStart(2, '0')}
                            </Text>
                        </View>
                    )}
                </View>

                <View style={{ flex: 3, backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, marginTop: -24, padding: 16, alignItems: 'center' }}>
                    {/* Таймер UI */}
                    <Text style={{ fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 8, color: phaseInfo.color }}>
                        {phaseInfo.name}
                    </Text>

                    {timer.phase !== 'done' && (
                        <Text style={{ fontSize: 16, color: '#888', textAlign: 'center', marginBottom: 8 }}>
                            {`Интервал ${timer.intervalIdx || 1}/${timer.cycles}  Сет ${timer.setIdx + 1}/${timer.sets}`}
                        </Text>
                    )}

                    {/* Время */}
                    <Text style={{ fontSize: 40, fontWeight: 'bold', textAlign: 'center', marginBottom: 8 }}>
                        {String(timer.seconds).padStart(2, '0')}
                    </Text>

                    {/* Круговой прогресс */}
                    <ProgressCircle progress={progress} size={160} stroke={10} color={phaseInfo.color} showPercentage={true} />

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
    center: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20
    },
    permissionButton: {
        backgroundColor: '#4caf50',
        padding: 12,
        borderRadius: 8,
        marginBottom: 10,
        minWidth: 200,
        alignItems: 'center',
    },
    permissionButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
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