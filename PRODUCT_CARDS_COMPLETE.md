# 🛍️ ПОЛНАЯ ИСТОРИЯ КАРТОЧЕК ТОВАРОВ

## Последнее обновление: 2024-01-13

## Статус: АКТИВНАЯ РАЗРАБОТКА

---

## 🔍 БЫСТРАЯ НАВИГАЦИЯ

- [📅 Хронология разработки](#-хронология-разработки)
- [🏗️ Текущая архитектура](#️-текущая-архитектура)
- [⚡ Известные проблемы](#-известные-проблемы)
- [📋 Планы развития](#-планы-развития)
- [📚 Справочники](#-справочники)

---

## 📅 ХРОНОЛОГИЯ РАЗРАБОТКИ

### 🎯 2024-12-15: Архитектурный аудит

**Цель:** Анализ текущего состояния карточек товаров

**Обнаружено:**

- 3 типа карточек: Grid/List в каталоге, компактные на главной
- Дублирование логики между компонентами
- Неоптимизированные галереи изображений
- Проблемы с производительностью FlatList

**Ключевые файлы:**

- `app/products.tsx` - основной каталог (800+ строк)
- `app/product/[slug].tsx` - детальная страница товара
- `components/ui/ProductImageGallery.tsx` - галерея (259 строк)

### 🎨 2024-12-16: UX анализ и макеты

**Цель:** Сравнение с лидерами рынка (WB, Ozon)

**Результаты анализа:**

- WB подход: минимализм, фокус на цене
- Ozon подход: информативность, социальные индикаторы
- Наш подход: гибрид лучших практик

**Созданы макеты:**

- 3 варианта ценового блока
- 4 состояния кнопки корзины
- Анимации микроинтерракций
- Темная тема

### ⚡ 2024-12-17: Оптимизация производительности

**Цель:** Устранение лагов и улучшение отзывчивости

**Проведенные оптимизации:**

1. **FlatList настройки:**
   ```typescript
   getItemLayout={(data, index) => ({
     length: ITEM_HEIGHT,
     offset: ITEM_HEIGHT * index,
     index,
   })}
   removeClippedSubviews={true}
   maxToRenderPerBatch={10}
   windowSize={10}
   ```

2. **Мемоизация компонентов:**
   ```typescript
   const MemoizedGridItem = memo(GridItem);
   const MemoizedListItem = memo(ListItem);
   ```

3. **Предзагрузка изображений:**
   ```typescript
   // components/ui/ImagePreloader.tsx
   const prefetchImages = useCallback(async (urls: string[]) => {
       await Promise.all(urls.map((url) => Image.prefetch(url)));
   }, []);
   ```

4. **Оптимизация Redux:**
   ```typescript
   // Селекторы с мемоизацией
   const selectFilteredProducts = createSelector(
       [selectAllProducts, selectCurrentFilter],
       (products, filter) => products.filter(filter),
   );
   ```

### 🐛 2024-12-18: Баги навигации и фиксы

**Цель:** Исправление критических багов

**Решенные проблемы:**

1. **Красная корзина после покупки:**
   ```typescript
   // До: некорректное обновление состояния
   setCartItems([...cartItems, newItem]);

   // После: правильная мемоизация
   const cartCount = useMemo(
       () => cartItems.reduce((sum, item) => sum + item.quantity, 0),
       [cartItems],
   );
   ```

2. **Навигация из карточки:**
   ```typescript
   // navigation_error.md решение:
   router.replace("/blog"); // вместо router.push для сохранения layout
   ```

3. **Свайп галереи:**
   ```typescript
   // README_catalog_tap_swipe.md
   const onSwipeLeft = useCallback(() => {
       if (currentIndex < images.length - 1) {
           setCurrentIndex((prev) => prev + 1);
       }
   }, [currentIndex, images.length]);
   ```

### 🎯 2024-12-19: Финальные улучшения

**Цель:** Полировка и документация

**Завершенные задачи:**

- Создание полного индекса файлов (PRODUCT_CARD_FILES_INDEX.md)
- Визуальные макеты для всех состояний (PRODUCT_CARD_MOCKUPS.md)
- Руководство по реализации (PRODUCT_CARD_IMPLEMENTATION_GUIDE.md)
- Upgrade план для кнопок (PRODUCT_CARD_BUTTON_UPGRADE.md)

### 🔧 2024-01-13: Техническое обслуживание

**Цель:** Реструктуризация документации

**Выполнено:**

- Объединение 13 файлов документации в единую систему
- Создание справочников по компонентам, багам и оптимизации
- Архивирование устаревших файлов

---

## 🏗️ ТЕКУЩАЯ АРХИТЕКТУРА

### Основные компоненты:

```mermaid
graph TD
    subgraph "Экраны"
        A[app/products.tsx] --> B[Grid/List карточки]
        C[app/main.tsx] --> D[Компактные карточки]
        E[app/product/[slug].tsx] --> F[Детальная страница]
    end

    subgraph "UI Компоненты"
        G[ProductImageGallery.tsx]
        H[AddToCartButton.tsx]
        I[QuantitySelector.tsx]
        J[ProductTabs.tsx]
        K[OptimizedImage.tsx]
    end

    subgraph "Redux Store"
        L[productsSlice.ts]
        M[cartSlice.ts]
    end

    B --> G
    B --> H
    D --> H
    F --> G
    F --> H
    F --> I
    F --> J
    G --> K
    B --> L
    D --> L
    F --> L
    H --> M
```

### Файловая структура:

```
📁 app/
├── products.tsx (800+ строк) - каталог
├── main.tsx (300+ строк) - главная
└── product/[slug].tsx (280+ строк) - детали

📁 components/ui/
├── ProductImageGallery.tsx (259 строк)
├── ProductTabs.tsx (218 строк)
├── AddToCartButton.tsx (127 строк)
├── QuantitySelector.tsx (94 строки)
└── OptimizedImage.tsx (81 строка)

📁 app/store/slices/
├── productsSlice.ts - управление товарами
└── cartSlice.ts - управление корзиной
```

### Типы данных:

```typescript
interface ProductItem {
    id: string;
    name: string;
    price: number;
    original_price?: number;
    discount_percentage?: number;
    image_url: string;
    images: string[];
    description: string;
    specs: Record<string, any>;
    slug: string;
    rating?: number;
    reviews_count?: number;
}

interface CartItem {
    product: ProductItem;
    quantity: number;
    selectedOptions?: Record<string, string>;
}
```

---

## ⚡ ИЗВЕСТНЫЕ ПРОБЛЕМЫ

### 🔴 Критические (требуют немедленного решения):

1. **Производительность галереи:** 259 строк в ProductImageGallery нуждаются в
   оптимизации
2. **Дублирование кода:** Логика карточек дублируется между Grid/List режимами
3. **Медленный FlatList:** При большом количестве товаров возникают лаги

### 🟡 Важные (планируется к решению):

1. **Отсутствие lazy loading:** Все изображения загружаются сразу
2. **Неоптимальные ре-рендеры:** Компоненты перерисовываются без необходимости
3. **Отсутствие виртуализации:** FlatList не использует виртуализацию для
   больших списков

### 🟢 Низкий приоритет:

1. **Анимации переходов:** Нет плавных переходов между состояниями
2. **A/B тестирование:** Нет возможности тестировать разные варианты карточек
3. **Аналитика:** Отсутствует трекинг взаимодействий с карточками

---

## 📋 ПЛАНЫ РАЗВИТИЯ

### 🎯 Краткосрочные (1-2 недели):

- [ ] Рефакторинг ProductImageGallery (разбить на подкомпоненты)
- [ ] Внедрение react-native-fast-image для оптимизации
- [ ] Добавление skeleton loading для карточек
- [ ] Унификация Grid/List логики через общий компонент

### 🚀 Среднесрочные (1 месяц):

- [ ] Виртуализация FlatList для каталога
- [ ] A/B тестирование разных вариантов карточек
- [ ] Добавление анимаций микроинтерракций
- [ ] Интеграция с аналитикой (трекинг кликов, просмотров)

### 🌟 Долгосрочные (2-3 месяца):

- [ ] Персонализация карточек на основе истории покупок
- [ ] AR примерка товаров (для определенных категорий)
- [ ] Социальные функции (отзывы с фото, рейтинги друзей)
- [ ] Умные рекомендации в карточках

---

## 📚 СПРАВОЧНИКИ

### 📖 Детальная документация:

- **[Компоненты и API](docs/product-cards/REFERENCE_COMPONENTS.md)** - полный
  справочник по всем компонентам
- **[Баги и решения](docs/product-cards/REFERENCE_FIXES.md)** - история всех
  багов и их исправлений
- **[Оптимизация](docs/product-cards/REFERENCE_PERFORMANCE.md)** - все
  проведенные оптимизации с метриками

### 📂 Архивные файлы:

- Устаревшие файлы перенесены в `docs/archive/product-cards/`
- Исторические макеты и черновики сохранены для справки

---

## 🔍 БЫСТРЫЙ ПОИСК

### По функциональности:

```bash
# Найти все карточки товаров
grep -r "ProductCard\|GridItem\|ListItem" app/ components/

# Найти оптимизации
grep -r "memo\|useMemo\|useCallback" app/products.tsx

# Найти проблемы производительности  
grep -r "FlatList\|performance\|optimization" .
```

### По компонентам:

- **Галерея изображений:** `components/ui/ProductImageGallery.tsx:1-259`
- **Кнопка корзины:** `components/ui/AddToCartButton.tsx:1-127`
- **Каталог товаров:** `app/products.tsx:288-400` (Grid),
  `app/products.tsx:358-450` (List)

---

_Документ создан: 2024-01-13_ _Автор: AI Assistant_ _Связанные справочники:
docs/product-cards/_
