import { useLocalSearchParams } from 'expo-router';
import React from 'react';
import { Dimensions, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';

const SCREEN_WIDTH = Dimensions.get('window').width;
const GRID_GAP = 8;
const GRID_CARD_WIDTH = (SCREEN_WIDTH - GRID_GAP * 3) / 2;
const GRID_CARD_HEIGHT = 230;
const ARTICLE_CARD_HEIGHT = GRID_CARD_HEIGHT * 1.5;

const mockArticles: { id: string; title: string; preview: string }[] = Array.from({ length: 10 }, (_, i) => ({
    id: i + '',
    title: `Статья ${i + 1}`,
    preview: 'Краткое описание статьи...'
}));

export default function BlogArticleScreen() {
    const { id } = useLocalSearchParams();
    const article = mockArticles.find(a => a.id === id);
    if (!article) {
        return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><Text>Статья не найдена</Text></View>;
    }
    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.articleImageContainer}>
                    <View style={styles.articleImagePlaceholder} />
                </View>
                <Text style={styles.articleTitle}>{article.title}</Text>
                <Text style={styles.articlePreview}>{article.preview}</Text>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    scrollContent: {
        padding: 24,
        alignItems: 'center',
    },
    articleImageContainer: {
        width: '100%',
        height: ARTICLE_CARD_HEIGHT * 0.7,
        backgroundColor: '#f0f0f0',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 12,
        marginBottom: 24,
    },
    articleImagePlaceholder: {
        width: '80%',
        height: '80%',
        backgroundColor: '#e0e0e0',
        borderRadius: 8,
    },
    articleTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#1976d2',
        marginBottom: 18,
        textAlign: 'center',
    },
    articlePreview: {
        fontSize: 16,
        color: '#555',
        lineHeight: 24,
        textAlign: 'center',
    },
}); 