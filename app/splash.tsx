import { useEffect } from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';

export default function SplashScreen() {
    const router = useRouter();
    useEffect(() => {
        const timer = setTimeout(() => {
            router.replace('/main');
        }, 2000);
        return () => clearTimeout(timer);
    }, [router]);

    return (
        <View style={styles.container}>
            <Image source={require('../assets/images/logo.png')} style={styles.logo} />
            <Text style={styles.slogan}>Marketplace + Fitness Timer</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' },
    logo: { width: 120, height: 120, marginBottom: 24 },
    slogan: { fontSize: 18, color: '#888' },
}); 