import React, { useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { fetchProducts } from '../store/slices/productsSlice';

const ProductCard = ({ item }: any) => (
    <View style={styles.card}>
        <Image
            source={item.images[0] ? { uri: item.images[0] } : require('../assets/placeholder.png')}
            style={styles.image}
            resizeMode="cover"
        />
        <Text style={styles.name}>{item.name}</Text>
        <View style={styles.priceRow}>
            <Text style={styles.price}>{item.price} ₽</Text>
            {item.old_price && (
                <Text style={styles.oldPrice}>{item.old_price} ₽</Text>
            )}
            {item.discount && (
                <Text style={styles.discount}>-{item.discount}%</Text>
            )}
        </View>
        <TouchableOpacity style={styles.cartBtn}>
            <Text style={styles.cartBtnText}>В корзину</Text>
        </TouchableOpacity>
    </View>
);

const MainScreen = () => {
    const dispatch = useAppDispatch();
    const { items, status, error } = useAppSelector(state => state.products);

    useEffect(() => {
        dispatch(fetchProducts());
    }, [dispatch]);

    if (status === 'loading') {
        return <View style={styles.center}><ActivityIndicator size="large" /></View>;
    }
    if (status === 'failed') {
        return <View style={styles.center}><Text style={styles.error}>{error || 'Ошибка загрузки'}</Text></View>;
    }
    if (!items.length) {
        return <View style={styles.center}><Text>Нет товаров</Text></View>;
    }

    return (
        <FlatList
            data={items}
            keyExtractor={item => item.id}
            renderItem={({ item }) => <ProductCard item={item} />}
            numColumns={2}
            contentContainerStyle={styles.list}
        />
    );
};

const styles = StyleSheet.create({
    center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    list: { padding: 8 },
    card: {
        flex: 1,
        backgroundColor: '#fff',
        margin: 8,
        borderRadius: 12,
        padding: 12,
        alignItems: 'center',
        elevation: 2,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 2 },
        minWidth: 160,
        maxWidth: '48%'
    },
    image: { width: 120, height: 120, borderRadius: 8, backgroundColor: '#eee' },
    name: { fontSize: 16, fontWeight: '600', marginVertical: 8, textAlign: 'center' },
    priceRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    price: { fontSize: 16, fontWeight: 'bold', color: '#222' },
    oldPrice: { fontSize: 14, color: '#aaa', textDecorationLine: 'line-through', marginLeft: 6 },
    discount: { fontSize: 14, color: '#e53935', marginLeft: 6 },
    cartBtn: { marginTop: 10, backgroundColor: '#222', borderRadius: 6, paddingVertical: 6, paddingHorizontal: 16 },
    cartBtnText: { color: '#fff', fontWeight: '600' },
    error: { color: '#e53935', fontSize: 16 }
});

export default MainScreen; 