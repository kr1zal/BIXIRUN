# ТЕХНИЧЕСКОЕ РУКОВОДСТВО ПО РЕАЛИЗАЦИИ
## Улучшения карточки товара BIXIRUN
## Дата: 2024-12-19

---

## 🎯 ПРИОРИТЕТНЫЕ УЛУЧШЕНИЯ

### 1. 💰 УЛУЧШЕННЫЙ ЦЕНОВОЙ БЛОК

**Создать компонент: `components/ui/EnhancedPriceBlock.tsx`**

```tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface EnhancedPriceBlockProps {
  price: number;
  oldPrice?: number;
  discount?: number;
  monthlyPayment?: number;
  currency?: string;
  installmentMonths?: number;
}

export const EnhancedPriceBlock: React.FC<EnhancedPriceBlockProps> = ({
  price,
  oldPrice,
  discount,
  monthlyPayment,
  currency = '₽',
  installmentMonths = 12
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.priceRow}>
        <Text style={styles.currentPrice}>
          {price.toLocaleString()} {currency}
        </Text>
        {oldPrice && (
          <Text style={styles.oldPrice}>
            {oldPrice.toLocaleString()} {currency}
          </Text>
        )}
        {discount && (
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>-{discount}%</Text>
          </View>
        )}
      </View>
      
      {monthlyPayment && (
        <Text style={styles.monthlyPayment}>
          по {monthlyPayment.toLocaleString()} {currency} в месяц
        </Text>
      )}
      
      <Text style={styles.installmentInfo}>
        💳 Рассрочка 0% • {installmentMonths} месяцев
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 16,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 4,
  },
  currentPrice: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
  },
  oldPrice: {
    fontSize: 18,
    color: '#666',
    textDecorationLine: 'line-through',
  },
  discountBadge: {
    backgroundColor: '#FF5722',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  discountText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  monthlyPayment: {
    fontSize: 16,
    color: '#666',
    marginBottom: 4,
  },
  installmentInfo: {
    fontSize: 14,
    color: '#1976D2',
  },
});
```

### 2. 🎮 УЛУЧШЕННЫЕ КНОПКИ ДЕЙСТВИЙ

**Создать компонент: `components/ui/ActionButtons.tsx`**

```tsx
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ActionButtonsProps {
  onBuyNow: () => void;
  onAddToCart: () => void;
  isInCart: boolean;
  quantity: number;
  onQuantityChange: (value: number) => void;
  cartItemsCount?: number;
}

export const ActionButtons: React.FC<ActionButtonsProps> = ({
  onBuyNow,
  onAddToCart,
  isInCart,
  quantity,
  onQuantityChange,
  cartItemsCount = 0
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const scaleAnim = new Animated.Value(1);

  const handleAddToCart = async () => {
    setIsLoading(true);
    
    // Микроанимация
    Animated.sequence([
      Animated.scale(scaleAnim, { toValue: 0.95, duration: 100, useNativeDriver: true }),
      Animated.scale(scaleAnim, { toValue: 1, duration: 100, useNativeDriver: true }),
    ]).start();

    try {
      await onAddToCart();
    } finally {
      setIsLoading(false);
    }
  };

  const getCartButtonState = () => {
    if (isLoading) return { 
      text: 'Добавляем...', 
      color: '#666', 
      icon: 'hourglass-outline' as const 
    };
    if (isInCart) return { 
      text: 'В корзине', 
      color: '#00C851', 
      icon: 'checkmark-circle' as const 
    };
    return { 
      text: 'В корзину', 
      color: '#1976D2', 
      icon: 'cart-outline' as const 
    };
  };

  const buttonState = getCartButtonState();

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.buyNowButton}
        onPress={onBuyNow}
        activeOpacity={0.8}
      >
        <Text style={styles.buyNowText}>Купить сейчас</Text>
      </TouchableOpacity>

      <View style={styles.cartSection}>
        <View style={styles.quantitySelector}>
          <TouchableOpacity
            style={styles.quantityButton}
            onPress={() => onQuantityChange(Math.max(1, quantity - 1))}
            disabled={quantity <= 1}
          >
            <Ionicons name="remove" size={20} color="#666" />
          </TouchableOpacity>
          
          <Text style={styles.quantityText}>{quantity}</Text>
          
          <TouchableOpacity
            style={styles.quantityButton}
            onPress={() => onQuantityChange(quantity + 1)}
          >
            <Ionicons name="add" size={20} color="#666" />
          </TouchableOpacity>
        </View>

        <Animated.View style={[{ transform: [{ scale: scaleAnim }] }]}>
          <TouchableOpacity
            style={[styles.cartButton, { backgroundColor: buttonState.color }]}
            onPress={handleAddToCart}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            <Ionicons name={buttonState.icon} size={20} color="#FFF" />
            <Text style={styles.cartButtonText}>{buttonState.text}</Text>
            {cartItemsCount > 0 && (
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>{cartItemsCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </Animated.View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 16,
    gap: 12,
  },
  buyNowButton: {
    backgroundColor: '#FF9800',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  buyNowText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cartSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  quantitySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    paddingHorizontal: 4,
  },
  quantityButton: {
    padding: 8,
    minWidth: 32,
    alignItems: 'center',
  },
  quantityText: {
    fontSize: 16,
    fontWeight: 'bold',
    minWidth: 24,
    textAlign: 'center',
  },
  cartButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    flex: 1,
    justifyContent: 'center',
    gap: 8,
  },
  cartButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cartBadge: {
    backgroundColor: '#FF5722',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    top: -8,
    right: -8,
  },
  cartBadgeText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
});
```

### 3. 📦 ИНФОРМАЦИЯ О ДОСТАВКЕ

**Создать компонент: `components/ui/DeliveryInfo.tsx`**

```tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface DeliveryInfoProps {
  estimatedDate: string;
  freeDeliveryThreshold?: number;
  currentCartValue?: number;
  onChangeLocation?: () => void;
  expressDelivery?: {
    available: boolean;
    date: string;
    price: number;
  };
}

export const DeliveryInfo: React.FC<DeliveryInfoProps> = ({
  estimatedDate,
  freeDeliveryThreshold = 999,
  currentCartValue = 0,
  onChangeLocation,
  expressDelivery
}) => {
  const remainingForFreeDelivery = Math.max(0, freeDeliveryThreshold - currentCartValue);
  const isFreeDelivery = remainingForFreeDelivery === 0;

  return (
    <View style={styles.container}>
      <View style={styles.deliveryRow}>
        <Ionicons name="cube-outline" size={16} color="#00C851" />
        <Text style={styles.deliveryText}>
          Доставим {estimatedDate}
          {isFreeDelivery ? ' • Бесплатно' : ` • Бесплатно от ${freeDeliveryThreshold} ₽`}
        </Text>
      </View>

      {!isFreeDelivery && (
        <Text style={styles.freeDeliveryProgress}>
          До бесплатной доставки: {remainingForFreeDelivery} ₽
        </Text>
      )}

      <TouchableOpacity style={styles.locationRow} onPress={onChangeLocation}>
        <Ionicons name="location-outline" size={16} color="#666" />
        <Text style={styles.locationText}>
          Москва, до пункта выдачи
        </Text>
        <Ionicons name="chevron-forward" size={16} color="#666" />
      </TouchableOpacity>

      {expressDelivery?.available && (
        <View style={styles.expressDelivery}>
          <Ionicons name="flash-outline" size={16} color="#FF9800" />
          <Text style={styles.expressText}>
            Экспресс-доставка: {expressDelivery.date} +{expressDelivery.price}₽
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 16,
    gap: 8,
  },
  deliveryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  deliveryText: {
    fontSize: 14,
    color: '#333',
  },
  freeDeliveryProgress: {
    fontSize: 12,
    color: '#666',
    marginLeft: 24,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
  },
  locationText: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  expressDelivery: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
  },
  expressText: {
    fontSize: 14,
    color: '#FF9800',
  },
});
```

### 4. ⭐ РЕЙТИНГИ И ОТЗЫВЫ

**Создать компонент: `components/ui/RatingSection.tsx`**

```tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface RatingSectionProps {
  rating: number;
  reviewsCount: number;
  onReadReviews: () => void;
  lastReview?: string;
  photoReviewsCount?: number;
  weeklyPurchases?: number;
}

export const RatingSection: React.FC<RatingSectionProps> = ({
  rating,
  reviewsCount,
  onReadReviews,
  lastReview,
  photoReviewsCount = 0,
  weeklyPurchases = 0
}) => {
  const renderStars = (rating: number) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Ionicons
          key={i}
          name={i <= rating ? 'star' : 'star-outline'}
          size={16}
          color="#FFD700"
        />
      );
    }
    return stars;
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.ratingRow} onPress={onReadReviews}>
        <View style={styles.stars}>
          {renderStars(Math.floor(rating))}
        </View>
        <Text style={styles.ratingText}>
          {rating} ({reviewsCount})
        </Text>
        <Ionicons name="chevron-forward" size={16} color="#666" />
      </TouchableOpacity>

      {photoReviewsCount > 0 && (
        <TouchableOpacity style={styles.photoReviews} onPress={onReadReviews}>
          <Ionicons name="camera-outline" size={16} color="#1976D2" />
          <Text style={styles.photoReviewsText}>
            Фото от покупателей ({photoReviewsCount})
          </Text>
        </TouchableOpacity>
      )}

      {lastReview && (
        <View style={styles.lastReview}>
          <Ionicons name="chatbubble-outline" size={16} color="#666" />
          <Text style={styles.lastReviewText} numberOfLines={1}>
            Последний отзыв: "{lastReview}"
          </Text>
        </View>
      )}

      {weeklyPurchases > 0 && (
        <View style={styles.socialProof}>
          <Ionicons name="people-outline" size={16} color="#00C851" />
          <Text style={styles.socialProofText}>
            {weeklyPurchases} человек купили на этой неделе
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 16,
    gap: 8,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stars: {
    flexDirection: 'row',
    gap: 2,
  },
  ratingText: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  photoReviews: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
  },
  photoReviewsText: {
    fontSize: 14,
    color: '#1976D2',
  },
  lastReview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
  },
  lastReviewText: {
    fontSize: 12,
    color: '#666',
    flex: 1,
  },
  socialProof: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
  },
  socialProofText: {
    fontSize: 12,
    color: '#00C851',
  },
});
```

### 5. 🏷️ БЕЙДЖИ ДОВЕРИЯ

**Создать компонент: `components/ui/TrustBadges.tsx`**

```tsx
import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Badge {
  text: string;
  color: string;
  icon: string;
  type: 'trust' | 'feature' | 'promo';
}

interface TrustBadgesProps {
  badges: Badge[];
  variant?: 'horizontal' | 'wrap';
}

export const TrustBadges: React.FC<TrustBadgesProps> = ({
  badges,
  variant = 'wrap'
}) => {
  const renderBadge = (badge: Badge, index: number) => (
    <View key={index} style={[styles.badge, { backgroundColor: badge.color }]}>
      <Ionicons name={badge.icon as any} size={14} color="#FFF" />
      <Text style={styles.badgeText}>{badge.text}</Text>
    </View>
  );

  if (variant === 'horizontal') {
    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.horizontalContainer}
        contentContainerStyle={styles.horizontalContent}
      >
        {badges.map(renderBadge)}
      </ScrollView>
    );
  }

  return (
    <View style={styles.wrapContainer}>
      {badges.map(renderBadge)}
    </View>
  );
};

const styles = StyleSheet.create({
  horizontalContainer: {
    paddingVertical: 8,
  },
  horizontalContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  wrapContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingVertical: 8,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  badgeText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '500',
  },
});

// Предустановленные бейджи
export const DEFAULT_BADGES: Badge[] = [
  {
    text: 'Быстрая доставка',
    color: '#00C851',
    icon: 'flash-outline',
    type: 'feature'
  },
  {
    text: 'Возврат 30 дней',
    color: '#1976D2',
    icon: 'refresh-outline',
    type: 'trust'
  },
  {
    text: 'Гарантия качества',
    color: '#FF9800',
    icon: 'shield-checkmark-outline',
    type: 'trust'
  },
  {
    text: 'Хит продаж',
    color: '#E91E63',
    icon: 'trending-up-outline',
    type: 'promo'
  }
];
```

---

## 🔧 ИНТЕГРАЦИЯ В СУЩЕСТВУЮЩИЙ КОД

### 1. Обновить `app/product/[id].tsx`

```tsx
// Добавить новые импорты
import { EnhancedPriceBlock } from '../../components/ui/EnhancedPriceBlock';
import { ActionButtons } from '../../components/ui/ActionButtons';
import { DeliveryInfo } from '../../components/ui/DeliveryInfo';
import { RatingSection } from '../../components/ui/RatingSection';
import { TrustBadges, DEFAULT_BADGES } from '../../components/ui/TrustBadges';

// Заменить существующий ценовой блок
<EnhancedPriceBlock
  price={parseFloat(product.price)}
  oldPrice={product.old_price ? parseFloat(product.old_price) : undefined}
  discount={product.discount}
  monthlyPayment={Math.round(parseFloat(product.price) / 12)}
/>

// Заменить кнопки
<ActionButtons
  onBuyNow={handleBuyNow}
  onAddToCart={handleAddToCart}
  isInCart={isInCart}
  quantity={quantity}
  onQuantityChange={setQuantity}
  cartItemsCount={cartItems.length}
/>

// Добавить новые секции
<RatingSection
  rating={4.8}
  reviewsCount={127}
  onReadReviews={handleReadReviews}
  lastReview="Отличное качество!"
  photoReviewsCount={15}
  weeklyPurchases={32}
/>

<DeliveryInfo
  estimatedDate="23 декабря"
  freeDeliveryThreshold={999}
  currentCartValue={totalCartValue}
  onChangeLocation={handleChangeLocation}
  expressDelivery={{
    available: true,
    date: "завтра",
    price: 200
  }}
/>

<TrustBadges badges={DEFAULT_BADGES} />
```

### 2. Добавить новые хуки

**Создать: `hooks/useProductInteractions.ts`**

```tsx
import { useState, useCallback } from 'react';
import { useAppDispatch } from '../app/store/hooks';
import { addToCart } from '../app/store/slices/cartSlice';

export const useProductInteractions = (product: any) => {
  const dispatch = useAppDispatch();
  const [quantity, setQuantity] = useState(1);
  const [isInCart, setIsInCart] = useState(false);

  const handleBuyNow = useCallback(() => {
    // Логика быстрой покупки
    dispatch(addToCart({ ...product, quantity }));
    // Перенаправление на оформление заказа
    // navigation.navigate('Checkout');
  }, [product, quantity]);

  const handleAddToCart = useCallback(async () => {
    dispatch(addToCart({ ...product, quantity }));
    setIsInCart(true);
    
    // Показать уведомление
    // showToast('Товар добавлен в корзину');
  }, [product, quantity]);

  const handleReadReviews = useCallback(() => {
    // Навигация к отзывам
    // navigation.navigate('Reviews', { productId: product.id });
  }, [product]);

  const handleChangeLocation = useCallback(() => {
    // Модальное окно выбора города
    // showLocationModal();
  }, []);

  return {
    quantity,
    setQuantity,
    isInCart,
    handleBuyNow,
    handleAddToCart,
    handleReadReviews,
    handleChangeLocation
  };
};
```

### 3. Обновить типы

**Добавить в `app/supabaseClient.ts`:**

```tsx
export type ProductData = {
  id: string;
  name: string;
  price: string;
  old_price?: string;
  discount: number;
  images?: string[];
  description?: string;
  // Новые поля
  rating?: number;
  reviews_count?: number;
  monthly_payment?: number;
  delivery_days?: number;
  stock_quantity?: number;
  weekly_purchases?: number;
  last_review?: string;
  photo_reviews_count?: number;
};
```

---

## 🎨 ОБНОВЛЕНИЕ СТИЛЕЙ

### 1. Обновить цветовую схему

**В `constants/Colors.ts`:**

```tsx
export const Colors = {
  light: {
    // Существующие цвета
    text: '#000',
    background: '#fff',
    tint: '#1976D2',
    // Новые цвета
    success: '#00C851',
    error: '#FF5722',
    warning: '#FF9800',
    discount: '#E91E63',
    secondary: '#666',
    border: '#E0E0E0',
    badge: '#F5F5F5',
  },
  dark: {
    // Существующие цвета
    text: '#fff',
    background: '#000',
    tint: '#BB86FC',
    // Новые цвета
    success: '#03DAC6',
    error: '#CF6679',
    warning: '#FF9800',
    discount: '#E91E63',
    secondary: '#AAAAAA',
    border: '#333',
    badge: '#1E1E1E',
  },
};
```

### 2. Добавить общие стили

**Создать: `styles/productCard.ts`**

```tsx
import { StyleSheet } from 'react-native';
import { Colors } from '../constants/Colors';

export const productCardStyles = StyleSheet.create({
  container: {
    backgroundColor: Colors.light.background,
    paddingHorizontal: 16,
  },
  section: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.light.text,
    marginBottom: 8,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.light.border,
    marginVertical: 16,
  },
  // Адаптивные стили
  tablet: {
    flexDirection: 'row',
    gap: 24,
  },
  imageSection: {
    flex: 1,
  },
  detailsSection: {
    flex: 1,
  },
});
```

---

## 📱 ТЕСТИРОВАНИЕ

### 1. Юнит-тесты для новых компонентов

```tsx
// __tests__/components/EnhancedPriceBlock.test.tsx
import React from 'react';
import { render } from '@testing-library/react-native';
import { EnhancedPriceBlock } from '../../components/ui/EnhancedPriceBlock';

describe('EnhancedPriceBlock', () => {
  it('renders price correctly', () => {
    const { getByText } = render(
      <EnhancedPriceBlock price={2990} oldPrice={3990} discount={25} />
    );
    
    expect(getByText('2 990 ₽')).toBeTruthy();
    expect(getByText('3 990 ₽')).toBeTruthy();
    expect(getByText('-25%')).toBeTruthy();
  });

  it('shows monthly payment', () => {
    const { getByText } = render(
      <EnhancedPriceBlock price={2990} monthlyPayment={249} />
    );
    
    expect(getByText('по 249 ₽ в месяц')).toBeTruthy();
  });
});
```

### 2. E2E тесты для пользовательских сценариев

```tsx
// e2e/productCard.e2e.ts
describe('Product Card', () => {
  beforeEach(async () => {
    await device.reloadReactNative();
  });

  it('should add product to cart', async () => {
    await element(by.id('addToCartButton')).tap();
    await expect(element(by.text('В корзине'))).toBeVisible();
  });

  it('should update quantity', async () => {
    await element(by.id('increaseQuantity')).tap();
    await expect(element(by.text('2'))).toBeVisible();
  });

  it('should navigate to reviews', async () => {
    await element(by.id('readReviewsButton')).tap();
    await expect(element(by.id('reviewsScreen'))).toBeVisible();
  });
});
```

---

## 🚀 ПЛАН РАЗВЕРТЫВАНИЯ

### Этап 1: Базовые компоненты (1-2 дня)
1. ✅ Создать EnhancedPriceBlock
2. ✅ Создать ActionButtons
3. ✅ Интегрировать в существующую карточку
4. ✅ Протестировать основную функциональность

### Этап 2: Расширенные функции (2-3 дня)
1. ✅ Добавить DeliveryInfo
2. ✅ Добавить RatingSection
3. ✅ Добавить TrustBadges
4. ✅ Добавить микроинтерракции

### Этап 3: Оптимизация (1-2 дня)
1. ✅ Оптимизировать производительность
2. ✅ Добавить тесты
3. ✅ Проверить адаптивность
4. ✅ Финальная проверка

---

## 📊 МЕТРИКИ ДЛЯ ОТСЛЕЖИВАНИЯ

### Аналитика (Firebase/Amplitude)
```tsx
// Отслеживание взаимодействий
trackEvent('product_view', {
  product_id: product.id,
  source: 'product_card'
});

trackEvent('add_to_cart', {
  product_id: product.id,
  quantity: quantity,
  price: product.price
});

trackEvent('buy_now_click', {
  product_id: product.id,
  conversion_path: 'direct'
});
```

### A/B тестирование
```tsx
// Варианты кнопок для тестирования
const buttonVariants = {
  control: 'В корзину',
  variant_a: 'Добавить в корзину',
  variant_b: 'Купить',
  variant_c: 'Заказать'
};
```

---

*Техническое руководство создано: 2024-12-19*
*Основано на анализе WB и Ozon*
*Связанные документы: PRODUCT_CARD_UX_ANALYSIS.md, PRODUCT_CARD_MOCKUPS.md* 