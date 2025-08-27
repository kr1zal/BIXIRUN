import { Stack, useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function TimerScreen() {
    const router = useRouter();

    // ✅ ИСПРАВЛЕНИЕ: Перенаправляем на новый экран настроек
    useEffect(() => {
        router.replace('/timer-settings');
    }, [router]);

    // Простая заглушка пока происходит перенаправление
    return (
        <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <Stack.Screen
                options={{
                    title: 'Таймер',
                    headerTitleAlign: 'center',
                }}
            />
            <Text>Перенаправление на настройки...</Text>
        </SafeAreaView>
    );
}
