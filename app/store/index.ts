import { configureStore } from '@reduxjs/toolkit';
// import { cartMiddleware } from './middleware/cartMiddleware'; // ВРЕМЕННО ОТКЛЮЧЕНО
import cartReducer from './slices/cartSlice';
import { articlesReducer, productsReducer } from './slices/contentSlice';
import timerReducer from './slices/timerSlice';

export const store = configureStore({
    reducer: {
        products: productsReducer,
        articles: articlesReducer,
        cart: cartReducer,
        timer: timerReducer,
    },
    // Отключаем middleware для диагностики
    // middleware: (getDefaultMiddleware) =>
    //     getDefaultMiddleware().concat(cartMiddleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch; 