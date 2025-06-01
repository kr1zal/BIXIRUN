// Import the full polyfill first to handle all Node.js module requirements
import './src/utils/fullPolyfill';
import { ExpoRoot } from 'expo-router';
import SyncManager from './src/components/SyncManager';
import React from 'react';
import { View, StyleSheet } from 'react-native';

export default function App() {
    return (
        <View style={styles.container}>
            <ExpoRoot context={require.context('./app')} />
            <SyncManager />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
});