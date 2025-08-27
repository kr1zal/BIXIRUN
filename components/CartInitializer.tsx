import React, { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '../store';
import { loadCartFromStorage } from '../store/slices/cartSlice';

/**
 * Компонент для инициализации корзины при запуске приложения
 * Загружает данные корзины из AsyncStorage
 */
const CartInitializer: React.FC = () => {
    // Используем типизированный dispatch
    const dispatch = useDispatch<AppDispatch>();

    useEffect(() => {
        const loadCart = async () => {
            await dispatch(loadCartFromStorage());
        };
        loadCart();
    }, [dispatch]);

    // Компонент не отображает ничего в UI
    return null;
};

export default CartInitializer; 