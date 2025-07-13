import { Camera } from 'expo-camera';
import * as MediaLibrary from 'expo-media-library';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function WorkoutSessionScreen() {
    const cameraRef = useRef(null);
    const [hasPermission, setHasPermission] = useState<boolean | null>(null);
    const [isRecording, setIsRecording] = useState(false);
    const [timer, setTimer] = useState(0);
    const [intervalId, setIntervalId] = useState<ReturnType<typeof setInterval> | null>(null);
    const [cameraReady, setCameraReady] = useState(false);

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

    useEffect(() => {
        if (hasPermission && cameraReady && !isRecording) {
            startRecording();
        }
        return () => {
            if (intervalId) clearInterval(intervalId);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [hasPermission, cameraReady]);

    const startRecording = async () => {
        if (!cameraRef.current) return;
        setIsRecording(true);
        setTimer(0);
        const id = setInterval(() => setTimer((t) => t + 1), 1000);
        setIntervalId(id);
        try {
            const video = await (cameraRef.current as any).recordAsync({
                quality: '720p',
                maxDuration: 600, // safety: 10 минут
                mute: false,
            });
            if (intervalId) clearInterval(intervalId);
            setIsRecording(false);
            setTimer(0);
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

    if (hasPermission === null) {
        return <View style={styles.center}><Text>Запрашиваем разрешения...</Text></View>;
    }
    if (hasPermission === false) {
        return <View style={styles.center}><Text>Нет доступа к камере/микрофону/галерее</Text></View>;
    }

    return (
        <View style={styles.container}>
            {/* @ts-ignore */}
            <Camera
                ref={cameraRef}
                style={StyleSheet.absoluteFill}
                type={'back'}
                ratio="16:9"
                onCameraReady={() => setCameraReady(true)}
            />
            <View style={styles.overlay}>
                <Text style={styles.timer}>{timer}s</Text>
                {isRecording && (
                    <TouchableOpacity style={styles.stopBtn} onPress={stopRecording}>
                        <Text style={styles.stopText}>Стоп</Text>
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000' },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    overlay: {
        position: 'absolute',
        top: 40,
        left: 0,
        right: 0,
        alignItems: 'center',
        zIndex: 10,
    },
    timer: {
        color: '#fff',
        fontSize: 32,
        fontWeight: 'bold',
        marginBottom: 24,
    },
    stopBtn: {
        backgroundColor: '#e53935',
        borderRadius: 32,
        paddingVertical: 16,
        paddingHorizontal: 40,
    },
    stopText: {
        color: '#fff',
        fontSize: 20,
        fontWeight: 'bold',
    },
}); 