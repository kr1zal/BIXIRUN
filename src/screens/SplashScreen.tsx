import React, { useEffect } from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';

type SplashScreenProps = {
    navigation: StackNavigationProp<any, any>;
};

const SplashScreen = ({ navigation }: SplashScreenProps) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            navigation.replace('Main');
        }, 2000);
        return () => clearTimeout(timer);
    }, [navigation]);

    return (
        <View style={styles.container}>
            <Image source={require('../assets/logo.png')} style={styles.logo} />
            <Text style={styles.slogan}>Marketplace + Fitness Timer</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' },
    logo: { width: 120, height: 120, marginBottom: 24 },
    slogan: { fontSize: 18, color: '#888' },
});

export default SplashScreen; 