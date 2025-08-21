import React from 'react';
import { Redirect } from 'expo-router';

export default function Index() {
    // Стартуем в табах (Tabs + кастомный таббар) на главной: /(tabs) → main
    return <Redirect href="/(tabs)" />;
}