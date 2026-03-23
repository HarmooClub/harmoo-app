import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Platform, View } from 'react-native';
import { useTheme } from '../../src/contexts/ThemeContext';
import { radius } from '../../src/theme';

export default function TabsLayout() {
  const { theme } = useTheme();

  const TabIcon = ({ name, focused, color }: { name: string; focused: boolean; color: string }) => (
    <View style={focused ? { backgroundColor: theme.primarySoft, borderRadius: radius.md, padding: 6 } : { padding: 6 }}>
      <Ionicons name={name as any} size={22} color={color} />
    </View>
  );

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
      <Tabs.Screen name="index" options={{ tabBarIcon: ({ color, focused }) => <TabIcon name={focused ? 'compass' : 'compass-outline'} focused={focused} color={color} /> }} />
      <Tabs.Screen name="search" options={{ tabBarIcon: ({ color, focused }) => <TabIcon name={focused ? 'search' : 'search-outline'} focused={focused} color={color} /> }} />
      <Tabs.Screen name="bookings" options={{ tabBarIcon: ({ color, focused }) => <TabIcon name={focused ? 'calendar' : 'calendar-outline'} focused={focused} color={color} /> }} />
      <Tabs.Screen name="messages" options={{ tabBarIcon: ({ color, focused }) => <TabIcon name={focused ? 'chatbubble' : 'chatbubble-outline'} focused={focused} color={color} /> }} />
      <Tabs.Screen name="profile" options={{ tabBarIcon: ({ color, focused }) => <TabIcon name={focused ? 'person' : 'person-outline'} focused={focused} color={color} /> }} />
    </Tabs>
  );
}
