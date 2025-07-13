import { createAsyncThunk, createSelector, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { getData, STORAGE_KEYS, storeData } from '../../utils/storage';
import { ProductItem } from './contentSlice';

// Тип элемента корзины (расширяет тип товара, добавляя количество)
export type CartItem = {
    product: ProductItem;
    quantity: number;
    selected: boolean; // Добавлено поле для выбора
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
            return cartData || [];
        } catch (error) {
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
            return Date.now(); // Возвращаем время сохранения
        } catch (error) {
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
                // Иначе добавляем новый товар, по умолчанию выбран
                state.items.push({ product, quantity, selected: true });
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
        },

        // Переключение выбора одного товара
        toggleItemSelected: (state, action: PayloadAction<string>) => {
            const productId = action.payload;
            const item = state.items.find(item => item.product.id === productId);
            if (item) {
                item.selected = !item.selected;
            }
        },

        // Переключение выбора всех товаров
        toggleSelectAll: (state, action: PayloadAction<boolean>) => {
            const selected = action.payload;
            state.items.forEach(item => {
                item.selected = selected;
            });
        }
    },
    extraReducers: (builder) => {
        builder
            // Обработка загрузки корзины из хранилища
            .addCase(loadCartFromStorage.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(loadCartFromStorage.fulfilled, (state, action: PayloadAction<CartItem[]>) => {
                state.isLoading = false;
                // ✅ ОПТИМИЗАЦИЯ: Сохраняем оригинальное состояние selected
                // Не перезаписываем selected: true для всех товаров
                state.items = action.payload.map(item => ({
                    ...item,
                    // Если в сохраненных данных нет поля selected, устанавливаем true
                    selected: item.selected !== undefined ? item.selected : true
                }));
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
    clearCart,
    toggleItemSelected,
    toggleSelectAll
} = cartSlice.actions;

// ✅ ОПТИМИЗИРОВАННЫЕ СЕЛЕКТОРЫ С МЕМОИЗАЦИЕЙ
// Мемоизируем базовые селекторы
const selectCartItems = (state: { cart: CartState }) => state.cart.items;
const selectSelectedCartItems = createSelector(
    [selectCartItems],
    (items) => items.filter(item => item.selected)
);

// Селектор для получения общей стоимости ВСЕХ товаров в корзине
export const selectCartTotal = createSelector(
    [selectCartItems],
    (items) => {
        const total = items.reduce((sum, item) => {
            const price = parseFloat(item.product.price);
            return sum + (price * item.quantity);
        }, 0);
        return total.toFixed(2);
    }
);

// Селектор для получения общего количества ВСЕХ товаров в корзине
export const selectCartItemsCount = createSelector(
    [selectCartItems],
    (items) => items.reduce((count, item) => count + item.quantity, 0)
);

// --- ОПТИМИЗИРОВАННЫЕ СЕЛЕКТОРЫ ДЛЯ ВЫБРАННЫХ ТОВАРОВ ---

// Селектор для получения только выбранных товаров
export const selectSelectedItems = selectSelectedCartItems;

// Селектор для получения общей стоимости ВЫБРАННЫХ товаров
export const selectSelectedItemsTotal = createSelector(
    [selectSelectedCartItems],
    (selectedItems) => {
        const total = selectedItems.reduce((sum, item) => {
            const price = parseFloat(item.product.price);
            return sum + (price * item.quantity);
        }, 0);
        return total.toFixed(2);
    }
);

// Селектор для получения общей стоимости ВЫБРАННЫХ товаров (без скидки)
export const selectSelectedItemsOriginalTotal = createSelector(
    [selectSelectedCartItems],
    (selectedItems) => {
        return selectedItems.reduce((sum, item) => {
            const originalPrice = parseFloat(item.product.old_price || item.product.price);
            return sum + (originalPrice * item.quantity);
        }, 0);
    }
);

// Селектор для получения общей скидки по ВЫБРАННЫМ товарам
export const selectSelectedItemsDiscount = createSelector(
    [selectSelectedCartItems],
    (selectedItems) => {
        return selectedItems.reduce((discount, item: CartItem) => {
            const originalPrice = parseFloat(item.product.old_price || item.product.price);
            const currentPrice = parseFloat(item.product.price);
            return discount + (originalPrice - currentPrice) * item.quantity;
        }, 0);
    }
);

// Селектор для конкретного товара в корзине по ID продукта
export const selectCartItemByProductId = createSelector(
    [selectCartItems, (_state: { cart: CartState }, productId: string) => productId],
    (cartItems, productId) => cartItems.find((item: CartItem) => item.product.id === productId)
);


export default cartSlice.reducer; 