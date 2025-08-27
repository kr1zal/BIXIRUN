// Import the full polyfill first to handle all Node.js module requirements
import { ExpoRoot } from 'expo-router';
import './polyfills.ts';
// import SyncManager from './src/components/SyncManager'; // Удалено, если не нужен
import React from 'react';
import { StyleSheet, View } from 'react-native';

export default function App() {
    return (
        <View style={styles.container}>
            <ExpoRoot context={(require as any).context('./app')} />
            {/* <SyncManager /> */}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
});