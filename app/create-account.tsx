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
import { authClient, getEmailVerificationCallbackUrl } from "@/lib/auth-client";
import { showAlert, showAlertWithAction, validateEmail } from "@/lib/auth-utils";
import { router } from "expo-router";
import React, { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView } from "react-native";

const MIN_PASSWORD_LENGTH = 8;

export default function CreateAccountScreen(): React.JSX.Element {
  const { colors } = useSafeAuthTheme();
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
        callbackURL: getEmailVerificationCallbackUrl(),
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
                Get protected
              </Text>
              <Text className="text-3xl font-black" style={{ color: colors.ink }}>
                Create your account
              </Text>
              <Text className="leading-6" style={{ color: colors.muted }}>
                Use an email address you can verify after sign up.
              </Text>
            </VStack>

            <VStack className="gap-4">
              <Field label="Full name" autoComplete="name" editable={!loading} onChangeText={setName} placeholder="Your name" value={name} />
              <Field label="Email address" autoCapitalize="none" autoComplete="email" editable={!loading} inputMode="email" keyboardType="email-address" onChangeText={setEmail} placeholder="you@example.com" value={email} />
              <Field label="Password" autoComplete="new-password" editable={!loading} onChangeText={setPassword} placeholder={`At least ${MIN_PASSWORD_LENGTH} characters`} secureTextEntry value={password} />
            </VStack>

            <PrimaryButton loading={loading} onPress={() => void handleSignUp()}>
              {loading ? "Creating account" : "Create secure account"}
            </PrimaryButton>

            <Pressable className="items-center rounded-xl py-2" onPress={() => router.push("/sign-in")}>
              <Text className="font-bold" style={{ color: colors.accent }}>
                Already registered? Sign in
              </Text>
            </Pressable>
          </Surface>
        </VStack>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
