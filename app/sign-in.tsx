import { authClient, notifyAuthStateChanged, setBearerToken } from "@/lib/auth-client";
import { showAlert, showAlertWithAction } from "@/lib/auth-utils";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

export default function SignInScreen(): React.JSX.Element {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSignIn(): Promise<void> {
    if (!email.trim() || !password) {
      showAlert("Error", "Please enter email and password.");
      return;
    }

    setLoading(true);

    try {
      const response = await authClient.signIn.email({
        email: email.trim().toLowerCase(),
        password,
      });

      if (response.error) {
        showAlert("Sign in failed", response.error.message ?? "Failed to sign in.");
        return;
      }

      setBearerToken(response.data?.token);
      notifyAuthStateChanged();
      showAlertWithAction("Signed in", "Welcome back.", () => router.replace("/home"));
    } catch (error: unknown) {
      showAlert("Error", error instanceof Error ? error.message : "Unknown error.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.screen}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <Pressable onPress={() => router.back()} hitSlop={12}>
              <Text style={styles.backText}>Back</Text>
            </Pressable>
          </View>

          <View style={styles.form}>
            <Text style={styles.title}>Welcome back</Text>
            <Text style={styles.subtitle}>Sign in with your SafeAuth account.</Text>

            <TextInput
              autoCapitalize="none"
              autoComplete="email"
              editable={!loading}
              inputMode="email"
              keyboardType="email-address"
              onChangeText={setEmail}
              placeholder="Email address"
              placeholderTextColor="#7c8798"
              style={styles.input}
              value={email}
            />

            <TextInput
              autoComplete="password"
              editable={!loading}
              onChangeText={setPassword}
              placeholder="Password"
              placeholderTextColor="#7c8798"
              secureTextEntry
              style={styles.input}
              value={password}
            />

            <Pressable
              disabled={loading}
              onPress={handleSignIn}
              style={[styles.primaryButton, loading && styles.disabledButton]}
            >
              <Text style={styles.primaryButtonText}>{loading ? "Signing in..." : "Sign in"}</Text>
            </Pressable>

            <Pressable onPress={() => router.push("/create-account")} style={styles.linkButton}>
              <Text style={styles.linkButtonText}>Create account</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  screen: {
    backgroundColor: "#f6f7fb",
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 24,
  },
  header: {
    left: 24,
    position: "absolute",
    top: 24,
  },
  backText: {
    color: "#174ea6",
    fontSize: 16,
    fontWeight: "700",
  },
  form: {
    gap: 14,
    width: "100%",
  },
  title: {
    color: "#101828",
    fontSize: 34,
    fontWeight: "800",
    letterSpacing: 0,
  },
  subtitle: {
    color: "#475467",
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 12,
  },
  input: {
    backgroundColor: "#ffffff",
    borderColor: "#cbd5e1",
    borderRadius: 8,
    borderWidth: 1,
    color: "#101828",
    fontSize: 16,
    minHeight: 52,
    paddingHorizontal: 14,
  },
  primaryButton: {
    alignItems: "center",
    backgroundColor: "#174ea6",
    borderRadius: 8,
    justifyContent: "center",
    marginTop: 8,
    minHeight: 52,
  },
  disabledButton: {
    opacity: 0.7,
  },
  primaryButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
  },
  linkButton: {
    alignItems: "center",
    minHeight: 44,
    justifyContent: "center",
  },
  linkButtonText: {
    color: "#174ea6",
    fontSize: 16,
    fontWeight: "700",
  },
});
