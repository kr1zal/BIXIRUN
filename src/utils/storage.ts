import AsyncStorage from '@react-native-async-storage/async-storage';

// Ключи для сохранения данных
export const STORAGE_KEYS = {
    CART: 'bixirun_cart',
    USER: 'bixirun_user',
    FAVORITES: 'bixirun_favorites',
    SETTINGS: 'bixirun_settings',
    TIMER_PRESETS: 'bixirun_timer_presets',
    TIMER_LAST_SETTINGS: 'bixirun_timer_last_settings',
};

/**
 * Сохраняет данные в AsyncStorage
 * @param key - Ключ для сохранения
 * @param value - Значение для сохранения
 */
export const storeData = async (key: string, value: any): Promise<void> => {
    try {
        const jsonValue = JSON.stringify(value);
        await AsyncStorage.setItem(key, jsonValue);
        console.log(`Data stored successfully for key: ${key}`);
    } catch (error) {
        console.error('Error storing data:', error);
        throw error;
    }
};

/**
 * Получает данные из AsyncStorage
 * @param key - Ключ для получения данных
 * @returns Полученные данные или null, если данных нет
 */
export const getData = async <T>(key: string): Promise<T | null> => {
    try {
        const jsonValue = await AsyncStorage.getItem(key);
        return jsonValue != null ? JSON.parse(jsonValue) : null;
    } catch (error) {
        console.error('Error retrieving data:', error);
        return null;
    }
};

/**
 * Удаляет данные из AsyncStorage
 * @param key - Ключ для удаления данных
 */
export const removeData = async (key: string): Promise<void> => {
    try {
        await AsyncStorage.removeItem(key);
        console.log(`Data removed successfully for key: ${key}`);
    } catch (error) {
        console.error('Error removing data:', error);
        throw error;
    }
};

/**
 * Очищает все хранилище AsyncStorage
 */
export const clearAllData = async (): Promise<void> => {
    try {
        await AsyncStorage.clear();
        console.log('All data cleared successfully');
    } catch (error) {
        console.error('Error clearing all data:', error);
        throw error;
    }
}; 