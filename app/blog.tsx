import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

const mockArticles: { id: string; title: string; preview: string }[] = Array.from({ length: 10 }, (_, i) => ({
    id: i + '',
    title: `Статья ${i + 1}`,
    preview: 'Краткое описание статьи...'
}));

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
                    <TouchableOpacity style={styles.articleCard} onPress={() => router.replace(`/blog/${item.id}` as any)}>
                        <Text style={styles.articleTitle}>{item.title}</Text>
                        <Text style={styles.articlePreview}>{item.preview}</Text>
                    </TouchableOpacity>
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
    articleCard: { backgroundColor: '#f9f9f9', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#ececec', marginBottom: 8 },
    articleTitle: { fontSize: 15, fontWeight: 'bold', color: '#1976d2' },
    articlePreview: { fontSize: 13, color: '#555', marginTop: 4 },
}); 