import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiClient } from '../services/apiClient';

interface User {
  id: number;
  name: string;
  email: string;
  company_id: number;
}

interface AuthContextType {
  user: User | null;
  roles: string[];
  permissions: string[];
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  forgotPassword: (email: string) => Promise<any>;
  resetPassword: (payload: any) => Promise<void>;
  hasPermission: (permission: string) => boolean;
  hasRole: (role: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [roles, setRoles] = useState<string[]>([]);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  const loadLocalUser = () => {
    const savedUser = localStorage.getItem('user');
    const token = localStorage.getItem('auth_token');
    const savedRoles = localStorage.getItem('roles');
    const savedPermissions = localStorage.getItem('permissions');

    if (savedUser && token) {
      setUser(JSON.parse(savedUser));
      setRoles(savedRoles ? JSON.parse(savedRoles) : []);
      setPermissions(savedPermissions ? JSON.parse(savedPermissions) : []);
      setIsAuthenticated(true);
    } else {
      setUser(null);
      setRoles([]);
      setPermissions([]);
      setIsAuthenticated(false);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadLocalUser();

    const handleLogoutEvent = () => {
      setUser(null);
      setRoles([]);
      setPermissions([]);
      setIsAuthenticated(false);
    };

    window.addEventListener('auth-logout', handleLogoutEvent);
    return () => {
      window.removeEventListener('auth-logout', handleLogoutEvent);
    };
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const response = await apiClient.post<any>('/auth/login', { email, password });
      if (response.success && response.data) {
        const { user, token, roles, permissions, branches } = response.data;
        localStorage.setItem('auth_token', token);
        localStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem('roles', JSON.stringify(roles));
        localStorage.setItem('permissions', JSON.stringify(permissions));
        localStorage.setItem('user_branches', JSON.stringify(branches || []));

        if (branches && branches.length > 0) {
          localStorage.setItem('selected_branch_id', String(branches[0].id));
        }

        setUser(user);
        setRoles(roles);
        setPermissions(permissions);
        setIsAuthenticated(true);
      }
    } catch (error) {
      setIsAuthenticated(false);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await apiClient.post('/auth/logout');
    } catch (error) {
      console.warn('Logout request failed or user already unauthenticated.');
    } finally {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
      localStorage.removeItem('roles');
      localStorage.removeItem('permissions');
      localStorage.removeItem('user_branches');
      localStorage.removeItem('selected_branch_id');
      setUser(null);
      setRoles([]);
      setPermissions([]);
      setIsAuthenticated(false);
      setLoading(false);
    }
  };

  const forgotPassword = async (email: string) => {
    return await apiClient.post<any>('/auth/forgot-password', { email });
  };

  const resetPassword = async (payload: any) => {
    await apiClient.post('/auth/reset-password', payload);
  };

  const hasPermission = (permission: string): boolean => {
    // Super Admin has bypass access to all pages/permissions
    if (roles.includes('Super Admin')) return true;
    return permissions.includes(permission);
  };

  const hasRole = (role: string): boolean => {
    return roles.includes(role);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        roles,
        permissions,
        isAuthenticated,
        loading,
        login,
        logout,
        forgotPassword,
        resetPassword,
        hasPermission,
        hasRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthContextProvider');
  }
  return context;
};
