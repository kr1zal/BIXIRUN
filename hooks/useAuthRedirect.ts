import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { useAuth } from '../components/AuthProvider';

interface UseAuthRedirectOptions {
    requireAuth?: boolean;
    redirectTo?: string;
    redirectIfAuth?: string;
}

export const useAuthRedirect = ({
    requireAuth = false,
    redirectTo = '/auth',
    redirectIfAuth = '/main'
}: UseAuthRedirectOptions = {}) => {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (loading) return; // Ждем завершения проверки

        if (requireAuth && !user) {
            // Требуется авторизация, но пользователь не авторизован
            router.replace(redirectTo as any);
        } else if (!requireAuth && user && redirectIfAuth) {
            // Пользователь авторизован, но находится на странице для неавторизованных
            router.replace(redirectIfAuth as any);
        }
    }, [user, loading, requireAuth, redirectTo, redirectIfAuth, router]);

    return { user, loading };
}; 