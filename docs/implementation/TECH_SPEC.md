# TECH_SPEC.md (MASTER VERSION)

## LEGAL PAGES: About, Terms, Privacy (RU)

### 1) Цели и охват

- Отобразить в приложении офлайн‑версии документов: Пользовательское соглашение
  и Политика конфиденциальности.
- Предоставить экран «О приложении» с версией, копирайтом, ссылками на документы
  и почтой поддержки.
- Навигация без промежуточного экрана («Помощь и приложение» не используется).

### 2) Маршруты / экраны

- `/about` — экран «О приложении» (светло‑серая шапка как на карточке товара;
  стрелка «назад» → профиль).
- `/legal/terms` — Пользовательское соглашение (офлайн; кликабельное оглавление;
  стрелка «назад» → `/about`).
- `/legal/privacy` — Политика конфиденциальности (офлайн; кликабельное
  оглавление; стрелка «назад» → `/about`).

### 3) Реализация (файлы)

- `app/about.tsx` — шапка как у карточки товара; блок с названием BIXIRUN,
  версия из `app.json`, копирайт, `mailto:support@bixirun.ru`; пункты
  «Пользовательское соглашение», «Политика конфиденциальности».
- `app/legal/terms.tsx` — офлайн контент: секции (массив `sections`), оглавление
  (карточка сверху) → якорная навигация; типографика 18/700 для заголовков,
  16/23 для текста; учёт `SafeAreaInsets` и отступ снизу `insets.bottom + 96`.
- `app/legal/privacy.tsx` — тот же паттерн, структура разделов приведена к
  требованиям 152‑ФЗ: оператор ПДн, состав/цели, правовые основания,
  хранение/удаление, передача/трансграничность, права субъекта, обновления.
- Профиль (`app/profile.tsx`) — добавлен пункт «О приложении»; добавлена кнопка
  «Удалить аккаунт» с подтверждением (подключение реального API удаления —
  TODO).

### 4) Тексты (RU)

- Правообладатель/оператор ПДн: **ООО «СИСТЕМНЫЕ РЕШЕНИЯ», ИНН 5700009897, ОГРН
  1245700002514, адрес: 302027, Орловская область, г. Орёл**; e‑mail:
  **support@bixirun.ru**.
- В публичных документах не указывается номер квартиры (сокращённый адрес
  допустим).
- Канал поддержки — e‑mail; чат может быть добавлен позднее.

### 5) Нагрузочные/UX особенности

- Офлайн стратегия: документы встроены в приложение, не требуют сети; при
  необходимости можно добавить WebView на `bixirun.ru/terms` и
  `bixirun.ru/privacy` как онлайн‑источник (позже), оставив офлайн fallback.
- Кликабельное оглавление: скролл к секции с якорями; иконка стрелки выровнена
  при переносе заголовков (текст `flex:1`, иконка с `marginLeft`).
- Отступы снизу увеличены (`insets.bottom + 96`), текст не перекрывается нижним
  таб‑баром.

### 6) App Store Connect — App Privacy (черновик)

- Tracking: **No**.
- Data Collection: **App Functionality** (медиа/разрешения — по действию
  пользователя), **Diagnostics** (crash/perf от ОС).
- Linked to You: **Yes**, если есть аккаунт; Advertising/Third‑party SDK:
  **None**.
- Export Compliance: **Yes (HTTPS)** → **Exempt**.

### 7) API удаления аккаунта (план)

- Кнопка «Удалить аккаунт» в профиле → диалог подтверждения → вызов
  `DELETE /account` (требует авторизации) → logout → тост «Ваш аккаунт будет
  удалён…».
- Сервер: физическое удаление учётной записи и связанных данных с учётом сроков
  ретенции резервных копий (описать в Политике при наличии).

### 8) QA‑чеклист

- Стрелки «назад» на всех трёх экранах корректны (terms/privacy → about; about →
  профиль).
- Оглавление кликабельно, скроллит к нужным блокам без перекрытия заголовка.
- Нижний контент не перекрывается таб‑баром на устройствах с разной высотой
  `HomeIndicator`.
- mailto:support@bixirun.ru открывает почтовый клиент.
- Версия приложения отображается корректно (берётся из `app.json`).

### 9) Релиз/дальнейшие шаги

- (Опционально) Разместить веб‑версии документов на `bixirun.ru/terms` и
  `bixirun.ru/privacy`.
- Добавить **Privacy Policy URL** и **Support URL** в App Store Connect.
- Получение Apple Developer Team ID → включение Universal Links
  (`associatedDomains`), если требуется в релизе.
- Подключить реальный endpoint удаления аккаунта (серверная часть) и обновить
  Политику (сроки/порядок удаления).

### 10) Примечания

- В репозитории ранее был `docs/policy.md` (пример из OZON) — устаревший
  образец; рекомендуется удалить, чтобы не путать с текущими документами.

> **Дисклеймер:** Это мастер-версия технической спецификации. Все изменения и
> актуализации вносятся только сюда. Содержит объединённую, самую полную и
> свежую информацию из всех предыдущих версий.

---

# Technical Specification: Mobile Marketplace + Fitness Interval Timer

**Audience:** Senior React Native devs building a cross-platform e-commerce app
with an integrated interval timer.

---

## Текущее состояние (2024)

- **Backend:** Supabase (auth, storage, CRUD, sync, аватары). Firebase не
  используется, все интеграции через Supabase.
- **Redux:** cartSlice, timerSlice, productsSlice реализованы, интеграция с
  AsyncStorage.
- **UI:** Все основные экраны, pixel-perfect, багфиксы, адаптация под
  спецификацию.
- **Корзина:** Все базовые функции, хранение, UI-фиксы. Checkout/order не
  реализовано.
- **Таймер:** Пресеты, синхронизация, отображение на главной. Голос/TTS и
  background не реализовано.
- **Profile:** Аватар, имя, email, смена аватара, биометрия (заглушка), Google
  Auth (заглушка), история заказов и методы оплаты не реализованы.
- **Product:** Карточки, детальная страница, галерея, табы, AddToCart,
  QuantitySelector. Скелетон и парсинг specs не реализовано.
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

- **Top:** Animated promo banner (Lottie, horizontal scroll, auto-rotate 5s)
  _(Lottie не реализовано)_
- **Filters:** Toggle grid/list (2-col, 1-col, list) — persist state
  (AsyncStorage)
- **Product List:**
  - Card: thumbnail, name, price, "Add to Cart" (icon + counter)
  - Infinite scroll (pagination)
  - Pull-to-refresh
  - Нижний отступ списка уменьшен для плотной стыковки с таббаром (2025‑01‑13):
    `FlatList.contentContainerStyle.paddingBottom = 56` (ранее 100).

### 2.3 Product Details

- Image gallery (swipe, thumbnails)
- Tabs: Description | Specs | Reviews
- "Add to Cart" (qty selector)
- _Specs парсинг не полный, skeleton не реализован_

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
- "Start" → timer with voice alerts _(TTS не реализовано)_
- Progress: circular chart + current stage _(анимация не реализована)_

### 2.6 Shopping Cart

- Editable list, total price
- "Checkout" → payment _(checkout/order не реализовано)_

### 2.7 User Profile

- Sections: Personal Info | Payment Methods | Order History _(payment/order
  history не реализовано)_
- Apple Pay/Google Pay _(не реализовано)_
- Подробная спецификация: см. [`PROFILE.md`](./PROFILE.md)
- Нижние отступы у таббара оптимизированы (2025‑01‑13):
  `ScrollView.contentContainerStyle.paddingBottom = Math.max(0, insets.bottom + 4)`,
  последняя секция `marginBottom = 0`, нижний спейсер
  `height = Math.max(0, insets.bottom + 6)`.

---

## 3. Technical Requirements

- **Stack:** React Native (iOS/Android), Supabase backend (auth, storage, CRUD,
  sync)
- **Animations:** Lottie (баннеры, transitions) _(не внедрено)_
- **State:** Redux (cart, timer)
- **Testing:** Jest (unit), Detox (E2E) _(не реализовано)_
- **Design:** Material Design + iOS HIG

---

## 4. Data Sync & Performance

- Используется Supabase (Realtime/Storage) для live sync товаров, корзины,
  таймеров
- Redux для локального состояния, sync с backend на ключевых действиях
  (add/remove cart, checkout)
- Persist view/filter state с AsyncStorage
- Оптимизация product list: FlatList + React.memo + getItemLayout
- Таймер: (планируется) react-native-background-timer для background/locked
  state _(не реализовано)_

---

## 5. Task Prioritization (Roadmap, актуальный)

1. Project setup (RN, Supabase, Redux, Lottie, navigation) _(реализовано, кроме
   Lottie)_
2. Splash/Main screen skeletons _(реализовано)_
3. Product list + filters + infinite scroll _(реализовано, кроме skeleton)_
4. Product details page _(реализовано, specs парсинг не полный, skeleton не
   реализован)_
5. Cart logic + checkout _(cart реализовано, checkout/order не реализовано)_
6. Timer screen (UI, logic, voice alerts) _(UI/logic реализовано, TTS не
   реализовано)_
7. User profile + payment integration _(profile реализовано, payment/order
   history не реализовано, Google Auth/биометрия — заглушки)_
8. Animations/polish _(только базовые RN, Lottie не внедрён)_
9. Testing (unit, E2E) _(не реализовано)_
10. QA, bugfix, deploy _(в процессе)_

---

## 6. Sample Code

### Timer Logic (Background, Voice Alerts)

```js
import BackgroundTimer from "react-native-background-timer";
import Tts from "react-native-tts";

const stages = [
  { label: "Preparation", duration: prep },
  { label: "Work", duration: work },
  { label: "Rest", duration: rest },
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
import { createSlice } from "@reduxjs/toolkit";

const cartSlice = createSlice({
  name: "cart",
  initialState: { items: [], total: 0 },
  reducers: {
    addItem(state, action) {/* ... */},
    removeItem(state, action) {/* ... */},
    updateQty(state, action) {/* ... */},
    clearCart(state) {/* ... */},
  },
});

export const { addItem, removeItem, updateQty, clearCart } = cartSlice.actions;
export default cartSlice.reducer;
```

---

## 7. Notes

- Use FlatList's `getItemLayout` for perf
- Memoize product cards
- Use Lottie for banners/animations _(не внедрено)_
- Persist user settings (filters, timer presets) with AsyncStorage
- Adhere to Material/iOS HIG for all UI

---

## 8. Database Schema (Supabase)

_(Supabase, не Firestore)_

### users

- uid: string (doc id)
- name: string
- email: string
- avatarUrl: string
- phone: string
- paymentMethods: array _(не реализовано)_
- orderHistory: array (order ids) _(не реализовано)_
- createdAt: timestamp

### products

- productId: string (doc id)
- name: string
- description: string
- price: number
- images: array (urls)
- specs: map _(парсинг specs не полный)_
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
- items: array of { productId: string (ref), qty: number }
- updatedAt: timestamp

### orders

- orderId: string (doc id)
- userId: string (ref)
- items: array of { productId: string (ref), qty: number, price: number }
- total: number
- status: string (pending/paid/shipped/etc)
- paymentMethod: string _(не реализовано)_
- createdAt: timestamp

### banners

- bannerId: string (doc id)
- imageUrl: string
- link: string
- active: boolean
- order: number

### timer_presets

- userId: string (doc id)
- presets: array of { name: string, preparation: number, work: number, rest:
  number, cycles: number, sets: number, restBetweenSets: number }

#### Индексы и связи:

- Индекс по products.category
- Индекс по reviews.productId
- Индекс по orders.userId
- Индекс по carts.userId
- Индекс по timer_presets.userId
- Связи через ref (userId, productId)

---

## 9. Project Folder Structure

_(актуализировано, Supabase, нет Firebase)_

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
- tests: unit (Jest), e2e (Detox) _(не реализовано)_
- api: работа с Supabase/сервером
- hooks: кастомные хуки (например, useCart, useTimer)
- utils: валидация, форматирование, вспомогательные функции

---

## 10. Additional Notes

- Use FlatList's `getItemLayout` for perf
- Memoize product cards
- Use Lottie for banners/animations _(не внедрено)_
- Persist user settings (filters, timer presets) with AsyncStorage
- Adhere to Material/iOS HIG for all UI

---

## 11. Cart Implementation Checklist

### 11.1 Checkout Process

- [ ] Create checkout screen route/component _(не реализовано)_
- [ ] Build multi-step checkout wizard _(не реализовано)_
- [ ] Implement form validation for all checkout fields _(не реализовано)_
- [ ] Add order summary with line items, subtotal, shipping, tax, and total _(не
      реализовано)_
- [ ] Create order success/confirmation screen _(не реализовано)_
- [ ] Store completed orders in AsyncStorage (order history) _(не реализовано)_
- [ ] Add connectivity check before placing order _(не реализовано)_

### 11.2 Discount & Promo Codes

- [ ] Add promo code entry field in cart screen _(не реализовано)_
- [ ] Implement promo code validation logic _(не реализовано)_
- [ ] Create discount calculations in cart summary _(не реализовано)_
- [ ] Show applied discount and savings amount _(не реализовано)_
- [ ] Add visual indicators for discounted items _(не реализовано)_
- [ ] Create animations for successful promo code application _(не реализовано)_
- [ ] Implement expiration checking for promo codes _(не реализовано)_

### 11.3 Cart UX Improvements

- [x] Add product image zoom on long press in cart _(реализовано)_
- [x] Create "Add to Cart" animation with flying item to cart icon
      _(реализовано, базово)_
- [x] Implement pull-down quick cart view from any screen _(реализовано)_
- [x] Add haptic feedback for cart actions (add, remove, update) _(реализовано)_
- [x] Create skeleton loading state for cart _(не реализовано)_
- [x] Add related/recommended products section at bottom of cart _(не
      реализовано)_
- [x] Implement "Continue Shopping" smart redirect (to last viewed category)
      _(реализовано)_
- [x] Create empty cart illustrations with motivational messages _(реализовано)_

### 11.4 Save for Later Functionality

- [ ] Implement "Save for Later" button in cart items _(не реализовано)_
- [ ] Create saved items section below active cart _(не реализовано)_
- [ ] Add "Move to Cart" button for saved items _(не реализовано)_
- [ ] Design visual distinction between cart and saved items _(не реализовано)_
- [ ] Persist saved items in AsyncStorage _(не реализовано)_
- [ ] Add batch actions for saved items (move all to cart, remove all) _(не
      реализовано)_
- [ ] Implement drag and drop between cart and saved items _(не реализовано)_

### 11.5 Backend Integration

- [x] Create API service for cart operations (Supabase) _(реализовано)_
- [x] Implement cart sync between local storage and Supabase _(реализовано)_
- [x] Add real-time stock checking for cart items _(реализовано)_
- [ ] Create conflict resolution for cart differences between devices _(не
      реализовано)_
- [ ] Implement analytics tracking for cart events _(не реализовано)_
- [x] Add auth flow integration for guest carts vs. user carts _(реализовано)_
- [ ] Create order tracking functionality with status updates _(не реализовано)_
- [ ] Implement secure payment processing with Supabase functions _(не
      реализовано)_

### 11.6 Testing & QA

- [ ] Write unit tests for cart reducers and selectors _(не реализовано)_
- [ ] Create integration tests for cart persistence _(не реализовано)_
- [ ] Test checkout flows with various edge cases _(не реализовано)_
- [ ] Verify cart behavior with network interruptions _(не реализовано)_
- [ ] Test performance with large number of items _(не реализовано)_
- [ ] Ensure accessibility compliance for all cart screens _(не реализовано)_
- [ ] Test cross-platform behavior (iOS vs Android) _(не реализовано)_

---

## 12. Supabase Storage Setup

### 12.1 Avatar Storage Implementation

- [x] Create "avatars" bucket in Supabase Storage _(реализовано)_
- [x] Set up storage policies _(реализовано)_
- [x] Implement profile image upload with expo-image-picker _(реализовано)_
- [x] Structure avatar paths as `{user_id}/{timestamp}.jpg` _(реализовано)_
- [x] Update user metadata with avatar URL after successful upload
      _(реализовано)_

### 12.2 Avatar Upload Function

_(реализовано, см. app/profile.tsx)_

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
- [x] Получать все нужные поля: name, images, price, old_price, discount,
      description, specs
- [ ] Обработать массив images и specs _(парсинг specs не полный)_
- [x] Создать компонент ProductList/CatalogScreen
- [x] Использовать FlatList для отображения товаров
- [x] Сделать карточку товара с картинкой, ценой, скидкой
- [ ] Сделать placeholder/skeleton для картинок _(не реализовано)_
- [x] Создать ProductDetailScreen (детальная страница)
- [x] Реализовать галерею изображений, specs, описание
- [x] Реализовать swipe/scroll по изображениям
- [ ] Проверить отображение specs (парсить JSONB) _(парсинг specs не полный)_
- [x] Проверить отображение товаров с разным количеством картинок и specs

### 2. Корзина, оформление заказа, профиль

- [x] Реализовать redux slice для корзины (cartSlice)
- [x] Реализовать добавление, удаление, изменение qty, очистку корзины
- [x] Сохранять корзину в AsyncStorage
- [ ] Создать CheckoutScreen (оформление заказа) _(не реализовано)_
- [ ] Реализовать форму для ввода данных (адрес, телефон, оплата) _(не
      реализовано)_
- [ ] Реализовать отправку заказа в Supabase (orders table) _(не реализовано)_
- [ ] Очистить корзину после заказа _(не реализовано)_
- [x] Создать ProfileScreen
- [x] Реализовать отображение профиля, загрузку/смену аватара
- [ ] Выводить историю заказов _(не реализовано)_

---

**Дальнейшие шаги:**

- [ ] Реализовать функцию getProducts в supabaseClient.ts _(реализовано)_
- [ ] Интегрировать её в productsSlice (убрать mock, сделать реальный fetch)
      _(реализовано)_
- [ ] Создать компонент ProductList и вывести товары на экран _(реализовано)_

---

## Product Details Page: Финальная реализация (2024)

### 1. Архитектура и взаимодействие файлов

- **app/product/[id].tsx** — главный экран товара, собирает всю страницу.
  - Получает данные о товаре из Redux (state.products.items)
  - Прокидывает данные в UI-компоненты через пропсы
- **components/ui/ProductImageGallery.tsx** — единый компонент для галереи и
  миниатюр
  - Высота: SCREEN_WIDTH + MINIATURES_HEIGHT
  - Миниатюры всегда строго под галереей, не наезжают, не обрезаются
  - FlatList оптимизирован: initialNumToRender, windowSize,
    removeClippedSubviews
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
- Название, цена, кнопка всегда строго под галереей и миниатюрами, с
  гарантированным отступом (marginTop: 48).
- Галерея и миниатюры — единый контейнер, высота считается автоматически, ничего
  не обрезается.
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

**Резюме:**\
Базовая архитектура, корзина, профиль, таймер, каталог — реализованы.\
Не реализовано: оформление заказа, история заказов, промокоды, save for later,
платежи, тесты, часть анимаций, часть skeleton-UI, голосовой таймер, реальный
Google Auth.\
Фактический бекенд — Supabase, а не Firebase (TECH_SPEC.md обновлён).
