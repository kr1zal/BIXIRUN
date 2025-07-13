# 🐛 СПРАВОЧНИК БАГОВ И РЕШЕНИЙ

## Последнее обновление: 2024-01-13

---

## 📋 СОДЕРЖАНИЕ

- [🔴 Критические баги](#-критические-баги)
- [🟡 Важные баги](#-важные-баги)
- [🟢 Исправленные баги](#-исправленные-баги)
- [⚙️ Профилактические решения](#️-профилактические-решения)
- [🔍 Диагностические методы](#-диагностические-методы)

---

## 🔴 КРИТИЧЕСКИЕ БАГИ

### 1. 🛒 Красная корзина после покупки

**Дата обнаружения:** 2024-12-18\
**Статус:** ✅ ИСПРАВЛЕН\
**Файл:** `navigation_error.md`, `components/ui/AddToCartButton.tsx`

#### Описание проблемы:

Корзина отображалась красным цветом (состояние ошибки) после успешного
добавления товара.

#### Причина:

Некорректное обновление состояния Redux, приводящее к рассинхронизации UI и
данных корзины.

#### Решение:

```typescript
// ❌ ДО: некорректное обновление
const addToCart = (product: ProductItem) => {
    setCartItems([...cartItems, { product, quantity: 1 }]);
    // Состояние обновляется асинхронно, UI не успевает за изменениями
};

// ✅ ПОСЛЕ: правильная мемоизация
const cartCount = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.quantity, 0),
    [cartItems],
);

const addToCart = useCallback((product: ProductItem, quantity = 1) => {
    dispatch(cartSlice.actions.addToCart({ product, quantity }));
}, [dispatch]);
```

#### Тестирование:

```typescript
// Тест для проверки корректности состояния
describe("AddToCartButton", () => {
    it("should update cart count correctly", async () => {
        const { getByTestId } = render(
            <AddToCartButton product={mockProduct} />,
        );

        fireEvent.press(getByTestId("add-to-cart-button"));

        await waitFor(() => {
            expect(getByTestId("cart-badge")).toHaveTextContent("1");
        });
    });
});
```

---

### 2. 📱 Пропадание меню навигации

**Дата обнаружения:** 2024-12-18\
**Статус:** ✅ ИСПРАВЛЕН\
**Файл:** `navigation_error.md`

#### Описание проблемы:

При переходе на страницу товара из карточки пропадало нижнее меню навигации.

#### Причина:

Конфликт между `router.push()` и `router.replace()` в контексте `AppLayout`.

#### Решение:

```typescript
// ❌ ДО: router.push() ломал layout
const handleProductPress = (slug: string) => {
    router.push(`/product/${slug}`); // Создавал новый стек, ломал AppLayout
};

// ✅ ПОСЛЕ: router.replace() сохраняет layout
const handleProductPress = (slug: string) => {
    router.replace(`/product/${slug}`); // Сохраняет AppLayout и меню
};

// На странице товара для возврата:
const handleBackPress = () => {
    router.push("/products"); // Явный возврат к каталогу
};
```

#### Проверка:

1. Переход из каталога на товар → меню остается
2. Переход с главной на товар → меню остается
3. Кнопка "назад" → корректный возврат

---

### 3. 🖼️ Зависание галереи изображений

**Дата обнаружения:** 2024-12-17\
**Статус:** ✅ ИСПРАВЛЕН\
**Файл:** `PERFORMANCE_OPTIMIZATION.md`

#### Описание проблемы:

Галерея изображений зависала при свайпе между большими изображениями (259 строк
кода).

#### Причина:

Отсутствие оптимизации загрузки и рендеринга изображений.

#### Решение:

```typescript
// ❌ ДО: все изображения загружались сразу
{
    images.map((image, index) => (
        <Image key={index} source={{ uri: image }} style={styles.image} />
    ));
}

// ✅ ПОСЛЕ: ленивая загрузка + мемоизация
const MemoizedImage = memo(({ source, isVisible }: ImageProps) => {
    if (!isVisible) return <View style={styles.placeholder} />;

    return (
        <Image
            source={{ uri: source }}
            style={styles.image}
            resizeMode="cover"
            cache="force-cache"
        />
    );
});

// Предзагрузка соседних изображений
useEffect(() => {
    const preloadImages = async () => {
        const adjacentImages = [
            images[currentIndex - 1],
            images[currentIndex + 1],
        ].filter(Boolean);

        await Promise.all(adjacentImages.map((img) => Image.prefetch(img)));
    };

    preloadImages();
}, [currentIndex, images]);
```

---

## 🟡 ВАЖНЫЕ БАГИ

### 4. 📐 Неправильные размеры карточек на разных экранах

**Дата обнаружения:** 2024-12-17\
**Статус:** ⚠️ ЧАСТИЧНО ИСПРАВЛЕН

#### Описание проблемы:

Карточки товаров имели фиксированные размеры, не адаптируясь к разным размерам
экранов.

#### Решение:

```typescript
// ✅ Адаптивные размеры
const { width: screenWidth } = useWindowDimensions();

const getItemWidth = () => {
    const padding = 32; // отступы по краям
    const gap = 16; // отступ между карточками
    const columns = screenWidth > 768 ? 3 : 2;

    return (screenWidth - padding - (gap * (columns - 1))) / columns;
};

const styles = StyleSheet.create({
    gridItem: {
        width: getItemWidth(),
        marginBottom: 16,
    },
});
```

---

### 5. 🔄 Лишние ре-рендеры карточек

**Дата обнаружения:** 2024-12-17\
**Статус:** ✅ ИСПРАВЛЕН

#### Описание проблемы:

Карточки товаров перерисовывались при изменении не связанных с ними данных.

#### Решение:

```typescript
// ❌ ДО: компонент без мемоизации
const GridItem = ({ item, onPress }) => {
    return (
        <TouchableOpacity onPress={() => onPress(item.id)}>
            <Text>{item.name}</Text>
            <Text>{item.price}</Text>
        </TouchableOpacity>
    );
};

// ✅ ПОСЛЕ: мемоизация с правильными зависимостями
const GridItem = memo(({ item, onPress }: GridItemProps) => {
    const handlePress = useCallback(() => {
        onPress(item.id);
    }, [item.id, onPress]);

    return (
        <TouchableOpacity onPress={handlePress}>
            <Text>{item.name}</Text>
            <Text>{item.price}</Text>
        </TouchableOpacity>
    );
}, (prevProps, nextProps) => {
    // Кастомная функция сравнения
    return prevProps.item.id === nextProps.item.id &&
        prevProps.item.price === nextProps.item.price;
});
```

---

## 🟢 ИСПРАВЛЕННЫЕ БАГИ

### 6. 🔍 Свайп галереи конфликтует с прокруткой

**Дата обнаружения:** 2024-12-18\
**Статус:** ✅ ИСПРАВЛЕН\
**Файл:** `README_catalog_tap_swipe.md`

#### Описание проблемы:

Горизонтальный свайп в галерее конфликтовал с вертикальной прокруткой страницы.

#### Решение:

```typescript
// ✅ Правильная обработка жестов
const gestureHandler = useCallback((event: GestureEvent) => {
    const { translationX, translationY, velocityX } = event.nativeEvent;

    // Определяем направление жеста
    const isHorizontalGesture = Math.abs(translationX) > Math.abs(translationY);

    if (isHorizontalGesture && Math.abs(velocityX) > 200) {
        // Обрабатываем как свайп галереи
        if (translationX > 50) {
            showPreviousImage();
        } else if (translationX < -50) {
            showNextImage();
        }
    }
    // Иначе пропускаем событие для прокрутки
}, [showPreviousImage, showNextImage]);
```

---

### 7. 💾 Потеря данных корзины при перезагрузке

**Дата обнаружения:** 2024-12-18\
**Статус:** ✅ ИСПРАВЛЕН

#### Решение:

```typescript
// ✅ Персистентность данных корзины
import { persistReducer, persistStore } from "redux-persist";
import AsyncStorage from "@react-native-async-storage/async-storage";

const persistConfig = {
    key: "cart",
    storage: AsyncStorage,
    whitelist: ["items", "total"], // Сохраняем только нужные поля
};

const persistedCartReducer = persistReducer(persistConfig, cartSlice.reducer);
```

---

### 8. 🎨 Темная тема не применяется к карточкам

**Дата обнаружения:** 2024-12-19\
**Статус:** ✅ ИСПРАВЛЕН

#### Решение:

```typescript
// ✅ Динамические стили на основе темы
const useProductCardStyles = () => {
    const { theme } = useTheme();

    return StyleSheet.create({
        card: {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
        },
        title: {
            color: theme.colors.onSurface,
        },
        price: {
            color: theme.colors.primary,
        },
    });
};
```

---

## ⚙️ ПРОФИЛАКТИЧЕСКИЕ РЕШЕНИЯ

### 1. 🔒 Типобезопасность

```typescript
// Строгая типизация для предотвращения ошибок
interface ProductCardProps {
    product: ProductItem;
    variant: "grid" | "list" | "compact";
    onPress: (productId: string) => void;
    loading?: boolean;
}

// Валидация пропсов в runtime (только для разработки)
if (__DEV__) {
    const validateProps = (props: ProductCardProps) => {
        if (!props.product?.id) {
            console.warn("ProductCard: product.id is required");
        }
        if (!props.onPress) {
            console.warn("ProductCard: onPress handler is required");
        }
    };
}
```

### 2. 🎯 Error Boundaries

```typescript
// Обертка для предотвращения краха приложения
class ProductCardErrorBoundary extends React.Component {
    state = { hasError: false };

    static getDerivedStateFromError(error: Error) {
        return { hasError: true };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error("ProductCard Error:", error, errorInfo);
        // Отправка в аналитику
    }

    render() {
        if (this.state.hasError) {
            return <ProductCardFallback />;
        }

        return this.props.children;
    }
}
```

### 3. 📊 Мониторинг производительности

```typescript
// Отслеживание медленных рендеров
const usePerformanceMonitoring = (componentName: string) => {
    useEffect(() => {
        const startTime = performance.now();

        return () => {
            const endTime = performance.now();
            const renderTime = endTime - startTime;

            if (renderTime > 16) { // Больше одного фрейма
                console.warn(
                    `Slow render in ${componentName}: ${renderTime}ms`,
                );
            }
        };
    });
};
```

---

## 🔍 ДИАГНОСТИЧЕСКИЕ МЕТОДЫ

### 1. 🐛 Отладка Redux состояния

```typescript
// Логирование изменений состояния корзины
const debugCartState = () => {
    const state = store.getState();
    console.group("Cart Debug");
    console.log("Items:", state.cart.items);
    console.log("Total:", state.cart.total);
    console.log("Count:", state.cart.items.length);
    console.groupEnd();
};

// Middleware для отладки
const debugMiddleware: Middleware = (store) => (next) => (action) => {
    if (action.type.startsWith("cart/")) {
        console.log("Cart action:", action.type, action.payload);
    }
    return next(action);
};
```

### 2. 📱 Отладка рендеринга

```typescript
// Подсветка перерисовок компонентов
const useRenderTracker = (componentName: string) => {
    const renderCount = useRef(0);
    renderCount.current++;

    console.log(`${componentName} rendered ${renderCount.current} times`);
};

// Флаг для включения отладки
if (__DEV__ && global.DEBUG_RENDERS) {
    // Включить отладку рендеринга
}
```

### 3. 🔍 Профилирование производительности

```typescript
// Измерение времени выполнения операций
const measurePerformance = async (
    operation: string,
    fn: () => Promise<void>,
) => {
    const startTime = performance.now();
    await fn();
    const endTime = performance.now();

    console.log(`${operation} took ${endTime - startTime} milliseconds`);
};

// Использование
await measurePerformance("Add to cart", async () => {
    dispatch(addToCart(product));
});
```

### 4. 📋 Чек-лист для тестирования карточек

```markdown
## Чек-лист тестирования карточки товара

### Функциональность:

- [ ] Отображение информации о товаре
- [ ] Переход на детальную страницу
- [ ] Добавление в корзину
- [ ] Изменение количества
- [ ] Переключение между Grid/List

### Производительность:

- [ ] Плавная прокрутка каталога
- [ ] Быстрая загрузка изображений
- [ ] Отсутствие лишних ре-рендеров

### UX:

- [ ] Анимации переходов
- [ ] Haptic feedback
- [ ] Правильные состояния кнопок
- [ ] Темная тема

### Совместимость:

- [ ] iOS
- [ ] Android
- [ ] Разные размеры экранов
- [ ] Разные ориентации
```

---

## 📚 ПОЛЕЗНЫЕ КОМАНДЫ

### Поиск потенциальных проблем:

```bash
# Найти компоненты без memo
grep -r "const.*= (" app/products.tsx | grep -v "memo"

# Найти прямые мутации состояния
grep -r "\.push\|\.pop\|\.splice" app/store/

# Найти неоптимизированные стили
grep -r "StyleSheet\.create" . | grep -v "useMemo\|useCallback"
```

### Генерация отчета о производительности:

```bash
# Анализ бандла
npx react-native bundle \
  --platform ios \
  --dev false \
  --entry-file index.js \
  --bundle-output ios-release.bundle \
  --verbose

# Анализ размеров
du -sh ios-release.bundle
```

---

_Справочник создан: 2024-01-13_\
_Связанные документы:
[PRODUCT_CARDS_COMPLETE.md](../../PRODUCT_CARDS_COMPLETE.md)_
