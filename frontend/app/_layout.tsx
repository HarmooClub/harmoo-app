import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from '../src/contexts/AuthContext';
import { ThemeProvider, useTheme } from '../src/contexts/ThemeContext';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || 'https://harmoo-backen.onrender.com';

function RootLayoutNav() {
  const { theme, isDark } = useTheme();
  
  // Keep-alive: ping backend every 13 minutes to prevent Render cold starts
  useEffect(() => {
    const ping = () => {
      fetch(`${API_URL}/api/health`).catch(() => {});
    };
    ping(); // Ping immediately on app load
    const interval = setInterval(ping, 13 * 60 * 1000); // Every 13 min
    return () => clearInterval(interval);
  }, []);
  
  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: theme.background },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="waiting-room" options={{ headerShown: false, gestureEnabled: false }} />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen 
          name="freelancer/[id]" 
          options={{ 
            headerShown: false,
            presentation: 'card' 
          }} 
        />
        <Stack.Screen 
          name="booking/[serviceId]" 
          options={{ 
            headerShown: false,
            presentation: 'modal' 
          }} 
        />
        <Stack.Screen 
          name="chat/[conversationId]" 
          options={{ 
            headerShown: false,
            presentation: 'card' 
          }} 
        />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <AuthProvider>
            <RootLayoutNav />
          </AuthProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
