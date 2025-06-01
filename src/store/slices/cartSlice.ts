import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { ProductItem } from './productsSlice';
import { STORAGE_KEYS, storeData, getData } from '../../utils/storage';

// Тип элемента корзины (расширяет тип товара, добавляя количество)
export type CartItem = {
    product: ProductItem;
    quantity: number;
};

// Состояние корзины
interface CartState {
    items: CartItem[];
    isLoading: boolean;
    error: string | null;
    lastSaved: number | null; // Время последнего сохранения
}

// Начальное состояние
const initialState: CartState = {
    items: [],
    isLoading: false,
    error: null,
    lastSaved: null
};

// Async Thunk для загрузки данных корзины из AsyncStorage
export const loadCartFromStorage = createAsyncThunk(
    'cart/loadFromStorage',
    async (_, { rejectWithValue }) => {
        try {
            const cartData = await getData<CartItem[]>(STORAGE_KEYS.CART);
            console.log('Loaded cart data:', cartData);
            return cartData || [];
        } catch (error) {
            console.error('Error loading cart:', error);
            return rejectWithValue('Не удалось загрузить данные корзины');
        }
    }
);

// Async Thunk для сохранения данных корзины в AsyncStorage
export const saveCartToStorage = createAsyncThunk(
    'cart/saveToStorage',
    async (items: CartItem[], { rejectWithValue }) => {
        try {
            await storeData(STORAGE_KEYS.CART, items);
            console.log('Saved cart data:', items);
            return Date.now(); // Возвращаем время сохранения
        } catch (error) {
            console.error('Error saving cart:', error);
            return rejectWithValue('Не удалось сохранить данные корзины');
        }
    }
);

export const cartSlice = createSlice({
    name: 'cart',
    initialState,
    reducers: {
        // Добавление товара в корзину
        addToCart: (state, action: PayloadAction<{ product: ProductItem; quantity: number }>) => {
            const { product, quantity } = action.payload;
            const existingItem = state.items.find(item => item.product.id === product.id);

            if (existingItem) {
                // Если товар уже в корзине, увеличиваем количество
                existingItem.quantity += quantity;
            } else {
                // Иначе добавляем новый товар
                state.items.push({ product, quantity });
            }
        },

        // Удаление товара из корзины
        removeFromCart: (state, action: PayloadAction<string>) => {
            const productId = action.payload;
            state.items = state.items.filter(item => item.product.id !== productId);
        },

        // Изменение количества товара
        updateQuantity: (state, action: PayloadAction<{ productId: string; quantity: number }>) => {
            const { productId, quantity } = action.payload;
            const item = state.items.find(item => item.product.id === productId);

            if (item) {
                if (quantity <= 0) {
                    // Если количество 0 или меньше, удаляем товар
                    state.items = state.items.filter(item => item.product.id !== productId);
                } else {
                    // Иначе обновляем количество
                    item.quantity = quantity;
                }
            }
        },

        // Очистка корзины
        clearCart: (state) => {
            state.items = [];
        }
    },
    extraReducers: (builder) => {
        builder
            // Обработка загрузки корзины из хранилища
            .addCase(loadCartFromStorage.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(loadCartFromStorage.fulfilled, (state, action) => {
                state.isLoading = false;
                state.items = action.payload;
            })
            .addCase(loadCartFromStorage.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
            })
            // Обработка сохранения корзины в хранилище
            .addCase(saveCartToStorage.fulfilled, (state, action) => {
                state.lastSaved = action.payload as number;
            })
            .addCase(saveCartToStorage.rejected, (state, action) => {
                state.error = action.payload as string;
            });
    }
});

// Экспортируем actions
export const {
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart
} = cartSlice.actions;

// Middleware для автоматического сохранения корзины
export const saveCartMiddleware = (store: any) => (next: any) => (action: any) => {
    // Выполняем действие
    const result = next(action);

    // Проверяем, было ли это действие с корзиной
    if (
        action.type.startsWith('cart/') &&
        !action.type.includes('loadFromStorage') &&
        !action.type.includes('saveToStorage')
    ) {
        // Получаем текущее состояние корзины после обработки действия
        const state = store.getState();
        const cartItems = state.cart.items;

        // Сохраняем корзину в AsyncStorage
        store.dispatch(saveCartToStorage(cartItems));
    }

    return result;
};

// Селектор для получения общей стоимости корзины
export const selectCartTotal = (state: { cart: CartState }) => {
    return state.cart.items.reduce((total, item) => {
        return total + (parseFloat(item.product.price) * item.quantity);
    }, 0).toFixed(2);
};

// Селектор для получения общего количества товаров в корзине
export const selectCartItemsCount = (state: { cart: CartState }) => {
    return state.cart.items.reduce((count, item) => count + item.quantity, 0);
};

export default cartSlice.reducer; 