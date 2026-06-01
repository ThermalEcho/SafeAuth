import { ThemeToggle } from "@/components/ThemeToggle";
import { Box } from "@/components/ui/box";
import { Button, ButtonText } from "@/components/ui/button";
import { Heading } from "@/components/ui/heading";
import { HStack } from "@/components/ui/hstack";
import { Input, InputField, InputSlot } from "@/components/ui/input";
import { SafeAreaView } from "@/components/ui/safe-area-view";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { authClient } from "@/lib/auth-client";
import { showAlert, showAlertWithAction, validateEmail } from "@/lib/auth-utils";
import { router } from "expo-router";
import { ArrowLeft, Fingerprint, Lock, Mail, User } from "lucide-react-native";
import React, { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StatusBar } from "react-native";

// -----------------------------------------------------------------------------
// Screen constants
// -----------------------------------------------------------------------------

const MIN_PASSWORD_LENGTH = 8;
const SIGN_UP_REQUEST_TIMEOUT_MS = 60000;
const INPUT_PLACEHOLDER_COLOR = "#7C8798";
const TITLE = "Create your account";
const SUBTITLE = "Set up secure access in a few taps.";
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
  try {
    console.log("[SignUp] Starting sign-up...");
    console.log("[SignUp] Form values:", { name: values.name, email: values.email });
    
    const response = await authClient.signUp.email({
      name: values.name.trim(),
      email: values.email.trim().toLowerCase(),
      password: values.password,
    });

    console.log("[SignUp] Response object:", response);
    
    if (response.error) {
      console.error("[SignUp] Auth error:", response.error);
      return {
        message:
          response.error.message ?? response.error.statusText ?? GENERIC_SIGN_UP_ERROR_MESSAGE,
      };
    } else {
      console.log("[SignUp] Sign-up successful:", response.data);
      return null;
    }
  } catch (err: unknown) {
    console.error("[SignUp] Network/request error:", err);
    if (err instanceof Error) {
      console.error("[SignUp] Error details:", {
        name: err.name,
        message: err.message,
        cause: (err as any).cause,
      });
      console.error("[SignUp] Stack:", err.stack);
    }
    throw err;
  }
}

/**
 * Create-account screen for new users.
 *
 * @returns The rendered React Native sign-up screen.
 */
export default function CreateAccountScreen(): React.JSX.Element {
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
      const errorMessage = getErrorMessage(error);
      console.error("[SignUp Handler] Caught error:", errorMessage);
      
      // Show more helpful error message for network issues
      if (errorMessage.includes("Aborted") || errorMessage.toLowerCase().includes("network")) {
        showAlert(
          "Connection Failed",
          "Cannot reach the backend server.\n\nPlease ensure:\n1. Backend is running (npm run dev)\n2. Check internet connection\n3. Verify EXPO_PUBLIC_API_URL in .env"
        );
      } else if (errorMessage.includes("timeout")) {
        showAlert(
          "Request Timeout",
          "The server took too long to respond. Try again or restart the backend server."
        );
      } else {
        showAlert("Error", errorMessage);
      }
    } finally {
      clearTimeout(timeoutId);
      setLoading(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-[#F5F7FB]" edges={["top", "bottom"]}>
      <StatusBar barStyle="dark-content" backgroundColor="#F5F7FB" />

      <Box className="absolute -right-20 top-12 h-64 w-64 rounded-full bg-primary-500/10" />
      <Box className="absolute -left-24 bottom-10 h-72 w-72 rounded-full bg-secondary-400/20" />

      <Box className="px-6 pt-4">
        <Box className="flex-row items-center justify-between">
          <Button variant="link" action="primary" className="px-0" onPress={() => router.back()}>
            <HStack className="items-center">
              <ArrowLeft size={18} color="#2563eb" />
              <ButtonText className="text-base text-primary-600">Back</ButtonText>
            </HStack>
          </Button>

          <ThemeToggle />
        </Box>
      </Box>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView
          className="flex-1"
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ flexGrow: 1 }}
        >
          <Box className="flex-1 justify-center px-6 py-8">
            <VStack space="xl" className="w-full max-w-md self-center">
              <Box className="items-center">
                <Box className="h-24 w-24 items-center justify-center rounded-[28px] bg-primary-500 shadow-sm">
                  <Fingerprint size={42} color="#ffffff" />
                </Box>

                <Heading size="2xl" className="mt-5 text-center text-typography-900">
                  {TITLE}
                </Heading>

                <Text className="mt-3 text-center text-base leading-7 text-typography-500">
                  {SUBTITLE}
                </Text>
              </Box>

              <Box className="w-full rounded-[30px] border border-outline-200 bg-background-0/95 p-5 shadow-sm">
                <VStack space="md" className="w-full">
                  <Input>
                    <InputSlot className="mr-3">
                      <User size={18} color="#6B7280" />
                    </InputSlot>
                    <InputField
                      value={name}
                      onChangeText={setName}
                      placeholder="Full name"
                      placeholderTextColor={INPUT_PLACEHOLDER_COLOR}
                      className="text-typography-900"
                      editable={!loading}
                      returnKeyType="next"
                    />
                  </Input>

                  <Input>
                    <InputSlot className="mr-3">
                      <Mail size={18} color="#6B7280" />
                    </InputSlot>
                    <InputField
                      value={email}
                      onChangeText={setEmail}
                      placeholder="Email address"
                      placeholderTextColor={INPUT_PLACEHOLDER_COLOR}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      className="text-typography-900"
                      editable={!loading}
                      returnKeyType="next"
                    />
                  </Input>

                  <Input>
                    <InputSlot className="mr-3">
                      <Lock size={18} color="#6B7280" />
                    </InputSlot>
                    <InputField
                      value={password}
                      onChangeText={setPassword}
                      placeholder="Password"
                      placeholderTextColor={INPUT_PLACEHOLDER_COLOR}
                      secureTextEntry
                      className="text-typography-900"
                      editable={!loading}
                      returnKeyType="done"
                    />
                  </Input>

                  <Text className="px-1 text-xs leading-5 text-typography-500">
                    {ACCOUNT_CREATE_HINT}. We will email a verification link after sign up.
                  </Text>

                  <Button
                    variant="solid"
                    size="lg"
                    action="primary"
                    disabled={loading}
                    onPress={handleSignUp}
                    className="h-14 rounded-[20px]"
                  >
                    <ButtonText>{loading ? SIGN_UP_LOADING_LABEL : SIGN_UP_BUTTON_LABEL}</ButtonText>
                  </Button>

                  <Button
                    variant="link"
                    action="primary"
                    className="self-center px-0"
                    onPress={() => router.push(SIGN_IN_ROUTE)}
                  >
                    <ButtonText className="text-base text-primary-600">
                      {NAVIGATE_TO_SIGN_IN_LABEL}
                    </ButtonText>
                  </Button>
                </VStack>
              </Box>
            </VStack>
          </Box>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}