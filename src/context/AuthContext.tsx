import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, RiderProfile, RestaurantProfile } from '../types/index.ts';
import { api } from '../services/api.ts';
import { auth, signInWithEmailAndPassword, signOut, FirebaseUser } from '../lib/firebase.ts';
import { onAuthStateChanged } from 'firebase/auth';

interface AuthContextType {
  user: User | null;
  riderProfile: RiderProfile | null;
  restaurantProfile: RestaurantProfile | null;
  firebaseUser: FirebaseUser | null;
  isLoading: boolean;
  login: (email: string, password: string, portal?: string) => Promise<any>;
  loginAdminWithFirebase: (email: string, password: string) => Promise<any>;
  register: (payload: any) => Promise<any>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [riderProfile, setRiderProfile] = useState<RiderProfile | null>(null);
  const [restaurantProfile, setRestaurantProfile] = useState<RestaurantProfile | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Sync Firebase Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (fbUser) => {
      setFirebaseUser(fbUser);
    });
    return () => unsubscribe();
  }, []);

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

  const login = async (email: string, password: string, portal?: string) => {
    setIsLoading(true);
    try {
      const res = await api.login({ email, password, portal });
      setUser(res.user);
      setRiderProfile(res.riderProfile || null);
      setRestaurantProfile(res.restaurantProfile || null);
      return res;
    } finally {
      setIsLoading(false);
    }
  };

  const loginAdminWithFirebase = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      // 1. Authenticate with Firebase Authentication client SDK
      const cred = await signInWithEmailAndPassword(auth, email.trim(), password);

      // 2. Refresh token to retrieve server-assigned custom claims
      const idTokenResult = await cred.user.getIdTokenResult(true);

      // 3. Verify { admin: true } custom claim
      if (idTokenResult.claims.admin !== true) {
        // Sign out immediately if lacking admin claim
        await signOut(auth);
        const err: any = new Error(
          'Access Denied: Authenticated account does not possess administrator privileges ({ admin: true }). A matching email alone does not grant administrator access.'
        );
        err.code = 'auth/admin-claim-missing';
        throw err;
      }

      // 4. Exchange cryptographically verified ID token for server session
      const idToken = await cred.user.getIdToken();
      const res = await api.verifyFirebaseAdmin(idToken);

      setUser(res.user);
      setRiderProfile(null);
      setRestaurantProfile(null);
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
    try {
      await signOut(auth);
    } catch (e) {
      // ignore
    }
    api.clearToken();
    setUser(null);
    setRiderProfile(null);
    setRestaurantProfile(null);
    setFirebaseUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        riderProfile,
        restaurantProfile,
        firebaseUser,
        isLoading,
        login,
        loginAdminWithFirebase,
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
