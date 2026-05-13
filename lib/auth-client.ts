// lib/auth-client.ts - Better Auth client configuration for React Native/Expo
import { createAuthClient } from "better-auth/client";
import { Platform } from "react-native";

const LOCAL_API_URLS = new Set([
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "http://10.0.2.2:3000",
]);

const getConfiguredApiUrl = (): string | undefined => {
  return (
    process.env.EXPO_PUBLIC_API_URL?.trim() ||
    process.env.EXPO_PUBLIC_RENDER_API_URL?.trim() ||
    undefined
  );
};

const isLocalApiUrl = (url: string): boolean => {
  return LOCAL_API_URLS.has(url);
};

// Resolve the API base URL for local development or Render deployment.
const getBaseUrl = (): string => {
  const configuredUrl = getConfiguredApiUrl();

  if (configuredUrl) {
    if (Platform.OS === "android" && isLocalApiUrl(configuredUrl)) {
      return "http://10.0.2.2:3000";
    }

    return configuredUrl;
  }

  if (__DEV__) {
    if (Platform.OS === "android") {
      return "http://10.0.2.2:3000";
    }

    return "http://localhost:3000";
  }

  throw new Error(
    "EXPO_PUBLIC_API_URL is required in production. Set it to your Render backend URL, such as https://safeauth-backend.onrender.com."
  );
};

export const authClient = createAuthClient({
  baseURL: getBaseUrl(),
  fetchOptions: {
    timeout: 30000,
  },
});

// Export types for TypeScript
export type AuthClient = typeof authClient;
