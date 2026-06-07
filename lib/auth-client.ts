import { createAuthClient } from "better-auth/client";
import { Platform } from "react-native";

const LOCAL_API_URLS = new Set([
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "http://10.0.2.2:3000",
]);
const FALLBACK_PRODUCTION_API_URL = "https://safeauth-backend.onrender.com";
let bearerToken = "";

const getConfiguredApiUrl = (): string | undefined => {
  const apiUrl = process.env.EXPO_PUBLIC_API_URL?.trim();
  const renderUrl = process.env.EXPO_PUBLIC_RENDER_API_URL?.trim();

  return apiUrl || renderUrl || undefined;
};

const isLocalApiUrl = (url: string): boolean => {
  return LOCAL_API_URLS.has(url);
};

// Resolve the API base URL for local development or Render deployment.
export const getAuthBaseUrl = (): string => {
  const configuredUrl = getConfiguredApiUrl();

  if (configuredUrl) {
    if (Platform.OS === "android" && isLocalApiUrl(configuredUrl)) {
      return "http://10.0.2.2:3000";
    }

    return configuredUrl;
  }

  if (__DEV__) {
    return Platform.OS === "android" ? "http://10.0.2.2:3000" : "http://localhost:3000";
  }

  return FALLBACK_PRODUCTION_API_URL;
};

const authBaseUrl = getAuthBaseUrl();

export const authClient = createAuthClient({
  baseURL: authBaseUrl,
  disableDefaultFetchPlugins: true,
  fetchOptions: {
    auth: {
      token: () => bearerToken,
      type: "Bearer",
    },
    headers: Platform.OS === "web" ? undefined : {
      Origin: new URL(authBaseUrl).origin,
    },
    timeout: 60000,
  },
});

const authStateListeners = new Set<() => void>();

export function subscribeAuthState(listener: () => void): () => void {
  authStateListeners.add(listener);

  return () => {
    authStateListeners.delete(listener);
  };
}

export function notifyAuthStateChanged(): void {
  for (const listener of authStateListeners) {
    listener();
  }
}

export function setBearerToken(token: string | null | undefined): void {
  bearerToken = token ?? "";
}

export function getAuthHeaders(): Record<string, string> {
  if (!bearerToken) {
    return {};
  }

  return {
    Authorization: `Bearer ${bearerToken}`,
  };
}

export type AuthClient = typeof authClient;
