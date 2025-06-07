import React, { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '../app/store';
import { loadCartFromStorage } from '../app/store/slices/cartSlice';

/**
 * Компонент для инициализации корзины при запуске приложения
 * Загружает данные корзины из AsyncStorage
 */
const CartInitializer: React.FC = () => {
    // Используем типизированный dispatch
    const dispatch = useDispatch<AppDispatch>();

    useEffect(() => {
        // Загрузка корзины при монтировании компонента
        dispatch(loadCartFromStorage());

        // Выводим сообщение в консоль для отладки
        console.log('CartInitializer: Attempting to load cart from storage');
    }, [dispatch]);

    // Компонент не отображает ничего в UI
    return null;
};

export default CartInitializer; 