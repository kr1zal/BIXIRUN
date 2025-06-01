import { configureStore } from '@reduxjs/toolkit';
import productsReducer from './slices/productsSlice';
import cartReducer from './slices/cartSlice';
import timerReducer from './slices/timerSlice';
import { saveCartToStorage } from './slices/cartSlice';

// Define the root reducer explicitly
const rootReducer = {
    products: productsReducer,
    timer: timerReducer,
    cart: cartReducer
};

// Create a custom middleware for saving cart data
const saveCartMiddleware = (store: any) => (next: any) => (action: any) => {
    // Perform the action
    const result = next(action);

    // Check if this was a cart action
    if (
        action.type.startsWith('cart/') &&
        !action.type.includes('loadFromStorage') &&
        !action.type.includes('saveToStorage')
    ) {
        // Get the current cart state after the action has been processed
        const state = store.getState();
        const cartItems = state.cart.items;

        // Save the cart to AsyncStorage
        store.dispatch(saveCartToStorage(cartItems));
    }

    return result;
};

// Создаем хранилище
export const store = configureStore({
    reducer: rootReducer,
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware().concat(saveCartMiddleware)
});

// Экспортируем типы для использования в приложении
// Экспортируем тип состояния приложения
export type RootState = ReturnType<typeof store.getState>;
// Экспортируем тип для dispatch
export type AppDispatch = typeof store.dispatch; 