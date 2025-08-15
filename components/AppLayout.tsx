import { store } from '../store/index.ts';
import { usePathname } from 'expo-router';
import React, { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Provider } from 'react-redux';
import { AuthProvider } from './AuthProvider.tsx';
import CartInitializer from './CartInitializer.tsx';
import { FooterNavigation } from './FooterNavigation.tsx';

type AppLayoutProps = {
    children: React.ReactNode;
};

// Memoize the AppLayout to prevent unnecessary re-renders
export const AppLayout = memo(({ children }: AppLayoutProps) => {
    const insets = useSafeAreaInsets();
    const pathname = usePathname();

    // TabBar скрыт на специальных страницах
    // Показываем таббар на главной всегда и после replace('/main')
    const hideTabBarRoutes = ['/timerWorkout', '/auth', '/splash', '/checkout'];
    const showTabBar = !hideTabBarRoutes.includes(pathname);

    return (
        <Provider store={store}>
            <AuthProvider>
                <GestureHandlerRootView style={{ flex: 1 }}>
                    <View style={styles.container}>
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