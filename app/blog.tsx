import { useRouter } from 'expo-router';
import React from 'react';
import { Dimensions, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const mockArticles: { id: string; title: string; preview: string }[] = Array.from({ length: 10 }, (_, i) => ({
    id: i + '',
    title: `Статья ${i + 1}`,
    preview: 'Краткое описание статьи...'
}));

const SCREEN_WIDTH = Dimensions.get('window').width;
const GRID_MARGIN = 6;
const GRID_GAP = 8;
const GRID_CARD_WIDTH = (SCREEN_WIDTH - GRID_GAP * 3) / 2;
const GRID_CARD_HEIGHT = 230;
const ARTICLE_CARD_HEIGHT = GRID_CARD_HEIGHT * 1.5;

const ArticleCard = ({ item, onPress }: { item: { id: string; title: string; preview: string }; onPress: () => void }) => (
    <TouchableOpacity style={styles.articleCard} onPress={onPress} activeOpacity={0.85}>
        <View style={styles.articleImageContainer}>
            <View style={styles.articleImagePlaceholder} />
        </View>
        <View style={styles.articleTextBlock}>
            <Text style={styles.articleTitle}>{item.title}</Text>
            <Text style={styles.articlePreview}>{item.preview}</Text>
        </View>
    </TouchableOpacity>
);

export default function BlogScreen() {
    const router = useRouter();
    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
            <View style={styles.headerRow}>
                <Text style={styles.title}>Блог</Text>
            </View>
            <FlatList
                data={mockArticles}
                renderItem={({ item }) => (
                    <ArticleCard item={item} onPress={() => router.replace(`/blog/${item.id}` as any)} />
                )}
                keyExtractor={item => item.id}
                contentContainerStyle={{ padding: 12, gap: 12 }}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginHorizontal: 8, marginTop: 16, marginBottom: 8 },
    title: { fontSize: 22, fontWeight: 'bold', color: '#1976d2' },
    articleCard: {
        backgroundColor: '#fff',
        borderRadius: 8,
        padding: 0,
        width: GRID_CARD_WIDTH * 1.5,
        marginHorizontal: GRID_MARGIN,
        borderWidth: 1,
        borderColor: '#e0e0e0',
        overflow: 'hidden',
        flexDirection: 'column',
        height: ARTICLE_CARD_HEIGHT,
    },
    articleImageContainer: {
        width: '100%',
        height: ARTICLE_CARD_HEIGHT * 0.55,
        backgroundColor: '#f0f0f0',
        alignItems: 'center',
        justifyContent: 'center',
    },
    articleImagePlaceholder: {
        width: '80%',
        height: '80%',
        backgroundColor: '#e0e0e0',
        borderRadius: 8,
    },
    articleTextBlock: {
        flex: 1,
        padding: 16,
        justifyContent: 'center',
    },
    articleTitle: {
        fontSize: 17,
        fontWeight: 'bold',
        color: '#1976d2',
        marginBottom: 8,
    },
    articlePreview: {
        fontSize: 15,
        color: '#555',
        lineHeight: 22,
    },
}); 