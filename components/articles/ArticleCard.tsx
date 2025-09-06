import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ArticleItem } from '../../store/slices/contentSlice';
import OptimizedImage from '../ui/OptimizedImage';

interface ArticleCardProps {
    item: ArticleItem;
    onPress: () => void;
}

const ArticleCard = ({ item, onPress }: ArticleCardProps) => (
    <TouchableOpacity 
        style={styles.articleCard} 
        onPress={onPress} 
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel={`Читать статью: ${item.title}`}
        accessibilityHint="Нажмите для открытия полной статьи"
    >
        <View style={styles.articleImageContainer}>
            {item.cover_image_url ? (
                <OptimizedImage
                    source={{ uri: item.cover_image_url }}
                    style={styles.articleImage}
                    contentFit="cover"
                />
            ) : (
                <View style={styles.articleImagePlaceholder} />
            )}
        </View>
        <View style={styles.articleTextBlock}>
            <Text style={styles.articleTitle} numberOfLines={2}>{item.title}</Text>
            <Text style={styles.articlePreview} numberOfLines={3}>{item.summary}</Text>
        </View>
    </TouchableOpacity>
);

const styles = StyleSheet.create({
    articleCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 4,
        overflow: 'hidden',
        flexDirection: 'column',
        height: 280,
        width: '100%',
        marginBottom: 16,
    },
    articleImageContainer: {
        width: '100%',
        height: '45%',
        backgroundColor: '#f5f5f5',
    },
    articleImage: {
        width: '100%',
        height: '100%',
    },
    articleImagePlaceholder: {
        width: '100%',
        height: '100%',
        backgroundColor: '#e5e7eb',
    },
    articleTextBlock: {
        flex: 1,
        padding: 16,
        justifyContent: 'space-between',
    },
    articleTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1a1a1a',
        marginBottom: 8,
        lineHeight: 22,
    },
    articlePreview: {
        fontSize: 14,
        color: '#6b7280',
        lineHeight: 20,
        marginBottom: 8,
    },
});

export default ArticleCard; 