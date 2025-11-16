// FIX: Implemented full content for AuthContext.tsx to provide authentication state and actions.
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, UserRole, Anggota } from '../types';
import { findAnggotaByCredentials, getAnggotaById } from '../services/anggotaService';
import { findAdminByCredentials } from '../services/adminService';

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
  updateAuthUser: (updatedData: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error("Failed to parse user from localStorage", error);
      localStorage.removeItem('user');
    } finally {
        setLoading(false);
    }
  }, []);

  const login = async (username: string, password: string) => {
    // 1. Try to log in as an Admin first
    const admin = await findAdminByCredentials(username, password);
    if (admin) {
        const adminUser: User = {
            id: admin.id,
            name: admin.nama,
            email: admin.email,
            role: UserRole.ADMIN,
        };
        localStorage.setItem('user', JSON.stringify(adminUser));
        setUser(adminUser);
        return;
    }
    
    // 2. If not an admin, try to log in as an Anggota
    const anggota = await findAnggotaByCredentials(username, password);
    if (anggota) {
        const anggotaUser: User = {
            id: anggota.id,
            anggotaId: anggota.id,
            name: anggota.nama,
            email: anggota.email || '',
            role: UserRole.ANGGOTA,
            photoURL: anggota.photoURL,
        };
        localStorage.setItem('user', JSON.stringify(anggotaUser));
        setUser(anggotaUser);
        return;
    }

    // 3. If neither, throw error
    throw new Error('Username atau password salah.');
  };

  const logout = () => {
    localStorage.removeItem('user');
    setUser(null);
  };
  
  const updateAuthUser = (updatedData: Partial<User>) => {
    setUser(prevUser => {
        if (!prevUser) return null;
        const newUser = { ...prevUser, ...updatedData };
        localStorage.setItem('user', JSON.stringify(newUser));
        return newUser;
    });
  };

  if (loading) {
      return <div className="flex justify-center items-center h-screen">Loading...</div>; 
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, updateAuthUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};