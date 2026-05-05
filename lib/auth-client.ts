// lib/auth-client.ts - Better Auth client configuration for React Native/Expo
import { createAuthClient } from "better-auth/react";

// Get base URL from environment or default
const getBaseUrl = () => {
  if (typeof window !== "undefined") {
    return process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000";
  }
  return process.env.API_URL || "http://localhost:3000";
};

export const authClient = createAuthClient({
  baseURL: getBaseUrl(),
});

// Export types for TypeScript
export type AuthClient = typeof authClient;
export type Session = any;
export type User = any;

// Helper function to check if user is authenticated
export const isAuthenticated = (): boolean => {
  const snapshot = (authClient as any).$getSnapshot?.();
  return snapshot?.session !== null;
};

// Helper function to get current user
export const getCurrentUser = (): User | null => {
  const snapshot = (authClient as any).$getSnapshot?.();
  return snapshot?.user || null;
};

// Helper function to get current session
export const getCurrentSession = (): Session | null => {
  const snapshot = (authClient as any).$getSnapshot?.();
  return snapshot?.session || null;
};
