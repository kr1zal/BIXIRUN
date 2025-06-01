import React from 'react';
import { View, Text, StyleSheet, FlatList, Image, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { RouteProp, useRoute } from '@react-navigation/native';

const { width } = Dimensions.get('window');

// Ожидаем, что product приходит через route.params
const ProductDetailScreen = () => {
    const route = useRoute<any>();
    const product = route.params?.product;

    if (!product) {
        return <View style={styles.center}><Text>Нет данных о товаре</Text></View>;
    }

    // specs может быть объектом
    const specs = product.specs && typeof product.specs === 'object' ? product.specs : {};

    return (
        <ScrollView style={styles.container}>
            {/* Галерея изображений */}
            <FlatList
                data={product.images}
                horizontal
                showsHorizontalScrollIndicator={false}
                keyExtractor={(_, idx) => idx.toString()}
                renderItem={({ item }) => (
                    <Image
                        source={{ uri: item }}
                        style={styles.image}
                        resizeMode="cover"
                        onError={() => { }}
                    />
                )}
                style={styles.gallery}
            />

            {/* Название и цена */}
            <Text style={styles.name}>{product.name}</Text>
            <View style={styles.priceRow}>
                <Text style={styles.price}>{product.price} ₽</Text>
                {product.old_price && (
                    <Text style={styles.oldPrice}>{product.old_price} ₽</Text>
                )}
                {product.discount && (
                    <Text style={styles.discount}>-{product.discount}%</Text>
                )}
            </View>

            {/* Описание */}
            <Text style={styles.sectionTitle}>Описание</Text>
            <Text style={styles.description}>{product.description || 'Нет описания'}</Text>

            {/* Характеристики */}
            <Text style={styles.sectionTitle}>Характеристики</Text>
            {Object.keys(specs).length ? (
                Object.entries(specs).map(([key, value]) => (
                    <View key={key} style={styles.specRow}>
                        <Text style={styles.specKey}>{key}:</Text>
                        <Text style={styles.specValue}>{String(value)}</Text>
                    </View>
                ))
            ) : (
                <Text style={styles.description}>Нет характеристик</Text>
            )}

            {/* Кнопка "В корзину" */}
            <TouchableOpacity style={styles.cartBtn}>
                <Text style={styles.cartBtnText}>В корзину</Text>
            </TouchableOpacity>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    gallery: { maxHeight: 260, marginBottom: 12 },
    image: { width: width, height: 260, backgroundColor: '#eee' },
    name: { fontSize: 22, fontWeight: '700', margin: 12 },
    priceRow: { flexDirection: 'row', alignItems: 'center', marginLeft: 12, gap: 8 },
    price: { fontSize: 20, fontWeight: 'bold', color: '#222' },
    oldPrice: { fontSize: 16, color: '#aaa', textDecorationLine: 'line-through', marginLeft: 8 },
    discount: { fontSize: 16, color: '#e53935', marginLeft: 8 },
    sectionTitle: { fontSize: 18, fontWeight: '600', marginTop: 18, marginLeft: 12 },
    description: { fontSize: 15, color: '#444', margin: 12, marginTop: 6 },
    specRow: { flexDirection: 'row', marginLeft: 12, marginBottom: 4 },
    specKey: { fontWeight: '500', width: 140 },
    specValue: { color: '#333', flex: 1 },
    cartBtn: { margin: 24, backgroundColor: '#222', borderRadius: 8, paddingVertical: 14, alignItems: 'center' },
    cartBtnText: { color: '#fff', fontWeight: '700', fontSize: 18 },
});

export default ProductDetailScreen; 