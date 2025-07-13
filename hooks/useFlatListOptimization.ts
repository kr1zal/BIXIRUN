import { useCallback } from 'react';

type ItemSizeParams = {
    itemHeight: number;
    columns?: number;
};

export function useFlatListOptimization<T>({
    itemHeight,
    columns = 1,
}: ItemSizeParams) {
    // Optimized getItemLayout function for FlatList
    const getItemLayout = useCallback(
        (_: ArrayLike<T> | null | undefined, index: number) => ({
            length: itemHeight,
            offset: itemHeight * Math.floor(index / columns),
            index,
        }),
        [itemHeight, columns]
    );

    // Default optimal settings for FlatList
    const optimizedProps = {
        removeClippedSubviews: true,
        maxToRenderPerBatch: 10,
        initialNumToRender: 8,
        windowSize: 5,
        updateCellsBatchingPeriod: 50,
        getItemLayout,
    };

    return optimizedProps;
} 