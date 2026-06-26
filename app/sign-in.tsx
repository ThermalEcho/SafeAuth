import {
  BrandLogo,
  Field,
  PrimaryButton,
  Surface,
  useSafeAuthTheme,
} from "@/components/safeauth-ui";
import { Pressable } from "@/components/ui/pressable";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import {
  authClient,
  getEmailVerificationCallbackUrl,
  notifyAuthStateChanged,
  setBearerToken,
} from "@/lib/auth-client";
import { showAlert, showAlertWithAction } from "@/lib/auth-utils";
import { router } from "expo-router";
import React, { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView } from "react-native";

export default function SignInScreen(): React.JSX.Element {
  const { colors } = useSafeAuthTheme();
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
        callbackURL: getEmailVerificationCallbackUrl(),
      });

      if (response.error) {
        const message = response.error.message ?? "Failed to sign in.";
        showAlert(
          "Sign in failed",
          message.toLowerCase().includes("verify")
            ? "Please verify your email before signing in. We sent another verification email if your account exists."
            : message,
        );
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
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ backgroundColor: colors.background, flex: 1 }}
    >
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ flexGrow: 1, justifyContent: "center", padding: 24 }}
      >
        <VStack className="mx-auto w-full max-w-[520px] gap-6">
          <BrandLogo compact />
          <Surface>
            <VStack className="gap-2">
              <Text className="text-sm font-bold uppercase tracking-[1.5px]" style={{ color: colors.accent }}>
                Welcome back
              </Text>
              <Text className="text-3xl font-black" style={{ color: colors.ink }}>
                Sign in to SafeAuth
              </Text>
              <Text className="leading-6" style={{ color: colors.muted }}>
                Access your protected authenticator codes.
              </Text>
            </VStack>

            <VStack className="gap-4">
              <Field label="Email address" autoCapitalize="none" autoComplete="email" editable={!loading} inputMode="email" keyboardType="email-address" onChangeText={setEmail} placeholder="you@example.com" value={email} />
              <Field label="Password" autoComplete="password" editable={!loading} onChangeText={setPassword} placeholder="Enter your password" secureTextEntry value={password} />
            </VStack>

            <PrimaryButton loading={loading} onPress={() => void handleSignIn()}>
              {loading ? "Signing in" : "Sign in"}
            </PrimaryButton>

            <Pressable className="items-center rounded-xl py-2" onPress={() => router.push("/create-account")}>
              <Text className="font-bold" style={{ color: colors.accent }}>
                New to SafeAuth? Create an account
              </Text>
            </Pressable>
          </Surface>
        </VStack>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
