import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { AppState } from 'react-native';
import 'react-native-url-polyfill/auto';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
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
    const { data, error } = await supabase.from('timer_presets').insert([preset]).select();
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
    const { data, error } = await supabase.from('timer_presets').upsert(presets, { onConflict: 'id,local_id' }).select();
    if (error) throw error;
    return data;
}

// Пример для products (оставляю как есть, если нужно)
export type ProductData = {
    id: string;
    name: string;
    price: string;
    old_price?: string;
    discount: number;
    images?: string[];
    description?: string;
    specs?: Record<string, string>;
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