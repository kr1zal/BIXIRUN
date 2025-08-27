# ⚡ ПРОИЗВОДИТЕЛЬНОСТЬ КАТАЛОГА ТОВАРОВ

**Последнее обновление:** 2024-01-13\
**Статус:** ОПТИМИЗАЦИЯ В ПРОЦЕССЕ\
**Приоритет:** 🔴 КРИТИЧНЫЙ

---

## 📊 ТЕКУЩИЕ ПОКАЗАТЕЛИ

### ⏱️ Производительность

- **Время загрузки каталога:** ~2-3 секунды
- **FPS при скролле:** 45-55 FPS (цель: 60 FPS)
- **Время отклика кнопок:** <100ms ✅
- **Загрузка изображений:** 1-2 секунды
- **Переход между экранами:** <200ms ✅

### 📈 Метрики

- **Bundle size:** Не измерен
- **Memory usage:** Не отслеживается
- **JS Thread load:** Высокий при скролле
- **UI Thread load:** Средний

---

## 🚀 FLATLIST ОПТИМИЗАЦИЯ

### ✅ Реализовано

#### **getItemLayout для фиксированных размеров**

```typescript
// app/products.tsx
const getItemLayout = useCallback((data: any, index: number) => {
    const height = viewMode === "grid" ? GRID_CARD_HEIGHT : LIST_CARD_HEIGHT;
    return {
        length: height,
        offset: height * index,
        index,
    };
}, [viewMode]);
```

#### **Оптимальные батчи рендеринга**

```typescript
<FlatList
    data={filteredProducts}
    renderItem={renderProductItem}
    keyExtractor={(item) => item.id}
    getItemLayout={getItemLayout}
    // Производительность
    initialNumToRender={viewMode === "grid" ? 6 : 8}
    maxToRenderPerBatch={viewMode === "grid" ? 4 : 6}
    windowSize={5}
    updateCellsBatchingPeriod={100}
    // Оптимизация скролла
    removeClippedSubviews={false} // Отключено для стабильности
    scrollEventThrottle={16} // 60 FPS
    // Кеширование
    getItemLayout={getItemLayout}
    keyExtractor={keyExtractor}
/>;
```

### ❌ Проблемы

#### **1. Динамические высоты карточек**

```typescript
// ПРОБЛЕМА: Разные высоты для разных товаров
const GridItem = ({ item }) => {
    // Высота зависит от длины названия
    const cardHeight = item.name.length > 20 ? 180 : 160;
    // getItemLayout не может это обработать
};
```

#### **2. Вложенные FlatList в галереях**

```typescript
// ПРОБЛЕМА: Неоптимизированные вложенные списки
<FlatList // Основной список товаров
    data={products}
    renderItem={({ item }) => (
        <ProductCard>
            <FlatList // Вложенная галерея - НЕ ОПТИМИЗИРОВАНА
                data={item.images}
                horizontal
                pagingEnabled
                // Отсутствуют оптимизации
            />
        </ProductCard>
    )}
/>;
```

---

## 🧠 МЕМОИЗАЦИЯ

### ✅ Реализовано

#### **Мемоизированные компоненты**

```typescript
// Основные карточки
const GridItem = memo(({ item }: { item: ProductItem }) => {
    // Компонент мемоизирован
    return <ProductCard item={item} />;
});

const ListItem = memo(({ item }: { item: ProductItem }) => {
    // Компонент мемоизирован
    return <ProductListCard item={item} />;
});
```

#### **Мемоизированные колбеки**

```typescript
// Обработчики событий
const handleProductPress = useCallback((slug: string) => {
    router.replace(`/product/${slug}`);
}, [router]);

const handleAddToCart = useCallback((product: ProductItem) => {
    dispatch(addToCart({ product, quantity: 1 }));
}, [dispatch]);
```

#### **Селекторы Redux**

```typescript
// Мемоизированные селекторы
export const selectFilteredProducts = createSelector(
    [selectAllProducts, selectActiveFilter],
    (products, activeFilter) => filterProducts(products, activeFilter),
);
```

### ❌ Проблемы

#### **1. Пересоздание объектов в рендере**

```typescript
// ПРОБЛЕМА: Создание новых объектов при каждом рендере
const renderItem = ({ item }) => (
    <ProductCard
        item={item}
        style={{ marginBottom: 10 }} // Новый объект каждый раз
        onPress={() => handlePress(item.slug)} // Новая функция каждый раз
    />
);
```

#### **2. Нестабильные зависимости**

```typescript
// ПРОБЛЕМА: Меняющиеся зависимости
const memoizedCallback = useCallback(() => {
    // Некоторая логика
}, [state.someValue, props.someValue]); // Часто меняющиеся зависимости
```

---

## 🖼️ ОПТИМИЗАЦИЯ ИЗОБРАЖЕНИЙ

### ✅ Реализовано

#### **OptimizedImage компонент**

```typescript
// components/ui/OptimizedImage.tsx
import { Image } from "expo-image";

export const OptimizedImage = ({ source, style, ...props }) => {
    return (
        <Image
            source={source}
            style={style}
            contentFit="cover"
            transition={200}
            cachePolicy="disk"
            {...props}
        />
    );
};
```

#### **Предзагрузка изображений**

```typescript
// hooks/usePrefetch.ts
export const usePrefetch = (urls: string[]) => {
    useEffect(() => {
        const prefetchImages = async () => {
            await Promise.all(
                urls.map((url) => Image.prefetch(url)),
            );
        };
        prefetchImages();
    }, [urls]);
};
```

### ❌ Проблемы

#### **1. Отсутствие progressive loading**

```typescript
// ПРОБЛЕМА: Нет поэтапной загрузки
<OptimizedImage
    source={{ uri: highResUrl }} // Сразу загружаем полное разрешение
    // Нет placeholder или low-res preview
/>;
```

#### **2. Нет lazy loading**

```typescript
// ПРОБЛЕМА: Все изображения загружаются сразу
{
    products.map((product) => (
        <OptimizedImage
            source={{ uri: product.image_url }} // Загружается даже если не видно
        />
    ));
}
```

#### **3. Отсутствие skeleton loading**

```typescript
// ПРОБЛЕМА: Нет placeholder'ов при загрузке
<OptimizedImage
    source={{ uri: imageUrl }}
    // Нет индикатора загрузки
    // Нет fallback изображения
/>;
```

---

## 🗄️ REDUX ОПТИМИЗАЦИЯ

### ✅ Реализовано

#### **Мемоизированные селекторы**

```typescript
// Эффективные селекторы
export const selectFilteredProducts = createSelector(
    [selectAllProducts, selectActiveFilter],
    (products, activeFilter) => {
        if (activeFilter === "all") return products;
        return products.filter((p) => p.category === activeFilter);
    },
);
```

#### **Нормализованная структура**

```typescript
// Хорошая структура состояния
interface ProductsState {
    items: ProductItem[]; // Все товары
    filteredItems: ProductItem[]; // Отфильтрованные
    status: LoadingStatus;
    error: string | null;
}
```

### ❌ Проблемы

#### **1. Избыточные перерендеры**

```typescript
// ПРОБЛЕМА: Компонент подписан на всё состояние
const products = useAppSelector((state) => state.products); // Всё состояние
// Лучше: только нужные части
const items = useAppSelector((state) => state.products.items);
const status = useAppSelector((state) => state.products.status);
```

#### **2. Неэффективная фильтрация**

```typescript
// ПРОБЛЕМА: Фильтрация при каждом рендере
const filteredProducts = products.filter((p) => p.category === activeFilter); // Вычисляется каждый раз
```

---

## 📱 ОПТИМИЗАЦИЯ КОМПОНЕНТОВ

### ✅ Реализовано

#### **React.memo для карточек**

```typescript
const ProductCard = memo(({ item, viewMode, onPress }) => {
    return (
        <TouchableOpacity onPress={() => onPress(item.slug)}>
            <OptimizedImage source={{ uri: item.image_url }} />
            <Text>{item.name}</Text>
            <Text>{item.price} ₽</Text>
        </TouchableOpacity>
    );
});
```

#### **useCallback для обработчиков**

```typescript
const handleProductPress = useCallback((slug: string) => {
    router.replace(`/product/${slug}`);
}, [router]);
```

### ❌ Проблемы

#### **1. Избыточные вычисления**

```typescript
// ПРОБЛЕМА: Форматирование при каждом рендере
const ProductCard = ({ item }) => {
    const formattedPrice = formatPrice(item.price); // Каждый раз
    const discountText = getDiscountText(item.discount); // Каждый раз

    return (
        <View>
            <Text>{formattedPrice}</Text>
            <Text>{discountText}</Text>
        </View>
    );
};
```

#### **2. Неэффективные условия**

```typescript
// ПРОБЛЕМА: Условный рендер дорогих компонентов
return (
    <View>
        {showGallery && <ExpensiveGallery />} // Создается каждый раз
        {showDetails && <ExpensiveDetails />} // Создается каждый раз
    </View>
);
```

---

## 🎯 ПЛАН ОПТИМИЗАЦИИ

### 🔴 Критические (1-2 недели)

#### **1. Исправление FlatList**

```typescript
// TODO: Добавить виртуализацию
<VirtualizedList
    data={products}
    renderItem={renderMemoizedItem}
    getItemLayout={getOptimalItemLayout}
    // Продвинутые настройки
/>;
```

#### **2. Lazy loading изображений**

```typescript
// TODO: Ленивая загрузка
<LazyImage
    source={{ uri: imageUrl }}
    placeholder={<Skeleton />}
    threshold={100} // Загружать за 100px до появления
/>;
```

#### **3. Skeleton loading**

```typescript
// TODO: Skeleton компоненты
<SkeletonCard loading={isLoading}>
    <ProductCard item={item} />
</SkeletonCard>;
```

### 🟡 Важные (2-3 недели)

#### **4. Виртуализация галерей**

```typescript
// TODO: Виртуализированные галереи
<VirtualizedImageGallery
    images={product.images}
    renderItem={renderOptimizedImage}
    horizontal
    pagingEnabled
/>;
```

#### **5. Web Workers для обработки**

```typescript
// TODO: Тяжелые вычисления в Web Workers
const processProductData = (products) => {
    // Фильтрация, сортировка, группировка
    // в отдельном потоке
};
```

### 🟢 Желательные (1 месяц)

#### **6. Кеширование на уровне компонентов**

```typescript
// TODO: Кеширование результатов
const memoizedProductCard = useMemo(() => <ProductCard item={item} />, [
    item.id,
    item.name,
    item.price,
]);
```

#### **7. Предиктивная предзагрузка**

```typescript
// TODO: Предзагрузка следующих страниц
const prefetchNextPage = useCallback(() => {
    if (currentPage < totalPages) {
        dispatch(fetchProducts(currentPage + 1));
    }
}, [currentPage, totalPages]);
```

---

## 🔍 ПРОФИЛИРОВАНИЕ

### 🛠️ Инструменты

#### **React DevTools Profiler**

```typescript
// Для анализа рендеров
<Profiler id="ProductList" onRender={onRenderCallback}>
    <ProductList />
</Profiler>;
```

#### **Flipper Performance**

```typescript
// Мониторинг производительности
import { enableProfiler } from "react-native-flipper";

enableProfiler({
    measureRenders: true,
    measureInteractions: true,
});
```

### 📊 Метрики для отслеживания

#### **Производительность**

- **TTI (Time to Interactive):** <2s
- **FPS при скролле:** 60 FPS
- **Memory usage:** <150MB
- **JS Thread load:** <70%

#### **Пользовательский опыт**

- **Время загрузки изображений:** <1s
- **Отклик на тап:** <100ms
- **Плавность анимаций:** 60 FPS

---

## 🧪 ТЕСТИРОВАНИЕ ПРОИЗВОДИТЕЛЬНОСТИ

### 🔧 Методы тестирования

#### **Нагрузочное тестирование**

```typescript
// Тест с большим количеством товаров
const testLargeDataset = () => {
    const products = generateMockProducts(1000);
    render(<ProductList products={products} />);
    // Измерить время рендера
};
```

#### **Тест памяти**

```typescript
// Тест утечек памяти
const testMemoryLeaks = () => {
    // Многократно монтировать/размонтировать
    for (let i = 0; i < 100; i++) {
        const { unmount } = render(<ProductList />);
        unmount();
    }
    // Проверить использование памяти
};
```

### 📈 Бенчмарки

#### **Baseline (текущее состояние)**

- Рендер 50 товаров: ~300ms
- Скролл 1000 товаров: 45-55 FPS
- Загрузка изображения: 1-2s

#### **Цели оптимизации**

- Рендер 50 товаров: <150ms
- Скролл 1000 товаров: 60 FPS
- Загрузка изображения: <500ms

---

## 📚 СВЯЗАННЫЕ ДОКУМЕНТЫ

- **Текущее состояние:** [CURRENT_STATE.md](./CURRENT_STATE.md)
- **Архитектура:** [ARCHITECTURE.md](./ARCHITECTURE.md)
- **История изменений:** [CHANGELOG.md](./CHANGELOG.md)
- **План оптимизации:** [OPTIMIZATION_PLAN.md](./OPTIMIZATION_PLAN.md)

---

## 🔗 ПОЛЕЗНЫЕ РЕСУРСЫ

### 📖 Документация

- [React Native Performance](https://reactnative.dev/docs/performance)
- [FlatList Optimization](https://reactnative.dev/docs/flatlist#performance)
- [Expo Image Optimization](https://docs.expo.dev/versions/latest/sdk/image/)

### 🛠️ Инструменты

- [React DevTools Profiler](https://reactjs.org/blog/2018/09/10/introducing-the-react-profiler.html)
- [Flipper Performance Plugin](https://fbflipper.com/docs/features/react-native-performance)
- [Metro Bundle Analyzer](https://github.com/facebook/metro/tree/main/packages/metro-visualizer)

---

_Документ создан: 2024-01-13_\
_Автор: AI Assistant_\
_Версия: 1.0.0_
