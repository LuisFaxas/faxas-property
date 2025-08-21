'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  sendPasswordResetEmail
} from 'firebase/auth';
import { auth } from '@/lib/firebaseClient';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  userRole: string | null;
  userModules: string[] | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userModules, setUserModules] = useState<string[] | null>(null);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      
      if (user) {
        // Get custom claims
        const tokenResult = await user.getIdTokenResult();
        setUserRole(tokenResult.claims.role as string || null);
        setUserModules(tokenResult.claims.modules as string[] || null);
      } else {
        setUserRole(null);
        setUserModules(null);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithEmail = async (email: string, password: string) => {
    try {
      setError(null);
      setLoading(true);
      const result = await signInWithEmailAndPassword(auth, email, password);
      
      // Get custom claims - force token refresh to get latest claims
      const tokenResult = await result.user.getIdTokenResult(true);
      const role = tokenResult.claims.role as string;
      
      console.log('User signed in:', { uid: result.user.uid, email: result.user.email, role });
      
      // Update state
      setUser(result.user);
      setUserRole(role || 'ADMIN');
      setUserModules(tokenResult.claims.modules as string[] || []);
      
      // Use window.location for hard redirect to ensure page refresh
      if (role === 'ADMIN' || role === 'STAFF' || !role) {
        console.log('Redirecting to /admin');
        window.location.href = '/admin';
      } else if (role === 'CONTRACTOR') {
        console.log('Redirecting to /contractor');
        window.location.href = '/contractor';
      } else {
        console.log('Redirecting to home');
        window.location.href = '/';
      }
    } catch (error: any) {
      console.error('Sign in error:', error);
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    try {
      setError(null);
      setLoading(true);
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      
      // Get custom claims - force token refresh
      const tokenResult = await result.user.getIdTokenResult(true);
      const role = tokenResult.claims.role as string;
      
      console.log('User signed in with Google:', { uid: result.user.uid, email: result.user.email, role });
      
      // Update state
      setUser(result.user);
      setUserRole(role || 'ADMIN');
      setUserModules(tokenResult.claims.modules as string[] || []);
      
      // Use window.location for hard redirect
      if (role === 'ADMIN' || role === 'STAFF' || !role) {
        console.log('Redirecting to /admin');
        window.location.href = '/admin';
      } else if (role === 'CONTRACTOR') {
        console.log('Redirecting to /contractor');
        window.location.href = '/contractor';
      } else {
        console.log('Redirecting to home');
        window.location.href = '/';
      }
    } catch (error: any) {
      console.error('Google sign in error:', error);
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setError(null);
      await signOut(auth);
      router.push('/login');
    } catch (error: any) {
      setError(error.message);
      throw error;
    }
  };

  const resetPassword = async (email: string) => {
    try {
      setError(null);
      await sendPasswordResetEmail(auth, email);
    } catch (error: any) {
      setError(error.message);
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    error,
    signInWithEmail,
    signInWithGoogle,
    logout,
    resetPassword,
    userRole,
    userModules
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};