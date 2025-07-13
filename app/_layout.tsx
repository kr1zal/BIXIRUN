import { AppLayout } from '@/components/AppLayout';
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
          presentation: 'transparentModal',
          contentStyle: { backgroundColor: '#f8f9fa' },
        }}
      />
    </AppLayout>
  );
}
