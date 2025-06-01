import { useCallback } from 'react';

/**
 * A hook that memoizes a collection of handler functions
 * to prevent unnecessary re-renders.
 * 
 * @param handlers - An object containing handler functions
 * @param deps - Dependencies array that should trigger handler regeneration
 * @returns An object with memoized versions of all handlers
 */
export function useMemoizedHandlers<T extends Record<string, (...args: any[]) => any>>(
    handlers: T,
    deps: React.DependencyList = []
): T {
    const memoizedHandlers = {} as T;

    // Create memoized versions of each handler
    Object.keys(handlers).forEach(key => {
        const handler = handlers[key];
        // @ts-ignore - We know key exists in T
        memoizedHandlers[key] = useCallback((...args: any[]) => {
            return handler(...args);
        }, [...deps]);
    });

    return memoizedHandlers;
} 