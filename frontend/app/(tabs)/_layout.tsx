import React from 'react';
import { Tabs } from 'expo-router';
import { useTheme } from '../../src/contexts/ThemeContext';

export default function TabsLayout() {
  const { theme } = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: { display: 'none' },
      }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="search" options={{ href: null }} />
      <Tabs.Screen name="bookings" />
      <Tabs.Screen name="messages" options={{ href: null }} />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}
