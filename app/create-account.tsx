import { ThemeToggle } from "@/components/ThemeToggle";
import { Button, ButtonText } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { showAlert, showAlertWithAction, validateEmail } from "@/lib/auth-utils";
import { router } from "expo-router";
import { Lock, Mail, User } from "lucide-react-native";
import React, { useState } from "react";
import {
    Image,
    KeyboardAvoidingView,
    Platform,
    Text,
    TextInput,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// -----------------------------------------------------------------------------
// Screen constants
// -----------------------------------------------------------------------------

const MIN_PASSWORD_LENGTH = 8;
const SIGN_UP_REQUEST_TIMEOUT_MS = 30000;
const INPUT_PLACEHOLDER_COLOR = "#888";
const TITLE = "Create Account";
const SUBTITLE = "Secure your identity in seconds";
const SIGN_UP_BUTTON_LABEL = "Create Account";
const SIGN_UP_LOADING_LABEL = "Creating...";
const NAVIGATE_TO_SIGN_IN_LABEL = "Sign In";
const SIGN_UP_TIMEOUT_MESSAGE = "Request took too long. Check your connection.";
const VALIDATION_ERROR_TITLE = "Validation Error";
const SIGN_UP_ERROR_TITLE = "Sign Up Error";
const SIGN_UP_SUCCESS_TITLE = "Account Created!";
const GENERIC_SIGN_UP_ERROR_MESSAGE = "Failed to create account";
const SIGN_IN_ROUTE = "/";
const EMAIL_VERIFICATION_MESSAGE_SUFFIX = "Check your inbox to verify.";
const ACCOUNT_CREATE_HINT = `Use at least ${MIN_PASSWORD_LENGTH} characters`;

interface SignUpFormValues {
  name: string;
  email: string;
  password: string;
}

/**
 * Returns a readable error message for unknown thrown values.
 *
 * @param error - The thrown value from the sign-up flow.
 * @returns A string that can be shown to the user in an alert.
 */
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return GENERIC_SIGN_UP_ERROR_MESSAGE;
}

/**
 * Validates the sign-up form and returns the first human-readable error.
 *
 * @param values - The current sign-up form values.
 * @returns A validation message when the form is invalid, otherwise `null`.
 */
function validateSignUpForm(values: SignUpFormValues): string | null {
  if (!values.name.trim()) {
    return "Please enter your full name";
  }

  if (!values.email.trim()) {
    return "Please enter your email address";
  }

  if (!validateEmail(values.email)) {
    return "Please enter a valid email address";
  }

  if (!values.password) {
    return "Please enter a password";
  }

  if (values.password.length < MIN_PASSWORD_LENGTH) {
    return `Password must be at least ${MIN_PASSWORD_LENGTH} characters`;
  }

  return null;
}

/**
 * Signs a user up with Better Auth.
 *
 * @param values - The sanitized form values.
 * @returns The Better Auth error object or `null` when sign-up succeeds.
 */
async function submitSignUp(values: SignUpFormValues): Promise<{ message: string } | null> {
  const { error } = await authClient.signUp.email({
    name: values.name.trim(),
    email: values.email.trim().toLowerCase(),
    password: values.password,
  });

  return error ?? null;
}

/**
 * Create-account screen for new users.
 *
 * @returns The rendered React Native sign-up screen.
 */
export default function CreateAccountScreen(): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const [name, setName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  /**
   * Validates local form state and sends the sign-up request.
   */
  async function handleSignUp(): Promise<void> {
    const validationMessage = validateSignUpForm({ name, email, password });

    if (validationMessage !== null) {
      showAlert(VALIDATION_ERROR_TITLE, validationMessage);
      return;
    }

    setLoading(true);

    const timeoutId = setTimeout(() => {
      setLoading(false);
      showAlert("Timeout", SIGN_UP_TIMEOUT_MESSAGE);
    }, SIGN_UP_REQUEST_TIMEOUT_MS);

    try {
      const authError = await submitSignUp({ name, email, password });

      if (authError !== null) {
        showAlert(SIGN_UP_ERROR_TITLE, authError.message);
        return;
      }

      showAlertWithAction(
        SIGN_UP_SUCCESS_TITLE,
        `Verification email sent to ${email}. ${EMAIL_VERIFICATION_MESSAGE_SUFFIX}`,
        () => {
          setName("");
          setEmail("");
          setPassword("");
          router.replace(SIGN_IN_ROUTE);
        }
      );
    } catch (error: unknown) {
      showAlert("Error", getErrorMessage(error));
    } finally {
      clearTimeout(timeoutId);
      setLoading(false);
    }
  }

  return (
    <View style={{ paddingTop: insets.top }} className="flex-1 bg-background-0">
      <View className="flex-row justify-end px-6 py-4">
        <ThemeToggle />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1"
      >
        <View className="flex-1 justify-center px-6">
          <View className="mb-10 items-center">
            <View className="mb-3 h-20 w-20 items-center justify-center rounded-full bg-primary-500/10">
              <Image
                source={require("@/assets/images/Logo.png")}
                style={{ width: 64, height: 64 }}
                resizeMode="contain"
              />
            </View>

            <Text className="text-3xl font-bold text-typography-900">
              {TITLE}
            </Text>

            <Text className="mt-2 text-center text-typography-500">
              {SUBTITLE}
            </Text>
          </View>

          <View className="w-full gap-4">
            <View className="flex-row items-center rounded-xl border border-outline-200 bg-background-50 px-4 py-3">
              <User size={18} className="mr-2 text-typography-500" />
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Full name"
                placeholderTextColor={INPUT_PLACEHOLDER_COLOR}
                className="flex-1 text-typography-900"
                editable={!loading}
              />
            </View>

            <View className="flex-row items-center rounded-xl border border-outline-200 bg-background-50 px-4 py-3">
              <Mail size={18} className="mr-2 text-typography-500" />
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="Email address"
                placeholderTextColor={INPUT_PLACEHOLDER_COLOR}
                keyboardType="email-address"
                autoCapitalize="none"
                className="flex-1 text-typography-900"
                editable={!loading}
              />
            </View>

            <View className="flex-row items-center rounded-xl border border-outline-200 bg-background-50 px-4 py-3">
              <Lock size={18} className="mr-2 text-typography-500" />
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="Password"
                placeholderTextColor={INPUT_PLACEHOLDER_COLOR}
                secureTextEntry
                className="flex-1 text-typography-900"
                editable={!loading}
              />
            </View>

            <Text className="px-1 text-xs text-typography-500">
              {ACCOUNT_CREATE_HINT}
            </Text>

            <Button
              variant="solid"
              size="lg"
              action="primary"
              isDisabled={loading}
              onPress={handleSignUp}
            >
              <ButtonText>{loading ? SIGN_UP_LOADING_LABEL : SIGN_UP_BUTTON_LABEL}</ButtonText>
            </Button>

            <View className="mt-6 flex-row justify-center">
              <Text className="text-typography-500">Already have an account?{" "}</Text>
              <Text
                className="font-semibold text-primary-500"
                onPress={() => router.push(SIGN_IN_ROUTE)}
              >
                {NAVIGATE_TO_SIGN_IN_LABEL}
              </Text>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}