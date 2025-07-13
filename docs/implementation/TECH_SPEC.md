# TECH_SPEC.md (MASTER VERSION)

> **Дисклеймер:** Это мастер-версия технической спецификации. Все изменения и актуализации вносятся только сюда. Содержит объединённую, самую полную и свежую информацию из всех предыдущих версий.

---

# Technical Specification: Mobile Marketplace + Fitness Interval Timer

**Audience:** Senior React Native devs building a cross-platform e-commerce app with an integrated interval timer.

---

## Текущее состояние (2024)

- **Backend:** Supabase (auth, storage, CRUD, sync, аватары). Firebase не используется, все интеграции через Supabase.
- **Redux:** cartSlice, timerSlice, productsSlice реализованы, интеграция с AsyncStorage.
- **UI:** Все основные экраны, pixel-perfect, багфиксы, адаптация под спецификацию.
- **Корзина:** Все базовые функции, хранение, UI-фиксы. Checkout/order не реализовано.
- **Таймер:** Пресеты, синхронизация, отображение на главной. Голос/TTS и background не реализовано.
- **Profile:** Аватар, имя, email, смена аватара, биометрия (заглушка), Google Auth (заглушка), история заказов и методы оплаты не реализованы.
- **Product:** Карточки, детальная страница, галерея, табы, AddToCart, QuantitySelector. Скелетон и парсинг specs не реализовано.
- **Удалено:** Дубли, неиспользуемые компоненты, устаревшие экраны.
- **Тесты:** Unit/E2E не реализовано.
- **Анимации:** Только базовые RN, Lottie не внедрён.

---

## 1. App Purpose

- Mobile marketplace with seamless shopping UX
- Integrated, customizable fitness interval timer

---

## 2. Architecture Overview

### 2.1 Splash Screen
- Minimalist: logo + slogan
- Auto-redirect to Main after 2s

### 2.2 Main Screen
- **Top:** Animated promo banner (Lottie, horizontal scroll, auto-rotate 5s) *(Lottie не реализовано)*
- **Filters:** Toggle grid/list (2-col, 1-col, list) — persist state (AsyncStorage)
- **Product List:**  
  - Card: thumbnail, name, price, "Add to Cart" (icon + counter)
  - Infinite scroll (pagination)
  - Pull-to-refresh

### 2.3 Product Details
- Image gallery (swipe, thumbnails)
- Tabs: Description | Specs | Reviews
- "Add to Cart" (qty selector)
- *Specs парсинг не полный, skeleton не реализован*

### 2.4 Fixed Nav Bar (Header)
- Icons: Home / Catalog / Timer / Cart / Profile
- Active indicator

### 2.5 Timer Screen
- Numeric steppers (validation):
  - Preparation: 10–300s
  - Work: 15–600s
  - Rest: 5–180s
  - Cycles: 1–20
  - Sets: 1–10
  - Rest Between Sets: 30–600s
- "Start" → timer with voice alerts *(TTS не реализовано)*
- Progress: circular chart + current stage *(анимация не реализована)*

### 2.6 Shopping Cart
- Editable list, total price
- "Checkout" → payment *(checkout/order не реализовано)*

### 2.7 User Profile
- Sections: Personal Info | Payment Methods | Order History *(payment/order history не реализовано)*
- Apple Pay/Google Pay *(не реализовано)*

---

## 3. Technical Requirements

- **Stack:** React Native (iOS/Android), Supabase backend (auth, storage, CRUD, sync)
- **Animations:** Lottie (баннеры, transitions) *(не внедрено)*
- **State:** Redux (cart, timer)
- **Testing:** Jest (unit), Detox (E2E) *(не реализовано)*
- **Design:** Material Design + iOS HIG

---

## 4. Data Sync & Performance

- Используется Supabase (Realtime/Storage) для live sync товаров, корзины, таймеров
- Redux для локального состояния, sync с backend на ключевых действиях (add/remove cart, checkout)
- Persist view/filter state с AsyncStorage
- Оптимизация product list: FlatList + React.memo + getItemLayout
- Таймер: (планируется) react-native-background-timer для background/locked state *(не реализовано)*

---

## 5. Task Prioritization (Roadmap, актуальный)

1. Project setup (RN, Supabase, Redux, Lottie, navigation) *(реализовано, кроме Lottie)*
2. Splash/Main screen skeletons *(реализовано)*
3. Product list + filters + infinite scroll *(реализовано, кроме skeleton)*
4. Product details page *(реализовано, specs парсинг не полный, skeleton не реализован)*
5. Cart logic + checkout *(cart реализовано, checkout/order не реализовано)*
6. Timer screen (UI, logic, voice alerts) *(UI/logic реализовано, TTS не реализовано)*
7. User profile + payment integration *(profile реализовано, payment/order history не реализовано, Google Auth/биометрия — заглушки)*
8. Animations/polish *(только базовые RN, Lottie не внедрён)*
9. Testing (unit, E2E) *(не реализовано)*
10. QA, bugfix, deploy *(в процессе)*

---

## 6. Sample Code

### Timer Logic (Background, Voice Alerts)

```js
import BackgroundTimer from 'react-native-background-timer';
import Tts from 'react-native-tts';

const stages = [
  { label: 'Preparation', duration: prep },
  { label: 'Work', duration: work },
  { label: 'Rest', duration: rest },
  // ...cycles/sets logic
];

function startIntervalTimer(stages) {
  let current = 0;
  function nextStage() {
    if (current >= stages.length) return;
    const { label, duration } = stages[current];
    Tts.speak(label);
    BackgroundTimer.setTimeout(() => {
      current++;
      nextStage();
    }, duration * 1000);
  }
  nextStage();
}
```

### Cart State (Redux Slice)

```js
import { createSlice } from '@reduxjs/toolkit';

const cartSlice = createSlice({
  name: 'cart',
  initialState: { items: [], total: 0 },
  reducers: {
    addItem(state, action) { /* ... */ },
    removeItem(state, action) { /* ... */ },
    updateQty(state, action) { /* ... */ },
    clearCart(state) { /* ... */ },
  },
});

export const { addItem, removeItem, updateQty, clearCart } = cartSlice.actions;
export default cartSlice.reducer;
```

---

## 7. Notes

- Use FlatList's `getItemLayout` for perf
- Memoize product cards
- Use Lottie for banners/animations *(не внедрено)*
- Persist user settings (filters, timer presets) with AsyncStorage
- Adhere to Material/iOS HIG for all UI 

---

## 8. Database Schema (Supabase)

*(Supabase, не Firestore)*

### users
- uid: string (doc id)
- name: string
- email: string
- avatarUrl: string
- phone: string
- paymentMethods: array *(не реализовано)*
- orderHistory: array (order ids) *(не реализовано)*
- createdAt: timestamp

### products
- productId: string (doc id)
- name: string
- description: string
- price: number
- images: array (urls)
- specs: map *(парсинг specs не полный)*
- stock: number
- category: string
- rating: number
- reviewsCount: number
- createdAt: timestamp

### reviews
- reviewId: string (doc id)
- productId: string (ref)
- userId: string (ref)
- rating: number
- text: string
- createdAt: timestamp

### carts
- userId: string (doc id)
- items: array of {
    productId: string (ref),
    qty: number
  }
- updatedAt: timestamp

### orders
- orderId: string (doc id)
- userId: string (ref)
- items: array of {
    productId: string (ref),
    qty: number,
    price: number
  }
- total: number
- status: string (pending/paid/shipped/etc)
- paymentMethod: string *(не реализовано)*
- createdAt: timestamp

### banners
- bannerId: string (doc id)
- imageUrl: string
- link: string
- active: boolean
- order: number

### timer_presets
- userId: string (doc id)
- presets: array of {
    name: string,
    preparation: number,
    work: number,
    rest: number,
    cycles: number,
    sets: number,
    restBetweenSets: number
  }

#### Индексы и связи:
- Индекс по products.category
- Индекс по reviews.productId
- Индекс по orders.userId
- Индекс по carts.userId
- Индекс по timer_presets.userId
- Связи через ref (userId, productId)

---

## 9. Project Folder Structure

*(актуализировано, Supabase, нет Firebase)*

```
root/
├── android/                  # Android-проект (Expo/React Native)
├── ios/                      # iOS-проект (Expo/React Native)
├── assets/                   # Глобальные ассеты (картинки, шрифты, звуки)
│   ├── images/               # Картинки и иконки
│   ├── sounds/               # Аудио/уведомления
│   └── fonts/                # Кастомные шрифты
├── app/                      # Основная бизнес-логика и экраны
│   ├── assets/               # (если есть) ассеты, используемые только внутри app
│   ├── blog/                 # Динамические страницы блога
│   │   └── [id].tsx          # Страница отдельной статьи
│   ├── product/              # Динамические страницы товаров
│   │   └── [id].tsx          # Страница отдельного товара
│   ├── store/                # Redux store, слайсы, хуки, middleware
│   │   ├── slices/           # cartSlice, productsSlice, timerSlice
│   │   ├── middleware/       # (если есть) кастомные middleware
│   │   ├── hooks.ts          # useAppSelector, useAppDispatch
│   │   └── index.ts          # store setup
│   ├── utils/                # Вспомогательные функции, форматтеры, валидаторы
│   ├── cart.tsx              # Экран корзины
│   ├── profile.tsx           # Экран профиля пользователя
│   ├── auth.tsx              # Экран авторизации/регистрации
│   ├── supabaseClient.ts     # Работа с Supabase (API, Auth)
│   ├── products.tsx          # Экран каталога товаров (грид/лист)
│   ├── main.tsx              # Главная страница (лендинг, статьи, товары)
│   ├── timer.tsx             # Экран таймера/пресетов
│   ├── blog.tsx              # Экран блога (список статей)
│   ├── _layout.tsx           # Layout для expo-router (навигация)
│   ├── +not-found.tsx        # 404 страница
│   ├── index.tsx             # Редиректы/роутинг
│   ├── logo.png              # Логотип приложения
│   └── splash.tsx            # Splash screen
├── components/               # Переиспользуемые UI- и бизнес-компоненты
│   ├── AppLayout.tsx         # Обёртка с провайдерами, навигацией
│   ├── FooterNavigation.tsx  # Нижнее меню (табы)
│   ├── CartInitializer.tsx   # Инициализация корзины из storage
│   ├── cart/                 # Компоненты корзины (CartItem, CartSummary и т.д.)
│   ├── timer/                # Компоненты таймера
│   ├── ui/                   # Универсальные UI-атомы и молекулы
│   │   ├── ProductImageGallery.tsx
│   │   ├── AddToCartButton.tsx
│   │   ├── QuantitySelector.tsx
│   │   ├── ProductTabs.tsx
│   │   ├── OptimizedImage.tsx
│   │   └── ...
│   └── ...
├── constants/                # Глобальные константы (цвета, размеры и т.д.)
│   └── Colors.ts
├── hooks/                    # Кастомные хуки (если есть)
├── scripts/                  # Скрипты для сборки/деплоя/миграций
├── stubs/                    # Заглушки/моки (если есть)
├── docs/                     # Документация
├── .env                      # Переменные окружения
├── package.json              # Зависимости и скрипты
├── app.json                  # Конфиг Expo
├── tsconfig.json             # TypeScript конфиг
├── README.md                 # Документация по проекту
└── ...
```

- Все бизнес-логика и состояния — в features и redux
- assets: картинки, анимации, шрифты
- tests: unit (Jest), e2e (Detox) *(не реализовано)*
- api: работа с Supabase/сервером
- hooks: кастомные хуки (например, useCart, useTimer)
- utils: валидация, форматирование, вспомогательные функции

---

## 10. Additional Notes

- Use FlatList's `getItemLayout` for perf
- Memoize product cards
- Use Lottie for banners/animations *(не внедрено)*
- Persist user settings (filters, timer presets) with AsyncStorage
- Adhere to Material/iOS HIG for all UI 

---

## 11. Cart Implementation Checklist

### 11.1 Checkout Process
- [ ] Create checkout screen route/component *(не реализовано)*
- [ ] Build multi-step checkout wizard *(не реализовано)*
- [ ] Implement form validation for all checkout fields *(не реализовано)*
- [ ] Add order summary with line items, subtotal, shipping, tax, and total *(не реализовано)*
- [ ] Create order success/confirmation screen *(не реализовано)*
- [ ] Store completed orders in AsyncStorage (order history) *(не реализовано)*
- [ ] Add connectivity check before placing order *(не реализовано)*

### 11.2 Discount & Promo Codes
- [ ] Add promo code entry field in cart screen *(не реализовано)*
- [ ] Implement promo code validation logic *(не реализовано)*
- [ ] Create discount calculations in cart summary *(не реализовано)*
- [ ] Show applied discount and savings amount *(не реализовано)*
- [ ] Add visual indicators for discounted items *(не реализовано)*
- [ ] Create animations for successful promo code application *(не реализовано)*
- [ ] Implement expiration checking for promo codes *(не реализовано)*

### 11.3 Cart UX Improvements
- [x] Add product image zoom on long press in cart *(реализовано)*
- [x] Create "Add to Cart" animation with flying item to cart icon *(реализовано, базово)*
- [x] Implement pull-down quick cart view from any screen *(реализовано)*
- [x] Add haptic feedback for cart actions (add, remove, update) *(реализовано)*
- [x] Create skeleton loading state for cart *(не реализовано)*
- [x] Add related/recommended products section at bottom of cart *(не реализовано)*
- [x] Implement "Continue Shopping" smart redirect (to last viewed category) *(реализовано)*
- [x] Create empty cart illustrations with motivational messages *(реализовано)*

### 11.4 Save for Later Functionality
- [ ] Implement "Save for Later" button in cart items *(не реализовано)*
- [ ] Create saved items section below active cart *(не реализовано)*
- [ ] Add "Move to Cart" button for saved items *(не реализовано)*
- [ ] Design visual distinction between cart and saved items *(не реализовано)*
- [ ] Persist saved items in AsyncStorage *(не реализовано)*
- [ ] Add batch actions for saved items (move all to cart, remove all) *(не реализовано)*
- [ ] Implement drag and drop between cart and saved items *(не реализовано)*

### 11.5 Backend Integration
- [x] Create API service for cart operations (Supabase) *(реализовано)*
- [x] Implement cart sync between local storage and Supabase *(реализовано)*
- [x] Add real-time stock checking for cart items *(реализовано)*
- [ ] Create conflict resolution for cart differences between devices *(не реализовано)*
- [ ] Implement analytics tracking for cart events *(не реализовано)*
- [x] Add auth flow integration for guest carts vs. user carts *(реализовано)*
- [ ] Create order tracking functionality with status updates *(не реализовано)*
- [ ] Implement secure payment processing with Supabase functions *(не реализовано)*

### 11.6 Testing & QA
- [ ] Write unit tests for cart reducers and selectors *(не реализовано)*
- [ ] Create integration tests for cart persistence *(не реализовано)*
- [ ] Test checkout flows with various edge cases *(не реализовано)*
- [ ] Verify cart behavior with network interruptions *(не реализовано)*
- [ ] Test performance with large number of items *(не реализовано)*
- [ ] Ensure accessibility compliance for all cart screens *(не реализовано)*
- [ ] Test cross-platform behavior (iOS vs Android) *(не реализовано)*

---

## 12. Supabase Storage Setup

### 12.1 Avatar Storage Implementation
- [x] Create "avatars" bucket in Supabase Storage *(реализовано)*
- [x] Set up storage policies *(реализовано)*
- [x] Implement profile image upload with expo-image-picker *(реализовано)*
- [x] Structure avatar paths as `{user_id}/{timestamp}.jpg` *(реализовано)*
- [x] Update user metadata with avatar URL after successful upload *(реализовано)*

### 12.2 Avatar Upload Function
*(реализовано, см. app/profile.tsx)*

### 12.3 Troubleshooting Common Issues
- If "Bucket not found" error occurs, verify bucket name is exactly "avatars"
- For permissions errors, check that all four policies are properly configured
- For path errors, ensure the user ID is available before attempting upload
- If images fail to load, check that the Public URL is correctly formatted 

---

## 13. Project Setup (Cleaned)

### 13.1. Инициализация проекта

```sh
npx react-native init BIXIRUN --template react-native-template-typescript
cd BIXIRUN
```

### 13.2. Установка зависимостей

```sh
yarn add @react-navigation/native @react-navigation/stack @react-navigation/bottom-tabs
# Для навигации:
yarn add react-native-gesture-handler react-native-reanimated react-native-screens react-native-safe-area-context @react-native-community/masked-view
# Для состояния:
yarn add @reduxjs/toolkit react-redux
# Для firebase:
yarn add @react-native-firebase/app @react-native-firebase/firestore @react-native-firebase/auth @react-native-firebase/storage
# Для UI/UX:
yarn add lottie-react-native lottie-ios
# Для таймера и TTS:
yarn add react-native-background-timer react-native-tts
# Для хранения:
yarn add @react-native-async-storage/async-storage
# Для иконок и конфигов:
yarn add react-native-vector-icons react-native-config
```

### 13.3. Инициализация git-репозитория (если нужно)

```sh
git init
echo "node_modules/" >> .gitignore
```

### 13.4. Структура src/ (создай папки)

```sh
mkdir -p src/{api,assets,components,features/cart,features/catalog,features/product,features/profile,features/timer,navigation,redux,screens,utils,hooks}
```

### 13.5. Проверка запуска

```sh
npx react-native run-ios
# или
npx react-native run-android
```

--- 

## Project Progress Checklist (Supabase Integration & Frontend)

### 1. Подключение фронта к Supabase, вывод товаров, карточки и детальные страницы

- [x] Установить supabase-js
- [x] Создать клиент Supabase (src/services/supabaseClient.ts)
- [x] Создать функцию для получения списка товаров из Supabase (getProducts)
- [x] Получать все нужные поля: name, images, price, old_price, discount, description, specs
- [ ] Обработать массив images и specs *(парсинг specs не полный)*
- [x] Создать компонент ProductList/CatalogScreen
- [x] Использовать FlatList для отображения товаров
- [x] Сделать карточку товара с картинкой, ценой, скидкой
- [ ] Сделать placeholder/skeleton для картинок *(не реализовано)*
- [x] Создать ProductDetailScreen (детальная страница)
- [x] Реализовать галерею изображений, specs, описание
- [x] Реализовать swipe/scroll по изображениям
- [ ] Проверить отображение specs (парсить JSONB) *(парсинг specs не полный)*
- [x] Проверить отображение товаров с разным количеством картинок и specs

### 2. Корзина, оформление заказа, профиль

- [x] Реализовать redux slice для корзины (cartSlice)
- [x] Реализовать добавление, удаление, изменение qty, очистку корзины
- [x] Сохранять корзину в AsyncStorage
- [ ] Создать CheckoutScreen (оформление заказа) *(не реализовано)*
- [ ] Реализовать форму для ввода данных (адрес, телефон, оплата) *(не реализовано)*
- [ ] Реализовать отправку заказа в Supabase (orders table) *(не реализовано)*
- [ ] Очистить корзину после заказа *(не реализовано)*
- [x] Создать ProfileScreen
- [x] Реализовать отображение профиля, загрузку/смену аватара
- [ ] Выводить историю заказов *(не реализовано)*

---

**Дальнейшие шаги:**
- [ ] Реализовать функцию getProducts в supabaseClient.ts *(реализовано)*
- [ ] Интегрировать её в productsSlice (убрать mock, сделать реальный fetch) *(реализовано)*
- [ ] Создать компонент ProductList и вывести товары на экран *(реализовано)*

--- 

## Product Details Page: Финальная реализация (2024)

### 1. Архитектура и взаимодействие файлов

- **app/product/[id].tsx** — главный экран товара, собирает всю страницу.
  - Получает данные о товаре из Redux (state.products.items)
  - Прокидывает данные в UI-компоненты через пропсы
- **components/ui/ProductImageGallery.tsx** — единый компонент для галереи и миниатюр
  - Высота: SCREEN_WIDTH + MINIATURES_HEIGHT
  - Миниатюры всегда строго под галереей, не наезжают, не обрезаются
  - FlatList оптимизирован: initialNumToRender, windowSize, removeClippedSubviews
- **components/ui/ProductTabs.tsx** — табы: описание, характеристики, отзывы
- **components/ui/AddToCartButton.tsx** — кнопка "В корзину"
- **components/ui/QuantitySelector.tsx** — селектор количества

**Вся информация о товаре берётся из Redux, главный сборщик — [id].tsx.**

#### Схема взаимодействия файлов (финальная)

```
[Redux: products.items]
      ↓
app/product/[id].tsx (главный экран)
  ├─ ProductImageGallery (галерея + миниатюры, единый layout)
  ├─ productInfo (название, цена, кнопка, qty)
  └─ ProductTabs (описание, характеристики, отзывы)
```

- Нет дублей блока productInfo, нет лишних FlatList, нет багов с layout.
- Название, цена, кнопка всегда строго под галереей и миниатюрами, с гарантированным отступом (marginTop: 48).
- Галерея и миниатюры — единый контейнер, высота считается автоматически, ничего не обрезается.
- Все стили и структура соответствуют best practice и TECH_SPEC.

---

### 2. Итоговая структура JSX (фрагмент)

```jsx
<View style={styles.galleryContainer}>
  <ProductImageGallery images={images} />
</View>

<View style={styles.productInfo}>
  <Text style={styles.name}>{name}</Text>
  <View style={styles.priceContainer}>
    <Text style={styles.price}>{price} ₽</Text>
    {old_price && <Text style={styles.oldPrice}>{old_price} ₽</Text>}
    {discount && (
      <View style={styles.discountBadge}>
        <Text style={styles.discountText}>-{discount}%</Text>
      </View>
    )}
  </View>
  <View style={styles.addToCartSection}>
    <QuantitySelector ... />
    <AddToCartButton ... />
  </View>
</View>
<ProductTabs ... />
```

---

### 3. Ключевые стили

```js
// ProductImageGallery
container: {
  width: SCREEN_WIDTH,
  height: SCREEN_WIDTH + MINIATURES_HEIGHT,
  backgroundColor: '#fff',
  marginTop: 24,
  marginBottom: 0,
  position: 'relative',
},
imageContainer: {
  width: SCREEN_WIDTH,
  height: SCREEN_WIDTH,
  justifyContent: 'center',
  alignItems: 'center',
},
thumbnailsContainer: {
  position: 'absolute',
  left: 0,
  right: 0,
  bottom: 0,
  height: MINIATURES_HEIGHT,
  backgroundColor: '#fff',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 2,
},
// productInfo
productInfo: {
  padding: 16,
  marginTop: 48,
},
```

---

### 4. Итог

- Страница товара полностью соответствует TECH_SPEC и best practice.
- Нет дублей, нет багов с layout, всё быстро и адаптивно.
- Вся логика и структура максимально чистые и технологичные. 

---

## 14. Итоговая сводка по таскам и подтаскам (2024)

**1. Каталог**
- [x] ProductList, карточки, детали
- [ ] Скелетон, парсинг specs

**2. Корзина**
- [x] CRUD, хранение, UI
- [ ] Checkout, order history, промокоды, скидки, save for later

**3. Профиль**
- [x] Аватар, имя, email, биометрия (заглушка)
- [ ] История заказов, методы оплаты, Google Auth (реальный)

**4. Таймер**
- [x] CRUD, синхронизация, отображение
- [ ] Голос/TTS, background

**5. UI/UX**
- [x] Pixel-perfect, багфиксы
- [ ] Lottie, skeleton

**6. Интеграция**
- [x] Supabase (auth, storage, CRUD)
- [ ] Firebase (не используется)

**7. Тесты**
- [ ] Unit/E2E

---

**Резюме:**  
Базовая архитектура, корзина, профиль, таймер, каталог — реализованы.  
Не реализовано: оформление заказа, история заказов, промокоды, save for later, платежи, тесты, часть анимаций, часть skeleton-UI, голосовой таймер, реальный Google Auth.  
Фактический бекенд — Supabase, а не Firebase (TECH_SPEC.md обновлён). 