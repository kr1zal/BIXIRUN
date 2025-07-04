import { AnyAction, Middleware } from 'redux';
import { RootState } from '../index';
import { saveCartToStorage } from '../slices/cartSlice';

/**
 * Middleware для автоматического сохранения корзины при изменениях
 */
export const cartMiddleware: Middleware<{}, RootState> = store => next => action => {
    // Сначала выполняется оригинальное действие
    const result = next(action);

    // Проверяем, связано ли действие с корзиной
    const actionType = (action as AnyAction).type;
    if (
        typeof actionType === 'string' &&
        actionType.startsWith('cart/') &&
        !actionType.includes('loadFromStorage') &&
        !actionType.includes('saveToStorage')
    ) {
        // Получаем текущее состояние корзины после обработки действия
        const currentCart = store.getState().cart.items;

        // Отправляем асинхронное действие для сохранения данных
        // @ts-ignore - игнорируем ошибку типизации, так как AsyncThunk является валидным действием для dispatch
        store.dispatch(saveCartToStorage(currentCart));
    }

    return result;
}; 