'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { UserProfile } from '../types';
import { api, mapApiUserToUserProfile, ApiUser } from '../lib/api';

interface AuthContextType {
  user: UserProfile | null;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
}

interface RegisterData {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
  phone?: string;
  address?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = useCallback(async () => {
    const token = typeof localStorage !== 'undefined' ? localStorage.getItem('auth_token') : null;
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const res = await api.get<{ user: ApiUser }>('/auth/me');
      const profile = mapApiUserToUserProfile(res.user);
      setUser(profile);
    } catch {
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  // When user changes, verify orders belong to them
  useEffect(() => {
    if (user) {
      const storedOrders = localStorage.getItem('lumina_orders');
      if (storedOrders) {
        try {
          const orders = JSON.parse(storedOrders);
          // Filter orders to only include those belonging to current user
          const userOrders = orders.filter((order: any) => order.userId === user.uid);
          if (userOrders.length !== orders.length) {
            console.log('[Auth] Cleaned up orders: removed orders from other users');
            localStorage.setItem('lumina_orders', JSON.stringify(userOrders));
          }
        } catch (e) {
          console.error('[Auth] Error validating orders:', e);
        }
      }
    }
  }, [user]);

  useEffect(() => {
    const handleAuthChange = () => {
      fetchUser();
    };
    window.addEventListener('auth-change', handleAuthChange);
    return () => window.removeEventListener('auth-change', handleAuthChange);
  }, [fetchUser]);

  const login = async (email: string, password: string) => {
    const res = await api.post<{ user: ApiUser; token: string }>('/auth/login', {
      email,
      password,
    });
    localStorage.setItem('auth_token', res.token);
    setUser(mapApiUserToUserProfile(res.user));
    try { window.dispatchEvent(new Event('auth-change')); } catch (err) {}
  };

  const register = async (data: RegisterData) => {
    const res = await api.post<{ user: ApiUser; token: string }>('/auth/register', data);
    localStorage.setItem('auth_token', res.token);
    setUser(mapApiUserToUserProfile(res.user));
    try { window.dispatchEvent(new Event('auth-change')); } catch (err) {}
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch {
    } finally {
      localStorage.removeItem('auth_token');
      setUser(null);
      localStorage.removeItem('lumina_cart');
      // Clear wishlist and cart on logout
      try { 
        window.dispatchEvent(new Event('auth-change'));
        window.dispatchEvent(new CustomEvent('wishlist-clear'));
        window.dispatchEvent(new CustomEvent('cart-clear'));
      } catch (err) {}
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
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
