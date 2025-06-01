import React, { useEffect, useRef, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { isUserLoggedIn } from '@/src/services/supabaseClient';
import { forceSyncWithCloud } from '@/src/utils/timerStorage';

// Интервал синхронизации в миллисекундах
const SYNC_INTERVAL = 10 * 60 * 1000; // 10 минут
const SYNC_INTERVAL_BACKGROUND = 30 * 60 * 1000; // 30 минут в фоновом режиме

/**
 * Компонент для управления фоновой синхронизацией данных
 * Отслеживает состояние приложения и сети, выполняет синхронизацию
 * в оптимальные моменты для минимизации использования ресурсов
 */
const SyncManager: React.FC = () => {
    const appState = useRef(AppState.currentState);
    const lastSyncTime = useRef<number>(0);
    const syncTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [isOnline, setIsOnline] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);

    // Выполняет синхронизацию если пользователь авторизован и сеть доступна
    const performSync = async (force = false) => {
        // Предотвращаем параллельную синхронизацию
        if (isSyncing) return;

        try {
            setIsSyncing(true);

            // Проверяем, авторизован ли пользователь
            const loggedIn = await isUserLoggedIn();
            if (!loggedIn || !isOnline) {
                setIsSyncing(false);
                return;
            }

            console.log(`Starting ${force ? 'forced' : 'background'} sync...`);

            // Выполняем синхронизацию
            await forceSyncWithCloud(force);

            // Сохраняем время последней синхронизации
            lastSyncTime.current = Date.now();
            await AsyncStorage.setItem('lastBackgroundSync', lastSyncTime.current.toString());

            console.log('Background sync completed');
            setIsSyncing(false);
        } catch (error) {
            console.error('Background sync error:', error);
            setIsSyncing(false);
        }
    };

    // Планирует следующую синхронизацию в зависимости от состояния приложения
    const scheduleNextSync = (isBackground = false) => {
        if (syncTimeoutRef.current) {
            clearTimeout(syncTimeoutRef.current);
        }

        // Выбираем интервал в зависимости от состояния приложения
        const interval = isBackground ? SYNC_INTERVAL_BACKGROUND : SYNC_INTERVAL;

        syncTimeoutRef.current = setTimeout(() => {
            performSync();
            scheduleNextSync(isBackground);
        }, interval);
    };

    // Обработчик изменения состояния приложения
    const handleAppStateChange = async (nextAppState: AppStateStatus) => {
        // Приложение вернулось из фона
        if (appState.current === 'background' && nextAppState === 'active') {
            // Проверяем, прошло ли достаточно времени с последней синхронизации
            const timeSinceLastSync = Date.now() - lastSyncTime.current;

            if (timeSinceLastSync > SYNC_INTERVAL) {
                await performSync(true); // Принудительная синхронизация
            }

            // Восстанавливаем нормальный интервал синхронизации
            scheduleNextSync(false);
        }
        // Приложение уходит в фон
        else if (nextAppState === 'background') {
            // Финальная синхронизация перед уходом в фон
            const timeSinceLastSync = Date.now() - lastSyncTime.current;
            if (timeSinceLastSync > SYNC_INTERVAL / 2) {
                await performSync(false);
            }

            // Устанавливаем увеличенный интервал для фонового режима
            scheduleNextSync(true);
        }

        appState.current = nextAppState;
    };

    // Инициализация при загрузке
    useEffect(() => {
        // Загружаем время последней синхронизации
        AsyncStorage.getItem('lastBackgroundSync')
            .then(value => {
                if (value) {
                    lastSyncTime.current = parseInt(value);
                }
            })
            .catch(error => console.error('Error loading last sync time:', error));

        // Подписываемся на изменения состояния приложения
        const subscription = AppState.addEventListener('change', handleAppStateChange);

        // Подписываемся на изменения сетевого подключения
        const unsubscribeNetInfo = NetInfo.addEventListener((state: NetInfoState) => {
            const newIsOnline = state.isConnected === true && state.isInternetReachable === true;
            const wasOffline = !isOnline;

            setIsOnline(newIsOnline);

            // Если сеть восстановилась - синхронизируемся
            if (newIsOnline && wasOffline) {
                performSync(true); // Полная синхронизация при восстановлении соединения
            }
        });

        // Запускаем планировщик синхронизации
        scheduleNextSync(false);

        // Первичная синхронизация при запуске (с задержкой, чтобы не влиять на запуск приложения)
        setTimeout(() => {
            performSync(false);
        }, 3000);

        // Очистка при размонтировании
        return () => {
            subscription.remove();
            unsubscribeNetInfo();

            if (syncTimeoutRef.current) {
                clearTimeout(syncTimeoutRef.current);
            }
        };
    }, [isOnline]);

    // Компонент не рендерит UI
    return null;
};

export default SyncManager; 