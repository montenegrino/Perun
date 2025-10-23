import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../services/api';
import { UserRole } from '@perper/shared';

interface User {
  id: string;
  email: string;
  username: string;
  fullName: string;
  roles: UserRole[];
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (emailOrUsername: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await authApi.getMe();
      setUser(response.data.user);
    } catch (error) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (emailOrUsername: string, password: string) => {
    const response = await authApi.login({ emailOrUsername, password });
    setUser(response.data.user);
  };

  const logout = async () => {
    await authApi.logout();
    setUser(null);
  };

  const isAdmin = user?.roles.includes(UserRole.ADMIN) || false;

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
