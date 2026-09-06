import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Address } from '../types/index.js';
import { apiFetch } from '../services/api.js';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  addresses: Address[];
  login: (email: string, pass: string) => Promise<void>;
  register: (data: { name: string; email: string; password: string; cpf?: string; phone?: string }) => Promise<void>;
  logout: () => Promise<void>;
  loadAddresses: () => Promise<void>;
  addAddress: (addr: Partial<Address>) => Promise<Address>;
  deleteAddress: (id: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [addresses, setAddresses] = useState<Address[]>([]);

  useEffect(() => {
    checkMe();
  }, []);

  const checkMe = async () => {
    try {
      const token = localStorage.getItem('aura_token');
      if (token) {
        const res = await apiFetch<{ user: User }>('/api/auth/me');
        setUser(res.user);
        await loadAddresses();
      }
    } catch {
      localStorage.removeItem('aura_token');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, pass: string) => {
    const res = await apiFetch<{ user: User; token: string }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password: pass }),
    });
    localStorage.setItem('aura_token', res.token);
    setUser(res.user);
    await loadAddresses();
  };

  const register = async (data: { name: string; email: string; password: string; cpf?: string; phone?: string }) => {
    const res = await apiFetch<{ user: User; token: string }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    localStorage.setItem('aura_token', res.token);
    setUser(res.user);
    await loadAddresses();
  };

  const logout = async () => {
    try {
      await apiFetch('/api/auth/logout', { method: 'POST' });
    } catch {}
    localStorage.removeItem('aura_token');
    setUser(null);
    setAddresses([]);
  };

  const loadAddresses = async () => {
    try {
      const res = await apiFetch<{ addresses: Address[] }>('/api/addresses');
      setAddresses(res.addresses);
    } catch {
      setAddresses([]);
    }
  };

  const addAddress = async (addr: Partial<Address>) => {
    const res = await apiFetch<{ address: Address }>('/api/addresses', {
      method: 'POST',
      body: JSON.stringify(addr),
    });
    await loadAddresses();
    return res.address;
  };

  const deleteAddress = async (id: string) => {
    await apiFetch(`/api/addresses/${id}`, { method: 'DELETE' });
    await loadAddresses();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        addresses,
        login,
        register,
        logout,
        loadAddresses,
        addAddress,
        deleteAddress,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth deve ser utilizado dentro de AuthProvider');
  return context;
};
