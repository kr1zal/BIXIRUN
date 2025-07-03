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
    activeFilter: 'all'
};

// Функция фильтрации товаров
const filterProducts = (items: ProductItem[], filter: FilterCategory): ProductItem[] => {
    if (filter === 'all') return items;

    return items.filter(item => {
        const category = item.category?.toLowerCase();
        switch (filter) {
            case 'clothing':
                return category === 'clothing' || category === 'одежда';
            case 'equipment':
                return category === 'equipment' || category === 'оборудование';
            case 'supplements':
                return category === 'supplements' || category === 'добавки' || category === 'бады';
            default:
                return true;
        }
    });
};

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

// Мемоизированные селекторы
export const selectProducts = (state: RootState) => state.products.items;
export const selectProductsStatus = (state: RootState) => state.products.status;
export const selectProductsError = (state: RootState) => state.products.error;
export const selectActiveFilter = (state: RootState) => state.products.activeFilter;
export const selectViewMode = (state: RootState) => state.products.viewMode;

// Мемоизированный селектор для отфильтрованных товаров
export const selectFilteredProducts = createSelector(
    [selectProducts, selectActiveFilter],
    (products, activeFilter) => {
        if (activeFilter === 'all') return products;

        return products.filter(item => {
            const category = item.category?.toLowerCase();
            switch (activeFilter) {
                case 'clothing':
                    return category === 'clothing' || category === 'одежда';
                case 'equipment':
                    return category === 'equipment' || category === 'оборудование';
                case 'supplements':
                    return category === 'supplements' || category === 'добавки' || category === 'бады';
                default:
                    return true;
            }
        });
    }
);

export default productsSlice.reducer; 