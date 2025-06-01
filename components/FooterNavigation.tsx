import React, { memo, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { selectCartItemsCount } from '../src/store/slices/cartSlice';
import { RootState } from '../src/store';

// Define types for our tab items
type TabIconName = 'home' | 'pricetags' | 'timer' | 'book' | 'cart' | 'person-circle';
type TabPath = '/main' | '/products' | '/timer' | '/blog' | '/cart' | '/profile' | '/';

// Define tab configuration
const tabs = [
    { path: '/main' as TabPath, icon: 'home' as TabIconName, label: 'Главная', fallbackPaths: ['/'] },
    { path: '/products' as TabPath, icon: 'pricetags' as TabIconName, label: 'Товары' },
    { path: '/timer' as TabPath, icon: 'timer' as TabIconName, label: 'Таймер' },
    { path: '/blog' as TabPath, icon: 'book' as TabIconName, label: 'Блог' },
    { path: '/cart' as TabPath, icon: 'cart' as TabIconName, label: 'Корзина' },
    { path: '/profile' as TabPath, icon: 'person-circle' as TabIconName, label: 'Профиль' }
];

type TabButtonProps = {
    active: boolean;
    icon: TabIconName;
    label: string;
    onPress: () => void;
    badge?: number;
};

// Memoized tab button component
const TabButton = memo(({ active, icon, label, onPress, badge }: TabButtonProps) => (
    <TouchableOpacity
        style={styles.footerBtn}
        onPress={onPress}
        activeOpacity={0.7}
    >
        <View style={styles.tabContent}>
            <View style={styles.iconContainer}>
                <Ionicons
                    name={icon}
                    size={20}
                    color={active ? "#F33" : "#333"}
                />
                {badge ? (
                    <View style={styles.badge}>
                        <Text style={styles.badgeText}>
                            {badge > 99 ? '99+' : badge}
                        </Text>
                    </View>
                ) : null}
            </View>
            <Text style={[styles.tabLabel, active && styles.activeTabLabel]}>
                {label}
            </Text>
        </View>
        {active && <View style={styles.activeIndicator} />}
    </TouchableOpacity>
));

// Memoized FooterNavigation component
export const FooterNavigation = memo(() => {
    const router = useRouter();
    const pathname = usePathname();

    // Получаем счетчик товаров из Redux
    const cartItemsCount = useSelector(selectCartItemsCount);

    // Check if a path is active
    const isActive = useCallback((tab: typeof tabs[0]) => {
        if (pathname === tab.path) return true;
        if (tab.fallbackPaths?.includes(pathname)) return true;
        if (pathname.includes(tab.path) && tab.path !== '/') return true;
        return false;
    }, [pathname]);

    // Handle tab navigation
    const handleTabPress = useCallback((path: TabPath) => {
        router.replace(path);
    }, [router]);

    return (
        <View style={styles.footerBar}>
            <View style={styles.footerRow}>
                {tabs.map((tab) => (
                    <TabButton
                        key={tab.path}
                        active={isActive(tab)}
                        icon={tab.icon}
                        label={tab.label}
                        onPress={() => handleTabPress(tab.path)}
                        badge={tab.path === '/cart' && cartItemsCount > 0 ? cartItemsCount : undefined}
                    />
                ))}
            </View>
        </View>
    );
});

const styles = StyleSheet.create({
    footerBar: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: '#FFFFFF',
        borderTopWidth: 1,
        borderTopColor: '#E0E0E0',
        zIndex: 100,
        elevation: 8,
        paddingBottom: 12
    },
    footerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-around',
        paddingTop: 8,
        paddingBottom: 0
    },
    footerBtn: {
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        paddingBottom: 2
    },
    tabContent: {
        alignItems: 'center',
        justifyContent: 'center'
    },
    iconContainer: {
        position: 'relative',
        marginBottom: 3
    },
    tabLabel: {
        fontSize: 10,
        color: '#333333'
    },
    activeTabLabel: {
        color: '#F33',
        fontWeight: 'bold'
    },
    activeIndicator: {
        position: 'absolute',
        bottom: -2,
        width: '100%',
        height: 2,
        backgroundColor: '#F33'
    },
    badge: {
        position: 'absolute',
        top: -6,
        right: -8,
        backgroundColor: '#F33',
        borderRadius: 8,
        minWidth: 16,
        height: 16,
        alignItems: 'center',
        justifyContent: 'center'
    },
    badgeText: {
        color: '#fff',
        fontSize: 9,
        fontWeight: 'bold',
        paddingHorizontal: 3
    }
}); 