import React, { createContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '@/lib/api';

interface User {
  id: number;
  email: string;
  name: string;
  role: string;
  photo?: string;
  avatar?: string;
  faceRegistered?: boolean;
  tenantId?: number;
}

interface AuthContextData {
  user: User | null;
  isLoading: boolean;
  login: (token: string, userData: User, tenantId?: number) => Promise<void>;
  logout: () => Promise<void>;
  loadUser: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const token = await AsyncStorage.getItem('auth_token');
      
      if (token) {
        const response = await api.get('/users/profile');
        if (response.data.success) {
          setUser(response.data.data);
        } else {
          await logout();
        }
      }
    } catch (error: any) {
      console.error('Failed to load user:', error);
      // Auto-logout on client/auth errors (400, 401, 403, 404) so user can re-login cleanly
      const status = error.response?.status;
      if (status === 400 || status === 401 || status === 403 || status === 404) {
        await logout();
      }
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (token: string, userData: User, tenantId?: number) => {
    await AsyncStorage.setItem('auth_token', token);
    if (tenantId) {
      await AsyncStorage.setItem('tenant_id', tenantId.toString());
    } else {
      await AsyncStorage.removeItem('tenant_id');
    }
    setUser(userData);
  };

  const logout = async () => {
    await AsyncStorage.removeItem('auth_token');
    await AsyncStorage.removeItem('tenant_id');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, loadUser }}>
      {children}
    </AuthContext.Provider>
  );
};
