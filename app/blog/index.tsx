import { useRouter } from 'expo-router';
import React, { useCallback, useEffect } from 'react';
import {
    ActivityIndicator,
    FlatList,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import ArticleCard from '../../components/articles/ArticleCard';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { ArticleItem, fetchArticles } from '../../store/slices/contentSlice';

export default function BlogScreen() {
    const router = useRouter();
    const dispatch = useAppDispatch();
    const { items: articles, status } = useAppSelector(state => state.articles);

    useEffect(() => {
        if (status === 'idle') {
            dispatch(fetchArticles() as any);
        }
    }, [status, dispatch]);

    const renderItem = useCallback(
        ({ item }: { item: ArticleItem }) => {
            return (
                <ArticleCard
                    item={item}
                    onPress={() => router.push(`/blog/${item.id}`)}
                />
            );
        },
        [router]
    );

    if (status === 'loading' && articles.length === 0) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" />
            </View>
        );
    }

    if (status === 'failed') {
        return (
            <View style={styles.centered}>
                <Text>Не удалось загрузить статьи.</Text>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <FlatList
                data={articles}
                renderItem={renderItem}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.listContainer}
                refreshing={status === 'loading'}
                onRefresh={() => dispatch(fetchArticles() as any)}
                showsVerticalScrollIndicator={false}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f9fafb',
    },
    listContainer: {
        padding: 16,
        paddingBottom: 100, // Безопасный отступ для tab navigation
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
});