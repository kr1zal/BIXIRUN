# 🏗️ АРХИТЕКТУРА КАТАЛОГА ТОВАРОВ

**Последнее обновление:** 2024-01-13\
**Статус:** ТЕКУЩАЯ АРХИТЕКТУРА\
**Следующий этап:** Декомпозиция монолитных компонентов

---

## 🎯 ОБЩАЯ АРХИТЕКТУРА

```mermaid
graph TB
    subgraph "Client App"
        A[App.tsx]
        B[AppLayout.tsx]
        C[FooterNavigation.tsx]
    end
    
    subgraph "Catalog Screens"
        D[products.tsx]
        E[main.tsx]
        F[product/[slug].tsx]
    end
    
    subgraph "UI Components"
        G[ProductImageGallery.tsx]
        H[ProductTabs.tsx]
        I[AddToCartButton.tsx]
        J[QuantitySelector.tsx]
        K[OptimizedImage.tsx]
        L[StickyProductActions.tsx]
    end
    
    subgraph "Redux Store"
        M[contentSlice.ts]
        N[cartSlice.ts]
        O[index.ts]
    end
    
    subgraph "Backend"
        P[Supabase DB]
        Q[Storage]
    end
    
    A --> B
    B --> C
    B --> D
    B --> E
    B --> F
    
    D --> G
    D --> I
    E --> K
    F --> G
    F --> H
    F --> I
    F --> J
    F --> L
    
    G --> K
    I --> K
    
    D --> M
    D --> N
    E --> M
    F --> M
    F --> N
    
    M --> P
    N --> P
    K --> Q
```

---

## 📁 СТРУКТУРА ФАЙЛОВ

### 🏠 Корневая структура

```
BIXIRUN-cart-almost-final/
├── app/                    # Экраны приложения
│   ├── products.tsx        # Каталог товаров
│   ├── main.tsx            # Главная страница
│   ├── product/[slug].tsx  # Детальная страница товара
│   └── store/              # Redux состояние
├── components/             # Переиспользуемые компоненты
│   ├── ui/                 # UI компоненты
│   └── cart/               # Компоненты корзины
├── utils/                  # Утилиты
├── hooks/                  # Кастомные хуки
└── constants/              # Константы
```

### 📱 Экраны каталога

```
app/
├── products.tsx           # Основной каталог (800+ строк)
├── main.tsx              # Блок товаров на главной (285 строк)
├── product/
│   └── [slug].tsx        # Детальная страница (280+ строк)
└── store/
    ├── slices/
    │   ├── contentSlice.ts  # Products + Articles (149 строк)
    │   └── cartSlice.ts     # Корзина
    ├── hooks.ts            # Типизированные хуки
    └── index.ts            # Конфигурация store
```

### 🎨 UI компоненты

```
components/ui/
├── ProductImageGallery.tsx  # Галерея изображений (259 строк)
├── ProductTabs.tsx         # Табы товара (218 строк)
├── AddToCartButton.tsx     # Кнопка корзины (127 строк)
├── StickyProductActions.tsx # Фиксированные действия
├── QuantitySelector.tsx    # Селектор количества (94 строки)
└── OptimizedImage.tsx      # Оптимизированное изображение (81 строка)
```

---

## 🔗 ГРАФ ЗАВИСИМОСТЕЙ

### Redux State Flow

```typescript
// Состояние продуктов
interface ProductsState {
    items: ProductItem[];
    filteredItems: ProductItem[];
    status: "idle" | "loading" | "succeeded" | "failed";
    error: string | null;
    viewMode: "grid" | "list";
    activeFilter: FilterCategory;
}

// Состояние корзины
interface CartState {
    items: CartItem[];
    total: number;
    status: "idle" | "loading" | "succeeded" | "failed";
}
```

### Component Dependencies

```typescript
// Основные зависимости
products.tsx
├── useAppSelector(state => state.products)
├── useAppDispatch()
├── OptimizedImage
├── AddToCartButton
└── ImagePreloader

product/[slug].tsx
├── useAppSelector(state => state.products)
├── useAppSelector(state => state.cart)
├── ProductImageGallery
├── ProductTabs
├── AddToCartButton
└── QuantitySelector

ProductImageGallery.tsx
├── OptimizedImage
├── FlatList (для миниатюр)
└── ScrollView (для основной галереи)
```

---

## 🗄️ REDUX АРХИТЕКТУРА

### Store Configuration

```typescript
// app/store/index.ts
export const store = configureStore({
    reducer: {
        products: productsReducer, // Из contentSlice
        articles: articlesReducer, // Из contentSlice
        cart: cartReducer, // Из cartSlice
        timer: timerReducer, // Из timerSlice
    },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
```

### Async Thunks

```typescript
// Загрузка продуктов
export const fetchProducts = createAsyncThunk(
    "products/fetchProducts",
    async () => {
        const { data, error } = await supabase.from("products").select("*");
        if (error) throw new Error(error.message);
        return data as ProductItem[];
    },
);

// Загрузка статей
export const fetchArticles = createAsyncThunk(
    "articles/fetchArticles",
    async () => {
        const { data, error } = await supabase
            .from("articles")
            .select("*")
            .order("published_at", { ascending: false });
        if (error) throw new Error(error.message);
        return data as ArticleItem[];
    },
);
```

### Selectors

```typescript
// Базовые селекторы
export const selectAllProducts = (state: RootState) => state.products.items;
export const selectActiveFilter = (state: RootState) =>
    state.products.activeFilter;
export const selectViewMode = (state: RootState) => state.products.viewMode;

// Мемоизированные селекторы
export const selectFilteredProducts = createSelector(
    [selectAllProducts, selectActiveFilter],
    (products, activeFilter) => filterProducts(products, activeFilter),
);

export const selectArticleById = createSelector(
    [
        (state: RootState) => state.articles.items,
        (_, articleId: string) => articleId,
    ],
    (articles, articleId) =>
        articles.find((article) => article.id === articleId),
);
```

---

## 📊 ТИПЫ ДАННЫХ

### Core Types

```typescript
// Основной тип продукта
export type ProductData = {
    id: string;
    name: string;
    price: string;
    old_price?: string;
    discount: number;
    images?: string[];
    description?: string;
    specs?: Record<string, string>;
    category?: string;
    slug: string;
};

// Алиас для Redux
export type ProductItem = ProductData;

// Фильтры каталога
export type FilterCategory = "all" | "clothing" | "equipment" | "supplements";

// Статья блога
export interface ArticleItem {
    id: string;
    title: string;
    summary: string;
    content_markdown: string;
    cover_image_url: string;
    published_at: string;
}

// Элемент корзины
export type CartItem = {
    product: ProductItem;
    quantity: number;
    selected: boolean;
};
```

### Component Props

```typescript
// Пропсы карточки товара
interface ProductCardProps {
    item: ProductItem;
    viewMode: "grid" | "list" | "compact";
    onPress: (slug: string) => void;
    showAddToCart?: boolean;
}

// Пропсы галереи изображений
interface ProductImageGalleryProps {
    images: string[];
    productName: string;
    initialIndex?: number;
    onImageChange?: (index: number) => void;
}

// Пропсы кнопки корзины
interface AddToCartButtonProps {
    product: ProductItem;
    size: "small" | "medium" | "large";
    disabled?: boolean;
    onPress?: () => void;
}
```

---

## 🔄 DATA FLOW

### 1. Загрузка данных

```typescript
// При старте приложения
useEffect(() => {
    if (productsStatus === "idle") {
        dispatch(fetchProducts());
    }
}, [dispatch, productsStatus]);
```

### 2. Фильтрация и отображение

```typescript
// Применение фильтров
const filteredProducts = useAppSelector(selectFilteredProducts);

// Переключение режимов отображения
const handleViewModeChange = (mode: "grid" | "list") => {
    dispatch(setViewMode(mode));
};
```

### 3. Взаимодействие с корзиной

```typescript
// Добавление в корзину
const handleAddToCart = (product: ProductItem) => {
    dispatch(addToCart({
        product,
        quantity: 1,
    }));
};
```

---

## 🎨 UI АРХИТЕКТУРА

### Layout Structure

```typescript
// Общая структура страницы
AppLayout.tsx
├── Header (если нужен)
├── Main Content
│   ├── products.tsx
│   ├── main.tsx
│   └── product/[slug].tsx
└── FooterNavigation.tsx
```

### Responsive Design

```typescript
// Адаптивные размеры
const SCREEN_WIDTH = Dimensions.get("window").width;
const GRID_GAP = 3;
const GRID_CARD_WIDTH = (SCREEN_WIDTH - GRID_GAP * 3) / 2;
const GRID_CARD_HEIGHT = GRID_CARD_WIDTH * (5 / 4) + 80;
```

### Theme System

```typescript
// Константы цветов
export const Colors = {
    light: {
        primary: "#000000",
        secondary: "#666666",
        background: "#FFFFFF",
        card: "#F5F5F5",
    },
    dark: {
        primary: "#FFFFFF",
        secondary: "#CCCCCC",
        background: "#000000",
        card: "#1A1A1A",
    },
};
```

---

## 🚀 НАВИГАЦИЯ

### Routing Structure

```typescript
// Expo Router структура
app/
├── _layout.tsx           # Корневой layout
├── index.tsx            # Redirect страница
├── main.tsx             # Главная страница
├── products.tsx         # Каталог
├── product/
│   └── [slug].tsx       # Детальная страница
├── cart.tsx             # Корзина
├── profile.tsx          # Профиль
└── auth.tsx             # Авторизация
```

### Navigation Flow

```typescript
// Переходы между экранами
const handleProductPress = useCallback((slug: string) => {
    router.replace(`/product/${slug}`);
}, [router]);

const handleCatalogPress = useCallback(() => {
    router.replace("/products");
}, [router]);
```

---

## 🔧 УТИЛИТЫ И ХУКИ

### Custom Hooks

```typescript
// hooks/useCart.ts
export const useCart = () => {
    const dispatch = useAppDispatch();
    const cartItems = useAppSelector((state) => state.cart.items);

    const addToCart = useCallback((product: ProductItem) => {
        dispatch(addToCartAction({ product, quantity: 1 }));
    }, [dispatch]);

    return { cartItems, addToCart };
};

// hooks/useFlatListOptimization.ts
export const useFlatListOptimization = () => {
    const getItemLayout = useCallback((data: any, index: number) => ({
        length: ITEM_HEIGHT,
        offset: ITEM_HEIGHT * index,
        index,
    }), []);

    return { getItemLayout };
};
```

### Utility Functions

```typescript
// utils/imageUtils.ts
export const prefetchImages = async (urls: string[]) => {
    await Promise.all(urls.map((url) => Image.prefetch(url)));
};

export const getImageDimensions = (url: string) => {
    return new Promise((resolve) => {
        Image.getSize(url, (width, height) => {
            resolve({ width, height });
        });
    });
};
```

---

## 📈 PRODUCTION CONSIDERATIONS

### Performance Optimizations

- **FlatList:** `getItemLayout`, `removeClippedSubviews`
- **Images:** Lazy loading, caching, prefetching
- **Redux:** Memoized selectors, normalized state
- **Components:** React.memo, useCallback, useMemo

### Error Handling

- **Network errors:** Retry mechanism
- **Image loading:** Fallback images
- **State errors:** Error boundaries

### Accessibility

- **Screen readers:** AccessibilityLabel
- **Navigation:** Keyboard support
- **Contrast:** WCAG compliance

---

## 🔮 FUTURE ARCHITECTURE

### Планируемые изменения

1. **Декомпозиция** `products.tsx` на модули
2. **Создание** универсального `ProductCard` компонента
3. **Разделение** `contentSlice` на отдельные слайсы
4. **Добавление** middleware для аналитики
5. **Внедрение** кеширования и оффлайн поддержки

---

## 📚 СВЯЗАННЫЕ ДОКУМЕНТЫ

- **Текущее состояние:** [CURRENT_STATE.md](./CURRENT_STATE.md)
- **Производительность:** [PERFORMANCE.md](./PERFORMANCE.md)
- **История изменений:** [CHANGELOG.md](./CHANGELOG.md)
- **План оптимизации:** [OPTIMIZATION_PLAN.md](./OPTIMIZATION_PLAN.md)

---

_Документ создан: 2024-01-13_\
_Автор: AI Assistant_\
_Версия: 1.0.0_
