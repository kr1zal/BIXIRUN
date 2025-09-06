import { selectCartItemsCount } from '../store/slices/cartSlice';
import { Ionicons } from '@expo/vector-icons';
import { Buffer } from 'buffer';
import * as ImagePicker from 'expo-image-picker';
import * as LocalAuthentication from 'expo-local-authentication';
import { Stack, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';
import OptimizedImage from '../components/ui/OptimizedImage';
import { RootState } from '../store';

// Supabase
import {
    signIn,
    signUp,
    supabase
} from '../supabaseClient';

// Timer presets sync
import { forceSyncWithCloud } from '../utils/timerStorage';

// Auth Provider
import { useAuth } from '../components/AuthProvider';

// Типы для компонентов авторизации
interface LoginScreenProps {
    email: string;
    setEmail: (email: string) => void;
    password: string;
    setPassword: (password: string) => void;
    showPassword: boolean;
    setShowPassword: (show: boolean) => void;
    handleSignIn: () => Promise<void>;
    loading: boolean;
    setMode: (mode: 'login' | 'register') => void;
    handleGoogleAuth: () => Promise<void>;
    handleBiometricAuth: () => Promise<void>;
}

interface RegisterScreenProps {
    email: string;
    setEmail: (email: string) => void;
    password: string;
    setPassword: (password: string) => void;
    showPassword: boolean;
    setShowPassword: (show: boolean) => void;
    username: string;
    setUsername: (username: string) => void;
    handleSignUp: () => Promise<void>;
    loading: boolean;
    setMode: (mode: 'login' | 'register') => void;
    handleGoogleAuth: () => Promise<void>;
}

// Компоненты для экранов авторизации
const LoginScreen = ({
    email,
    setEmail,
    password,
    setPassword,
    showPassword,
    setShowPassword,
    handleSignIn,
    loading,
    setMode,
    handleGoogleAuth,
    handleBiometricAuth
}: LoginScreenProps) => (
    <View style={styles.authContainer}>
        <View style={[styles.topWave, { backgroundColor: '#3498db' }]}>
            {/* Wave styling handled through the View background */}
        </View>

        <Text style={styles.authHeaderSmall}>Вход</Text>
        <Text style={styles.authHeader}>Вход</Text>

        <View style={styles.formContainer}>
            <View style={styles.inputContainer}>
                <Ionicons name="person-outline" size={20} color="#999" style={styles.inputIcon} />
                <TextInput
                    style={styles.input}
                    placeholder="Логин или Email"
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                />
            </View>

            <View style={styles.inputContainer}>
                <Ionicons name="lock-closed-outline" size={20} color="#999" style={styles.inputIcon} />
                <TextInput
                    style={styles.input}
                    placeholder="Пароль"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                />
                <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.eyeIcon}
                >
                    <Ionicons
                        name={showPassword ? "eye-off-outline" : "eye-outline"}
                        size={20}
                        color="#999"
                    />
                </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.forgotPasswordLink}>
                <Text style={styles.forgotPasswordText}>Забыли?</Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={styles.roundedButton}
                onPress={handleSignIn}
                disabled={loading}
            >
                {loading ? (
                    <ActivityIndicator size="small" color="#fff" />
                ) : (
                    <Ionicons name="arrow-forward" size={24} color="#fff" />
                )}
            </TouchableOpacity>

            <View style={styles.socialAuthContainer}>
                <TouchableOpacity
                    style={styles.socialAuthButton}
                    onPress={handleGoogleAuth}
                >
                    <Ionicons name="logo-google" size={24} color="#DB4437" />
                </TouchableOpacity>

                {Platform.OS === 'ios' && (
                    <TouchableOpacity
                        style={styles.socialAuthButton}
                        onPress={handleBiometricAuth}
                    >
                        <Ionicons name="finger-print" size={24} color="#000" />
                    </TouchableOpacity>
                )}
            </View>

            <View style={styles.switchModeContainer}>
                <TouchableOpacity onPress={() => setMode('register')}>
                    <Text style={styles.registerText}>Зарегистрироваться</Text>
                </TouchableOpacity>
            </View>
        </View>

        <View style={[styles.bottomWave, { backgroundColor: '#3498db' }]}>
            {/* Wave styling handled through the View background */}
        </View>
    </View>
);

const RegisterScreen = ({
    email,
    setEmail,
    password,
    setPassword,
    showPassword,
    setShowPassword,
    username,
    setUsername,
    handleSignUp,
    loading,
    setMode,
    handleGoogleAuth
}: RegisterScreenProps) => (
    <View style={styles.authContainer}>
        <View style={[styles.topWave, { backgroundColor: '#3498db' }]}>
            {/* Wave styling handled through the View background */}
        </View>

        <Text style={styles.authHeaderSmall}>Регистрация</Text>
        <Text style={styles.authHeader}>Регистрация</Text>

        <View style={styles.formContainer}>
            <View style={styles.inputContainer}>
                <Ionicons name="person-outline" size={20} color="#999" style={styles.inputIcon} />
                <TextInput
                    style={styles.input}
                    placeholder="Имя пользователя"
                    value={username}
                    onChangeText={setUsername}
                    autoCapitalize="none"
                />
            </View>

            <View style={styles.inputContainer}>
                <Ionicons name="lock-closed-outline" size={20} color="#999" style={styles.inputIcon} />
                <TextInput
                    style={styles.input}
                    placeholder="Пароль"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                />
                <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.eyeIcon}
                >
                    <Ionicons
                        name={showPassword ? "eye-off-outline" : "eye-outline"}
                        size={20}
                        color="#999"
                    />
                </TouchableOpacity>
            </View>

            <View style={styles.inputContainer}>
                <Ionicons name="mail-outline" size={20} color="#999" style={styles.inputIcon} />
                <TextInput
                    style={styles.input}
                    placeholder="Email"
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                />
            </View>

            <TouchableOpacity
                style={styles.roundedButtonCheck}
                onPress={handleSignUp}
                disabled={loading}
            >
                {loading ? (
                    <ActivityIndicator size="small" color="#fff" />
                ) : (
                    <Ionicons name="checkmark" size={24} color="#fff" />
                )}
            </TouchableOpacity>

            <View style={styles.socialAuthContainer}>
                <TouchableOpacity
                    style={styles.socialAuthButton}
                    onPress={handleGoogleAuth}
                >
                    <Ionicons name="logo-google" size={24} color="#DB4437" />
                </TouchableOpacity>
            </View>

            <View style={styles.switchModeContainer}>
                <TouchableOpacity onPress={() => setMode('login')}>
                    <Text style={styles.loginText}>Войти</Text>
                </TouchableOpacity>
            </View>
        </View>

        <View style={[styles.bottomWave, { backgroundColor: '#3498db' }]}>
            {/* Wave styling handled through the View background */}
        </View>
    </View>
);

export default function ProfileScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const [loading, setLoading] = useState(false);
    const [syncing, setSyncing] = useState(false);
    const [email, setEmail] = useState('');
    const [username, setUsername] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [mode, setMode] = useState<'login' | 'register'>('login');
    const [profileImage, setProfileImage] = useState<string | null>(null);
    const [isEditingName, setIsEditingName] = useState(false);

    // Используем AuthProvider вместо локального состояния
    const { session, user, loading: authLoading, signOut: authSignOut } = useAuth();

    // Проверяем биометрическую аутентификацию
    const [isBiometricSupported, setIsBiometricSupported] = useState(false);

    const cartItemsCount = useSelector(selectCartItemsCount);
    // Статьи из Redux для блока «Прочитанные статьи»
    const articles = useSelector((state: RootState) => (state as any).articles?.items || []);

    // Получаем товары из Redux
    const products = useSelector((state: RootState) => state.products.items);
    const recentProducts = products.slice(0, 4); // пока просто первые 4 товара

    // Функция для склонения слова "товар"
    const getItemsCountText = (count: number) => {
        if (count === 0) return 'товаров';
        if (count === 1) return 'товар';
        if (count >= 2 && count <= 4) return 'товара';
        return 'товаров';
    };

    useEffect(() => {
        (async () => {
            const compatible = await LocalAuthentication.hasHardwareAsync();
            setIsBiometricSupported(compatible);
        })();
    }, []);

    // Обновляем displayName и profileImage когда пользователь меняется
    useEffect(() => {
        if (user) {
            setDisplayName(user.user_metadata?.name || user.email?.split('@')[0] || 'Пользователь');
            setProfileImage(user.user_metadata?.avatar_url || null);
        }
    }, [user]);

    // Функция для входа в аккаунт
    const handleSignIn = async () => {
        try {
            if (!email || !password) {
                Alert.alert('Ошибка', 'Пожалуйста, введите email и пароль');
                return;
            }

            setLoading(true);
            await signIn(email, password);
            setPassword('');
        } catch (error: any) {
            Alert.alert('Ошибка входа', error.message || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    // Функция для регистрации
    const handleSignUp = async () => {
        try {
            if (!email || !password || !username) {
                Alert.alert('Ошибка', 'Пожалуйста, заполните все поля');
                return;
            }

            setLoading(true);
            await signUp(email, password);
            setPassword('');
        } catch (error: any) {
            Alert.alert('Ошибка регистрации', error.message || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    // Функция для выхода из аккаунта
    const handleSignOut = async () => {
        try {
            await authSignOut();
            Alert.alert('Успех', 'Вы вышли из аккаунта');
        } catch (error: any) {
            Alert.alert('Ошибка выхода', error.message);
        }
    };

    // Функция для синхронизации пресетов таймера
    const handleSyncTimerPresets = async () => {
        try {
            if (!user) {
                Alert.alert('Ошибка', 'Для синхронизации необходимо войти в аккаунт');
                return;
            }

            setSyncing(true);
            const updatedPresets = await forceSyncWithCloud(true);
            Alert.alert(
                'Синхронизация завершена',
                `Успешно синхронизировано ${updatedPresets.length} пресетов таймера`
            );
        } catch (error: any) {
            Alert.alert('Ошибка синхронизации', error.message);
        } finally {
            setSyncing(false);
        }
    };

    // Функция для аутентификации через Google
    const handleGoogleAuth = async () => {
        try {
            setLoading(true);
            Alert.alert('Google Auth', 'Google Authentication is not implemented yet');
            // Здесь будет код для аутентификации через Google
        } catch (error: any) {
            Alert.alert('Ошибка аутентификации', error.message);
        } finally {
            setLoading(false);
        }
    };

    // Функция для биометрической аутентификации
    const handleBiometricAuth = async () => {
        try {
            if (!isBiometricSupported) {
                Alert.alert('Ошибка', 'Биометрическая аутентификация не поддерживается на этом устройстве');
                return;
            }

            setLoading(true);

            // Проверяем, зарегистрирована ли биометрия
            const savedBiometrics = await LocalAuthentication.isEnrolledAsync();
            if (!savedBiometrics) {
                Alert.alert('Ошибка', 'На устройстве не настроена биометрическая аутентификация');
                setLoading(false);
                return;
            }

            // Выполняем аутентификацию
            const biometricAuth = await LocalAuthentication.authenticateAsync({
                promptMessage: 'Войти с помощью биометрии',
                disableDeviceFallback: true,
            });

            if (biometricAuth.success) {
                // Здесь должна быть логика входа через сохраненные данные
                Alert.alert('Успех', 'Биометрическая аутентификация выполнена успешно');
                // Для реального использования: восстановить сохраненные данные авторизации
            } else {
                Alert.alert('Ошибка', 'Биометрическая аутентификация не выполнена');
            }
        } catch (error: any) {
            Alert.alert('Ошибка биометрической аутентификации', error.message);
        } finally {
            setLoading(false);
        }
    };

    // Функция для выбора изображения из галереи
    const pickImage = async () => {
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
                base64: true,
            });

            if (!result.canceled && result.assets && result.assets.length > 0) {
                try {
                    setLoading(true);
                    const imageUri = result.assets[0].uri;
                    const base64Data = result.assets[0].base64;

                    if (!base64Data) {
                        throw new Error('Не удалось получить данные изображения');
                    }

                    // Временно устанавливаем локальное изображение для быстрого отображения
                    setProfileImage(imageUri);

                    if (!user?.id) {
                        throw new Error('Пользователь не авторизован');
                    }

                    // Генерируем уникальное имя файла
                    const fileName = `${Date.now()}.jpg`;
                    // Используем user.id как папку для хранения аватара
                    const filePath = `${user.id}/${fileName}`;

                    console.log('Загрузка файла:', {
                        path: filePath,
                        size: base64Data.length,
                        userID: user.id
                    });

                    // Конвертируем base64 в бинарные данные
                    const bufferData = Buffer.from(base64Data, 'base64');

                    // Загружаем в Supabase Storage в бакет avatars
                    const { data, error } = await supabase.storage
                        .from('avatars')
                        .upload(filePath, bufferData, {
                            contentType: 'image/jpeg',
                            upsert: true
                        });

                    if (error) {
                        throw error;
                    }

                    console.log('Файл загружен:', data);

                    // Получаем публичный URL загруженного файла
                    const { data: urlData } = supabase.storage
                        .from('avatars')
                        .getPublicUrl(filePath);

                    const publicUrl = urlData.publicUrl;
                    console.log('Public URL:', publicUrl);

                    // Обновляем профиль пользователя с новым URL аватара
                    const { error: updateError } = await supabase.auth.updateUser({
                        data: { avatar_url: publicUrl }
                    });

                    if (updateError) {
                        throw updateError;
                    }

                    // Обновляем локальное состояние
                    setProfileImage(publicUrl);

                    Alert.alert('Успешно', 'Фото профиля обновлено');
                } catch (error: any) {
                    console.error('Error uploading image:', error);
                    Alert.alert(
                        'Ошибка загрузки',
                        `Не удалось загрузить фото: ${error.message || 'Неизвестная ошибка'}`
                    );

                    // Сбрасываем временное изображение в случае ошибки
                    if (user) {
                        setProfileImage(user.user_metadata?.avatar_url || null);
                    }
                } finally {
                    setLoading(false);
                }
            }
        } catch (error: any) {
            Alert.alert('Ошибка', 'Не удалось загрузить фото');
            console.error('Error picking image:', error);
        }
    };

    // Функция для обновления имени пользователя
    const updateDisplayName = async () => {
        try {
            if (!user) {
                return;
            }

            setLoading(true);

            // Обновляем имя пользователя через Supabase
            const { error } = await supabase.auth.updateUser({
                data: { name: displayName }
            });

            if (error) {
                throw error;
            }

            Alert.alert('Успешно', 'Имя пользователя обновлено');
            setIsEditingName(false);
        } catch (error: any) {
            Alert.alert('Ошибка', 'Не удалось обновить имя пользователя');
            console.error('Error updating display name:', error);
        } finally {
            setLoading(false);
        }
    };

    // Переход в корзину
    const goToCart = () => {
        router.replace('/cart');
    };

    // Показываем загрузку пока проверяется сессия
    if (authLoading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                    <ActivityIndicator size="large" color="#0080FF" />
                    <Text style={{ marginTop: 16, color: '#666' }}>Проверка сессии...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
            <Stack.Screen
                options={{
                    headerShown: false,
                }}
            />

            <ScrollView contentContainerStyle={[styles.scrollContainer, { paddingBottom: Math.max(0, insets.bottom + 4) }]}>
                {user ? (
                    // Пользователь авторизован - отображаем профиль
                    <View style={styles.userContainer}>
                        <View style={styles.userInfoCard}>
                            <TouchableOpacity onPress={pickImage} style={styles.photoContainer}>
                                {profileImage ? (
                                    <OptimizedImage
                                        source={{ uri: profileImage }}
                                        style={styles.profileImage}
                                        contentFit="cover"
                                        priority="high"
                                    />
                                ) : (
                                    <Ionicons name="person-circle" size={80} color="#2196f3" />
                                )}
                                <View style={styles.editIconContainer}>
                                    <Ionicons name="camera" size={20} color="#fff" />
                                </View>
                            </TouchableOpacity>

                            {isEditingName ? (
                                <View style={styles.nameEditContainer}>
                                    <TextInput
                                        style={styles.nameInput}
                                        value={displayName}
                                        onChangeText={setDisplayName}
                                        autoFocus
                                    />
                                    <TouchableOpacity onPress={updateDisplayName} style={styles.saveNameButton}>
                                        <Ionicons name="checkmark" size={20} color="#fff" />
                                    </TouchableOpacity>
                                </View>
                            ) : (
                                <View style={styles.nameContainer}>
                                    <Text style={styles.nameText}>{displayName}</Text>
                                    <TouchableOpacity onPress={() => setIsEditingName(true)}>
                                        <Ionicons name="create-outline" size={20} color="#666" />
                                    </TouchableOpacity>
                                </View>
                            )}

                            <Text style={styles.emailText}>{user?.email || 'Email не указан'}</Text>
                        </View>

                        <View style={styles.statsContainer}>
                            <TouchableOpacity style={styles.statItem} onPress={goToCart}>
                                <Ionicons name="cart-outline" size={28} color="#2196f3" />
                                <Text style={styles.statValue}>Корзина</Text>
                                <Text style={styles.statLabel}>{cartItemsCount} {getItemsCountText(cartItemsCount)}</Text>
                            </TouchableOpacity>

                            <View style={styles.statItem}>
                                <Ionicons name="bag-check-outline" size={28} color="#4CAF50" />
                                <Text style={styles.statValue}>Покупки</Text>
                                <Text style={styles.statLabel}>2 заказа</Text>
                            </View>

                            <View style={styles.statItem}>
                                <Ionicons name="newspaper-outline" size={28} color="#FF9800" />
                                <Text style={styles.statValue}>Мои статьи</Text>
                                <Text style={styles.statLabel}>1</Text>
                            </View>
                        </View>

                        <View style={[styles.section, { paddingVertical: 8, marginBottom: 10 }]}
                        >
                            <Text style={styles.sectionTitle}>Недавно просмотренные</Text>
                            <ScrollView
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                contentContainerStyle={styles.recentProductsContainer}
                            >
                                {recentProducts.map((item: { id: string | number; slug: string; name: string; price: number; images?: string[] }) => (
                                    <TouchableOpacity key={item.id} style={styles.recentProductCard} activeOpacity={0.85} onPress={() => router.push(`/product/${item.slug}`)}>
                                        {item.images && item.images[0] ? (
                                            <OptimizedImage
                                                source={{ uri: item.images[0] }}
                                                style={styles.productImagePlaceholder}
                                                contentFit="cover"
                                                priority="low"
                                                width={110}
                                                height={110}
                                            />
                                        ) : (
                                            <View style={styles.productImagePlaceholder} />
                                        )}
                                        <Text style={styles.productName} numberOfLines={1} ellipsizeMode="tail">{item.name}</Text>
                                        <Text style={styles.productPrice}>{item.price} ₽</Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>

                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Прочитанные статьи</Text>
                            {(articles || []).slice(0, 3).map((article: any) => (
                                <TouchableOpacity key={article.id} style={styles.articleCard} onPress={() => router.push(`/blog/${article.id}`)}>
                                    <Text style={styles.articleTitle} numberOfLines={2}>{article.title}</Text>
                                    {article.summary ? (
                                        <Text style={styles.articleDescription} numberOfLines={2}>
                                            {article.summary}
                                        </Text>
                                    ) : null}
                                </TouchableOpacity>
                            ))}
                        </View>

                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Синхронизация</Text>

                            <View style={styles.syncContainer}>
                                <View style={styles.syncInfo}>
                                    <Text style={styles.syncTitle}>Пресеты таймера</Text>
                                    <Text style={styles.syncDescription}>
                                        Синхронизируйте пресеты таймера между устройствами
                                    </Text>
                                </View>

                                {syncing ? (
                                    <ActivityIndicator size="small" color="#2196f3" />
                                ) : (
                                    <TouchableOpacity
                                        style={styles.syncButton}
                                        onPress={handleSyncTimerPresets}
                                    >
                                        <Ionicons name="sync" size={20} color="#fff" />
                                    </TouchableOpacity>
                                )}
                            </View>
                        </View>

                        <View style={[styles.section, { marginBottom: 0 }]}>
                            <TouchableOpacity
                                onPress={() => router.push('/about')}
                                activeOpacity={0.85}
                                style={styles.row}
                            >
                                <Ionicons name="information-circle-outline" size={20} color="#333" />
                                <Text style={styles.rowText}>О приложении</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={() => {
                                    // Подтверждение удаления аккаунта
                                    if (!user) return;
                                    Alert.alert(
                                        'Удалить аккаунт',
                                        'Вы уверены, что хотите удалить аккаунт? Это действие необратимо.',
                                        [
                                            { text: 'Нет', style: 'cancel' },
                                            {
                                                text: 'Да',
                                                style: 'destructive',
                                                onPress: async () => {
                                                    try {
                                                        setLoading(true);
                                                        // Вызов API удаления аккаунта на бэкенде здесь
                                                        // await api.deleteAccount();
                                                        await authSignOut();
                                                        Alert.alert('Готово', 'Ваш аккаунт будет удалён в ближайшее время');
                                                    } catch (e: any) {
                                                        Alert.alert('Ошибка', e?.message || 'Не удалось удалить аккаунт');
                                                    } finally {
                                                        setLoading(false);
                                                    }
                                                },
                                            },
                                        ],
                                    );
                                }}
                                activeOpacity={0.85}
                                style={styles.row}
                            >
                                <Ionicons name="trash-outline" size={20} color="#FF5252" />
                                <Text style={[styles.rowText, { color: '#FF5252' }]}>Удалить аккаунт</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={handleSignOut}
                                activeOpacity={0.85}
                                style={styles.destructiveRow}
                            >
                                <Ionicons name="log-out-outline" size={20} color="#FF5252" />
                                <Text style={styles.destructiveText}>Выйти</Text>
                            </TouchableOpacity>
                        </View>

                        <View style={[styles.bottomSpacer, { height: Math.max(0, insets.bottom + 6) }]} />
                    </View>
                ) : (
                    // Пользователь не авторизован - показываем экран авторизации
                    <>
                        {mode === 'login' ? (
                            <LoginScreen
                                email={email}
                                setEmail={setEmail}
                                password={password}
                                setPassword={setPassword}
                                showPassword={showPassword}
                                setShowPassword={setShowPassword}
                                handleSignIn={handleSignIn}
                                loading={loading}
                                setMode={setMode}
                                handleGoogleAuth={handleGoogleAuth}
                                handleBiometricAuth={handleBiometricAuth}
                            />
                        ) : (
                            <RegisterScreen
                                email={email}
                                setEmail={setEmail}
                                password={password}
                                setPassword={setPassword}
                                showPassword={showPassword}
                                setShowPassword={setShowPassword}
                                username={username}
                                setUsername={setUsername}
                                handleSignUp={handleSignUp}
                                loading={loading}
                                setMode={setMode}
                                handleGoogleAuth={handleGoogleAuth}
                            />
                        )}
                    </>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    scrollContainer: {
        flexGrow: 1,
    },
    userContainer: {
        flex: 1,
        padding: 16,
    },
    userInfoCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 20,
        alignItems: 'center',
        marginBottom: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    photoContainer: {
        position: 'relative',
        marginBottom: 10,
    },
    profileImage: {
        width: 80,
        height: 80,
        borderRadius: 40,
    },
    editIconContainer: {
        position: 'absolute',
        right: -5,
        bottom: -5,
        backgroundColor: '#2196f3',
        borderRadius: 12,
        width: 24,
        height: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    nameContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    nameText: {
        fontSize: 20,
        fontWeight: 'bold',
        marginRight: 8,
    },
    nameEditContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    nameInput: {
        fontSize: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#2196f3',
        marginRight: 8,
        paddingHorizontal: 4,
        minWidth: 120,
        textAlign: 'center',
    },
    saveNameButton: {
        backgroundColor: '#2196f3',
        borderRadius: 12,
        width: 24,
        height: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emailText: {
        fontSize: 14,
        color: '#666',
    },
    userIdText: {
        fontSize: 14,
        color: '#666',
    },
    statsContainer: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        borderRadius: 12,
        marginBottom: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    statItem: {
        flex: 1,
        paddingVertical: 16,
        alignItems: 'center',
    },
    statValue: {
        fontSize: 16,
        fontWeight: 'bold',
        marginTop: 8,
    },
    statLabel: {
        fontSize: 12,
        color: '#666',
        marginTop: 4,
    },
    section: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 16,
    },
    recentProductsContainer: {
        paddingBottom: 8,
    },
    recentProductCard: {
        width: 110,
        marginRight: 16,
    },
    productImagePlaceholder: {
        width: 110,
        height: 110,
        backgroundColor: '#f0f0f0',
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    productImageText: {
        fontSize: 24,
        color: '#999',
    },
    productName: {
        fontSize: 14,
        fontWeight: '500',
    },
    productPrice: {
        fontSize: 14,
        color: '#2196f3',
        fontWeight: 'bold',
    },
    articleCard: {
        marginBottom: 16,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    articleTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 4,
        color: '#2196f3',
    },
    articleDescription: {
        fontSize: 14,
        color: '#666',
    },
    syncContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    syncInfo: {
        flex: 1,
    },
    syncTitle: {
        fontSize: 16,
        fontWeight: '500',
    },
    syncDescription: {
        fontSize: 14,
        color: '#666',
        marginTop: 4,
    },
    syncButton: {
        backgroundColor: '#2196f3',
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },
    destructiveRow: {
        height: 48,
        borderRadius: 8,
        backgroundColor: '#FFF',
        borderWidth: 1,
        borderColor: '#F0F0F0',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        gap: 8,
    },
    destructiveText: {
        color: '#FF5252',
        fontSize: 16,
        fontWeight: '600',
    },
    row: {
        height: 48,
        borderRadius: 8,
        backgroundColor: '#FFF',
        borderWidth: 1,
        borderColor: '#F0F0F0',
        alignItems: 'center',
        justifyContent: 'flex-start',
        flexDirection: 'row',
        gap: 8,
        paddingHorizontal: 12,
        marginBottom: 8,
    },
    rowText: {
        color: '#333',
        fontSize: 16,
        fontWeight: '600',
    },

    // Стили для экранов авторизации
    authContainer: {
        flex: 1,
        backgroundColor: '#fff',
        position: 'relative',
    },
    topWave: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 150,
    },
    bottomWave: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 150,
    },
    waveImage: {
        width: '100%',
        height: '100%',
    },
    authHeaderSmall: {
        fontSize: 16,
        color: '#FF7A59',
        marginTop: 60,
        marginLeft: 30,
    },
    authHeader: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#333',
        marginLeft: 30,
        marginBottom: 50,
    },
    formContainer: {
        paddingHorizontal: 30,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8F8F8',
        borderRadius: 30,
        paddingHorizontal: 20,
        height: 60,
        marginBottom: 20,
    },
    inputIcon: {
        marginRight: 12,
    },
    input: {
        flex: 1,
        fontSize: 16,
        color: '#333',
    },
    eyeIcon: {
        padding: 8,
    },
    forgotPasswordLink: {
        alignSelf: 'flex-end',
        marginBottom: 30,
    },
    forgotPasswordText: {
        color: '#999',
        fontSize: 14,
    },
    roundedButton: {
        backgroundColor: '#FF7A59',
        width: 60,
        height: 60,
        borderRadius: 30,
        alignItems: 'center',
        justifyContent: 'center',
        alignSelf: 'flex-end',
        shadowColor: '#FF7A59',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 8,
    },
    roundedButtonCheck: {
        backgroundColor: '#06B6D4',
        width: 60,
        height: 60,
        borderRadius: 30,
        alignItems: 'center',
        justifyContent: 'center',
        alignSelf: 'flex-end',
        shadowColor: '#06B6D4',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 8,
    },
    socialAuthContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 40,
        marginBottom: 20,
    },
    socialAuthButton: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#F8F8F8',
        alignItems: 'center',
        justifyContent: 'center',
        marginHorizontal: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    switchModeContainer: {
        alignItems: 'center',
        marginTop: 20,
    },
    registerText: {
        fontSize: 16,
        color: '#FF7A59',
        fontWeight: 'bold',
    },
    loginText: {
        fontSize: 16,
        color: '#06B6D4',
        fontWeight: 'bold',
    },

    // Обновляем стиль для отступа снизу
    bottomSpacer: {
        height: 40, // Уменьшаем высоту с 80 до 40
        marginBottom: 10, // Уменьшаем нижний отступ с 20 до 10
    },
}); 