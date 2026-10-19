import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, RiderProfile, RestaurantProfile } from '../types/index.ts';
import { api } from '../services/api.ts';

interface AuthContextType {
  user: User | null;
  riderProfile: RiderProfile | null;
  restaurantProfile: RestaurantProfile | null;
  isLoading: boolean;
  login: (email: string, password: string, portal?: string, rememberMe?: boolean) => Promise<any>;
  register: (payload: any) => Promise<any>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [riderProfile, setRiderProfile] = useState<RiderProfile | null>(null);
  const [restaurantProfile, setRestaurantProfile] = useState<RestaurantProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = async () => {
    try {
      if (api.getToken()) {
        const data = await api.getCurrentUser();
        setUser(data.user);
        setRiderProfile(data.riderProfile || null);
        setRestaurantProfile(data.restaurantProfile || null);
      } else {
        setUser(null);
        setRiderProfile(null);
        setRestaurantProfile(null);
      }
    } catch (err) {
      console.warn('Session expired or invalid, logging out:', err);
      api.clearToken();
      setUser(null);
      setRiderProfile(null);
      setRestaurantProfile(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (email: string, password: string, portal?: string, rememberMe?: boolean) => {
    setIsLoading(true);
    try {
      const res = await api.login({ email, password, portal, rememberMe });
      setUser(res.user);
      setRiderProfile(res.riderProfile || null);
      setRestaurantProfile(res.restaurantProfile || null);
      return res;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (payload: any) => {
    setIsLoading(true);
    try {
      const res = await api.register(payload);
      setUser(res.user);
      setRiderProfile(res.riderProfile || null);
      setRestaurantProfile(res.restaurantProfile || null);
      return res;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    api.clearToken();
    setUser(null);
    setRiderProfile(null);
    setRestaurantProfile(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        riderProfile,
        restaurantProfile,
        isLoading,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

