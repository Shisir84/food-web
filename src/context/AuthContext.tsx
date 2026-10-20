import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, RiderProfile, RestaurantProfile } from '../types/index.ts';
import { api } from '../services/api.ts';
import {
  auth,
  signInWithGooglePopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  onAuthStateChanged,
  updateProfile,
} from '../lib/firebase.ts';

interface AuthContextType {
  user: User | null;
  riderProfile: RiderProfile | null;
  restaurantProfile: RestaurantProfile | null;
  isLoading: boolean;
  login: (email: string, password: string, portal?: string, rememberMe?: boolean) => Promise<any>;
  register: (payload: any) => Promise<any>;
  loginWithGoogle: () => Promise<any>;
  socialLogin: (payload: { provider: string; name: string; email: string; avatarUrl?: string }) => Promise<any>;
  forgotPassword: (email: string) => Promise<{ success: boolean; message: string }>;
  verifyEmail: (email: string, code: string) => Promise<{ success: boolean; message: string; user?: User }>;
  resendVerification: (email: string) => Promise<{ success: boolean; message: string }>;
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

    // Listen to Firebase Auth state for real session persistence
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser && fbUser.email) {
        // If app does not have token or user session is empty, auto-sync with backend
        if (!api.getToken()) {
          try {
            const res = await api.socialLogin({
              provider: 'google',
              name: fbUser.displayName || fbUser.email.split('@')[0],
              email: fbUser.email,
              avatarUrl: fbUser.photoURL || undefined,
            });
            setUser(res.user);
            setRiderProfile(res.riderProfile || null);
            setRestaurantProfile(res.restaurantProfile || null);
          } catch (e) {
            console.warn('Auto-sync with backend error:', e);
          }
        }
      }
    });

    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async () => {
    setIsLoading(true);
    try {
      const fbUser = await signInWithGooglePopup();
      if (!fbUser || !fbUser.email) {
        throw new Error('Google authentication completed, but no email was provided.');
      }
      const displayName = fbUser.displayName || fbUser.email.split('@')[0] || 'Google User';
      const avatarUrl = fbUser.photoURL || undefined;

      const res = await api.socialLogin({
        provider: 'google',
        name: displayName,
        email: fbUser.email,
        avatarUrl,
      });

      setUser(res.user);
      setRiderProfile(res.riderProfile || null);
      setRestaurantProfile(res.restaurantProfile || null);
      return res;
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string, portal?: string, rememberMe?: boolean) => {
    setIsLoading(true);
    try {
      // Attempt Firebase auth for users configured in Firebase Authentication
      signInWithEmailAndPassword(auth, email.trim(), password).catch(() => {
        // Ignored for pre-seeded local database users
      });

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
      try {
        const fbCred = await createUserWithEmailAndPassword(auth, payload.email.trim(), payload.password);
        if (payload.name && fbCred.user) {
          await updateProfile(fbCred.user, { displayName: payload.name.trim() });
        }
      } catch (fbErr: any) {
        console.warn('Firebase user creation note:', fbErr?.message || fbErr);
      }

      const res = await api.register(payload);
      setUser(res.user);
      setRiderProfile(res.riderProfile || null);
      setRestaurantProfile(res.restaurantProfile || null);
      return res;
    } finally {
      setIsLoading(false);
    }
  };

  const socialLogin = async (payload: { provider: string; name: string; email: string; avatarUrl?: string }) => {
    setIsLoading(true);
    try {
      const res = await api.socialLogin(payload);
      setUser(res.user);
      setRiderProfile(res.riderProfile || null);
      setRestaurantProfile(res.restaurantProfile || null);
      return res;
    } finally {
      setIsLoading(false);
    }
  };

  const forgotPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email.trim());
    } catch (fbErr: any) {
      console.warn('Firebase password reset email note:', fbErr?.message || fbErr);
    }
    return api.forgotPassword(email);
  };

  const verifyEmail = async (email: string, code: string) => {
    const res = await api.verifyEmail(email, code);
    if (res.user) {
      setUser(res.user);
    }
    return res;
  };

  const resendVerification = async (email: string) => {
    return api.resendVerification(email);
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (e) {
      console.warn('Firebase signOut notice:', e);
    }
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
        loginWithGoogle,
        socialLogin,
        forgotPassword,
        verifyEmail,
        resendVerification,
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


