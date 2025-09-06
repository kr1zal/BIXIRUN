import AsyncStorageModule from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';
import { AppState } from 'react-native';
import * as SecureStore from 'expo-secure-store';
// @ts-ignore Polyfill resolved by Metro in RN; type resolver may not find it here
require('react-native-url-polyfill/auto');

// Access via any to avoid type mismatch across envs
const extra: any = (Constants as any).expoConfig?.extra ?? {};
const SUPABASE_URL = extra.supabaseUrl || process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = extra.supabaseAnonKey || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

// Normalize AsyncStorage shape to the interface Supabase expects
const NormalizedAsyncStorage = {
    getItem: (key: string): Promise<string | null> => (AsyncStorageModule as any).getItem(key),
    setItem: (key: string, value: string): Promise<void> => (AsyncStorageModule as any).setItem(key, value),
    removeItem: (key: string): Promise<void> => (AsyncStorageModule as any).removeItem(key),
};

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
        storage: NormalizedAsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
    },
    realtime: {
        params: {
            // Отключаем сжатие WebSocket для избежания проблем с zlib
            'per-message-deflate': false,
        },
    },
});

// Автоматическое обновление сессии при активации приложения
AppState.addEventListener('change', (state) => {
    if (state === 'active') {
        supabase.auth.startAutoRefresh();
    } else {
        supabase.auth.stopAutoRefresh();
    }
});

// AUTH
export async function signUp(email: string, password: string) {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
    return data;
}

export async function signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
}

export async function signOut() {
    const { error } = await supabase.auth.signOut();
    // Безопасно очищаем биометрические артефакты из SecureStore
    try {
        await SecureStore.deleteItemAsync('biometric_refresh_token');
        // На случай старых версий приложения удаляем сохранённый пароль, если он был
        await SecureStore.deleteItemAsync('biometric_password');
    } catch (_e) {
        // не блокируем выход при ошибках удаления локального секрета
    }
    if (error) throw error;
}

export async function getCurrentUser() {
    const { data, error } = await supabase.auth.getUser();
    if (error) throw error;
    return data.user;
}

export async function isUserLoggedIn() {
    const { data } = await supabase.auth.getSession();
    return !!data.session;
}

// TIMER PRESETS (заготовки, реализуй по необходимости)
export async function getTimerPresets() {
    const { data, error } = await supabase.from('timer_presets').select('*');
    if (error) throw error;
    return data;
}

export async function createTimerPreset(preset: any) {
    // Вставка требует user_id по RLS и NOT NULL
    const { data: authData } = await supabase.auth.getUser();
    const userId = authData?.user?.id;
    const row = { ...preset, user_id: preset.user_id || userId };
    const { data, error } = await supabase.from('timer_presets').insert([row]).select();
    if (error) throw error;
    return data[0];
}

export async function updateTimerPreset(preset: any) {
    const { data, error } = await supabase.from('timer_presets').update(preset).eq('id', preset.id).select();
    if (error) throw error;
    return data[0];
}

export async function deleteTimerPreset(id: string) {
    const { error } = await supabase.from('timer_presets').delete().eq('id', id);
    if (error) throw error;
}

export async function batchSyncToCloud(presets: any[]) {
    // Гарантируем наличие user_id в каждой записи для соответствия уникальному индексу (user_id, local_id)
    const { data: authData } = await supabase.auth.getUser();
    const userId = authData?.user?.id;
    const rows = (presets || []).map((p: any) => {
        const row: any = { ...p, user_id: p.user_id || userId || p.userId };
        // Всегда удаляем id, чтобы не конфликтовать с PK; идентификация идёт по (user_id, local_id)
        delete row.id;
        return row;
    });
    // Используем onConflict только по user_id,local_id — как в миграции
    const { data, error } = await supabase
        .from('timer_presets')
        .upsert(rows, { onConflict: 'user_id,local_id' })
        .select();
    if (error) throw error;
    return data;
}

// Пример для products (оставляю как есть, если нужно)
export type ProductData = {
    id: string;
    slug: string;
    name: string;
    price: string;
    old_price?: string;
    discount: number;
    images?: string[];
    description?: string;
    specs?: Record<string, string>;
    category?: string;
};

export async function getProducts(): Promise<ProductData[]> {
    const { data, error } = await supabase.from('products').select('*');
    if (error) throw error;
    // specs может быть строкой
    return (data || []).map((item: any) => ({
        ...item,
        specs: typeof item.specs === 'string' ? JSON.parse(item.specs) : item.specs
    }));
}

// ✅ НОВАЯ ФУНКЦИЯ ДЛЯ JWT SIGNING KEYS
export async function getClaims() {
    const { data, error } = await supabase.auth.getClaims();
    if (error) throw error;
    return data;
}