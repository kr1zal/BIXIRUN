# TECH_SPEC.md (MASTER VERSION)

> **Дисклеймер:** Это мастер-версия технической спецификации. Все изменения и актуализации вносятся только сюда. Содержит объединённую, самую полную и свежую информацию из всех предыдущих версий.

---

# Technical Specification: Mobile Marketplace + Fitness Interval Timer

**Audience:** Senior React Native devs building a cross-platform e-commerce app with an integrated interval timer.

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
- **Filters:** Toggle grid/list (2-col, 1-col, list) — persist state (AsyncStorage)
- **Product List:**  
  - Card: thumbnail, name, price, "Add to Cart" (icon + counter)
  - Infinite scroll (pagination)
  - Pull-to-refresh

### 2.3 Product Details
- Image gallery (swipe, thumbnails)
- Tabs: Description | Specs | Reviews
- "Add to Cart" (qty selector)

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
- "Start" → timer with voice alerts
- Progress: circular chart + current stage

### 2.6 Shopping Cart
- Editable list, total price
- "Checkout" → payment

### 2.7 User Profile
- Sections: Personal Info | Payment Methods | Order History
- Apple Pay/Google Pay

---

## 3. Technical Requirements

- **Stack:** React Native (iOS/Android), Firebase backend
- **Animations:** Lottie (banners, transitions)
- **State:** Redux (cart, timer)
- **Testing:** Jest (unit), Detox (E2E)
- **Design:** Material Design + iOS HIG

---

## 4. Data Sync & Performance

- Use Firebase Realtime Database or Firestore for live product/cart sync
- Use Redux for local state, sync with backend on key actions (add/remove cart, checkout)
- Persist view/filter state with AsyncStorage
- Optimize product list: FlatList + React.memo + getItemLayout
- Timer: use react-native-background-timer for background/locked state

---

## 5. Task Prioritization

1. Project setup (RN, Firebase, Redux, Lottie, navigation)
2. Splash/Main screen skeletons
3. Product list + filters + infinite scroll
4. Product details page
5. Cart logic + checkout
6. Timer screen (UI, logic, voice alerts)
7. User profile + payment integration
   * **Примечание:** Кнопка "Войти" удалена из нижнего меню навигации. Доступ к странице авторизации будет реализован при покупке товара или через профиль пользователя. Был сделан выбор в пользу статического меню без скроллинга для улучшения пользовательского опыта.
8. Animations/polish
9. Testing (unit, E2E)
10. QA, bugfix, deploy

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
- Use Lottie for banners/animations
- Persist user settings (filters, timer presets) with AsyncStorage
- Adhere to Material/iOS HIG for all UI 

---

## 8. Database Schema (Firestore)

### users
- uid: string (doc id)
- name: string
- email: string
- avatarUrl: string
- phone: string
- paymentMethods: array
- orderHistory: array (order ids)
- createdAt: timestamp

### products
- productId: string (doc id)
- name: string
- description: string
- price: number
- images: array (urls)
- specs: map
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
- paymentMethod: string
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

```
root/
├── android/
├── ios/
├── src/
│   ├── api/                # Firebase, REST, GraphQL clients
│   ├── assets/             # Images, Lottie, fonts
│   ├── components/         # Reusable UI components
│   ├── features/
│   │   ├── cart/
│   │   ├── catalog/
│   │   ├── product/
│   │   ├── profile/
│   │   ├── timer/
│   │   └── ...
│   ├── navigation/         # React Navigation configs
│   ├── redux/              # Slices, store, selectors
│   ├── screens/            # Screen containers
│   ├── utils/              # Helpers, validators
│   ├── hooks/              # Custom hooks
│   └── App.tsx             # Entry point
├── tests/
│   ├── unit/
│   └── e2e/
├── .env
├── app.json
├── package.json
├── README.md
└── ...
```

- Все бизнес-логика и состояния — в features и redux
- assets: картинки, анимации, шрифты
- tests: unit (Jest), e2e (Detox)
- api: работа с Firebase/сервером
- hooks: кастомные хуки (например, useCart, useTimer)
- utils: валидация, форматирование, вспомогательные функции

---

## 10. Additional Notes

- Use FlatList's `getItemLayout` for perf
- Memoize product cards
- Use Lottie for banners/animations
- Persist user settings (filters, timer presets) with AsyncStorage
- Adhere to Material/iOS HIG for all UI 

---

## 11. Cart Implementation Checklist

### 11.1 Checkout Process
- [ ] Create checkout screen route/component
- [ ] Build multi-step checkout wizard:
  - [ ] Step 1: Shipping information (address form)
  - [ ] Step 2: Payment method selection
  - [ ] Step 3: Order review and confirmation
- [ ] Implement form validation for all checkout fields
- [ ] Add order summary with line items, subtotal, shipping, tax, and total
- [ ] Create order success/confirmation screen
- [ ] Store completed orders in AsyncStorage (order history)
- [ ] Add connectivity check before placing order

### 11.2 Discount & Promo Codes
- [ ] Add promo code entry field in cart screen
- [ ] Implement promo code validation logic
- [ ] Create discount calculations in cart summary
- [ ] Show applied discount and savings amount
- [ ] Add visual indicators for discounted items
- [ ] Create animations for successful promo code application
- [ ] Implement expiration checking for promo codes

### 11.3 Cart UX Improvements
- [ ] Add product image zoom on long press in cart
- [ ] Create "Add to Cart" animation with flying item to cart icon
- [ ] Implement pull-down quick cart view from any screen
- [ ] Add haptic feedback for cart actions (add, remove, update)
- [ ] Create skeleton loading state for cart
- [ ] Add related/recommended products section at bottom of cart
- [ ] Implement "Continue Shopping" smart redirect (to last viewed category)
- [ ] Create empty cart illustrations with motivational messages

### 11.4 Save for Later Functionality
- [ ] Implement "Save for Later" button in cart items
- [ ] Create saved items section below active cart
- [ ] Add "Move to Cart" button for saved items
- [ ] Design visual distinction between cart and saved items
- [ ] Persist saved items in AsyncStorage
- [ ] Add batch actions for saved items (move all to cart, remove all)
- [ ] Implement drag and drop between cart and saved items

### 11.5 Backend Integration
- [ ] Create API service for cart operations
- [ ] Implement cart sync between local storage and Firebase
- [ ] Add real-time stock checking for cart items
- [ ] Create conflict resolution for cart differences between devices
- [ ] Implement analytics tracking for cart events
- [ ] Add auth flow integration for guest carts vs. user carts
- [ ] Create order tracking functionality with status updates
- [ ] Implement secure payment processing with Firebase functions

### 11.6 Testing & QA
- [ ] Write unit tests for cart reducers and selectors
- [ ] Create integration tests for cart persistence
- [ ] Test checkout flows with various edge cases
- [ ] Verify cart behavior with network interruptions
- [ ] Test performance with large number of items
- [ ] Ensure accessibility compliance for all cart screens
- [ ] Test cross-platform behavior (iOS vs Android) 

---

## 12. Supabase Storage Setup

### 12.1 Avatar Storage Implementation
- [x] Create "avatars" bucket in Supabase Storage
- [x] Set up storage policies:
  - [x] Public read access (SELECT): Allow anyone to view avatars
  - [x] Auth users upload (INSERT): Allow authenticated users to upload files
  - [x] Owner update (UPDATE): Restrict updates to file owners
  - [x] Owner delete (DELETE): Restrict deletion to file owners
- [x] Implement profile image upload with expo-image-picker
- [x] Structure avatar paths as `{user_id}/{timestamp}.jpg`
- [x] Update user metadata with avatar URL after successful upload

### 12.2 Avatar Upload Function
```javascript
const pickImage = async () => {
  try {
    // Request permissions
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Error', 'Permission to access gallery is required');
      return;
    }

    // Open image picker
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setLoading(true);
      const imageUri = result.assets[0].uri;
      
      // Display image immediately for better UX
      setProfileImage(imageUri);

      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      // Convert URI to Blob
      const response = await fetch(imageUri);
      const blob = await response.blob();

      // Generate unique file path
      const fileName = `${Date.now()}.jpg`;
      const filePath = `${user.id}/${fileName}`;

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('avatars')
        .upload(filePath, blob, {
          contentType: 'image/jpeg',
          upsert: true
        });

      if (error) throw error;

      // Get public URL
      const { data: publicUrlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const avatarUrl = publicUrlData.publicUrl;

      // Update user profile with new avatar URL
      await updateUserProfile({ avatar_url: avatarUrl });
      
      Alert.alert('Success', 'Profile photo updated');
    }
  } catch (error) {
    console.error('Error uploading image:', error);
    Alert.alert('Error', `Failed to upload photo: ${error.message}`);
  } finally {
    setLoading(false);
  }
};
```

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
- [ ] Создать функцию для получения списка товаров из Supabase (getProducts)
- [ ] Получать все нужные поля: name, images, price, old_price, discount, description, specs
- [ ] Обработать массив images и specs
- [ ] Создать компонент ProductList/CatalogScreen
- [ ] Использовать FlatList для отображения товаров
- [ ] Сделать карточку товара с картинкой, ценой, скидкой
- [ ] Сделать placeholder/skeleton для картинок
- [ ] Создать ProductDetailScreen (детальная страница)
- [ ] Реализовать галерею изображений, specs, описание
- [ ] Реализовать swipe/scroll по изображениям
- [ ] Проверить отображение specs (парсить JSONB)
- [ ] Проверить отображение товаров с разным количеством картинок и specs

### 2. Корзина, оформление заказа, профиль

- [x] Реализовать redux slice для корзины (cartSlice)
- [x] Реализовать добавление, удаление, изменение qty, очистку корзины
- [x] Сохранять корзину в AsyncStorage
- [ ] Создать CheckoutScreen (оформление заказа)
- [ ] Реализовать форму для ввода данных (адрес, телефон, оплата)
- [ ] Реализовать отправку заказа в Supabase (orders table)
- [ ] Очистить корзину после заказа
- [ ] Создать ProfileScreen
- [ ] Реализовать отображение профиля, загрузку/смену аватара
- [ ] Выводить историю заказов

---

**Дальнейшие шаги:**
- [ ] Реализовать функцию getProducts в supabaseClient.ts
- [ ] Интегрировать её в productsSlice (убрать mock, сделать реальный fetch)
- [ ] Создать компонент ProductList и вывести товары на экран

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