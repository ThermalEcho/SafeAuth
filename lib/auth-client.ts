// lib/auth-client.ts - Better Auth client configuration for React Native/Expo
import { createAuthClient } from "better-auth/client";
import { Platform } from "react-native";

const LOCAL_API_URLS = new Set([
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "http://10.0.2.2:3000",
]);

const getConfiguredApiUrl = (): string | undefined => {
  const apiUrl = process.env.EXPO_PUBLIC_API_URL?.trim();
  const renderUrl = process.env.EXPO_PUBLIC_RENDER_API_URL?.trim();
  
  console.log("[Auth] Env vars - EXPO_PUBLIC_API_URL:", apiUrl, "EXPO_PUBLIC_RENDER_API_URL:", renderUrl);
  
  return apiUrl || renderUrl || undefined;
};

const isLocalApiUrl = (url: string): boolean => {
  return LOCAL_API_URLS.has(url);
};

// Resolve the API base URL for local development or Render deployment.
const getBaseUrl = (): string => {
  const configuredUrl = getConfiguredApiUrl();

  if (configuredUrl) {
    if (Platform.OS === "android" && isLocalApiUrl(configuredUrl)) {
      console.log("[Auth] Using Android emulator localhost: http://10.0.2.2:3000");
      return "http://10.0.2.2:3000";
    }

    console.log("[Auth] Using configured API URL:", configuredUrl);
    return configuredUrl;
  }

  if (__DEV__) {
    const devUrl = Platform.OS === "android" ? "http://10.0.2.2:3000" : "http://localhost:3000";
    console.log("[Auth] Using development URL:", devUrl);
    return devUrl;
  }

  const errorMsg =
    "EXPO_PUBLIC_API_URL is required in production. Set it to your Render backend URL, such as https://safeauth-backend.onrender.com.";
  console.error("[Auth] Configuration error:", errorMsg);
  throw new Error(errorMsg);
};

const baseUrl = getBaseUrl();
console.log("[Auth] Final baseURL:", baseUrl);
console.log("[Auth] Platform:", Platform.OS);

export const authClient = createAuthClient({
  baseURL: baseUrl,
  // CRITICAL for React Native/Expo: disable default browser-specific fetch plugins
  // that don't work in native environments
  disableDefaultFetchPlugins: true,
  fetchOptions: {
    timeout: 30000,
    // Log fetch requests for debugging
    onRequest: async (request) => {
      console.log("[Auth Fetch] →", request.method, request.url);
      return request;
    },
    onResponse: async (response) => {
      console.log("[Auth Fetch] ←", response.status, response.statusText, response.url);
      return response;
    },
    onError: async (error) => {
      console.error("[Auth Fetch] ✗ Error:", error instanceof Error ? error.message : error);
      throw error;
    },
  },
});

// Export types for TypeScript
export type AuthClient = typeof authClient;
