'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { api } from './api';

interface Merchant {
  id: string;
  businessName: string;
  phone: string;
  address?: string;
}

interface LoginInput {
  phone: string;
  password: string;
}

interface RegisterInput {
  businessName: string;
  phone: string;
  password: string;
  address?: string;
}

interface AuthContextType {
  merchant: Merchant | null;
  isLoading: boolean;
  login: (input: LoginInput) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [merchant, setMerchant] = useState<Merchant | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const fetchMerchant = useCallback(async () => {
    try {
      const res = await api.get<{ data: Merchant }>('/merchants/me');
      if (res.success) {
        setMerchant(res.data.data);
      } else {
        setMerchant(null);
      }
    } catch {
      setMerchant(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMerchant();
  }, [fetchMerchant]);

  const login = useCallback(async (input: LoginInput) => {
    const res = await api.post<{ merchant: Merchant; token: string }>('/auth/login', input);
    if (!res.success) throw new Error(res.error);
    setMerchant(res.data.merchant);
    router.push('/dashboard');
  }, [router]);

  const register = useCallback(async (input: RegisterInput) => {
    const res = await api.post<{ merchant: Merchant; token: string }>('/auth/register', input);
    if (!res.success) throw new Error(res.error);
    setMerchant(res.data.merchant);
    router.push('/dashboard');
  }, [router]);

  const logout = useCallback(async () => {
    await api.post('/auth/logout', {});
    setMerchant(null);
    router.push('/login');
  }, [router]);

  return (
    <AuthContext.Provider value={{ merchant, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export function useMerchant() {
  const { merchant, isLoading } = useAuth();
  return { merchant, isLoading };
}
