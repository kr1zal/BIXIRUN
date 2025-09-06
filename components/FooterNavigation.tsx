import { Ionicons } from '@expo/vector-icons';
import { usePathname, useRouter } from 'expo-router';
import React, { memo, useCallback } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';
import { selectCartItemsCount } from '../store/slices/cartSlice';
import { Perf } from '../utils/perf';

// Define types for our tab items
type TabIconName = 'home' | 'pricetags' | 'timer' | 'book' | 'cart' | 'person-circle';
type TabPath = '/main' | '/products' | '/timer' | '/blog' | '/cart' | '/profile' | '/';

// Define tab configuration
const tabs = [
    { path: '/main' as TabPath, icon: 'home' as TabIconName, label: 'Главная', fallbackPaths: ['/'] },
    { path: '/products' as TabPath, icon: 'pricetags' as TabIconName, label: 'Каталог' },
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
        accessibilityRole="tab"
        accessibilityState={{ selected: active }}
        accessibilityLabel={label}
    >
        <View style={styles.tabContent}>
            <View style={styles.iconContainer}>
                <Ionicons
                    name={icon}
                    size={24}
                    color={active ? "#000" : "#666"}
                />
                {badge ? (
                    <View style={styles.badge}>
                        <Text style={styles.badgeText}>
                            {badge > 99 ? '99+' : badge}
                        </Text>
                    </View>
                ) : null}
            </View>
            <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{label}</Text>
        </View>
    </TouchableOpacity>
));

// Memoized FooterNavigation component
export const FooterNavigation = memo(() => {
    const router = useRouter();
    const pathname = usePathname();
    const insets = useSafeAreaInsets();

    // Получаем счетчик товаров из Redux
    const cartItemsCount = useSelector(selectCartItemsCount);

    // Check if a path is active
    const isActive = useCallback((tab: typeof tabs[0]) => {
        if (tab.path === '/blog') {
            // Активен только на /blog, но не на /blog/[id]
            return pathname === '/blog';
        }
        if (pathname === tab.path) return true;
        if (tab.fallbackPaths?.includes(pathname)) return true;
        if (pathname.includes(tab.path) && tab.path !== '/') return true;
        return false;
    }, [pathname]);

    // Handle tab navigation
    const handleTabPress = useCallback((path: TabPath) => {
        if (__DEV__) Perf.markNavStart(path, pathname);
        // Для мгновенного отклика без накопления истории используем replace
        router.replace(path);
    }, [router, pathname]);

    return (
        <View style={[styles.footerBar, { paddingBottom: Math.max(insets.bottom - 10, 6) }]}>
            <View style={styles.footerRow}>
                {tabs.map((tab) => (
                    <TabButton
                        key={tab.path}
                        active={isActive(tab)}
                        icon={tab.icon}
                        label={tab.label}
                        onPress={() => handleTabPress(tab.path)}
                        badge={tab.path === '/cart' && Number(cartItemsCount) > 0 ? Number(cartItemsCount) : undefined}
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
        zIndex: 9999,
        elevation: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    footerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-around',
        paddingVertical: 8,
    },
    footerBtn: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 8,
        paddingVertical: 4,
    },
    tabContent: {
        alignItems: 'center',
        justifyContent: 'center'
    },
    tabLabel: {
        marginTop: 4,
        fontSize: 10,
        color: '#666',
    },
    tabLabelActive: {
        color: '#000',
        fontWeight: '600'
    },
    iconContainer: {
        position: 'relative',
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