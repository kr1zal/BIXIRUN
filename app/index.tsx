import React from 'react';
import { Redirect } from 'expo-router';

export default function Index() {
    // Стартуем на главной странице приложения
    return <Redirect href="/main" />;
}