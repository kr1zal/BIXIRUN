import { TimerPreset } from '../../components/timer/TimerPresetSelector';
import {
    batchSyncToCloud,
    createTimerPreset,
    deleteTimerPreset as deleteSupabasePreset,
    getTimerPresets as getSupabasePresets,
    isUserLoggedIn,
    updateTimerPreset as updateSupabasePreset
} from '../supabaseClient';
import { getData, STORAGE_KEYS, storeData } from './storage';

// Кэш для хранения последнего времени синхронизации по категориям
const syncTimestamps: Record<string, number> = {};
const SYNC_CACHE_DURATION = 5 * 60 * 1000; // 5 минут

/**
 * Загружает пресеты таймера из хранилища с оптимизацией производительности
 * @param forceRefresh Принудительное обновление из облака (если пользователь авторизован)
 * @returns Promise с массивом пресетов таймера
 */
export const loadTimerPresets = async (forceRefresh = false): Promise<TimerPreset[]> => {
    try {
        // Проверяем, нужно ли обновление кэша
        const lastSyncTime = syncTimestamps['timer_presets'] || 0;
        const isCacheValid = Date.now() - lastSyncTime < SYNC_CACHE_DURATION;

        // Если кэш действителен и не требуется принудительное обновление, возвращаем локальные данные
        if (isCacheValid && !forceRefresh) {
            const localPresets = await getData<TimerPreset[]>(STORAGE_KEYS.TIMER_PRESETS);
            return localPresets || [];
        }

        // Проверяем, авторизован ли пользователь
        const loggedIn = await isUserLoggedIn();

        if (loggedIn) {
            // Получаем пресеты из Supabase
            try {
                const supabasePresets = await getSupabasePresets();

                // Преобразуем формат данных
                const appPresets = supabasePresets.map(convertSupabaseToAppPreset);

                // Обновляем локальное хранилище
                await storeData(STORAGE_KEYS.TIMER_PRESETS, appPresets);

                // Обновляем временную метку синхронизации
                syncTimestamps['timer_presets'] = Date.now();

                return appPresets;
            } catch (error) {
                console.error('Ошибка загрузки пресетов из Supabase:', error);
                // Если Supabase недоступен, возвращаем локальные данные
                const localPresets = await getData<TimerPreset[]>(STORAGE_KEYS.TIMER_PRESETS);
                return localPresets || [];
            }
        } else {
            // Если пользователь не авторизован, возвращаем локальные данные
            const localPresets = await getData<TimerPreset[]>(STORAGE_KEYS.TIMER_PRESETS);
            return localPresets || [];
        }
    } catch (error) {
        console.error('Error loading timer presets:', error);
        return [];
    }
};

/**
 * Сохраняет пресеты таймера в хранилище с поддержкой дифференциальной синхронизации
 * @param presets Массив пресетов таймера для сохранения
 */
export const saveTimerPresets = async (presets: TimerPreset[]): Promise<void> => {
    try {
        // Сохраняем в локальное хранилище
        await storeData(STORAGE_KEYS.TIMER_PRESETS, presets);

        // Проверяем, авторизован ли пользователь, и синхронизируем с облаком
        const loggedIn = await isUserLoggedIn();

        if (loggedIn) {
            try {
                // Преобразуем пресеты в формат Supabase
                const supabasePresets = presets.map(preset => {
                    const supabasePreset = convertAppToSupabasePreset(preset);
                    const payload: any = {
                        ...supabasePreset,
                        updated_at: new Date().toISOString()
                    };
                    // Передаем id/local_id только если это валидный UUID
                    if (isUuid(preset.id)) {
                        payload.id = preset.id;
                        // convertAppToSupabasePreset уже добавит local_id
                    }
                    return payload;
                });

                // Выполняем пакетную синхронизацию с облаком
                await batchSyncToCloud(supabasePresets);

                // Обновляем временную метку синхронизации
                syncTimestamps['timer_presets'] = Date.now();
            } catch (error) {
                console.error('Ошибка синхронизации пресетов с Supabase:', error);
            }
        }

        console.log('Timer presets saved successfully');
    } catch (error) {
        console.error('Error saving timer presets:', error);
        throw error;
    }
};

/**
 * Сохраняет последние использованные настройки таймера
 * @param settings Настройки таймера
 */
export const saveLastUsedTimerSettings = async (settings: Omit<TimerPreset, 'id' | 'name'>): Promise<void> => {
    try {
        await storeData(STORAGE_KEYS.TIMER_LAST_SETTINGS, settings);
        console.log('Last used timer settings saved successfully');
    } catch (error) {
        console.error('Error saving last used timer settings:', error);
        throw error;
    }
};

/**
 * Загружает последние использованные настройки таймера
 * @returns Promise с настройками таймера или null
 */
export const loadLastUsedTimerSettings = async (): Promise<Omit<TimerPreset, 'id' | 'name'> | null> => {
    try {
        const settings = await getData<Omit<TimerPreset, 'id' | 'name'>>(STORAGE_KEYS.TIMER_LAST_SETTINGS);
        return settings;
    } catch (error) {
        console.error('Error loading last used timer settings:', error);
        return null;
    }
};

/**
 * Конвертирует данные пресета из формата Supabase в формат приложения
 */
const convertSupabaseToAppPreset = (supabasePreset: any): TimerPreset => {
    return {
        id: supabasePreset.id || supabasePreset.local_id || Date.now().toString(),
        name: supabasePreset.name,
        prep: supabasePreset.prep,
        work: supabasePreset.work,
        rest: supabasePreset.rest,
        cycles: supabasePreset.cycles,
        sets: supabasePreset.sets,
        restBetweenSets: supabasePreset.rest_between_sets,
        descWork: supabasePreset.desc_work,
        descRest: supabasePreset.desc_rest
    };
};

/**
 * Конвертирует данные пресета из формата приложения в формат Supabase
 */
const isUuid = (value: string | undefined | null): boolean => {
    if (!value) return false;
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
};

const convertAppToSupabasePreset = (appPreset: TimerPreset): any => {
    const base = {
        name: appPreset.name,
        prep: appPreset.prep,
        work: appPreset.work,
        rest: appPreset.rest,
        cycles: appPreset.cycles,
        sets: appPreset.sets,
        rest_between_sets: appPreset.restBetweenSets,
        desc_work: appPreset.descWork,
        desc_rest: appPreset.descRest,
    } as any;

    // local_id отправляем только если это валидный UUID (тип столбца UUID)
    if (isUuid(appPreset.id)) {
        base.local_id = appPreset.id;
    }

    return base;
};

/**
 * Добавляет новый пресет с оптимизированной синхронизацией
 * @param preset Новый пресет для добавления
 * @returns Promise с обновленным массивом пресетов
 */
export const addTimerPreset = async (preset: TimerPreset): Promise<TimerPreset[]> => {
    try {
        // Сначала получаем текущие пресеты
        const presets = await loadTimerPresets();

        // Сохраняем в Supabase, если пользователь авторизован
        let supabaseId: string | undefined;
        let finalPreset = { ...preset };

        try {
            const supabasePreset = await createTimerPreset(convertAppToSupabasePreset(preset));
            supabaseId = supabasePreset.id;

            // Обновляем временную метку синхронизации
            syncTimestamps['timer_presets'] = Date.now();
        } catch (error) {
            console.error('Failed to save preset to Supabase, saving locally only:', error);
        }

        // Обновляем ID если получили от Supabase
        if (supabaseId) {
            finalPreset = {
                ...preset,
                id: supabaseId
            };
        }

        // Добавляем в локальное хранилище
        const updatedPresets = [...presets, finalPreset];
        await storeData(STORAGE_KEYS.TIMER_PRESETS, updatedPresets);

        return updatedPresets;
    } catch (error) {
        console.error('Error adding timer preset:', error);
        throw error;
    }
};

/**
 * Удаляет пресет с оптимизированной синхронизацией
 * @param presetId ID пресета для удаления
 * @returns Promise с обновленным массивом пресетов
 */
export const deleteTimerPreset = async (presetId: string): Promise<TimerPreset[]> => {
    try {
        // Удаляем из Supabase
        try {
            await deleteSupabasePreset(presetId);
            // Обновляем временную метку синхронизации
            syncTimestamps['timer_presets'] = Date.now();
        } catch (error) {
            console.error('Failed to delete preset from Supabase:', error);
        }

        // Удаляем из локального хранилища
        const presets = await loadTimerPresets();
        const updatedPresets = presets.filter(preset => preset.id !== presetId);
        await storeData(STORAGE_KEYS.TIMER_PRESETS, updatedPresets);

        return updatedPresets;
    } catch (error) {
        console.error('Error deleting timer preset:', error);
        throw error;
    }
};

/**
 * Обновляет существующий пресет с оптимизированной синхронизацией
 * @param preset Пресет с обновленными данными
 * @returns Promise с обновленным массивом пресетов
 */
export const updateTimerPreset = async (preset: TimerPreset): Promise<TimerPreset[]> => {
    try {
        // Обновляем в Supabase
        try {
            await updateSupabasePreset({ ...convertAppToSupabasePreset(preset), id: preset.id });
            // Обновляем временную метку синхронизации
            syncTimestamps['timer_presets'] = Date.now();
        } catch (error) {
            console.error('Failed to update preset in Supabase:', error);
        }

        // Обновляем в локальном хранилище
        const presets = await loadTimerPresets(false); // Не обновляем из облака, чтобы избежать перезаписи
        const updatedPresets = presets.map(p => p.id === preset.id ? preset : p);
        await storeData(STORAGE_KEYS.TIMER_PRESETS, updatedPresets);

        return updatedPresets;
    } catch (error) {
        console.error('Error updating timer preset:', error);
        throw error;
    }
};

/**
 * Принудительная синхронизация с облаком
 * Полезно для вызова после авторизации/регистрации
 * @param force Если true, выполняет полную синхронизацию игнорируя кэши
 */
export const forceSyncWithCloud = async (force: boolean = false): Promise<TimerPreset[]> => {
    try {
        // Проверяем, авторизован ли пользователь
        const loggedIn = await isUserLoggedIn();

        if (!loggedIn) {
            // Если пользователь не авторизован, просто возвращаем локальные данные
            return loadTimerPresets(false);
        }

        // Получаем локальные пресеты
        const localPresets = await getData<TimerPreset[]>(STORAGE_KEYS.TIMER_PRESETS) || [];

        // Получаем пресеты из облака (полный список при force=true)
        const cloudPresets = await getSupabasePresets();
        const appCloudPresets = cloudPresets.map(convertSupabaseToAppPreset);

        // Проводим слияние данных с учетом updated_at:
        // При force=true приоритет у облачных данных, иначе выбираем более новые

        // Создаем Map для быстрого доступа по ID и local_id
        const cloudPresetsMap = new Map();
        appCloudPresets.forEach(cloudPreset => {
            cloudPresetsMap.set(cloudPreset.id, cloudPreset);
            if (cloudPreset.local_id) {
                cloudPresetsMap.set(cloudPreset.local_id, cloudPreset);
            }
        });

        const localPresetsMap = new Map();
        localPresets.forEach(localPreset => {
            localPresetsMap.set(localPreset.id, localPreset);
            if (localPreset.local_id) {
                localPresetsMap.set(localPreset.local_id, localPreset);
            }
        });

        // Объединяем пресеты
        const mergedPresets: TimerPreset[] = [];

        // Если force=true, приоритет у облачных данных
        if (force) {
            // Сначала добавляем все облачные пресеты
            appCloudPresets.forEach(cloudPreset => {
                mergedPresets.push(cloudPreset);
            });

            // Затем добавляем локальные пресеты, которых нет в облаке
            localPresets.forEach(localPreset => {
                // Проверяем по id и local_id
                const existsInCloud =
                    cloudPresetsMap.has(localPreset.id) ||
                    (localPreset.local_id && cloudPresetsMap.has(localPreset.local_id));

                if (!existsInCloud) {
                    mergedPresets.push(localPreset);
                }
            });
        } else {
            // В обычном режиме объединяем данные, выбирая более новые версии
            const allPresets = new Map();

            // Добавляем локальные пресеты
            localPresets.forEach(localPreset => {
                allPresets.set(localPreset.id, localPreset);
            });

            // Объединяем с облачными, отдавая приоритет более новым
            appCloudPresets.forEach(cloudPreset => {
                const localPreset = localPresetsMap.get(cloudPreset.id) ||
                    (cloudPreset.local_id && localPresetsMap.get(cloudPreset.local_id));

                if (!localPreset) {
                    // Если нет в локальном хранилище, добавляем облачный
                    allPresets.set(cloudPreset.id, cloudPreset);
                } else {
                    // Выбираем более новый на основе updated_at
                    const cloudUpdatedAt = new Date(cloudPreset.updated_at || 0).getTime();
                    const localUpdatedAt = new Date(localPreset.updated_at || 0).getTime();

                    if (cloudUpdatedAt > localUpdatedAt) {
                        allPresets.set(localPreset.id, cloudPreset);
                    }
                }
            });

            // Преобразуем Map в массив
            mergedPresets.push(...Array.from(allPresets.values()));
        }

        // Сохраняем объединенные пресеты
        await storeData(STORAGE_KEYS.TIMER_PRESETS, mergedPresets);

        // Синхронизируем локальные данные с облаком, чтобы убедиться, что все пресеты загружены
        await saveTimerPresets(mergedPresets);

        // Обновляем временную метку синхронизации
        syncTimestamps['timer_presets'] = Date.now();

        return mergedPresets;
    } catch (error) {
        console.error('Error syncing with cloud:', error);
        // Возвращаем локальные данные в случае ошибки
        return loadTimerPresets(false);
    }
};

/**
 * Функция для обратной совместимости со старым кодом.
 * Просто вызывает forceSyncWithCloud с параметром true для полной синхронизации.
 */
export const syncTimerPresets = async (): Promise<TimerPreset[]> => {
    return forceSyncWithCloud(true);
}; 