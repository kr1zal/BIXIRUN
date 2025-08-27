# АУДИТ АРХИТЕКТУРЫ КАРТОЧКИ ТОВАРА
## Дата: 2024-12-19
## Цель: Полный анализ архитектуры карточки товара в проекте BIXIRUN

---

## 🎯 ОБЩАЯ АРХИТЕКТУРА

### Основные компоненты карточки товара:

1. **Экран каталога товаров** (`app/products.tsx`)
2. **Детальная страница товара** (`app/product/[id].tsx`)
3. **Карточка товара на главной** (`app/main.tsx`)
4. **UI компоненты** (`components/ui/`)
5. **Redux состояние** (`app/store/slices/`)
6. **Типы данных** (`app/supabaseClient.ts`)

---

## 📋 ТИПЫ ДАННЫХ

### ProductData (исходный тип из Supabase)
```typescript
// app/supabaseClient.ts:92-102
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
};
```

### ProductItem (алиас для Redux)
```typescript
// app/store/slices/productsSlice.ts:6
export type ProductItem = ProductData;
```

### CartItem (расширенный тип для корзины)
```typescript
// app/store/slices/cartSlice.ts:5-10
export type CartItem = {
    product: ProductItem;
    quantity: number;
    selected: boolean;
};
```

---

## 🧩 КОМПОНЕНТЫ КАРТОЧКИ ТОВАРА

### 1. Экран каталога товаров (`app/products.tsx`)

**Основная функция**: Отображение списка товаров в Grid/List режиме

**Ключевые компоненты**:
- `GridItem` (строка 288) - карточка товара в Grid режиме
- `ListItem` (строка 358) - карточка товара в List режиме
- `ProductGallery` - галерея изображений с свайпом
- `ProductInfo` - информация о товаре
- `CartButtons` - кнопки управления корзиной

**Оптимизации**:
- Мемоизация с `React.memo`
- Кэшированные селекторы Redux
- Виртуализация с `FlatList`
- Предзагрузка изображений (`ImagePreloader`)

**Размеры**:
- Grid карточка: `GRID_CARD_WIDTH = (SCREEN_WIDTH - GRID_GAP * 3) / 2`
- Grid высота: `GRID_CARD_HEIGHT = GRID_CARD_WIDTH * (5/4) + 80`
- List высота: `LIST_CARD_HEIGHT = 120`

### 2. Детальная страница товара (`app/product/[id].tsx`)

**Основная функция**: Полная информация о товаре

**Ключевые компоненты**:
- `ProductImageGallery` - галерея изображений
- `ProductTabs` - табы с описанием/характеристиками/отзывами
- `QuantitySelector` - выбор количества
- `AddToCartButton` - добавление в корзину

**Логика**:
- Получение товара из Redux по ID
- Управление локальным количеством
- Интеграция с корзиной
- Навигация назад

### 3. Карточка товара на главной (`app/main.tsx`)

**Основная функция**: Компактная карточка товара

**Компонент**: `ProductGridCard` (строка 34)

**Особенности**:
- Упрощенная версия карточки
- Только основная информация
- Переход к детальной странице

---

## 🎨 UI КОМПОНЕНТЫ

### 1. ProductImageGallery (`components/ui/ProductImageGallery.tsx`)

**Функции**:
- Отображение множественных изображений
- Swipe навигация
- Миниатюры под галереей
- Кнопки навигации
- Точки индикации

**Размеры**:
- Высота галереи: `GALLERY_HEIGHT = SCREEN_WIDTH * (5/4)`
- Формат изображений: `4:5`
- Миниатюры: `48x48px`

**Оптимизации**:
- Предзагрузка соседних изображений
- `snapToInterval` для точной фиксации
- Мемоизация компонента

### 2. ProductTabs (`components/ui/ProductTabs.tsx`)

**Функции**:
- Отображение описания товара
- Показ характеристик
- Список отзывов с рейтингом

**Табы**:
- `description` - описание
- `specifications` - характеристики
- `reviews` - отзывы

### 3. AddToCartButton (`components/ui/AddToCartButton.tsx`)

**Функции**:
- Добавление товара в корзину
- Индикация загрузки
- Разные размеры (small/medium/large)
- Кастомизация стилей

**Пропсы**:
- `onPress` - обработчик
- `title` - текст кнопки
- `loading` - состояние загрузки
- `showIcon` - показать иконку
- `size` - размер кнопки

### 4. QuantitySelector (`components/ui/QuantitySelector.tsx`)

**Функции**:
- Выбор количества товара
- Кнопки +/-
- Ограничения min/max

**Особенности**:
- Мемоизированные обработчики
- Блокировка при достижении лимитов
- Кастомизация стилей

### 5. OptimizedImage (`components/ui/OptimizedImage.tsx`)

**Функции**:
- Оптимизированное отображение изображений
- Кэширование
- Плейсхолдеры
- Обработка ошибок

**Оптимизации**:
- Использование `expo-image`
- Автоматическое изменение размеров
- Приоритет загрузки
- Мемоизация

---

## 🔄 REDUX ИНТЕГРАЦИЯ

### Products Slice (`app/store/slices/productsSlice.ts`)

**Состояние**:
- `items: ProductItem[]` - все товары
- `filteredItems: ProductItem[]` - отфильтрованные товары
- `status` - статус загрузки
- `viewMode` - режим отображения (grid/list)
- `activeFilter` - активный фильтр

**Actions**:
- `fetchProducts` - асинхронная загрузка товаров
- `setViewMode` - смена режима отображения
- `setFilter` - установка фильтра

**Селекторы**:
- `selectFilteredProducts` - отфильтрованные товары
- `selectProductsStatus` - статус загрузки
- `selectActiveFilter` - активный фильтр
- `selectViewMode` - режим отображения

### Cart Slice (`app/store/slices/cartSlice.ts`)

**Взаимодействие с товарами**:
- `addToCart` - добавление ProductItem в корзину
- `removeFromCart` - удаление по ID товара
- `updateQuantity` - изменение количества

**Селекторы для товаров**:
- `selectCartItems` - товары в корзине
- `selectCartTotal` - общая стоимость
- `selectCartItemsCount` - количество товаров

---

## 🛠 ОПТИМИЗАЦИИ ПРОИЗВОДИТЕЛЬНОСТИ

### 1. Мемоизация компонентов
```typescript
// GridItem и ListItem используют React.memo
export const GridItem = React.memo(({ item, onPress }: CardProps) => {
    // ... компонент
}, (prevProps, nextProps) => {
    // Сравнение пропсов для предотвращения ререндеров
});
```

### 2. Кэшированные селекторы
```typescript
// Используются createSelector для мемоизации
const selectFilteredProducts = createSelector(
    [selectProducts, selectActiveFilter],
    (products, filter) => filterProducts(products, filter)
);
```

### 3. FlatList оптимизации
- `getItemLayout` - предрасчет размеров
- `initialNumToRender` - начальное количество
- `windowSize` - размер окна рендеринга
- `removeClippedSubviews` - удаление невидимых элементов

### 4. Предзагрузка изображений
```typescript
// ImagePreloader предзагружает первые 20 изображений
const imageUrls = useMemo(() => {
    return filteredItems
        .slice(0, 20)
        .map(item => item.images?.[0])
        .filter(Boolean) as string[];
}, [filteredItems]);
```

---

## 📊 ИНТЕГРАЦИЯ С SUPABASE

### Получение данных (`app/supabaseClient.ts`)

**Функция**: `getProducts(): Promise<ProductData[]>`

**Особенности**:
- Парсинг JSON для поля `specs`
- Обработка ошибок
- Возврат типизированных данных

```typescript
export async function getProducts(): Promise<ProductData[]> {
    const { data, error } = await supabase.from('products').select('*');
    if (error) throw error;
    return (data || []).map((item: any) => ({
        ...item,
        specs: typeof item.specs === 'string' ? JSON.parse(item.specs) : item.specs
    }));
}
```

---

## 🎯 НАВИГАЦИЯ И РОУТИНГ

### Переходы между экранами:
1. **Главная → Каталог**: `router.replace('/products')`
2. **Каталог → Детальная**: `router.replace('/product/${id}')`
3. **Детальная → Корзина**: `router.replace('/cart')`
4. **Любая → Назад**: `router.back()`

### Параметры роутинга:
- `[id].tsx` - динамический роут для товара
- `useLocalSearchParams()` - получение ID товара

---

## 📱 АДАПТИВНОСТЬ И РАЗМЕРЫ

### Расчет размеров:
```typescript
const SCREEN_WIDTH = Dimensions.get('window').width;
const GRID_GAP = 3;
const GRID_CARD_WIDTH = (SCREEN_WIDTH - GRID_GAP * 3) / 2;
```

### Формат изображений:
- **Основные**: `4:5` (портретный)
- **Миниатюры**: `1:1` (квадратные)
- **Галерея**: `SCREEN_WIDTH * (5/4)` высота

---

## 🔍 ФАЙЛЫ ДОКУМЕНТАЦИИ

### Документы с упоминанием карточки товара:
1. **PERFORMANCE_OPTIMIZATION.md** - оптимизация карточек товаров
2. **CART_README.md** - интеграция с корзиной
3. **README_catalog_tap_swipe.md** - жесты в карточках
4. **README_navigation_error.md** - навигация через карточки
5. **TECH_SPEC.md** - техническая спецификация

### Проблемы и решения:
- **Подергивания**: Исправлены настройки FlatList
- **Массовые ре-рендеры**: Мемоизированные селекторы
- **Лаги галереи**: Оптимизированы изображения

---

## 🧪 ТЕСТИРОВАНИЕ И ОТЛАДКА

### Метрики производительности:
- FlatList рендеринг (50 товаров): **60% быстрее**
- Поддержка **1000+ товаров** без потери производительности
- Виртуализация UI для больших списков

### Профилирование:
- Мемоизация компонентов карточек
- Кэширование селекторов Redux
- Оптимизация изображений

---

## 🚀 РЕКОМЕНДАЦИИ ДЛЯ ДОРАБОТКИ

### 1. Улучшения UX:
- Skeleton loading для карточек
- Lazy loading изображений
- Кэширование данных товаров

### 2. Производительность:
- Intersection Observer для видимости
- Web Workers для обработки данных
- CDN для изображений

### 3. Функциональность:
- Сравнение товаров
- Избранное
- Фильтры по характеристикам
- Поиск по товарам

### 4. Типизация:
- Строгая типизация specs
- Валидация данных из API
- Обработка отсутствующих изображений

---

## 📋 ИМПОРТЫ И ЗАВИСИМОСТИ

### Основные зависимости карточки товара:

```typescript
// Навигация
import { useRouter } from 'expo-router';

// UI и стили
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';

// Redux
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { ProductItem } from '../store/slices/productsSlice';
import { addToCart } from '../store/slices/cartSlice';

// Утилиты
import { getOptimizedImageUrl } from '../utils/imageUtils';
```

### Граф зависимостей:
```
ProductData (supabaseClient.ts)
    ↓
ProductItem (productsSlice.ts)
    ↓
GridItem/ListItem (products.tsx)
    ↓
ProductImageGallery + ProductInfo + CartButtons
    ↓
OptimizedImage + AddToCartButton + QuantitySelector
```

---

## 🔧 СОСТОЯНИЕ АРХИТЕКТУРЫ

### ✅ Реализовано:
- [x] Типизация данных товаров
- [x] Redux интеграция
- [x] Оптимизированные карточки
- [x] Адаптивный дизайн
- [x] Навигация между экранами
- [x] Интеграция с корзиной
- [x] Галерея изображений
- [x] Производительность

### ⚠️ Требует внимания:
- [ ] Обработка ошибок загрузки
- [ ] Offline режим
- [ ] Кэширование изображений
- [ ] Accessibility

### 🔄 Потенциальные улучшения:
- [ ] Виртуализация больших списков
- [ ] Progressive image loading
- [ ] Gesture recognizers
- [ ] Animation transitions

---

## 📊 МЕТРИКИ КОДА

### Файлы по типам:
- **Экраны**: 3 файла (`products.tsx`, `product/[id].tsx`, `main.tsx`)
- **UI компоненты**: 6 файлов (`ProductImageGallery.tsx`, `ProductTabs.tsx`, `AddToCartButton.tsx`, `QuantitySelector.tsx`, `OptimizedImage.tsx`, `ImagePreloader.tsx`)
- **Redux**: 2 файла (`productsSlice.ts`, `cartSlice.ts`)
- **Утилиты**: 2 файла (`imageUtils.ts`, `supabaseClient.ts`)
- **Документация**: 6 файлов

### Объем кода:
- **Всего строк**: ~2000+ строк кода
- **Компоненты**: 15+ React компонентов
- **Типы**: 5+ TypeScript интерфейсов
- **Селекторы**: 10+ Redux селекторов

---

*Документ создан: 2024-12-19*
*Версия: 1.0.0*
*Автор: AI Assistant* 