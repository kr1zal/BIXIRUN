import React from 'react';
import { Stack } from 'expo-router';
import { AppLayout } from '@/components/AppLayout';

export default function RootLayout() {
  return (
    <AppLayout>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'none',
          animationTypeForReplace: 'pop',
          presentation: 'transparentModal',
          contentStyle: { backgroundColor: '#f8f9fa' },
        }}
      />
    </AppLayout>
  );
}
