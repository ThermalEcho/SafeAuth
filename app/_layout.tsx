import { authClient, subscribeAuthState } from "@/lib/auth-client";
import { Stack } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

export default function RootLayout() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function loadSession(): Promise<void> {
      try {
        const response = await authClient.getSession();

        if (mounted) {
          setIsLoggedIn(!response.error && Boolean(response.data?.user));
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

  if (loading) {
    return (
      <SafeAreaProvider>
        <View style={{ alignItems: "center", flex: 1, justifyContent: "center" }}>
          <ActivityIndicator color="#174ea6" />
        </View>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Protected guard={!isLoggedIn}>
          <Stack.Screen name="index" />
          <Stack.Screen name="sign-in" />
          <Stack.Screen name="create-account" />
        </Stack.Protected>
        <Stack.Protected guard={isLoggedIn}>
          <Stack.Screen name="home" />
          <Stack.Screen name="otp" />
        </Stack.Protected>
      </Stack>
    </SafeAreaProvider>
  );
}
