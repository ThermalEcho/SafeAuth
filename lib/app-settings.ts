import type * as ExpoSecureStore from "expo-secure-store";
import { Platform } from "react-native";

declare const require: (moduleName: string) => unknown;

export type ThemePreference = "system" | "light" | "dark";

export type AppLockSettings = {
  biometricsEnabled: boolean;
  pinEnabled: boolean;
};

const THEME_KEY = "safeauth.theme";
const APP_LOCK_KEY = "safeauth.app-lock";
const PIN_KEY = "safeauth.app-lock.pin";

const fallbackStorage = new Map<string, string>();
const themeListeners = new Set<() => void>();
const appLockListeners = new Set<() => void>();
let secureStoreModule: typeof ExpoSecureStore | null | undefined;
let secureStoreAvailabilityPromise: Promise<boolean> | null = null;

const defaultAppLockSettings: AppLockSettings = {
  biometricsEnabled: false,
  pinEnabled: false,
};

function getSecureStore(): typeof ExpoSecureStore | null {
  if (Platform.OS === "web") return null;
  if (secureStoreModule !== undefined) return secureStoreModule;

  try {
    secureStoreModule = require("expo-secure-store") as typeof ExpoSecureStore;
  } catch {
    secureStoreModule = null;
  }

  return secureStoreModule;
}

async function isNativeSecureStoreAvailable(): Promise<boolean> {
  const SecureStore = getSecureStore();
  if (!SecureStore) {
    secureStoreAvailabilityPromise = null;
    return false;
  }

  secureStoreAvailabilityPromise ??= SecureStore.isAvailableAsync().catch(() => false);
  return secureStoreAvailabilityPromise;
}

async function readItem(key: string): Promise<string | null> {
  if (Platform.OS === "web" && typeof localStorage !== "undefined") {
    return localStorage.getItem(key);
  }

  const SecureStore = (await isNativeSecureStoreAvailable()) ? getSecureStore() : null;
  if (SecureStore) {
    return SecureStore.getItemAsync(key);
  }

  return fallbackStorage.get(key) ?? null;
}

async function writeItem(key: string, value: string): Promise<void> {
  if (Platform.OS === "web" && typeof localStorage !== "undefined") {
    localStorage.setItem(key, value);
    return;
  }

  const SecureStore = (await isNativeSecureStoreAvailable()) ? getSecureStore() : null;
  if (SecureStore) {
    await SecureStore.setItemAsync(key, value);
    return;
  }

  fallbackStorage.set(key, value);
}

async function deleteItem(key: string): Promise<void> {
  if (Platform.OS === "web" && typeof localStorage !== "undefined") {
    localStorage.removeItem(key);
    return;
  }

  const SecureStore = (await isNativeSecureStoreAvailable()) ? getSecureStore() : null;
  if (SecureStore) {
    await SecureStore.deleteItemAsync(key);
    return;
  }

  fallbackStorage.delete(key);
}

function notify(listeners: Set<() => void>): void {
  listeners.forEach((listener) => listener());
}

function parseThemePreference(value: string | null): ThemePreference {
  return value === "light" || value === "dark" || value === "system" ? value : "system";
}

function parseAppLockSettings(value: string | null): AppLockSettings {
  if (!value) return defaultAppLockSettings;

  try {
    const parsed = JSON.parse(value) as Partial<AppLockSettings>;
    return {
      biometricsEnabled: parsed.biometricsEnabled === true,
      pinEnabled: parsed.pinEnabled === true,
    };
  } catch {
    return defaultAppLockSettings;
  }
}

export function isAppLockEnabled(settings: AppLockSettings): boolean {
  return settings.pinEnabled || settings.biometricsEnabled;
}

export async function getThemePreference(): Promise<ThemePreference> {
  return parseThemePreference(await readItem(THEME_KEY));
}

export async function setThemePreference(preference: ThemePreference): Promise<void> {
  await writeItem(THEME_KEY, preference);
  notify(themeListeners);
}

export function subscribeThemePreference(listener: () => void): () => void {
  themeListeners.add(listener);
  return () => themeListeners.delete(listener);
}

export async function getAppLockSettings(): Promise<AppLockSettings> {
  return parseAppLockSettings(await readItem(APP_LOCK_KEY));
}

export async function saveAppLockSettings(settings: AppLockSettings): Promise<void> {
  await writeItem(APP_LOCK_KEY, JSON.stringify(settings));
  notify(appLockListeners);
}

export function subscribeAppLockSettings(listener: () => void): () => void {
  appLockListeners.add(listener);
  return () => appLockListeners.delete(listener);
}

export async function savePin(pin: string): Promise<void> {
  await writeItem(PIN_KEY, pin);
}

export async function clearPin(): Promise<void> {
  await deleteItem(PIN_KEY);
}

export async function hasStoredPin(): Promise<boolean> {
  return Boolean(await readItem(PIN_KEY));
}

export async function verifyPin(pin: string): Promise<boolean> {
  return (await readItem(PIN_KEY)) === pin;
}
