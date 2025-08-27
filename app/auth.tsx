import { Ionicons } from '@expo/vector-icons';
import * as LocalAuthentication from 'expo-local-authentication';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    Image,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { useAuth } from '../components/AuthProvider';
import { signIn, signUp } from '../supabaseClient';

const { width } = Dimensions.get('window');

// Wave components for top and bottom decorative borders
const TopWave = () => (
    <View style={styles.waveContainer}>
        <Svg height="100" width={width} viewBox="0 0 1440 320">
            <Path
                fill="#FF8C00"
                d="M0,192L48,186.7C96,181,192,171,288,181.3C384,192,480,224,576,234.7C672,245,768,235,864,202.7C960,171,1056,117,1152,117.3C1248,117,1344,171,1392,197.3L1440,224L1440,0L1392,0C1344,0,1248,0,1152,0C1056,0,960,0,864,0C768,0,672,0,576,0C480,0,384,0,288,0C192,0,96,0,48,0L0,0Z"
            />
        </Svg>
    </View>
);

const BottomWave = () => (
    <View style={styles.bottomWaveContainer}>
        <Svg height="100" width={width} viewBox="0 0 1440 320">
            <Path
                fill="#0080FF"
                d="M0,64L48,69.3C96,75,192,85,288,117.3C384,149,480,203,576,208C672,213,768,171,864,149.3C960,128,1056,128,1152,149.3C1248,171,1344,213,1392,234.7L1440,256L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
            />
        </Svg>
    </View>
);

export default function AuthScreen() {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [isBiometricAvailable, setIsBiometricAvailable] = useState(false);
    const router = useRouter();
    const { user } = useAuth();

    // Если пользователь уже авторизован, редиректим на главную
    useEffect(() => {
        if (user) {
            router.replace('/main');
        }
    }, [user, router]);

    useEffect(() => {
        // Check if biometric authentication is available
        (async () => {
            const compatible = await LocalAuthentication.hasHardwareAsync();
            const enrolled = await LocalAuthentication.isEnrolledAsync();
            setIsBiometricAvailable(compatible && enrolled);
        })();
    }, []);

    const handleBiometricAuth = async () => {
        try {
            const result = await LocalAuthentication.authenticateAsync({
                promptMessage: 'Authenticate to continue',
                fallbackLabel: 'Use password'
            });

            if (result.success) {
                // Here you would normally validate with your backend
                // For demo purposes, we'll just navigate to main
                router.replace('/main');
            }
        } catch (error) {
            setError('Biometric authentication failed');
        }
    };

    const handleSignIn = async () => {
        setLoading(true);
        setError('');
        try {
            await signIn(email, password);
            // AuthProvider автоматически обновит состояние и произойдет редирект
        } catch (err: any) {
            setError(err.message || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    const handleSignUp = async () => {
        setLoading(true);
        setError('');

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            setLoading(false);
            return;
        }

        try {
            await signUp(email, password);
            // AuthProvider автоматически обновит состояние и произойдет редирект
        } catch (err: any) {
            setError(err.message || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleAuth = async () => {
        setLoading(true);
        setError('');
        try {
            // Implementation would go here
            // For now, show a placeholder message
            setError('Google authentication not implemented yet');
        } catch (err) {
            setError('An unexpected error occurred');
        } finally {
            setLoading(false);
        }
    };

    const toggleMode = () => {
        setIsLogin(!isLogin);
        setError('');
    };

    // Если пользователь уже авторизован, показываем загрузку
    if (user) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                    <ActivityIndicator size="large" color="#0080FF" />
                    <Text style={{ marginTop: 16, color: '#666' }}>Переход в приложение...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <TopWave />

            <KeyboardAvoidingView
                style={styles.contentContainer}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                >
                    <Image
                        source={require('../assets/images/logo-bixirun.png')}
                        style={styles.logo}
                        resizeMode="contain"
                    />

                    <Text style={styles.title}>
                        {isLogin ? 'Welcome Back' : 'Create Account'}
                    </Text>

                    <Text style={styles.subtitle}>
                        {isLogin
                            ? 'Sign in to access your BIXIRUN account'
                            : 'Sign up to start your fitness journey'}
                    </Text>

                    {error ? (
                        <View style={styles.errorContainer}>
                            <Ionicons name="alert-circle-outline" size={18} color="#d32f2f" />
                            <Text style={styles.errorText}>{error}</Text>
                        </View>
                    ) : null}

                    <View style={styles.formContainer}>
                        <View style={styles.inputContainer}>
                            <Ionicons name="mail-outline" size={20} color="#777" style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="Email"
                                value={email}
                                onChangeText={setEmail}
                                keyboardType="email-address"
                                autoCapitalize="none"
                                placeholderTextColor="#999"
                            />
                        </View>

                        <View style={styles.inputContainer}>
                            <Ionicons name="lock-closed-outline" size={20} color="#777" style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="Password"
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry
                                placeholderTextColor="#999"
                            />
                        </View>

                        {!isLogin && (
                            <View style={styles.inputContainer}>
                                <Ionicons name="lock-closed-outline" size={20} color="#777" style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Confirm Password"
                                    value={confirmPassword}
                                    onChangeText={setConfirmPassword}
                                    secureTextEntry
                                    placeholderTextColor="#999"
                                />
                            </View>
                        )}

                        <TouchableOpacity
                            style={styles.primaryButton}
                            onPress={isLogin ? handleSignIn : handleSignUp}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color="#fff" size="small" />
                            ) : (
                                <>
                                    <Ionicons
                                        name={isLogin ? "log-in-outline" : "person-add-outline"}
                                        size={20}
                                        color="#fff"
                                    />
                                    <Text style={styles.primaryButtonText}>
                                        {isLogin ? 'Sign In' : 'Sign Up'}
                                    </Text>
                                </>
                            )}
                        </TouchableOpacity>

                        <View style={styles.separator}>
                            <View style={styles.separatorLine} />
                            <Text style={styles.separatorText}>OR</Text>
                            <View style={styles.separatorLine} />
                        </View>

                        <TouchableOpacity
                            style={styles.socialButton}
                            onPress={handleGoogleAuth}
                        >
                            <Image
                                source={{ uri: 'https://upload.wikimedia.org/wikipedia/commons/5/53/Google_%22G%22_Logo.svg' }}
                                style={styles.socialIcon}
                            />
                            <Text style={styles.socialButtonText}>
                                Continue with Google
                            </Text>
                        </TouchableOpacity>

                        {isBiometricAvailable && Platform.OS === 'ios' && (
                            <TouchableOpacity
                                style={styles.biometricButton}
                                onPress={handleBiometricAuth}
                            >
                                <Ionicons name="finger-print-outline" size={22} color="#0080FF" />
                                <Text style={styles.biometricButtonText}>
                                    {Platform.OS === 'ios' ? 'Use Face ID' : 'Use Fingerprint'}
                                </Text>
                            </TouchableOpacity>
                        )}
                    </View>

                    <TouchableOpacity
                        style={styles.switchModeContainer}
                        onPress={toggleMode}
                    >
                        <Text style={styles.switchModeText}>
                            {isLogin ? "Don't have an account? " : "Already have an account? "}
                            <Text style={styles.switchModeAction}>
                                {isLogin ? 'Sign Up' : 'Sign In'}
                            </Text>
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.skipButton}
                        onPress={() => router.replace('/main')}
                    >
                        <Text style={styles.skipButtonText}>Continue without account</Text>
                    </TouchableOpacity>
                </ScrollView>
            </KeyboardAvoidingView>

            <BottomWave />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    contentContainer: {
        flex: 1,
        paddingHorizontal: 24,
    },
    scrollContent: {
        flexGrow: 1,
        paddingVertical: 20,
    },
    waveContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: -1,
    },
    bottomWaveContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: -1,
    },
    logo: {
        width: 100,
        height: 100,
        alignSelf: 'center',
        marginBottom: 20,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#222',
        textAlign: 'center',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        marginBottom: 30,
    },
    formContainer: {
        width: '100%',
        marginBottom: 30,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F5F5F5',
        borderRadius: 12,
        marginBottom: 16,
        paddingHorizontal: 16,
        height: 56,
        borderWidth: 1,
        borderColor: '#EAEAEA',
    },
    inputIcon: {
        marginRight: 12,
    },
    input: {
        flex: 1,
        fontSize: 16,
        color: '#333',
    },
    primaryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#0080FF',
        borderRadius: 12,
        paddingVertical: 16,
        height: 56,
        shadowColor: '#0080FF',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    primaryButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
        marginLeft: 8,
    },
    separator: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 24,
    },
    separatorLine: {
        flex: 1,
        height: 1,
        backgroundColor: '#E0E0E0',
    },
    separatorText: {
        color: '#666',
        paddingHorizontal: 10,
        fontSize: 14,
    },
    socialButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fff',
        borderRadius: 12,
        paddingVertical: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#E0E0E0',
        height: 56,
    },
    socialIcon: {
        width: 24,
        height: 24,
        marginRight: 12,
    },
    socialButtonText: {
        color: '#333',
        fontSize: 16,
        fontWeight: '600',
    },
    biometricButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F5F5F5',
        borderRadius: 12,
        paddingVertical: 16,
        borderWidth: 1,
        borderColor: '#E0E0E0',
        height: 56,
    },
    biometricButtonText: {
        color: '#333',
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 8,
    },
    switchModeContainer: {
        alignItems: 'center',
        marginBottom: 16,
        paddingVertical: 8,
    },
    switchModeText: {
        fontSize: 16,
        color: '#666',
    },
    switchModeAction: {
        color: '#0080FF',
        fontWeight: 'bold',
    },
    skipButton: {
        alignItems: 'center',
        padding: 12,
    },
    skipButtonText: {
        color: '#999',
        fontSize: 14,
    },
    errorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFEBEE',
        borderRadius: 8,
        padding: 12,
        marginBottom: 20,
    },
    errorText: {
        color: '#d32f2f',
        marginLeft: 8,
        fontSize: 14,
    },
}); 