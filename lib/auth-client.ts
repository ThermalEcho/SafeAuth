// lib/auth-client.ts - Better Auth client configuration for React Native/Expo
import { createAuthClient } from "better-auth/client";

// Get base URL from environment or default
// Handles all platforms: iOS, Android, Web
const getBaseUrl = () => {
  // For Expo development
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }

  // Default for local development
  if (__DEV__) {
    // Use appropriate host for different platforms
    // Android emulator: 10.0.2.2 routes to host
    // iOS simulator: localhost or 127.0.0.1
    // Web/Desktop: localhost
    return "http://localhost:3000";
  }

  // Production
  return process.env.EXPO_PUBLIC_API_URL || "https://api.safeauth.com";
};

export const authClient = createAuthClient({
  baseURL: getBaseUrl(),
  fetchOptions: {
    timeout: 1800000, // 30 minutes
  },
});

// Export types for TypeScript
export type AuthClient = typeof authClient;
