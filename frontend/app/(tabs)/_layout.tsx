import React, { useState, useEffect, useCallback } from 'react';
import { Tabs, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Platform, View, Text } from 'react-native';
import { useTheme } from '../../src/contexts/ThemeContext';
import { useAuth } from '../../src/contexts/AuthContext';
import { radius } from '../../src/theme';
import api from '../../src/services/api';

export default function TabsLayout() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const [unreadCount, setUnreadCount] = useState(0);

  // Poll unread messages every 15s
  useEffect(() => {
    if (!user) return;
    const fetchUnread = async () => {
      try {
        const res = await api.get('/messages/unread/count');
        setUnreadCount(res.data.unread_count || 0);
      } catch (e) {}
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 15000);
    return () => clearInterval(interval);
  }, [user]);

  const TabIcon = ({ name, focused, color }: { name: string; focused: boolean; color: string }) => (
    <View style={focused ? { backgroundColor: theme.primarySoft, borderRadius: radius.md, padding: 6 } : { padding: 6 }}>
      <Ionicons name={name as any} size={22} color={color} />
    </View>
  );

  const MessageTabIcon = ({ focused, color }: { focused: boolean; color: string }) => (
    <View style={[focused ? { backgroundColor: theme.primarySoft, borderRadius: radius.md, padding: 6 } : { padding: 6 }]}>
      <Ionicons name={focused ? 'chatbubble' : 'chatbubble-outline'} size={22} color={color} />
      {unreadCount > 0 && (
        <View style={{ position: 'absolute', top: 2, right: 2, backgroundColor: '#DC1B78', borderRadius: 10, minWidth: 18, height: 18, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 4 }}>
          <Text style={{ color: '#fff', fontSize: 10, fontWeight: '700' }}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
        </View>
      )}
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
      <Tabs.Screen name="messages" listeners={guardedListener} options={{ tabBarIcon: ({ color, focused }) => <MessageTabIcon focused={focused} color={color} /> }} />
      <Tabs.Screen name="profile" listeners={guardedListener} options={{ tabBarIcon: ({ color, focused }) => <TabIcon name={focused ? 'person' : 'person-outline'} focused={focused} color={color} /> }} />
    </Tabs>
  );
}
