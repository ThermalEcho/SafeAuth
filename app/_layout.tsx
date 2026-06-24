import { AppLockScreen } from "@/components/app-lock-screen";
import {
  getSafeAuthPalette,
  SafeAuthThemeProvider,
} from "@/components/safeauth-theme";
import { GluestackUIProvider } from "@/components/ui/gluestack-ui-provider";
import { authClient, subscribeAuthState } from "@/lib/auth-client";
import {
  getAppLockSettings,
  getThemePreference,
  isAppLockEnabled,
  subscribeAppLockSettings,
  subscribeThemePreference,
  type AppLockSettings,
  type ThemePreference,
} from "@/lib/app-settings";
import "@/global.css";
import { DarkTheme, DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { Stack } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, AppState, useColorScheme, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

export default function RootLayout() {
  const systemColorScheme = useColorScheme();
  const [themePreference, setThemePreference] = useState<ThemePreference>("system");
  const [appLockSettings, setAppLockSettings] = useState<AppLockSettings>({
    biometricsEnabled: false,
    pinEnabled: false,
  });
  const [appUnlocked, setAppUnlocked] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function loadSession(): Promise<void> {
      try {
        const response = await authClient.getSession();

        if (mounted) {
          const hasSession = !response.error && Boolean(response.data?.user);
          setIsLoggedIn(hasSession);

          if (hasSession) {
            const lockSettings = await getAppLockSettings();
            setAppLockSettings(lockSettings);
            setAppUnlocked(!isAppLockEnabled(lockSettings));
          } else {
            setAppUnlocked(true);
          }
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    void loadSession();
    const unsubscribe = subscribeAuthState(() => {
      void loadSession();
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    async function loadThemePreference(): Promise<void> {
      const preference = await getThemePreference();
      if (mounted) {
        setThemePreference(preference);
      }
    }

    void loadThemePreference();
    const unsubscribe = subscribeThemePreference(() => {
      void loadThemePreference();
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!isLoggedIn) return;

    let mounted = true;

    async function loadAppLockSettings(): Promise<void> {
      const lockSettings = await getAppLockSettings();
      if (mounted) {
        setAppLockSettings(lockSettings);
      }
    }

    const unsubscribe = subscribeAppLockSettings(() => {
      void loadAppLockSettings();
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, [isLoggedIn]);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextState) => {
      if (
        isLoggedIn &&
        isAppLockEnabled(appLockSettings) &&
        (nextState === "background" || nextState === "inactive")
      ) {
        setAppUnlocked(false);
      }
    });

    return () => subscription.remove();
  }, [appLockSettings, isLoggedIn]);

  const resolvedTheme =
    themePreference === "system"
      ? systemColorScheme === "dark"
        ? "dark"
        : "light"
      : themePreference;
  const palette = getSafeAuthPalette(resolvedTheme);

  const navigationTheme = useMemo(() => {
    const baseTheme = resolvedTheme === "dark" ? DarkTheme : DefaultTheme;

    return {
      ...baseTheme,
      colors: {
        ...baseTheme.colors,
        background: palette.background,
        border: palette.border,
        card: palette.navigation,
        notification: palette.danger,
        primary: palette.accent,
        text: palette.ink,
      },
      dark: resolvedTheme === "dark",
    };
  }, [palette, resolvedTheme]);

  const shouldShowAppLock =
    isLoggedIn && isAppLockEnabled(appLockSettings) && !appUnlocked;

  return (
    <SafeAreaProvider>
      <ThemeProvider value={navigationTheme}>
        <GluestackUIProvider mode={resolvedTheme}>
          <SafeAuthThemeProvider mode={resolvedTheme}>
            {loading ? (
              <View
                style={{
                  alignItems: "center",
                  backgroundColor: palette.background,
                  flex: 1,
                  justifyContent: "center",
                }}
              >
                <ActivityIndicator color={palette.accent} />
              </View>
            ) : shouldShowAppLock ? (
              <AppLockScreen
                settings={appLockSettings}
                onUnlocked={() => setAppUnlocked(true)}
              />
            ) : (
              <Stack screenOptions={{ contentStyle: { backgroundColor: palette.background }, headerShown: false }}>
                <Stack.Protected guard={!isLoggedIn}>
                  <Stack.Screen name="index" />
                  <Stack.Screen name="sign-in" />
                  <Stack.Screen name="create-account" />
                </Stack.Protected>
                <Stack.Protected guard={isLoggedIn}>
                  <Stack.Screen name="home" />
                  <Stack.Screen name="camera" />
                  <Stack.Screen name="otp" />
                  <Stack.Screen name="otp-create" />
                  <Stack.Screen name="settings" />
                  <Stack.Screen name="theme-settings" />
                  <Stack.Screen name="security-settings" />
                </Stack.Protected>
              </Stack>
            )}
          </SafeAuthThemeProvider>
        </GluestackUIProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}