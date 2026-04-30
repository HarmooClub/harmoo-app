import React from 'react';
import { Tabs, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Platform, View } from 'react-native';
import { useTheme } from '../../src/contexts/ThemeContext';
import { useAuth } from '../../src/contexts/AuthContext';
import { radius } from '../../src/theme';

export default function TabsLayout() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const router = useRouter();

  const TabIcon = ({ name, focused, color }: { name: string; focused: boolean; color: string }) => (
    <View style={focused ? { backgroundColor: theme.primarySoft, borderRadius: radius.md, padding: 6 } : { padding: 6 }}>
      <Ionicons name={name as any} size={22} color={color} />
    </View>
  );

  // Guard: redirect to auth for private tabs
  const guardedListener = () => ({
    tabPress: (e: any) => {
      if (!user) {
        e.preventDefault();
        router.push('/(auth)/welcome');
      }
    },
  });

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.textSecondary,
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: theme.card,
          borderTopColor: theme.divider,
          borderTopWidth: 0.5,
          height: Platform.OS === 'ios' ? 88 : 64,
          paddingBottom: Platform.OS === 'ios' ? 28 : 8,
          paddingTop: 8,
          elevation: 0,
        },
      }}
    >
      {/* PUBLIC tabs */}
      <Tabs.Screen name="index" options={{ tabBarIcon: ({ color, focused }) => <TabIcon name={focused ? 'compass' : 'compass-outline'} focused={focused} color={color} /> }} />
      <Tabs.Screen name="search" options={{ tabBarIcon: ({ color, focused }) => <TabIcon name={focused ? 'search' : 'search-outline'} focused={focused} color={color} /> }} />
      {/* PRIVATE tabs — require auth */}
      <Tabs.Screen name="bookings" listeners={guardedListener} options={{ tabBarIcon: ({ color, focused }) => <TabIcon name={focused ? 'calendar' : 'calendar-outline'} focused={focused} color={color} /> }} />
      <Tabs.Screen name="messages" options={{ href: null }} />
      <Tabs.Screen name="profile" listeners={guardedListener} options={{ tabBarIcon: ({ color, focused }) => <TabIcon name={focused ? 'person' : 'person-outline'} focused={focused} color={color} /> }} />
    </Tabs>
  );
}
