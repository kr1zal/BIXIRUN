import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { getProducts, ProductData } from '../../services/supabaseClient';

// Тип товара для state
export type ProductItem = ProductData;

interface ProductsState {
    items: ProductItem[];
    status: 'idle' | 'loading' | 'succeeded' | 'failed';
    error: string | null;
    viewMode: 'grid' | 'list';
}

// Начальное состояние
const initialState: ProductsState = {
    items: [],
    status: 'idle',
    error: null,
    viewMode: 'grid'
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
            })
            .addCase(fetchProducts.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload as string || null;
            });
    }
});

export const { setViewMode } = productsSlice.actions;

export default productsSlice.reducer; 