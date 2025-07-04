import { createAsyncThunk, createSelector, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { getProducts, ProductData } from '../../supabaseClient';
import { RootState } from '../index';

// Тип товара для state
export type ProductItem = ProductData;

export type FilterCategory = 'all' | 'clothing' | 'equipment' | 'supplements';

interface ProductsState {
    items: ProductItem[];
    filteredItems: ProductItem[];
    status: 'idle' | 'loading' | 'succeeded' | 'failed';
    error: string | null;
    viewMode: 'grid' | 'list';
    activeFilter: FilterCategory;
}

// Начальное состояние
const initialState: ProductsState = {
    items: [],
    filteredItems: [],
    status: 'idle',
    error: null,
    viewMode: 'grid',
    activeFilter: 'all',
};

// ✅ Мемоизированные селекторы для оптимизации производительности
export const selectProductsState = (state: RootState) => state.products;

export const selectAllProducts = createSelector(
    [selectProductsState],
    (productsState) => productsState.items
);

export const selectActiveFilter = createSelector(
    [selectProductsState],
    (productsState) => productsState.activeFilter
);

export const selectViewMode = createSelector(
    [selectProductsState],
    (productsState) => productsState.viewMode
);

export const selectProductsStatus = createSelector(
    [selectProductsState],
    (productsState) => productsState.status
);

// ✅ Селектор для корзины с мемоизацией
export const selectCartItemByProductId = createSelector(
    [(state: RootState) => state.cart.items, (_: RootState, productId: string) => productId],
    (cartItems, productId) => cartItems.find(item => item.product.id === productId)
);

// Функция фильтрации товаров
const filterProducts = (products: ProductItem[], filter: FilterCategory): ProductItem[] => {
    if (filter === 'all') return products;
    return products.filter(product => product.category === filter);
};

// ✅ Мемоизированный селектор для фильтрованных товаров
export const selectFilteredProducts = createSelector(
    [selectAllProducts, selectActiveFilter],
    (products, activeFilter) => filterProducts(products, activeFilter)
);

// Async thunk для получения товаров из Supabase
export const fetchProducts = createAsyncThunk(
    'products/fetchProducts',
    async (_, { rejectWithValue }) => {
        try {
            const products = await getProducts();
            return products;
        } catch (error: any) {
            return rejectWithValue(error.message || 'Ошибка загрузки товаров');
        }
    }
);

export const productsSlice = createSlice({
    name: 'products',
    initialState,
    reducers: {
        setViewMode: (state, action: PayloadAction<'grid' | 'list'>) => {
            state.viewMode = action.payload;
        },
        setFilter: (state, action: PayloadAction<FilterCategory>) => {
            state.activeFilter = action.payload;
            state.filteredItems = filterProducts(state.items, action.payload);
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchProducts.pending, (state) => {
                state.status = 'loading';
            })
            .addCase(fetchProducts.fulfilled, (state, action) => {
                state.status = 'succeeded';
                state.items = action.payload;
                state.filteredItems = filterProducts(action.payload, state.activeFilter);
            })
            .addCase(fetchProducts.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload as string || null;
            });
    }
});

export const { setViewMode, setFilter } = productsSlice.actions;

export default productsSlice.reducer; 