import { createAsyncThunk, createSelector, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ProductData, supabase } from '../../supabaseClient';
import { RootState } from '../index';

// --- TYPES ---
export type ProductItem = ProductData;
export type FilterCategory = 'all' | 'clothing' | 'equipment' | 'supplements';

export interface ArticleItem {
    id: string;
    title: string;
    summary: string;
    content_markdown: string;
    cover_image_url: string;
    published_at: string;
}

interface ProductsState {
    items: ProductItem[];
    filteredItems: ProductItem[];
    status: 'idle' | 'loading' | 'succeeded' | 'failed';
    error: string | null;
    viewMode: 'grid' | 'list';
    activeFilter: FilterCategory;
}

interface ArticlesState {
    items: ArticleItem[];
    status: 'idle' | 'loading' | 'succeeded' | 'failed';
    error: string | null;
}

// --- INITIAL STATE ---
const initialProductsState: ProductsState = {
    items: [],
    filteredItems: [],
    status: 'idle',
    error: null,
    viewMode: 'grid',
    activeFilter: 'all',
};

const initialArticlesState: ArticlesState = {
    items: [],
    status: 'idle',
    error: null,
};


// --- ASYNC THUNKS ---

export const fetchProducts = createAsyncThunk('products/fetchProducts', async () => {
    const { data, error } = await supabase.from('products').select('*');
    if (error) {
        throw new Error(error.message);
    }
    return data as ProductItem[];
});

export const fetchArticles = createAsyncThunk('articles/fetchArticles', async () => {
    const { data, error } = await supabase
        .from('articles')
        .select('*')
        .order('published_at', { ascending: false });

    if (error) {
        throw new Error(error.message);
    }
    return data as ArticleItem[];
});


// --- SLICES ---

const filterProducts = (products: ProductItem[], filter: FilterCategory) => {
    if (filter === 'all') return products;
    return products.filter(p => p.category === filter);
};

const productsSlice = createSlice({
    name: 'products',
    initialState: initialProductsState,
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
            .addCase(fetchProducts.fulfilled, (state, action: PayloadAction<ProductItem[]>) => {
                state.status = 'succeeded';
                state.items = action.payload;
                state.filteredItems = filterProducts(action.payload, state.activeFilter);
            })
            .addCase(fetchProducts.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.error.message || 'Could not fetch products';
            });
    },
});

const articlesSlice = createSlice({
    name: 'articles',
    initialState: initialArticlesState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchArticles.pending, (state) => {
                state.status = 'loading';
            })
            .addCase(fetchArticles.fulfilled, (state, action: PayloadAction<ArticleItem[]>) => {
                state.status = 'succeeded';
                state.items = action.payload;
            })
            .addCase(fetchArticles.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.error.message || 'Could not fetch articles';
            });
    },
});

// --- EXPORTS ---
export const { setViewMode, setFilter } = productsSlice.actions;
export const productsReducer = productsSlice.reducer;
export const articlesReducer = articlesSlice.reducer;

// --- SELECTORS ---
export const selectProductsStatus = (state: RootState) => state.products.status;
export const selectViewMode = (state: RootState) => state.products.viewMode;
export const selectAllProducts = (state: RootState) => state.products.items;
export const selectActiveFilter = (state: RootState) => state.products.activeFilter;

export const selectFilteredProducts = createSelector(
    [selectAllProducts, selectActiveFilter],
    (products, activeFilter) => filterProducts(products, activeFilter)
);

// Селектор для конкретной статьи по ID
export const selectArticleById = createSelector(
    [(state: RootState) => state.articles.items, (_: RootState, articleId: string) => articleId],
    (articles, articleId) => articles.find((article: ArticleItem) => article.id === articleId)
); 