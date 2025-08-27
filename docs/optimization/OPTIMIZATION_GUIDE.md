# Руководство по оптимизации приложения BIXIRUN

В этом документе собраны рекомендации по оптимизации производительности
мобильного приложения BIXIRUN на React Native/Expo. Рекомендации представлены в
формате пошаговых инструкций.

## 1. Оптимизация рендеринга компонентов

### 1.1. Мемоизация компонентов и функций

- [x] Мемоизировать карточки товаров с React.memo
- [x] Использовать useCallback для обработчиков событий
- [ ] Шаги по дальнейшей оптимизации:

```jsx
// ШАГ 1: Вынести все вспомогательные функции за пределы компонента
const calculateSomething = (param) => {
  // Вычисления
};

// ШАГ 2: Использовать useMemo для сложных вычислений
const ExpensiveComponent = () => {
  const expensiveValue = useMemo(() => {
    return someExpensiveCalculation(a, b);
  }, [a, b]);

  return <View>{expensiveValue}</View>;
};

// ШАГ 3: Предотвратить ненужные ререндеры с помощью React.memo и проверки пропсов
const areEqual = (prevProps, nextProps) => {
  return prevProps.value === nextProps.value;
};

const MemoizedComponent = React.memo(MyComponent, areEqual);
```

### 1.2. Оптимизация списков (FlatList)

- [x] Для каталога — removeClippedSubviews={true}; для главной — отключить
      (false), чтобы исключить мерцание/пустые картинки после билдов
- [x] Настроить initialNumToRender и maxToRenderPerBatch
- [x] Реализовать getItemLayout для оптимизации измерений
- [ ] Дополнительные шаги:

```jsx
// ШАГ 1: Мемоизировать renderItem
const renderItem = useCallback(({ item }) => <ItemComponent item={item} />, []);

// ШАГ 2: Оптимизировать keyExtractor
const keyExtractor = useCallback((item) => item.id.toString(), []);

// ШАГ 3: Использовать CellRendererComponent для дополнительного контроля
const CellRenderer = ({ children, index }) => (
  <View style={index % 2 === 0 ? styles.evenRow : styles.oddRow}>
    {children}
  </View>
);

// ШАГ 4: Добавить кэширование позиций элементов
const ITEM_HEIGHT = 100;
const getItemLayout = useCallback(
  (_, index) => ({
    length: ITEM_HEIGHT,
    offset: ITEM_HEIGHT * index,
    index,
  }),
  [],
);
```

### 1.3. Оптимизация изображений (expo-image + Supabase)

- [x] Компонент `components/ui/OptimizedImage.tsx` — использует `expo-image`,
      поддерживает кэш `memory-disk`, и имеет ретрай-логику: при ошибке загрузки
      оптимизированного URL делает один повтор с оригинальным URL без
      параметров.
- [x] Прелоад на главной: `ImagePreloader` подгружает первые 8 URL, чтобы убрать
      серые плейсхолдеры после холодного старта.
- [x] Платформенные правила генерации URL в `utils/imageUtils.ts`:
  - iOS: не указывать `format` (оставляем исходный JPEG/PNG), только
    `width/height` и `quality`.
  - Android: добавляем `format=webp` и `quality=75` для экономии трафика.
  - Для Android ограничиваем фактический `pixelRatio` до 2 при расчёте целевых
    размеров (сеточные карточки не тянут 3x+).

Кодовые точки:

- `utils/imageUtils.ts` — `getOptimizedImageUrl`, `getImageSizeForContainer`
  (платформенная логика и ограничение pixelRatio на Android)
- `components/ui/OptimizedImage.tsx` — ретрай на оригинальный URL при `onError`
- `components/ui/ImagePreloader.tsx` — фоновая предзагрузка
- `app/main.tsx` — подключение `ImagePreloader`, мягкие настройки FlatList

Замечания:

- Если отдельная карточка стабильно «серая», проверь `products.images[0]` и
  доступность объекта в бакете Supabase.
- Для больших PNG без прозрачности лучше хранить исходник в JPEG.

## 2. Оптимизация управления данными

### 2.1. Избегать вычислений при каждом рендере

- [x] Уменьшить количество тестовых данных
- [ ] Шаги по дальнейшей оптимизации:

```jsx
// ШАГ 1: Вынести генерацию тестовых данных за пределы компонента
// Плохо - данные создаются при каждом рендере
const Component = () => {
  const data = Array.from({ length: 100 }, createItem);
  return <View>{data.map(renderItem)}</View>;
};

// Хорошо - данные создаются один раз
const DATA = Array.from({ length: 100 }, createItem);
const Component = () => {
  return <View>{DATA.map(renderItem)}</View>;
};

// ШАГ 2: Использовать useMemo для обработки данных
const Component = ({ rawData }) => {
  const processedData = useMemo(() => {
    return rawData.map(processItem);
  }, [rawData]);

  return <FlatList data={processedData} />;
};
```

### 2.2. Внедрение Redux для управления состоянием

- [ ] Шаги по внедрению:

```jsx
// ШАГ 1: Настроить Redux с использованием Redux Toolkit
// store.js
import { configureStore } from "@reduxjs/toolkit";
import productsReducer from "./productsSlice";

export const store = configureStore({
  reducer: {
    products: productsReducer,
  },
});

// ШАГ 2: Создать slice для каждого типа данных
// productsSlice.js
import { createSlice } from "@reduxjs/toolkit";

const productsSlice = createSlice({
  name: "products",
  initialState: {
    items: [],
    status: "idle",
    error: null,
  },
  reducers: {
    // Редьюсеры
  },
});

// ШАГ 3: Использовать селекторы и мемоизацию с reselect
import { createSelector } from "reselect";

const selectProducts = (state) => state.products.items;
const selectCategories = (state) => state.categories.items;

export const selectProductsByCategory = createSelector(
  [selectProducts, selectCategories, (_, categoryId) => categoryId],
  (products, categories, categoryId) => {
    return products.filter((product) => product.categoryId === categoryId);
  },
);
```

## 3. Оптимизация навигации

### 3.1. Оптимизация Expo Router

- [ ] Шаги по оптимизации:

```jsx
// ШАГ 1: Предзагрузка маршрутов
// В корневом компоненте или при загрузке приложения
import { prefetchURL } from "expo-router";

useEffect(() => {
  prefetchURL("/products");
  prefetchURL("/timer");
}, []);

// ШАГ 2: Использовать lazy-loading для экранов
// В _layout.tsx
import { Slot, Stack } from "expo-router";
import { Suspense } from "react";

export default function Layout() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <Stack>
        <Stack.Screen name="index" options={{ title: "Home" }} />
      </Stack>
    </Suspense>
  );
}

// ШАГ 3: Оптимизировать переходы между экранами
router.push({
  pathname: "/product/[id]",
  params: { id: productId },
}, {
  animation: "fade", // Облегченная анимация
});
```

### 3.2. Кэширование состояния между навигациями

- [ ] Шаги по реализации:

```jsx
// ШАГ 1: Сохранение состояния при навигации
import AsyncStorage from "@react-native-async-storage/async-storage";

const ProductsScreen = () => {
  const [viewMode, setViewMode] = useState("grid");

  // Загрузка состояния при монтировании
  useEffect(() => {
    const loadViewMode = async () => {
      try {
        const savedMode = await AsyncStorage.getItem("viewMode");
        if (savedMode) setViewMode(savedMode);
      } catch (e) {
        console.log("Failed to load view mode");
      }
    };

    loadViewMode();
  }, []);

  // Сохранение при изменении
  useEffect(() => {
    const saveViewMode = async () => {
      try {
        await AsyncStorage.setItem("viewMode", viewMode);
      } catch (e) {
        console.log("Failed to save view mode");
      }
    };

    saveViewMode();
  }, [viewMode]);

  // Остальной код
};
```

## 4. Оптимизация UI и стилей

### 4.1. Упрощение стилей для повышения производительности

- [x] Удалить тени и заменить их на границы
- [ ] Дополнительные шаги:

```jsx
// ШАГ 1: Минимизировать использование абсолютных позиций
// Избегать:
{
  position: 'absolute',
  top: 10,
  left: 20,
  // ...
}

// Предпочитать:
{
  margin: 10,
  padding: 20,
  // ...
}

// ШАГ 2: Использовать оптимизированные изображения
import FastImage from 'react-native-fast-image';

<FastImage
  source={{ uri: item.imageUrl, priority: FastImage.priority.normal }}
  style={styles.image}
  resizeMode={FastImage.resizeMode.cover}
/>

// ШАГ 3: Минимизировать количество View контейнеров
// Вместо множества вложенных View используйте Fragment где возможно
<>
  <Text>Title</Text>
  <Text>Description</Text>
</>
```

### 4.2. Оптимизация анимаций

- [ ] Шаги по оптимизации:

```jsx
// ШАГ 1: Использовать useNativeDriver где возможно
Animated.timing(opacity, {
  toValue: 1,
  duration: 300,
  useNativeDriver: true, // Это критично для производительности
}).start();

// ШАГ 2: Предпочитать Reanimated 2 для сложных анимаций
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

const AnimatedComponent = () => {
  const opacity = useSharedValue(0);

  const animatedStyles = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
    };
  });

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 300 });
  }, []);

  return <Animated.View style={[styles.box, animatedStyles]} />;
};
```

## 5. Архитектурные улучшения

### 5.1. Разделение бизнес-логики и представления

- [ ] Шаги по реорганизации:

```jsx
// ШАГ 1: Выделить бизнес-логику в хуки
// useProducts.js
export const useProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      // Логика получения данных
      setProducts(data);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  return { products, loading, error, fetchProducts };
};

// В компоненте
const ProductsScreen = () => {
  const { products, loading, error, fetchProducts } = useProducts();

  // Только логика UI
  return (
    <View>
      {loading ? <LoadingIndicator /> : <ProductList products={products} />}
    </View>
  );
};
```

### 5.2. Внедрение кодового разделения

- [ ] Шаги по реализации:

```jsx
// ШАГ 1: Использовать динамические импорты для больших компонентов
import React, { lazy, Suspense } from "react";

// Вместо прямого импорта
// import HeavyComponent from './HeavyComponent';

// Использовать lazy
const HeavyComponent = lazy(() => import("./HeavyComponent"));

const App = () => (
  <Suspense fallback={<LoadingIndicator />}>
    <HeavyComponent />
  </Suspense>
);

// ШАГ 2: Разделить большие компоненты на более мелкие
// Вместо одного большого компонента ProductDetails
// Разделить на:
import ProductGallery from "./ProductGallery";
import ProductInfo from "./ProductInfo";
import ProductTabs from "./ProductTabs";

const ProductDetails = () => (
  <View>
    <ProductGallery images={product.images} />
    <ProductInfo product={product} />
    <ProductTabs product={product} />
  </View>
);
```

## 6. Мониторинг и дальнейшие улучшения

### 6.1. Внедрение инструментов профилирования

- [ ] Шаги по настройке:

```jsx
// ШАГ 1: Добавить Flipper для отладки (для разработки)
// Настроить в metro.config.js

// ШАГ 2: Использовать производительные журналы для отслеживания времени рендеринга
import { PerformanceObserver } from "react-native-performance";

const observer = new PerformanceObserver((list) => {
  const entries = list.getEntries();
  entries.forEach((entry) => {
    console.log(`${entry.name}: ${entry.duration}ms`);
  });
});

observer.observe({ entryTypes: ["measure"] });

// В компоненте
performance.mark("render-start");
// Рендеринг компонента
performance.mark("render-end");
performance.measure("component-render", "render-start", "render-end");
```

### 6.2. Оптимизация размера бандла

- [ ] Шаги по уменьшению размера:

```jsx
// ШАГ 1: Анализ размеров зависимостей
// Запустить команду для анализа
// npx expo-optimize

// ШАГ 2: Заменить большие библиотеки на более легкие аналоги
// Например, заменить moment.js на date-fns
// import { format } from 'date-fns';

// ШАГ 3: Использовать tree-shaking для уменьшения размера
// Импортировать только нужные компоненты
// Вместо:
// import { View, Text, Button, ... } from 'react-native';
// Использовать:
import { View } from "react-native";
import { Text } from "react-native";
import { Button } from "react-native";
```

---

## Приоритетные задачи

1. Дальнейшая мемоизация компонентов и функций
2. Внедрение Redux для улучшения управления состоянием
3. Оптимизация навигации и кэширование состояния между переходами
4. Разделение бизнес-логики и представления
5. Мониторинг производительности с инструментами профилирования

Эти оптимизации позволят значительно улучшить производительность и отзывчивость
приложения BIXIRUN.
