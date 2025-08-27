import { useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store';
import {
    addToCart,
    clearCart,
    removeFromCart,
    selectCartItemsCount,
    selectSelectedItemsDiscount,
    selectSelectedItemsOriginalTotal,
    selectSelectedItemsTotal,
    toggleItemSelected,
    toggleSelectAll,
    updateQuantity
} from '../store/slices/cartSlice';
import { ProductItem } from '../store/slices/contentSlice';

/**
 * ✅ ОПТИМИЗИРОВАННЫЙ ХУК ДЛЯ РАБОТЫ С КОРЗИНОЙ
 * Мемоизирует все операции и селекторы
 */
export const useCart = () => {
    const dispatch = useDispatch();

    // Мемоизированные селекторы
    const cartItems = useSelector((state: RootState) => state.cart.items);
    const itemCount = useSelector(selectCartItemsCount);
    const originalTotal = useSelector(selectSelectedItemsOriginalTotal);
    const discount = useSelector(selectSelectedItemsDiscount);
    const finalTotal = useSelector(selectSelectedItemsTotal);

    // Мемоизированные вычисления
    const allItemsSelected = useMemo(() =>
        cartItems.length > 0 && cartItems.every(item => item.selected),
        [cartItems]
    );

    const hasSelectedItems = useMemo(() =>
        cartItems.some(item => item.selected),
        [cartItems]
    );

    const selectedItemsCount = useMemo(() =>
        cartItems.filter(item => item.selected).length,
        [cartItems]
    );

    // Мемоизированные действия
    const actions = useMemo(() => ({
        addToCart: (product: ProductItem, quantity: number = 1) =>
            dispatch(addToCart({ product, quantity })),

        removeFromCart: (productId: string) =>
            dispatch(removeFromCart(productId)),

        updateQuantity: (productId: string, quantity: number) =>
            dispatch(updateQuantity({ productId, quantity })),

        clearCart: () =>
            dispatch(clearCart()),

        toggleItemSelected: (productId: string) =>
            dispatch(toggleItemSelected(productId)),

        toggleSelectAll: (selected: boolean) =>
            dispatch(toggleSelectAll(selected)),

        // Утилитарные методы
        getCartItemByProductId: (productId: string) =>
            cartItems.find(item => item.product.id === productId),

        isInCart: (productId: string) =>
            cartItems.some(item => item.product.id === productId),
    }), [dispatch, cartItems]);

    // Мемоизированные данные для компонентов
    const cartSummary = useMemo(() => ({
        originalTotal: Math.round(originalTotal),
        discount: Math.round(discount),
        total: Math.round(parseFloat(finalTotal)),
        itemCount,
        hasSelectedItems,
        selectedItemsCount,
    }), [originalTotal, discount, finalTotal, itemCount, hasSelectedItems, selectedItemsCount]);

    return {
        // Состояние
        cartItems,
        isEmpty: cartItems.length === 0,
        allItemsSelected,
        cartSummary,

        // Действия
        ...actions,
    };
};

/**
 * ✅ СПЕЦИАЛИЗИРОВАННЫЙ ХУК ДЛЯ ИНДИВИДУАЛЬНЫХ ТОВАРОВ
 * Использует мемоизацию для избежания ререндеров
 */
export const useCartItem = (productId: string) => {
    const dispatch = useDispatch();
    const cartItem = useSelector((state: RootState) =>
        state.cart.items.find(item => item.product.id === productId)
    );

    const actions = useMemo(() => ({
        addToCart: (product: ProductItem, quantity: number = 1) =>
            dispatch(addToCart({ product, quantity })),

        updateQuantity: (quantity: number) =>
            dispatch(updateQuantity({ productId, quantity })),

        removeFromCart: () =>
            dispatch(removeFromCart(productId)),

        toggleSelected: () =>
            dispatch(toggleItemSelected(productId)),
    }), [dispatch, productId]);

    return {
        cartItem,
        isInCart: !!cartItem,
        quantity: cartItem?.quantity || 0,
        isSelected: cartItem?.selected || false,
        ...actions,
    };
}; 