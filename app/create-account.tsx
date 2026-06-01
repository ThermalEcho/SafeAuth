import { authClient } from "@/lib/auth-client";
import { showAlert, showAlertWithAction, validateEmail } from "@/lib/auth-utils";
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

const MIN_PASSWORD_LENGTH = 8;

export default function CreateAccountScreen(): React.JSX.Element {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  function validateForm(): string | null {
    if (!name.trim()) return "Please enter your full name.";
    if (!email.trim()) return "Please enter your email address.";
    if (!validateEmail(email)) return "Please enter a valid email address.";
    if (password.length < MIN_PASSWORD_LENGTH) {
      return `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
    }

    return null;
  }

  async function handleSignUp(): Promise<void> {
    const validationMessage = validateForm();

    if (validationMessage) {
      showAlert("Validation error", validationMessage);
      return;
    }

    setLoading(true);

    try {
      const response = await authClient.signUp.email({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
      });

      if (response.error) {
        showAlert("Sign up failed", response.error.message ?? "Failed to create account.");
        return;
      }

      showAlertWithAction("Account created", "Check your email to verify your account.", () => {
        setName("");
        setEmail("");
        setPassword("");
        router.replace("/sign-in");
      });
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
            <Text style={styles.title}>Create account</Text>
            <Text style={styles.subtitle}>Use an email you can verify after sign up.</Text>

            <TextInput
              autoComplete="name"
              editable={!loading}
              onChangeText={setName}
              placeholder="Full name"
              placeholderTextColor="#7c8798"
              style={styles.input}
              value={name}
            />

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
              autoComplete="new-password"
              editable={!loading}
              onChangeText={setPassword}
              placeholder="Password"
              placeholderTextColor="#7c8798"
              secureTextEntry
              style={styles.input}
              value={password}
            />

            <Text style={styles.hint}>Use at least {MIN_PASSWORD_LENGTH} characters.</Text>

            <Pressable
              disabled={loading}
              onPress={handleSignUp}
              style={[styles.primaryButton, loading && styles.disabledButton]}
            >
              <Text style={styles.primaryButtonText}>
                {loading ? "Creating..." : "Create account"}
              </Text>
            </Pressable>

            <Pressable onPress={() => router.push("/sign-in")} style={styles.linkButton}>
              <Text style={styles.linkButtonText}>Sign in instead</Text>
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
  hint: {
    color: "#667085",
    fontSize: 13,
    lineHeight: 20,
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
