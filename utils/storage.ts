import AsyncStorage from '@react-native-async-storage/async-storage';

export const STORAGE_KEYS = {
    CART: 'CART',
    TIMER_PRESETS: 'TIMER_PRESETS',
    TIMER_LAST_SETTINGS: 'TIMER_LAST_SETTINGS',
    TIMER_SETTINGS_DONT_ASK_RESET_CONFIRM: 'TIMER_SETTINGS_DONT_ASK_RESET_CONFIRM',
    // добавь другие ключи если надо
};

export async function storeData<T>(key: string, value: T): Promise<void> {
    await AsyncStorage.setItem(key, JSON.stringify(value));
}

export async function getData<T>(key: string): Promise<T | null> {
    const json = await AsyncStorage.getItem(key);
    return json ? JSON.parse(json) : null;
} 