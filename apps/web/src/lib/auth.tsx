import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from './api';
import type { User, AuthResponse } from '@/types';

export const DEMO_ADMIN_USER: User = {
  id: 'usr-admin-demo',
  email: 'admin@techvista.io',
  firstName: 'Sarah',
  lastName: 'Vance',
  role: 'Talent Acquisition Director',
  organization: {
    id: 'org-demo',
    name: 'TechVista Innovations',
  },
};

export const DEMO_RECRUITER_USER: User = {
  id: 'usr-recruiter-demo',
  email: 'recruiter@techvista.io',
  firstName: 'Jordan',
  lastName: 'Miller',
  role: 'Senior Technical Recruiter',
  organization: {
    id: 'org-demo',
    name: 'TechVista Innovations',
  },
};

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginDemo: (role?: 'admin' | 'recruiter') => void;
  register: (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    organizationName: string;
  }) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadUser = useCallback(async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      setIsLoading(false);
      return;
    }

    if (token === 'demo-admin-token') {
      setUser(DEMO_ADMIN_USER);
      setIsLoading(false);
      return;
    }
    if (token === 'demo-recruiter-token') {
      setUser(DEMO_RECRUITER_USER);
      setIsLoading(false);
      return;
    }

    try {
      const { data } = await api.get('/auth/me');
      setUser(data);
    } catch {
      // If server unreachable but previously logged in with demo, keep demo session
      const savedRole = localStorage.getItem('demoRole');
      if (savedRole === 'admin') {
        setUser(DEMO_ADMIN_USER);
      } else if (savedRole === 'recruiter') {
        setUser(DEMO_RECRUITER_USER);
      } else {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const login = async (email: string, password: string) => {
    try {
      const { data } = await api.post<AuthResponse>('/auth/login', { email, password });
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      localStorage.removeItem('demoRole');
      setUser(data.user);
    } catch (err) {
      // Seamless demo fallback if offline or cold starting
      const cleanEmail = email.trim().toLowerCase();
      if (cleanEmail === 'admin@techvista.io') {
        loginDemo('admin');
        return;
      } else if (cleanEmail === 'recruiter@techvista.io') {
        loginDemo('recruiter');
        return;
      }
      throw err;
    }
  };

  const loginDemo = (role: 'admin' | 'recruiter' = 'recruiter') => {
    const demoUser = role === 'admin' ? DEMO_ADMIN_USER : DEMO_RECRUITER_USER;
    const token = role === 'admin' ? 'demo-admin-token' : 'demo-recruiter-token';
    localStorage.setItem('accessToken', token);
    localStorage.setItem('refreshToken', `${token}-refresh`);
    localStorage.setItem('demoRole', role);
    setUser(demoUser);
  };

  const register = async (regData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    organizationName: string;
  }) => {
    const { data } = await api.post<AuthResponse>('/auth/register', regData);
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    setUser(data.user);
  };

  const logout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('demoRole');
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        loginDemo,
        register,
        logout,
      }}
    >
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
