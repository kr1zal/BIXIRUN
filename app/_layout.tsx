import { AppLayout } from '../components/AppLayout.tsx';
import { Stack } from 'expo-router';
import React from 'react';

export default function RootLayout() {
  return (
    <AppLayout>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'none',
          animationTypeForReplace: 'pop',
          // Убираем глобальный transparentModal — ломал стек и перекрывал таббар
          contentStyle: { backgroundColor: '#f8f9fa' },
        }}
      />
    </AppLayout>
  );
}
