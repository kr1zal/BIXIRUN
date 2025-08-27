# 🧩 СПРАВОЧНИК КОМПОНЕНТОВ КАРТОЧЕК ТОВАРОВ

## Последнее обновление: 2024-01-13

---

## 📋 СОДЕРЖАНИЕ

- [🖼️ Галерея изображений](#️-галерея-изображений)
- [🛒 Кнопки корзины](#-кнопки-корзины)
- [📌 Фиксированный блок действий (StickyProductActions)](#-фиксированный-блок-действий-stickyproductactions)
- [🔢 Селектор количества](#-селектор-количества)
- [📱 Экраны карточек](#-экраны-карточек)
- [🔄 Redux слайсы](#-redux-слайсы)
- [🛠️ Утилиты](#️-утилиты)

---

## 🖼️ ГАЛЕРЕЯ ИЗОБРАЖЕНИЙ

### `ProductImageGallery.tsx`

**Расположение:** `components/ui/ProductImageGallery.tsx`\
**Размер:** 259 строк\
**Назначение:** Интерактивная галерея изображений с миниатюрами

#### API:

```typescript
interface ProductImageGalleryProps {
    images: string[];
    productName: string;
    initialIndex?: number;
    onImageChange?: (index: number) => void;
}
```

#### Использование:

```typescript
<ProductImageGallery
    images={product.images}
    productName={product.name}
    initialIndex={0}
    onImageChange={(index) => console.log("Current image:", index)}
/>;
```

#### Функции:

- ✅ Swipe навигация между изображениями
- ✅ Клик по миниатюрам для переключения
- ✅ Индикаторы текущего изображения
- ✅ Поддержка зума (двойной тап)
- ✅ Автоматическая предзагрузка соседних изображений

#### Состояние:

```typescript
const [currentIndex, setCurrentIndex] = useState(0);
const [isZoomed, setIsZoomed] = useState(false);
const [thumbnailsVisible, setThumbnailsVisible] = useState(true);
```

---

### `OptimizedImage.tsx`

**Расположение:** `components/ui/OptimizedImage.tsx`\
**Размер:** 81 строка\
**Назначение:** Оптимизированное отображение изображений с кэшированием

#### API:

```typescript
interface OptimizedImageProps {
    source: string | { uri: string };
    style?: ImageStyle;
    placeholder?: string;
    onLoad?: () => void;
    onError?: (error: any) => void;
    resizeMode?: "cover" | "contain" | "stretch" | "center";
}
```

#### Использование:

```typescript
<OptimizedImage
    source={{ uri: product.image_url }}
    style={styles.productImage}
    placeholder="https://via.placeholder.com/300"
    onLoad={() => setImageLoaded(true)}
    resizeMode="cover"
/>;
```

#### Функции:

- ✅ Автоматическое кэширование
- ✅ Плейсхолдер при загрузке
- ✅ Обработка ошибок загрузки
- ✅ Оптимизация размеров для разных экранов

---

### `ImagePreloader.tsx`

**Расположение:** `components/ui/ImagePreloader.tsx`\
**Размер:** 27 строк\
**Назначение:** Фоновая предзагрузка изображений

#### API:

```typescript
interface ImagePreloaderProps {
    urls: string[];
    priority?: "high" | "normal" | "low";
    onComplete?: () => void;
}
```

#### Использование:

```typescript
<ImagePreloader
    urls={nextPageImages}
    priority="normal"
    onComplete={() => console.log("Images preloaded")}
/>;
```

---

## 🛒 КНОПКИ КОРЗИНЫ

### `AddToCartButton.tsx`

**Расположение:** `components/ui/AddToCartButton.tsx`\
**Размер:** 127 строк\
**Назначение:** Кнопка добавления товара в корзину с состояниями

#### API:

```typescript
interface AddToCartButtonProps {
    product: ProductItem;
    quantity?: number;
    size?: "small" | "medium" | "large";
    variant?: "primary" | "secondary" | "outline";
    onPress?: (product: ProductItem, quantity: number) => void;
    disabled?: boolean;
    loading?: boolean;
}
```

#### Использование:

```typescript
<AddToCartButton
    product={product}
    quantity={selectedQuantity}
    size="large"
    variant="primary"
    onPress={handleAddToCart}
    loading={isAddingToCart}
/>;
```

#### Состояния:

```typescript
enum ButtonState {
    IDLE = "idle", // Обычное состояние
    LOADING = "loading", // Процесс добавления
    SUCCESS = "success", // Товар добавлен
    IN_CART = "in_cart", // Товар уже в корзине
}
```

#### Анимации:

- ✅ Bounce эффект при добавлении
- ✅ Плавная смена цветов
- ✅ Индикатор загрузки
- ✅ Тост уведомление об успехе

---

## 📌 ФИКСИРОВАННЫЙ БЛОК ДЕЙСТВИЙ (STICKYPRODUCTACTIONS)

### `StickyProductActions.tsx`

**Расположение:** `components/ui/StickyProductActions.tsx`\
**Назначение:** Фиксированный внизу экрана блок с кнопками «Купить сейчас» и «В
корзину», а также селектором количества, если товар уже в корзине.

#### Ключевые параметры и поведение

- Позиционирование: `position: 'absolute'`, `left: 0`, `right: 0`.
- Вертикальная позиция: вычисляется с учётом safe-area.
  - Актуально: `bottom: insets.bottom + 47` (сдвиг вниз на 4px относительно
    прежнего `+ 51`).
- Визуальные параметры контейнера:
  - Белый фон, скругления `borderTopLeftRadius`/`borderTopRightRadius: 15`.
  - Тени/поднятие для отделения от контента.
  - Внутренние отступы: `padding: 12`, `paddingBottom: 20`.
- Левая кнопка: «Купить сейчас» — оранжевая, `height: 45`.
- Правая область:
  - Если товара нет в корзине — кнопка «В корзину» (`height: 45`, синяя) с
    микроанимацией scale.
  - Если товар в корзине — селектор количества (границы, `height: 45`, кнопки ±
    45x45).

#### Пропсы

```ts
interface StickyProductActionsProps {
    onAddToCart: () => void;
    onBuyNow: () => void;
    onQuantityChange: (value: number) => void;
    cartQuantity: number;
    disabled?: boolean;
}
```

#### Недавние изменения

- 2025‑01‑13: уменьшен отступ от нижней границы на 4px —
  `bottom: insets.bottom + 47`.
- 2025‑01‑13: корректировка блока корзины — центровка контента и доп. сдвиги:
  см. CartSummary ниже.

---

### Блок суммы и кнопки оформления (CartSummary)

**Расположение:** `components/cart/CartSummary.tsx`

#### Ключевые параметры

- Плашка корзины: `position: 'absolute'`, `bottom: 76` (было `82`, затем `79`).
- Контентная часть:
  - `detailsContainer.transform`: `translateY: -6.7` (было `-10.7`).
  - `checkoutButton.transform`: `translateY: -9` (было `-13`).
- Цель: визуальная центровка текста сумм и кнопки «Оформить» внутри белой
  плашки, согласованная с кастомным таббаром.

## 🔢 СЕЛЕКТОР КОЛИЧЕСТВА

### `QuantitySelector.tsx`

**Расположение:** `components/ui/QuantitySelector.tsx`\
**Размер:** 94 строки\
**Назначение:** Селектор количества товара с кнопками +/-

#### API:

```typescript
interface QuantitySelectorProps {
    value: number;
    min?: number;
    max?: number;
    step?: number;
    onChange: (value: number) => void;
    size?: "small" | "medium" | "large";
    disabled?: boolean;
}
```

#### Использование:

```typescript
<QuantitySelector
    value={quantity}
    min={1}
    max={99}
    step={1}
    onChange={setQuantity}
    size="medium"
/>;
```

#### Функции:

- ✅ Кнопки увеличения/уменьшения
- ✅ Прямой ввод числа
- ✅ Валидация min/max значений
- ✅ Автоматическое форматирование
- ✅ Haptic feedback на iOS

---

## 📱 ЭКРАНЫ КАРТОЧЕК

### `app/products.tsx` (Каталог)

**Размер:** 800+ строк\
**Назначение:** Основной экран каталога с Grid/List режимами

#### Компоненты карточек:

```typescript
// Grid режим (строка 288)
const GridItem = memo(({ item }: { item: ProductItem }) => (
    <TouchableOpacity style={styles.gridItem}>
        <OptimizedImage source={{ uri: item.image_url }} />
        <Text style={styles.productName}>{item.name}</Text>
        <Text style={styles.price}>{item.price} ₽</Text>
        <AddToCartButton product={item} size="small" />
    </TouchableOpacity>
));

// List режим (строка 358)
const ListItem = memo(({ item }: { item: ProductItem }) => (
    <TouchableOpacity style={styles.listItem}>
        <OptimizedImage source={{ uri: item.image_url }} />
        <View style={styles.productInfo}>
            <Text style={styles.productName}>{item.name}</Text>
            <Text style={styles.description}>{item.description}</Text>
            <Text style={styles.price}>{item.price} ₽</Text>
        </View>
        <AddToCartButton product={item} size="medium" />
    </TouchableOpacity>
));
```

#### Состояние:

```typescript
const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
const [filterCategory, setFilterCategory] = useState<string>("all");
const [searchQuery, setSearchQuery] = useState("");
const [sortBy, setSortBy] = useState<"name" | "price" | "rating">("name");
```

---

### `app/main.tsx` (Главная)

**Размер:** 300+ строк\
**Назначение:** Главная страница с блоком товаров

#### Компонент карточки:

```typescript
// ProductGridCard (строка 34)
const ProductGridCard = memo(({ product }: { product: ProductItem }) => (
    <TouchableOpacity
        style={styles.productCard}
        onPress={() => router.push(`/product/${product.slug}`)}
    >
        <OptimizedImage source={{ uri: product.image_url }} />
        <Text style={styles.name}>{product.name}</Text>
        <Text style={styles.price}>{product.price} ₽</Text>
    </TouchableOpacity>
));
```

---

### `app/product/[slug].tsx` (Детальная страница)

**Размер:** 280+ строк\
**Назначение:** Детальная страница товара

#### Основные секции:

```typescript
// Структура страницы
<ScrollView>
    <ProductImageGallery images={product.images} />
    <View style={styles.productInfo}>
        <Text style={styles.title}>{product.name}</Text>
        <Text style={styles.price}>{product.price} ₽</Text>
        <ProductTabs
            description={product.description}
            specs={product.specs}
            reviews={product.reviews}
        />
    </View>
    <View style={styles.actions}>
        <QuantitySelector value={quantity} onChange={setQuantity} />
        <AddToCartButton product={product} quantity={quantity} />
    </View>
</ScrollView>;
```

---

## 🔄 REDUX СЛАЙСЫ

### `app/store/slices/productsSlice.ts`

**Назначение:** Управление состоянием товаров

#### API:

```typescript
interface ProductsState {
    items: ProductItem[];
    loading: boolean;
    error: string | null;
    filters: {
        category: string;
        priceRange: [number, number];
        rating: number;
    };
    viewMode: "grid" | "list";
    searchQuery: string;
}

// Actions
const productsSlice = createSlice({
    name: "products",
    initialState,
    reducers: {
        setViewMode: (state, action) => {
            state.viewMode = action.payload;
        },
        setFilter: (state, action) => {
            state.filters = { ...state.filters, ...action.payload };
        },
        setSearchQuery: (state, action) => {
            state.searchQuery = action.payload;
        },
    },
});

// Async Thunks
export const fetchProducts = createAsyncThunk(
    "products/fetchProducts",
    async (params?: FetchProductsParams) => {
        // Загрузка товаров из API
    },
);
```

#### Селекторы:

```typescript
export const selectAllProducts = (state: RootState) => state.products.items;
export const selectProductsLoading = (state: RootState) =>
    state.products.loading;

export const selectFilteredProducts = createSelector(
    [selectAllProducts, (state: RootState) => state.products.filters],
    (products, filters) => {
        return products.filter((product) => {
            // Логика фильтрации
        });
    },
);
```

---

### `app/store/slices/cartSlice.ts`

**Назначение:** Управление корзиной

#### API:

```typescript
interface CartState {
    items: CartItem[];
    total: number;
    count: number;
    discount: number;
    shipping: number;
}

// Actions
const cartSlice = createSlice({
    name: "cart",
    initialState,
    reducers: {
        addToCart: (state, action) => {
            // Логика добавления товара
        },
        removeFromCart: (state, action) => {
            // Логика удаления товара
        },
        updateQuantity: (state, action) => {
            // Логика обновления количества
        },
        clearCart: (state) => {
            state.items = [];
        },
    },
});
```

#### Селекторы:

```typescript
export const selectCartItems = (state: RootState) => state.cart.items;
export const selectCartTotal = (state: RootState) => state.cart.total;
export const selectCartCount = (state: RootState) =>
    state.cart.items.reduce((sum, item) => sum + item.quantity, 0);
```

---

## 🛠️ УТИЛИТЫ

### `utils/imageUtils.ts`

**Назначение:** Утилиты для оптимизации изображений

#### API:

```typescript
// Получение оптимизированного URL изображения
export const getOptimizedImageUrl = (
    url: string,
    size: "small" | "medium" | "large" | "original",
): string => {
    const sizes = {
        small: "150x150",
        medium: "300x300",
        large: "600x600",
        original: "original",
    };
    return `${url}?size=${sizes[size]}&format=webp`;
};

// Предзагрузка изображений
export const preloadImages = async (urls: string[]): Promise<void> => {
    await Promise.all(urls.map((url) => Image.prefetch(url)));
};
```

### `hooks/useCart.ts`

**Назначение:** Хук для работы с корзиной

#### API:

```typescript
export const useCart = () => {
    const dispatch = useAppDispatch();
    const cartItems = useAppSelector(selectCartItems);

    const addToCart = useCallback((product: ProductItem, quantity = 1) => {
        dispatch(cartSlice.actions.addToCart({ product, quantity }));
    }, [dispatch]);

    const removeFromCart = useCallback((productId: string) => {
        dispatch(cartSlice.actions.removeFromCart(productId));
    }, [dispatch]);

    return { cartItems, addToCart, removeFromCart };
};
```

### `hooks/useFlatListOptimization.ts`

**Назначение:** Оптимизация FlatList для больших списков

#### API:

```typescript
export const useFlatListOptimization = () => {
    return {
        getItemLayout: (data: any, index: number) => ({
            length: ITEM_HEIGHT,
            offset: ITEM_HEIGHT * index,
            index,
        }),
        removeClippedSubviews: true,
        maxToRenderPerBatch: 10,
        windowSize: 10,
        initialNumToRender: 10,
        updateCellsBatchingPeriod: 50,
    };
};
```

---

## 🎨 СТИЛИ И ТЕМЫ

### Основные константы:

```typescript
export const COLORS = {
    primary: "#1976D2",
    secondary: "#DC004E",
    success: "#00C851",
    warning: "#FF9800",
    error: "#FF5722",
    text: "#000000",
    textSecondary: "#666666",
    background: "#FFFFFF",
    border: "#E0E0E0",
};

export const SIZES = {
    borderRadius: 8,
    padding: 16,
    margin: 8,
    iconSize: 24,
};
```

### Адаптивные размеры:

```typescript
export const RESPONSIVE = {
    gridColumns: Platform.select({
        ios: 2,
        android: 2,
        web: 4,
    }),
    itemHeight: Platform.select({
        ios: 280,
        android: 270,
    }),
};
```

---

_Справочник создан: 2024-01-13_\
_Связанные документы:
[PRODUCT_CARDS_COMPLETE.md](../../PRODUCT_CARDS_COMPLETE.md)_
