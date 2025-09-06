import React from 'react';
import { Stack } from 'expo-router';
import { StyleSheet } from 'react-native';
import { Image } from 'react-native';

import { ThemedText } from '../components/ThemedText';
import { ThemedView } from '../components/ThemedView';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Oops!' }} />
      <ThemedView style={styles.container}>
        <ThemedText type="title">This screen does not exist.</ThemedText>
        <ThemedText style={styles.message}>
          Please use the navigation menu below to go to another page.
        </ThemedText>
        <Image source={require('../assets/images/logo-bixirun.png')} style={{ width: 80, height: 80, marginTop: 24 }} resizeMode="contain" />
      </ThemedView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  message: {
    marginTop: 15,
    textAlign: 'center',
    color: '#666',
  },
});
