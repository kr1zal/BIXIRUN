// Import polyfills are handled at the app root level
// No need to import polyfills here since they're loaded in App.tsx

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

const SYNC_CACHE_EXPIRATION = 5 * 60 * 1000; // 5 минут

// Create Supabase client with AsyncStorage for local session storage
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
    }
});

// Типы для работы с пресетами таймера
export interface TimerPresetData {
    id?: string;
    user_id?: string;
    name: string;
    prep: number;
    work: number;
    rest: number;
    cycles: number;
    sets: number;
    rest_between_sets: number;
    desc_work?: string;
    desc_rest?: string;
    created_at?: string;
    updated_at?: string;
    is_synced?: boolean;
    local_id?: string; // Локальный ID для неавторизованных пользователей
}

// Тип товара для фронта
export interface ProductData {
    id: string;
    name: string;
    images: string[];
    price: number;
    old_price?: number | null;
    discount?: number | null;
    description?: string;
    specs?: Record<string, any>;
    reviews?: any[];
}

// Функция для получения текущего пользователя
export const getCurrentUser = async () => {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        return user;
    } catch (error) {
        console.error('Ошибка при получении информации о пользователе:', error);
        return null;
    }
};

// Проверка, авторизован ли пользователь
export const isUserLoggedIn = async (): Promise<boolean> => {
    const user = await getCurrentUser();
    return user !== null;
};

// Функция для авторизации
export const signIn = async (email: string, password: string) => {
    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (error) throw error;

        // После успешного входа синхронизируем локальные данные с облаком
        await syncLocalToCloud();

        return data;
    } catch (error: any) {
        console.error('Ошибка входа:', error.message);
        throw error;
    }
};

// Функция для регистрации
export const signUp = async (email: string, password: string) => {
    try {
        const { data, error } = await supabase.auth.signUp({
            email,
            password
        });

        if (error) throw error;

        // После успешной регистрации синхронизируем локальные данные с облаком
        await syncLocalToCloud();

        return data;
    } catch (error: any) {
        console.error('Ошибка регистрации:', error.message);
        throw error;
    }
};

// Функция для выхода из аккаунта
export const signOut = async () => {
    try {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
    } catch (error: any) {
        console.error('Ошибка выхода:', error.message);
        throw error;
    }
};

// Синхронизация локальных данных с облаком
// Вызывается после входа или регистрации
export const syncLocalToCloud = async (): Promise<void> => {
    try {
        const user = await getCurrentUser();
        if (!user) return;

        // Получаем локальные пресеты, которые не синхронизированы
        const localPresets = await AsyncStorage.getItem('bixirun_timer_presets');
        if (!localPresets) return;

        const parsedPresets: TimerPresetData[] = JSON.parse(localPresets);
        const unsyncedPresets = parsedPresets.filter(preset => !preset.is_synced);

        if (unsyncedPresets.length === 0) return;

        // Преобразуем в формат Supabase и загружаем пакетом
        const supabasePresets = unsyncedPresets.map(preset => ({
            ...preset,
            user_id: user.id,
            updated_at: new Date().toISOString()
        }));

        const { data, error } = await supabase
            .from('timer_presets')
            .upsert(supabasePresets, { onConflict: 'id' })
            .select();

        if (error) throw error;

        // Обновляем статус синхронизации локальных пресетов
        const updatedPresets = parsedPresets.map(preset => {
            const syncedPreset = data?.find(sp => sp.id === preset.id || sp.local_id === preset.local_id);
            if (syncedPreset) {
                return {
                    ...preset,
                    id: syncedPreset.id,
                    is_synced: true
                };
            }
            return preset;
        });

        await AsyncStorage.setItem('bixirun_timer_presets', JSON.stringify(updatedPresets));
        await AsyncStorage.setItem('lastSyncTimestamp', Date.now().toString());

    } catch (error: any) {
        console.error('Ошибка синхронизации локальных данных:', error.message);
    }
};

// Функции для работы с пресетами таймера
// Получение всех пресетов пользователя с кэшированием
export const getTimerPresets = async (): Promise<TimerPresetData[]> => {
    try {
        const user = await getCurrentUser();

        // Проверяем, нужно ли обновлять кэш
        const lastSync = await AsyncStorage.getItem('lastSyncTimestamp');
        const cacheValid = lastSync && (Date.now() - parseInt(lastSync)) < SYNC_CACHE_EXPIRATION;

        // Если пользователь авторизован и кэш устарел, получаем данные с сервера
        if (user && !cacheValid) {
            const { data, error } = await supabase
                .from('timer_presets')
                .select('*')
                .eq('user_id', user.id)
                .order('updated_at', { ascending: false });

            if (error) throw error;

            // Сохраняем в кэш
            if (data) {
                await AsyncStorage.setItem('bixirun_timer_presets', JSON.stringify(
                    data.map(preset => ({ ...preset, is_synced: true }))
                ));
                await AsyncStorage.setItem('lastSyncTimestamp', Date.now().toString());
            }

            return data || [];
        }

        // В остальных случаях возвращаем локальные данные
        const localPresets = await AsyncStorage.getItem('bixirun_timer_presets');
        return localPresets ? JSON.parse(localPresets) : [];

    } catch (error: any) {
        console.error('Ошибка получения пресетов:', error.message);

        // В случае ошибки возвращаем локальные данные
        const localPresets = await AsyncStorage.getItem('bixirun_timer_presets');
        return localPresets ? JSON.parse(localPresets) : [];
    }
};

// Создание нового пресета - работает с или без авторизации
export const createTimerPreset = async (preset: Omit<TimerPresetData, 'id' | 'user_id' | 'created_at'>): Promise<TimerPresetData> => {
    try {
        const user = await getCurrentUser();
        const localId = preset.local_id || uuidv4(); // Используем существующий local_id или генерируем новый

        // Если пользователь авторизован, создаем в Supabase
        if (user) {
            const { data, error } = await supabase
                .from('timer_presets')
                .insert([{
                    ...preset,
                    user_id: user.id,
                    updated_at: new Date().toISOString(),
                    local_id: localId
                }])
                .select()
                .single();

            if (error) throw error;

            // Сохраняем в локальное хранилище
            const newPreset = { ...data, is_synced: true };
            await saveToLocalStorage(newPreset);

            return newPreset;
        }

        // Если пользователь не авторизован, сохраняем только локально
        const newPreset = {
            ...preset,
            id: localId,
            local_id: localId,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            is_synced: false
        };

        await saveToLocalStorage(newPreset);
        return newPreset;

    } catch (error: any) {
        console.error('Ошибка создания пресета:', error.message);

        // В случае ошибки сохраняем только локально
        const localId = preset.local_id || uuidv4();
        const newPreset = {
            ...preset,
            id: localId,
            local_id: localId,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            is_synced: false
        };

        await saveToLocalStorage(newPreset);
        return newPreset;
    }
};

// Сохранение пресета в локальное хранилище
const saveToLocalStorage = async (preset: TimerPresetData): Promise<void> => {
    const localPresets = await AsyncStorage.getItem('bixirun_timer_presets');
    const presets: TimerPresetData[] = localPresets ? JSON.parse(localPresets) : [];

    // Проверяем, существует ли пресет
    const existingIndex = presets.findIndex(p => p.id === preset.id || p.local_id === preset.local_id);

    if (existingIndex >= 0) {
        // Обновляем существующий
        presets[existingIndex] = preset;
    } else {
        // Добавляем новый
        presets.push(preset);
    }

    await AsyncStorage.setItem('bixirun_timer_presets', JSON.stringify(presets));
};

// Пакетная синхронизация - оптимизированная версия
export const batchSyncToCloud = async (presets: TimerPresetData[]): Promise<void> => {
    try {
        const user = await getCurrentUser();
        if (!user) return;

        // Получаем только несинхронизированные пресеты
        const unsyncedPresets = presets.filter(preset => !preset.is_synced);
        if (unsyncedPresets.length === 0) return;

        // Подготавливаем для Supabase
        const supabasePresets = unsyncedPresets.map(preset => ({
            ...preset,
            user_id: user.id,
            updated_at: new Date().toISOString(),
            local_id: preset.local_id || preset.id // Убеждаемся, что local_id всегда заполнен
        }));

        // Отправляем пакетом, используя local_id и user_id как ключи для разрешения конфликтов
        const { data, error } = await supabase
            .from('timer_presets')
            .upsert(supabasePresets, {
                onConflict: 'user_id,local_id',
                ignoreDuplicates: false // Перезаписывать при конфликте на основе updated_at
            })
            .select();

        if (error) throw error;

        // Обновляем статус синхронизации
        if (data) {
            const updatedPresets = presets.map(preset => {
                const syncedPreset = data.find(sp =>
                    sp.id === preset.id ||
                    (sp.local_id === preset.local_id && preset.local_id) ||
                    (sp.local_id === preset.id)
                );
                if (syncedPreset) {
                    return {
                        ...preset,
                        id: syncedPreset.id,
                        is_synced: true,
                        local_id: syncedPreset.local_id
                    };
                }
                return preset;
            });

            await AsyncStorage.setItem('bixirun_timer_presets', JSON.stringify(updatedPresets));
            await AsyncStorage.setItem('lastSyncTimestamp', Date.now().toString());
        }

    } catch (error: any) {
        console.error('Ошибка пакетной синхронизации:', error.message);
    }
};

// Обновление пресета - работает с или без авторизации
export const updateTimerPreset = async (id: string, preset: Partial<Omit<TimerPresetData, 'id' | 'user_id' | 'created_at'>>): Promise<TimerPresetData> => {
    try {
        const user = await getCurrentUser();

        // Получаем существующий пресет из локального хранилища
        const localPresets = await AsyncStorage.getItem('bixirun_timer_presets');
        const presets: TimerPresetData[] = localPresets ? JSON.parse(localPresets) : [];
        const existingPreset = presets.find(p => p.id === id || p.local_id === id);

        if (!existingPreset) {
            throw new Error('Пресет не найден');
        }

        // Убеждаемся, что у пресета есть local_id
        if (!existingPreset.local_id) {
            existingPreset.local_id = existingPreset.id || uuidv4();
        }

        // Обновляем данные
        const updatedPreset = {
            ...existingPreset,
            ...preset,
            updated_at: new Date().toISOString(),
            is_synced: user ? existingPreset.is_synced : false // Если пользователь не авторизован, помечаем для будущей синхронизации
        };

        // Если пользователь авторизован, обновляем в Supabase
        if (user) {
            try {
                // Используем local_id для обновления, так как именно он связывает локальные и облачные записи
                const { data, error } = await supabase
                    .from('timer_presets')
                    .update({
                        ...preset,
                        updated_at: updatedPreset.updated_at
                    })
                    .match({
                        'user_id': user.id,
                        'local_id': existingPreset.local_id
                    })
                    .select()
                    .single();

                if (!error && data) {
                    updatedPreset.is_synced = true;
                    updatedPreset.id = data.id; // Обновляем ID из облака, если он изменился
                }
            } catch (e) {
                console.error('Ошибка обновления в Supabase, обновляем только локально:', e);
                updatedPreset.is_synced = false;
            }
        }

        // Обновляем в локальном хранилище
        await saveToLocalStorage(updatedPreset);

        return updatedPreset;

    } catch (error: any) {
        console.error('Ошибка обновления пресета:', error.message);
        throw error;
    }
};

// Удаление пресета - работает с или без авторизации
export const deleteTimerPreset = async (id: string): Promise<void> => {
    try {
        const user = await getCurrentUser();

        // Найдем пресет, чтобы получить его local_id
        const localPresets = await AsyncStorage.getItem('bixirun_timer_presets');
        const presets: TimerPresetData[] = localPresets ? JSON.parse(localPresets) : [];
        const presetToDelete = presets.find(p => p.id === id || p.local_id === id);
        const localId = presetToDelete?.local_id || id;

        // Удаляем из локального хранилища
        const filteredPresets = presets.filter(p => p.id !== id && p.local_id !== id);
        await AsyncStorage.setItem('bixirun_timer_presets', JSON.stringify(filteredPresets));

        // Если пользователь авторизован, удаляем из Supabase
        if (user && presetToDelete) {
            try {
                // Находим запись по local_id и user_id для более точного удаления
                const { error } = await supabase
                    .from('timer_presets')
                    .delete()
                    .match({
                        user_id: user.id,
                        local_id: localId
                    });

                if (error) {
                    console.error('Ошибка при удалении из Supabase:', error);
                }
            } catch (e) {
                console.error('Ошибка удаления в Supabase, удалено только локально:', e);
            }
        }

    } catch (error: any) {
        console.error('Ошибка удаления пресета:', error.message);
        throw error;
    }
};

// Функция для обновления профиля пользователя
export const updateUserProfile = async (userData: { name?: string; avatar_url?: string }) => {
    try {
        const { data, error } = await supabase.auth.updateUser({
            data: userData
        });

        if (error) throw error;
        return data.user;
    } catch (error: any) {
        console.error('Ошибка обновления профиля:', error.message);
        throw error;
    }
};

// Получение всех товаров из Supabase
export const getProducts = async (): Promise<ProductData[]> => {
    try {
        const { data, error } = await supabase
            .from('products')
            .select('*');
        if (error) throw error;
        if (!data) return [];

        // Приводим к нужному формату
        return data.map((item: any) => {
            // --- Фикс парсинга images ---
            let images: string[] = [];
            if (Array.isArray(item.images)) {
                images = item.images;
            } else if (typeof item.images === 'string') {
                // Supabase Postgres-style array: '{"url1","url2"}'
                try {
                    images = item.images
                        .replace(/^{|}$/g, '') // remove curly braces
                        .split(/","|",|,|"/)
                        .map((s: string) => s.replace(/^"|"$/g, '').trim())
                        .filter((s: string) => s.length && s.startsWith('http'));
                } catch (e) {
                    images = [];
                }
            }
            // Debug log
            if (__DEV__) console.log('Product images:', images);

            // --- Фикс парсинга specs ---
            let specs: Record<string, any> = {};
            if (typeof item.specs === 'object' && item.specs !== null) {
                specs = item.specs;
            } else if (typeof item.specs === 'string') {
                try {
                    specs = JSON.parse(item.specs);
                } catch (e) {
                    specs = {};
                }
            }

            return {
                id: item.id || item.productId || item.uid || '',
                name: item.name,
                images,
                price: typeof item.price === 'number' ? item.price : Number(item.price) || 0,
                old_price: item.old_price ? Number(item.old_price) : null,
                discount: item.discount ? Number(item.discount) : null,
                description: item.description || '',
                specs
            };
        }).filter((item: ProductData) => item.id && item.name);
    } catch (e) {
        console.error('Ошибка получения товаров из Supabase:', e);
        return [];
    }
}; 