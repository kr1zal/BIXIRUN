import { useRouter } from 'expo-router';
import React from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { useAuth } from './AuthProvider';

interface ProtectedRouteProps {
    children: React.ReactNode;
    redirectTo?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
    children,
    redirectTo = '/auth'
}) => {
    const { user, loading } = useAuth();
    const router = useRouter();

    React.useEffect(() => {
        if (!loading && !user) {
            router.replace(redirectTo as any);
        }
    }, [user, loading, router, redirectTo]);

    if (loading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#0080FF" />
                <Text style={{ marginTop: 16, color: '#666' }}>Проверка авторизации...</Text>
            </View>
        );
    }

    if (!user) {
        return null; // Будет редирект
    }

    return <>{children}</>;
}; 