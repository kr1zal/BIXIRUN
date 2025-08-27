import { store } from '../store';
import { usePathname } from 'expo-router';
import React, { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Provider } from 'react-redux';
import { AuthProvider } from './AuthProvider';
import CartInitializer from './CartInitializer';
import { FooterNavigation } from './FooterNavigation';
import { Perf } from '../utils/perf';

type AppLayoutProps = {
    children: React.ReactNode;
};

// Memoize the AppLayout to prevent unnecessary re-renders
export const AppLayout = memo(({ children }: AppLayoutProps) => {
    const _insets = useSafeAreaInsets();
    const pathname = usePathname();

    React.useEffect(() => {
        if (__DEV__) Perf.markPathFocus(pathname);
        // сброс статуса навигации после фокуса
        if (__DEV__) Perf.resetIfDone(pathname);
    }, [pathname]);

    // Показываем таббар везде, кроме таймера и его вложенных экранов
    const hideRoutes = ['/timerWorkout', '/checkout'];
    const showTabBar = !hideRoutes.some((p) => pathname.startsWith(p));

    return (
        <Provider store={store}>
            <AuthProvider>
                <GestureHandlerRootView style={{ flex: 1 }}>
                    <View style={styles.container} onLayout={() => { if (__DEV__) Perf.markFirstLayout(pathname); }}>
                        <CartInitializer />
                        {children}
                        {showTabBar && <FooterNavigation />}
                    </View>
                </GestureHandlerRootView>
            </AuthProvider>
        </Provider>
    );
});

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
}); 