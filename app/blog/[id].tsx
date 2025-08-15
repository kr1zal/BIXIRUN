import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useCallback } from 'react';
import {
    ActivityIndicator,
    Linking,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import MarkdownDisplay from 'react-native-markdown-display';
import OptimizedImage from '../../components/ui/OptimizedImage';
import { RootState } from '../../store';
import { useAppSelector } from '../../store/hooks';
import { selectArticleById } from '../../store/slices/contentSlice';

export default function BlogArticleScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const article = useAppSelector((state: RootState) =>
        selectArticleById(state, id as string)
    );

    const handleLinkPress = useCallback((url: string): boolean => {
        // Проверяем, является ли ссылка внутренней (начинается с /)
        if (url.startsWith('/')) {
            router.replace(url as any);
            return true; // Сообщаем, что мы обработали ссылку
        }

        // Для внешних ссылок используем стандартное поведение
        Linking.openURL(url);
        return false;
    }, [router]);

    if (!article) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator />
                <Text>Article not found or loading...</Text>
            </View>
        );
    }

    // Очищаем Markdown от лишних пробелов в начале каждой строки
    const cleanedMarkdown = article.content_markdown
        .split('\n')
        .map(line => line.trim())
        .join('\n');

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
            <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/blog')} style={styles.backButton}>
                <Ionicons name="arrow-back" size={24} color="#333" />
            </TouchableOpacity>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                {article.cover_image_url && (
                    <OptimizedImage
                        source={{ uri: article.cover_image_url }}
                        style={styles.articleImage}
                        contentFit="cover"
                    />
                )}
                <View style={styles.contentBlock}>
                    <Text style={styles.articleTitle}>{article.title}</Text>
                    <MarkdownDisplay
                        onLinkPress={handleLinkPress}
                        style={markdownStyles}
                    >
                        {cleanedMarkdown}
                    </MarkdownDisplay>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    backButton: {
        position: 'absolute',
        top: 50,
        left: 15,
        zIndex: 10,
        backgroundColor: 'rgba(255, 255, 255, 0.7)',
        borderRadius: 20,
        padding: 8,
    },
    scrollContent: {
        paddingBottom: 40,
    },
    articleImage: {
        width: '100%',
        height: 250,
    },
    contentBlock: {
        padding: 20,
    },
    articleTitle: {
        fontSize: 26,
        fontWeight: 'bold',
        marginBottom: 20,
        color: '#333',
        lineHeight: 34,
    },
    articleContent: {
        fontSize: 16,
        lineHeight: 26,
        color: '#444',
    }
});

const markdownStyles = StyleSheet.create({
    heading1: {
        fontSize: 24,
        fontWeight: 'bold',
        marginTop: 20,
        marginBottom: 10,
        color: '#333',
    },
    heading2: {
        fontSize: 22,
        fontWeight: 'bold',
        marginTop: 18,
        marginBottom: 8,
        color: '#333',
    },
    heading3: {
        fontSize: 20,
        fontWeight: 'bold',
        marginTop: 16,
        marginBottom: 6,
        color: '#333',
    },
    body: {
        fontSize: 16,
        lineHeight: 26,
        color: '#444',
    },
    link: {
        color: '#1976d2',
        textDecorationLine: 'underline',
    },
    list_item: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 8,
    },
    bullet_list_icon: {
        marginRight: 10,
        color: '#333',
        lineHeight: 26,
    },
    blockquote: {
        backgroundColor: '#f5f5f5',
        padding: 15,
        borderRadius: 8,
        borderLeftWidth: 4,
        borderLeftColor: '#ccc',
        marginVertical: 10,
    }
}); 