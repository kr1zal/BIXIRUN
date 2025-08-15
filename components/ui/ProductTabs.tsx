import { Ionicons } from '@expo/vector-icons';
import React, { memo, useState } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

// Типы для отзывов и спецификаций
export type ProductReview = {
    id: string;
    user: string;
    text: string;
    rating: number;
    date?: string;
};

export type ProductSpecification = Record<string, string | number>;

type TabType = 'description' | 'specifications' | 'reviews';

interface ProductTabsProps {
    description: string;
    specs: ProductSpecification;
    reviews?: ProductReview[];
}

const ProductTabs = ({ description, specs, reviews = [] }: ProductTabsProps) => {
    const [activeTab, setActiveTab] = useState<TabType>('description');

    // Безопасный парсинг specs, если это строка
    let parsedSpecs: ProductSpecification = {};
    if (typeof specs === 'string') {
        try {
            parsedSpecs = JSON.parse(specs);
        } catch (e) {
            console.error("Failed to parse product specs:", e);
        }
    } else if (typeof specs === 'object' && specs !== null) {
        parsedSpecs = specs;
    }


    // Перевод названий табов для отображения
    const tabNames: Record<TabType, string> = {
        description: 'Описание',
        specifications: 'Характеристики',
        reviews: 'Отзывы',
    };

    // Обработчик переключения табов
    const handleTabChange = (tab: TabType) => {
        setActiveTab(tab);
    };

    // Рендер звездного рейтинга
    const renderRating = (rating: number, maxRating: number = 5) => {
        const stars = [];
        for (let i = 1; i <= maxRating; i++) {
            stars.push(
                <Ionicons
                    key={i}
                    name={i <= rating ? 'star' : 'star-outline'}
                    size={16}
                    color={i <= rating ? '#FFC107' : '#BDBDBD'}
                    style={{ marginRight: 2 }}
                />
            );
        }
        return <View style={{ flexDirection: 'row' }}>{stars}</View>;
    };

    // Рендер содержимого в зависимости от активного таба
    const renderTabContent = () => {
        switch (activeTab) {
            case 'description':
                return (
                    <View style={styles.tabContent}>
                        <Text style={styles.descriptionText}>{description}</Text>
                    </View>
                );

            case 'specifications':
                return (
                    <View style={styles.tabContent}>
                        {Object.entries(parsedSpecs).map(([key, value], index) => (
                            <View key={index} style={styles.specRow}>
                                <Text style={styles.specName}>{key}</Text>
                                <Text style={styles.specValue}>{value}</Text>
                            </View>
                        ))}
                    </View>
                );

            case 'reviews':
                return (
                    <View style={styles.tabContent}>
                        {reviews.length > 0 ? (
                            <FlatList
                                data={reviews}
                                keyExtractor={(item) => item.id}
                                renderItem={({ item }) => (
                                    <View style={styles.reviewItem}>
                                        <View style={styles.reviewHeader}>
                                            <Text style={styles.reviewUser}>{item.user}</Text>
                                            {item.date && <Text style={styles.reviewDate}>{item.date}</Text>}
                                        </View>
                                        {renderRating(item.rating)}
                                        <Text style={styles.reviewText}>{item.text}</Text>
                                    </View>
                                )}
                                scrollEnabled={false}
                            />
                        ) : (
                            <Text style={styles.noReviews}>Нет отзывов</Text>
                        )}
                    </View>
                );
        }
    };

    return (
        <View style={styles.container}>
            {/* Tabs header */}
            <View style={styles.tabsHeader}>
                {(Object.keys(tabNames) as TabType[]).map((tab) => (
                    <TouchableOpacity
                        key={tab}
                        style={[styles.tabButton, activeTab === tab && styles.activeTabButton]}
                        onPress={() => handleTabChange(tab)}
                    >
                        <Text style={[styles.tabButtonText, activeTab === tab && styles.activeTabButtonText]}>
                            {tabNames[tab]} {tab === 'reviews' && reviews.length > 0 && `(${reviews.length})`}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Tab content */}
            {renderTabContent()}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 16,
        paddingBottom: 16, // Добавим отступ снизу для красоты
    },
    tabsHeader: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
        marginBottom: 16,
        marginHorizontal: -16, // Компенсируем padding родителя
        paddingHorizontal: 16, // Возвращаем padding для содержимого
    },
    tabButton: {
        paddingVertical: 10,
        paddingHorizontal: 16,
        marginRight: 8,
    },
    activeTabButton: {
        borderBottomWidth: 2,
        borderBottomColor: '#1976d2',
    },
    tabButtonText: {
        color: '#757575',
        fontWeight: '500',
    },
    activeTabButtonText: {
        color: '#1976d2',
        fontWeight: 'bold',
    },
    tabContent: {
        paddingBottom: 20,
    },
    // Description styles
    descriptionText: {
        fontSize: 15,
        lineHeight: 22,
        color: '#424242',
    },
    // Specifications styles
    specRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        borderBottomWidth: 1,
        borderBottomColor: '#EEEEEE',
        paddingVertical: 10,
    },
    specName: {
        fontSize: 14,
        color: '#757575',
        flex: 1,
    },
    specValue: {
        fontSize: 14,
        color: '#212121',
        flex: 2,
        fontWeight: '500',
    },
    // Reviews styles
    reviewItem: {
        marginBottom: 16,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#EEEEEE',
    },
    reviewHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 4,
    },
    reviewUser: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#424242',
    },
    reviewDate: {
        fontSize: 12,
        color: '#9E9E9E',
    },
    reviewText: {
        fontSize: 14,
        marginTop: 8,
        color: '#424242',
        lineHeight: 20,
    },
    noReviews: {
        fontSize: 14,
        color: '#9E9E9E',
        fontStyle: 'italic',
    },
});

// Используем memo для оптимизации производительности
export default memo(ProductTabs); 