import { store } from '@/app/store';
import React, { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Provider } from 'react-redux';
import CartInitializer from './CartInitializer';
import { FooterNavigation } from './FooterNavigation';

type AppLayoutProps = {
    children: React.ReactNode;
};

// Memoize the AppLayout to prevent unnecessary re-renders
export const AppLayout = memo(({ children }: AppLayoutProps) => {
    const insets = useSafeAreaInsets();

    return (
        <Provider store={store}>
            <GestureHandlerRootView style={{ flex: 1 }}>
                <View style={styles.container}>
                    <CartInitializer />
                    {children}
                    <FooterNavigation />
                </View>
            </GestureHandlerRootView>
        </Provider>
    );
});

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
}); 