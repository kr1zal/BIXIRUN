import React from 'react';
import { Tabs } from 'expo-router';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{ headerShown: false, animation: 'none' }}
    >
      <Tabs.Screen name="index" options={{ href: '/main' }} />
      <Tabs.Screen name="products" options={{ href: '/products' }} />
      <Tabs.Screen name="timer" options={{ href: '/timer' }} />
      <Tabs.Screen name="blog" options={{ href: '/blog' }} />
      <Tabs.Screen name="cart" options={{ href: '/cart' }} />
      <Tabs.Screen name="profile" options={{ href: '/profile' }} />
    </Tabs>
  );
}


