import { configureStore } from '@reduxjs/toolkit';
import { cartMiddleware } from './middleware/cartMiddleware.ts';
import cartReducer from './slices/cartSlice.ts';
import { articlesReducer, productsReducer } from './slices/contentSlice.ts';
import timerReducer from './slices/timerSlice.ts';
export type { TimerState } from './slices/timerSlice.ts';

export const store = configureStore({
    reducer: {
        products: productsReducer,
        articles: articlesReducer,
        cart: cartReducer,
        timer: timerReducer,
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware().concat(cartMiddleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch; 