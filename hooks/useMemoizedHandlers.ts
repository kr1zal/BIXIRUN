import { useCallback, useEffect, useMemo, useRef } from 'react';

/**
 * Hook для мемоизации обработчиков событий
 */
export function useMemoizedHandlers<T extends Record<string, (...args: any[]) => any>>(
    handlers: T
): T {
    const memoizedHandlers = useMemo(() => {
        const result = {} as T;
        for (const [key, handler] of Object.entries(handlers)) {
            result[key as keyof T] = handler as T[keyof T]; // ✅ Убираем лишний useCallback
        }
        return result;
    }, [handlers]);

    return memoizedHandlers;
}

/**
 * Hook для дебаунса функций - предотвращает избыточные вызовы
 */
export function useDebounce<T extends (...args: any[]) => any>(
    callback: T,
    delay: number
): T {
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const debouncedCallback = useCallback(
        (...args: Parameters<T>) => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }

            timeoutRef.current = setTimeout(() => {
                callback(...args);
            }, delay);
        },
        [callback, delay]
    ) as T;

    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    return debouncedCallback;
}

/**
 * Hook для оптимизации производительности галереи в карточках товаров
 */
export function useOptimizedGallery(itemId: string) {
    // ✅ Мемоизированный keyExtractor для галереи
    const galleryKeyExtractor = useCallback(
        (_: string, index: number) => `gallery-${itemId}-${index}`,
        [itemId]
    );

    // ✅ Оптимизированные настройки для FlatList галереи
    const galleryOptimization = useMemo(() => ({
        initialNumToRender: 1,
        maxToRenderPerBatch: 1,
        windowSize: 3,
        removeClippedSubviews: true,
        scrollEventThrottle: 16,
        decelerationRate: "fast" as const,
    }), []);

    return {
        galleryKeyExtractor,
        galleryOptimization,
    };
} 