import { store } from '@/app/store';
import { usePathname } from 'expo-router';
import React, { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Provider } from 'react-redux';
import { AuthProvider } from './AuthProvider';
import CartInitializer from './CartInitializer';
import { FooterNavigation } from './FooterNavigation';

type AppLayoutProps = {
    children: React.ReactNode;
};

// Memoize the AppLayout to prevent unnecessary re-renders
export const AppLayout = memo(({ children }: AppLayoutProps) => {
    const insets = useSafeAreaInsets();
    const pathname = usePathname();

    // TabBar скрыт на workout-экране
    const showTabBar = !pathname.startsWith('/timer/workout');

    return (
        <Provider store={store}>
            <AuthProvider>
                <GestureHandlerRootView style={{ flex: 1 }}>
                    <View style={styles.container}>
                        {/* DEBUG: выводим pathname поверх всего */}
                        <Text style={{ position: 'absolute', top: 2, right: 2, zIndex: 9999, fontSize: 10, color: '#888' }}>{pathname}</Text>
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