import { authClient, notifyAuthStateChanged, setBearerToken } from "@/lib/auth-client";
import { showAlert } from "@/lib/auth-utils";
import { router } from "expo-router";
import React, { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function HomeScreen(): React.JSX.Element {
  const [signingOut, setSigningOut] = useState(false);

  async function handleLogout(): Promise<void> {
    setSigningOut(true);

    try {
      const response = await authClient.signOut();

      if (response.error) {
        showAlert("Logout failed", response.error.message ?? "Failed to log out.");
        return;
      }

      setBearerToken(null);
      notifyAuthStateChanged();
      router.replace("/");
    } catch (error: unknown) {
      showAlert("Logout failed", error instanceof Error ? error.message : "Unknown error.");
    } finally {
      setSigningOut(false);
    }
  }

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.container}>
        <View style={styles.panel}>
          <Text style={styles.eyebrow}>Authenticated</Text>
          <Text style={styles.title}>SafeAuth Home</Text>
          <Text style={styles.body}>
            Manage the authenticator codes saved to your SafeAuth account.
          </Text>

          <Pressable style={styles.primaryButton} onPress={() => router.push("/otp")}>
            <Text style={styles.primaryButtonText}>Open OTP codes</Text>
          </Pressable>

          <Pressable style={styles.secondaryButton} onPress={() => router.push("/camera")}>
            <Text style={styles.secondaryButtonText}>Open camera</Text>
          </Pressable>

          <Pressable
            disabled={signingOut}
            onPress={handleLogout}
            style={[styles.logoutButton, signingOut && styles.disabledButton]}
          >
            <Text style={styles.logoutButtonText}>
              {signingOut ? "Logging out..." : "Logout"}
            </Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: "#f6f7fb",
    flex: 1,
  },
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
  },
  panel: {
    backgroundColor: "#ffffff",
    borderColor: "#d8dee9",
    borderRadius: 8,
    borderWidth: 1,
    gap: 14,
    padding: 20,
  },
  eyebrow: {
    color: "#536176",
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0,
    textTransform: "uppercase",
  },
  title: {
    color: "#101828",
    fontSize: 30,
    fontWeight: "800",
    letterSpacing: 0,
  },
  body: {
    color: "#475467",
    fontSize: 16,
    lineHeight: 24,
  },
  primaryButton: {
    alignItems: "center",
    backgroundColor: "#174ea6",
    borderRadius: 8,
    justifyContent: "center",
    marginTop: 12,
    minHeight: 52,
  },
  primaryButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
  },
  secondaryButton: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderColor: "#174ea6",
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 52,
  },
  secondaryButtonText: {
    color: "#174ea6",
    fontSize: 16,
    fontWeight: "700",
  },
  logoutButton: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderColor: "#dc2626",
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 52,
  },
  logoutButtonText: {
    color: "#b42318",
    fontSize: 16,
    fontWeight: "700",
  },
  disabledButton: {
    opacity: 0.7,
  },
});
