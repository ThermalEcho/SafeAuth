// lib/use-auth.ts - Authentication hook for React Native
import { useEffect, useState } from 'react';
import { authClient } from './auth-client';
import type { Session, User } from './auth-client';

export const useAuth = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing session on mount
    const checkSession = async () => {
      try {
        // The auth client automatically persists session via Expo SecureStore
        const snapshot = (authClient as any).$getSnapshot?.();
        if (snapshot) {
          setSession(snapshot.session || null);
          setUser(snapshot.user || null);
        }
      } catch (error) {
        console.error('Session check error:', error);
      } finally {
        setLoading(false);
      }
    };

    checkSession();
  }, []);

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      const { data, error } = await authClient.signIn.email({ email, password });
      if (error) throw error;
      return { data, error: null };
    } catch (error: any) {
      return { data: null, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (name: string, email: string, password: string) => {
    setLoading(true);
    try {
      const { data, error } = await authClient.signUp.email({ name, email, password });
      if (error) throw error;
      return { data, error: null };
    } catch (error: any) {
      return { data: null, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      const { error } = await authClient.signOut();
      if (error) throw error;
      setSession(null);
      setUser(null);
      return { error: null };
    } catch (error: any) {
      return { error: error.message };
    } finally {
      setLoading(false);
    }
  };

  return {
    session,
    user,
    loading,
    signIn,
    signUp,
    signOut,
    isAuthenticated: !!session,
  };
};
