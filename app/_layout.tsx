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
import React, { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { AppState, useColorScheme } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

type AuthStatus = "checking" | "signed-in" | "signed-out";
type SessionResponse = Awaited<ReturnType<typeof authClient.getSession>>;

const STARTUP_SESSION_TIMEOUT_MS = 2500;
const LazyAppLockScreen = React.lazy(async () => {
  const module = await import("@/components/app-lock-screen");
  return { default: module.AppLockScreen };
});

function createStartupTimeout(): Promise<"timeout"> {
  return new Promise((resolve) => {
    setTimeout(() => resolve("timeout"), STARTUP_SESSION_TIMEOUT_MS);
  });
}

export default function RootLayout() {
  const systemColorScheme = useColorScheme();
  const sessionRequestId = useRef(0);
  const [themePreference, setThemePreference] = useState<ThemePreference>("system");
  const [appLockSettings, setAppLockSettings] = useState<AppLockSettings>({
    biometricsEnabled: false,
    pinEnabled: false,
  });
  const [appUnlocked, setAppUnlocked] = useState(true);
  const [authStatus, setAuthStatus] = useState<AuthStatus>("checking");

  useEffect(() => {
    let mounted = true;

    async function applySessionResponse(
      response: SessionResponse,
      requestId: number,
    ): Promise<void> {
      if (!mounted || requestId !== sessionRequestId.current) return;

      const hasSession = !response.error && Boolean(response.data?.user);

      if (!hasSession) {
        setAppUnlocked(true);
        setAuthStatus("signed-out");
        return;
      }

      const lockSettings = await getAppLockSettings();
      if (!mounted || requestId !== sessionRequestId.current) return;

      setAppLockSettings(lockSettings);
      setAppUnlocked(!isAppLockEnabled(lockSettings));
      setAuthStatus("signed-in");
    }

    async function markSignedOut(requestId: number): Promise<void> {
      if (!mounted || requestId !== sessionRequestId.current) return;
      setAppUnlocked(true);
      setAuthStatus("signed-out");
    }

    async function loadSession(useStartupTimeout: boolean): Promise<void> {
      const requestId = sessionRequestId.current + 1;
      sessionRequestId.current = requestId;
      const sessionPromise = authClient.getSession();

      try {
        const response = useStartupTimeout
          ? await Promise.race([sessionPromise, createStartupTimeout()])
          : await sessionPromise;

        if (response === "timeout") {
          await markSignedOut(requestId);
          void sessionPromise
            .then((lateResponse) => applySessionResponse(lateResponse, requestId))
            .catch(() => markSignedOut(requestId));
          return;
        }

        await applySessionResponse(response, requestId);
      } catch {
        await markSignedOut(requestId);
      }
    }

    void loadSession(true);
    const unsubscribe = subscribeAuthState(() => {
      void loadSession(false);
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

  const isLoggedIn = authStatus === "signed-in";

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
            {shouldShowAppLock ? (
              <Suspense fallback={null}>
                <LazyAppLockScreen
                  settings={appLockSettings}
                  onUnlocked={() => setAppUnlocked(true)}
                />
              </Suspense>
            ) : (
              <Stack
                screenOptions={{
                  contentStyle: { backgroundColor: palette.background },
                  headerShown: false,
                }}
              >
                <Stack.Protected guard={authStatus !== "signed-in"}>
                  <Stack.Screen name="index" />
                  <Stack.Screen name="sign-in" />
                  <Stack.Screen name="create-account" />
                  <Stack.Screen name="verify-email" />
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