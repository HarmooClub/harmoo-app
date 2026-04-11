import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import * as SecureStore from 'expo-secure-store';
import axios from 'axios';
import { Platform } from 'react-native';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || 'https://harmoo-backen.onrender.com';

interface User {
  id: string;
  email: string;
  full_name: string;
  user_type: 'client' | 'freelancer';
  bio?: string;
  avatar?: string;
  location?: { lat: number; lng: number };
  city?: string;
  categories?: string[];
  subcategories?: string[];
  hourly_rate?: number;
  is_harmoo_club?: boolean;
  subscription_tier?: string;
  rating?: number;
  reviews_count?: number;
  is_available?: boolean;
  is_provider_mode?: boolean;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, fullName: string, userType: string, categories?: string[], subcategories?: string[]) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (data: Partial<User>) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Storage helper for cross-platform compatibility
const storage = {
  async getItem(key: string): Promise<string | null> {
    if (Platform.OS === 'web') {
      return localStorage.getItem(key);
    }
    return SecureStore.getItemAsync(key);
  },
  async setItem(key: string, value: string): Promise<void> {
    if (Platform.OS === 'web') {
      localStorage.setItem(key, value);
    } else {
      await SecureStore.setItemAsync(key, value);
    }
  },
  async removeItem(key: string): Promise<void> {
    if (Platform.OS === 'web') {
      localStorage.removeItem(key);
    } else {
      await SecureStore.deleteItemAsync(key);
    }
  },
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      const storedToken = await storage.getItem('token');
      const storedUser = await storage.getItem('user');
      
      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
        
        // Verify token is still valid
        try {
          const response = await axios.get(`${API_URL}/api/auth/me`, {
            headers: { Authorization: `Bearer ${storedToken}` }
          });
          setUser(response.data);
          await storage.setItem('user', JSON.stringify(response.data));
        } catch (error) {
          // Token invalid, clear auth
          await logout();
        }
      }
    } catch (error) {
      console.error('Failed to load auth:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    const response = await axios.post(`${API_URL}/api/auth/login`, {
      email,
      password,
    });
    
    const { access_token, user: userData } = response.data;
    
    await storage.setItem('token', access_token);
    await storage.setItem('user', JSON.stringify(userData));
    
    setToken(access_token);
    setUser(userData);
  };

  const register = async (email: string, password: string, fullName: string, userType: string, categories?: string[], subcategories?: string[]) => {
    const payload: any = {
      email,
      password,
      full_name: fullName,
      user_type: userType,
    };
    if (userType === 'freelancer' && categories) {
      payload.categories = categories;
    }
    if (userType === 'freelancer' && subcategories) {
      payload.subcategories = subcategories;
    }
    const response = await axios.post(`${API_URL}/api/auth/register`, payload);
    
    const { access_token, user: userData } = response.data;
    
    await storage.setItem('token', access_token);
    await storage.setItem('user', JSON.stringify(userData));
    
    setToken(access_token);
    setUser(userData);
  };

  const logout = async () => {
    await storage.removeItem('token');
    await storage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  const updateUser = async (data: Partial<User>) => {
    if (!token) throw new Error('Not authenticated');
    
    const response = await axios.put(`${API_URL}/api/users/profile`, data, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    setUser(response.data);
    await storage.setItem('user', JSON.stringify(response.data));
  };

  const refreshUser = async () => {
    if (!token) return;
    
    const response = await axios.get(`${API_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    setUser(response.data);
    await storage.setItem('user', JSON.stringify(response.data));
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      isLoading,
      login,
      register,
      logout,
      updateUser,
      refreshUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
