// lib/auth-client.ts - Better Auth client configuration for React Native/Expo
import { createAuthClient } from "better-auth/client";
import { Platform } from 'react-native';

const LOCAL_API_URLS = new Set([
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://10.0.2.2:3000',
]);

// Get base URL from environment or default
// Handles all platforms: iOS, Android, Web
const getBaseUrl = () => {
  const configuredUrl = process.env.EXPO_PUBLIC_API_URL?.trim();

  // Default for local development
  if (__DEV__) {
    // Use explicit non-localhost URLs when provided so teams can point at a shared API.
    if (configuredUrl && !LOCAL_API_URLS.has(configuredUrl)) {
      return configuredUrl;
    }

    // Android emulator routes to host machine via 10.0.2.2
    if (Platform.OS === 'android') {
      return 'http://10.0.2.2:3000';
    }

    // iOS simulator and web/desktop can use localhost
    return 'http://localhost:3000';
  }

  // Production fallback
  return configuredUrl || 'https://api.safeauth.com';
};

export const authClient = createAuthClient({
  baseURL: getBaseUrl(),
  fetchOptions: {
    timeout: 1800000, // 30 minutes
  },
});

// Export types for TypeScript
export type AuthClient = typeof authClient;
