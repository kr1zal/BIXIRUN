# ИНДЕКС ФАЙЛОВ КАРТОЧКИ ТОВАРА
## Дата: 2024-12-19
## Цель: Быстрый доступ к файлам архитектуры карточки товара

---

## 📱 ОСНОВНЫЕ ЭКРАНЫ

### 1. `app/products.tsx`
- **Назначение**: Главный экран каталога товаров
- **Компоненты**: GridItem, ListItem, ProductGallery, ProductInfo, CartButtons
- **Особенности**: Grid/List режимы, фильтрация, оптимизация FlatList

### 2. `app/product/[id].tsx`
- **Назначение**: Детальная страница товара
- **Компоненты**: ProductImageGallery, ProductTabs, QuantitySelector, AddToCartButton
- **Особенности**: Динамический роутинг, интеграция с корзиной

### 3. `app/main.tsx`
- **Назначение**: Главная страница с блоком товаров
- **Компоненты**: ProductGridCard
- **Особенности**: Упрощенные карточки, навигация к каталогу

---

## 🎨 UI КОМПОНЕНТЫ

### 1. `components/ui/ProductImageGallery.tsx`
- **Назначение**: Галерея изображений товара
- **Функции**: Swipe навигация, миниатюры, кнопки навигации
- **Размер**: 259 строк

### 2. `components/ui/ProductTabs.tsx`
- **Назначение**: Табы с информацией о товаре
- **Функции**: Описание, характеристики, отзывы
- **Размер**: 218 строк

### 3. `components/ui/AddToCartButton.tsx`
- **Назначение**: Кнопка добавления в корзину
- **Функции**: Разные размеры, индикация загрузки
- **Размер**: 127 строк

### 4. `components/ui/QuantitySelector.tsx`
- **Назначение**: Селектор количества товара
- **Функции**: Кнопки +/-, ограничения min/max
- **Размер**: 94 строки

### 5. `components/ui/OptimizedImage.tsx`
- **Назначение**: Оптимизированное отображение изображений
- **Функции**: Кэширование, плейсхолдеры, обработка ошибок
- **Размер**: 81 строка

### 6. `components/ui/ImagePreloader.tsx`
- **Назначение**: Предзагрузка изображений в фоне
- **Функции**: Фоновая предзагрузка для лучшей производительности
- **Размер**: 27 строк

---

## 🔄 REDUX СЛАЙСЫ

### 1. `app/store/slices/productsSlice.ts`
- **Назначение**: Управление состоянием товаров
- **Функции**: Загрузка, фильтрация, режимы отображения
- **Типы**: ProductItem, FilterCategory
- **Селекторы**: selectFilteredProducts, selectProductsStatus

### 2. `app/store/slices/cartSlice.ts`
- **Назначение**: Управление корзиной
- **Функции**: Добавление/удаление товаров, количество
- **Типы**: CartItem
- **Селекторы**: selectCartItems, selectCartTotal

### 3. `app/store/hooks.ts`
- **Назначение**: Типизированные хуки Redux
- **Функции**: useAppDispatch, useAppSelector

### 4. `app/store/index.ts`
- **Назначение**: Конфигурация Redux store
- **Функции**: Подключение слайсов, middleware

---

## 🗄️ ДАННЫЕ И ТИПЫ

### 1. `app/supabaseClient.ts`
- **Назначение**: Интеграция с Supabase
- **Функции**: getProducts(), типы ProductData
- **Особенности**: Парсинг JSON specs, обработка ошибок

### 2. `utils/imageUtils.ts`
- **Назначение**: Утилиты для оптимизации изображений
- **Функции**: getOptimizedImageUrl, размеры изображений
- **Константы**: IMAGE_SIZES

### 3. `app/utils/storage.ts`
- **Назначение**: Работа с AsyncStorage
- **Функции**: Сохранение/загрузка данных корзины

---

## 🛠️ ХУКИ И УТИЛИТЫ

### 1. `hooks/useCart.ts`
- **Назначение**: Хук для работы с корзиной
- **Функции**: addToCart, removeFromCart, updateQuantity
- **Зависимости**: ProductItem, cartSlice

### 2. `hooks/useFlatListOptimization.ts`
- **Назначение**: Оптимизация FlatList
- **Функции**: Настройки производительности для списков

### 3. `hooks/usePrefetch.ts`
- **Назначение**: Предзагрузка данных
- **Функции**: Фоновая загрузка изображений

---

## 📚 ДОКУМЕНТАЦИЯ

### 1. `PERFORMANCE_OPTIMIZATION.md`
- **Содержание**: Оптимизация карточек товаров
- **Ключевые темы**: Неоптимизированные галереи, FlatList настройки

### 2. `CART_README.md`
- **Содержание**: Интеграция карточек с корзиной
- **Ключевые темы**: AddToCartButton, оптимизация ре-рендеров

### 3. `README_catalog_tap_swipe.md`
- **Содержание**: Жесты в карточках товаров
- **Ключевые темы**: Swipe галереи, tap навигация

### 4. `README_navigation_error.md`
- **Содержание**: Навигация через карточки товаров
- **Ключевые темы**: Исправления роутинга, красная корзина

### 5. `TECH_SPEC.md`
- **Содержание**: Техническая спецификация
- **Ключевые темы**: Product details page, memoize product cards

### 6. `docs/OPTIMIZATION_GUIDE.md`
- **Содержание**: Руководство по оптимизации
- **Ключевые темы**: Мемоизация карточек товаров

---

## 🎯 ГРАФ ЗАВИСИМОСТЕЙ

```
ProductData (supabaseClient.ts)
    ├── ProductItem (productsSlice.ts)
    │   ├── GridItem/ListItem (products.tsx)
    │   ├── ProductGridCard (main.tsx)
    │   └── ProductDetails ([id].tsx)
    │
    ├── CartItem (cartSlice.ts)
    │   └── useCart (hooks/useCart.ts)
    │
    └── UI Components
        ├── ProductImageGallery.tsx
        ├── ProductTabs.tsx
        ├── AddToCartButton.tsx
        ├── QuantitySelector.tsx
        └── OptimizedImage.tsx
```

---

## 🔧 ИМПОРТЫ ПО ФАЙЛАМ

### Основные импорты в `app/products.tsx`:
```typescript
import { FilterCategory, ProductItem, fetchProducts } from './store/slices/productsSlice';
import { addToCart, removeFromCart, updateQuantity } from './store/slices/cartSlice';
import ImagePreloader from '../components/ui/ImagePreloader';
import OptimizedImage from '../components/ui/OptimizedImage';
```

### Основные импорты в `app/product/[id].tsx`:
```typescript
import AddToCartButton from '../../components/ui/AddToCartButton';
import ProductImageGallery from '../../components/ui/ProductImageGallery';
import ProductTabs from '../../components/ui/ProductTabs';
import QuantitySelector from '../../components/ui/QuantitySelector';
```

### Основные импорты в UI компонентах:
```typescript
import { Image } from 'expo-image'; // OptimizedImage
import { Ionicons } from '@expo/vector-icons'; // Все UI компоненты
import { getOptimizedImageUrl } from '../../utils/imageUtils';
```

---

## 📊 СТАТИСТИКА ФАЙЛОВ

### Размеры файлов (приблизительно):
- **app/products.tsx**: ~800 строк
- **app/product/[id].tsx**: ~280 строк
- **app/main.tsx**: ~300 строк (включая карточки)
- **ProductImageGallery.tsx**: 259 строк
- **ProductTabs.tsx**: 218 строк
- **AddToCartButton.tsx**: 127 строк
- **QuantitySelector.tsx**: 94 строки
- **OptimizedImage.tsx**: 81 строка

### Общий объем:
- **Всего файлов**: 15+ прямо связанных с карточками
- **Строк кода**: ~2000+ строк
- **Компонентов**: 15+ React компонентов
- **Типов**: 5+ TypeScript интерфейсов

---

## 🚀 БЫСТРАЯ НАВИГАЦИЯ

### Для изменения дизайна карточки:
1. **Grid режим**: `app/products.tsx` → GridItem (строка 288)
2. **List режим**: `app/products.tsx` → ListItem (строка 358)
3. **Главная страница**: `app/main.tsx` → ProductGridCard (строка 34)

### Для изменения галереи изображений:
1. **Компонент**: `components/ui/ProductImageGallery.tsx`
2. **Использование**: `app/product/[id].tsx`

### Для изменения кнопок корзины:
1. **Компонент**: `components/ui/AddToCartButton.tsx`
2. **Логика**: `app/store/slices/cartSlice.ts`

### Для изменения типов данных:
1. **Основные типы**: `app/supabaseClient.ts`
2. **Redux типы**: `app/store/slices/productsSlice.ts`

---

## 🔍 ПОИСК ПО ФУНКЦИЯМ

### Поиск по коду:
```bash
# Найти все компоненты карточек товаров
grep -r "ProductCard\|GridItem\|ListItem" app/ components/

# Найти все использования ProductItem
grep -r "ProductItem" app/ components/ hooks/

# Найти все галереи изображений
grep -r "ProductImageGallery\|ProductGallery" app/ components/

# Найти все импорты товаров
grep -r "import.*product\|import.*Product" app/ components/
```

### Поиск по документации:
```bash
# Найти документацию по карточкам товаров
grep -r "product.*card\|карточка.*товара" *.md docs/
```

---

*Документ создан: 2024-12-19*
*Версия: 1.0.0*
*Связанный документ: PRODUCT_CARD_ARCHITECTURE_AUDIT.md* 