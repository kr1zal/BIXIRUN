import { configureStore } from '@reduxjs/toolkit';
import cartReducer, { saveCartToStorage } from './slices/cartSlice';
import productsReducer from './slices/productsSlice';
import timerReducer from './slices/timerSlice';

// Define the root reducer explicitly
const rootReducer = {
    products: productsReducer,
    timer: timerReducer,
    cart: cartReducer
};

// Дебаунс для сохранения корзины
let saveCartTimeout: ReturnType<typeof setTimeout>;

// Оптимизированный middleware для сохранения корзины с дебаунсом
const saveCartMiddleware = (store: any) => (next: any) => (action: any) => {
    const result = next(action);

    // Проверяем только cart actions, исключая загрузку и сохранение
    if (
        action.type.startsWith('cart/') &&
        !action.type.includes('loadFromStorage') &&
        !action.type.includes('saveToStorage')
    ) {
        // Очищаем предыдущий таймер
        if (saveCartTimeout) {
            clearTimeout(saveCartTimeout);
        }

        // Устанавливаем новый таймер с дебаунсом 500мс
        saveCartTimeout = setTimeout(() => {
            const state = store.getState();
            const cartItems = state.cart.items;
            store.dispatch(saveCartToStorage(cartItems));
        }, 500);
    }

    return result;
};

// Создаем хранилище
export const store = configureStore({
    reducer: rootReducer,
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: {
                // Игнорируем action types для сохранения корзины
                ignoredActions: ['cart/saveToStorage'],
            },
        }).concat(saveCartMiddleware),
    devTools: __DEV__, // Включаем DevTools только в режиме разработки
});

// Экспортируем типы для использования в приложении
// Экспортируем тип состояния приложения
export type RootState = ReturnType<typeof store.getState>;
// Экспортируем тип для dispatch
export type AppDispatch = typeof store.dispatch; 