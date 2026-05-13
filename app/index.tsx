import { ThemeToggle } from "@/components/ThemeToggle";
import { Button, ButtonText } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { showAlert, showAlertWithAction } from "@/lib/auth-utils";
import { router } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    Image,
    Animated as RNAnimated,
    Text,
    TextInput,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// -----------------------------------------------------------------------------
// Screen constants
// -----------------------------------------------------------------------------

const ROTATING_SECURITY_WORDS = ["secure", "private", "encrypted", "protected", "safe"] as const;
const WORD_ROTATION_INTERVAL_MS = 3000;
const WORD_FADE_DURATION_MS = 500;
const SIGN_IN_REQUEST_TIMEOUT_MS = 30000;
const INPUT_PLACEHOLDER_COLOR = "#888";
const LOADING_INDICATOR_COLOR = "#fff";
const APP_NAME = "SafeAuth";
const APP_TAGLINE = "Secure Authentication";
const SIGN_IN_TITLE = "Sign In";
const CREATE_ACCOUNT_TITLE = "Create Account";
const EMPTY_CREDENTIALS_ERROR = "Please enter email and password";
const SIGN_IN_TIMEOUT_MESSAGE = "Request took too long. Check your connection.";
const SIGN_IN_ERROR_TITLE = "Sign In Error";
const SIGN_IN_SUCCESS_TITLE = "Success";
const SIGN_IN_SUCCESS_MESSAGE = "Signed in successfully!";
const GENERIC_SIGN_IN_ERROR_MESSAGE = "Failed to sign in";
const SIGN_IN_SUCCESS_ROUTE = "/(tabs)/home";
const CREATE_ACCOUNT_ROUTE = "/create-account";

interface SignInCredentials {
  email: string;
  password: string;
}

interface RotatingWordState {
  currentWord: string;
  opacity: RNAnimated.Value;
}

/**
 * Returns a user-friendly message for unknown thrown values.
 *
 * @param error - The thrown value from the sign-in flow.
 * @returns A readable error message that can be shown in an alert.
 */
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return GENERIC_SIGN_IN_ERROR_MESSAGE;
}

/**
 * Manages the animated rotating word displayed on the sign-in screen.
 *
 * @param words - The words that should cycle through the hero message.
 * @param intervalMs - The time between word changes.
 * @param fadeDurationMs - The fade out and fade in duration for each change.
 * @returns The current word and its animated opacity value.
 */
function useRotatingSecurityWord(
  words: readonly string[],
  intervalMs: number,
  fadeDurationMs: number
): RotatingWordState {
  const [currentWordIndex, setCurrentWordIndex] = useState<number>(0);
  const opacity = useRef<RNAnimated.Value>(new RNAnimated.Value(1)).current;

  useEffect(() => {
    const rotationTimer = setInterval(() => {
      RNAnimated.timing(opacity, {
        toValue: 0,
        duration: fadeDurationMs,
        useNativeDriver: true,
      }).start(() => {
        setCurrentWordIndex((currentIndex: number) => (currentIndex + 1) % words.length);

        RNAnimated.timing(opacity, {
          toValue: 1,
          duration: fadeDurationMs,
          useNativeDriver: true,
        }).start();
      });
    }, intervalMs);

    return () => clearInterval(rotationTimer);
  }, [fadeDurationMs, intervalMs, opacity, words]);

  return {
    currentWord: words[currentWordIndex],
    opacity,
  };
}

/**
 * Performs the sign-in request and returns the Better Auth error, if any.
 *
 * @param credentials - The user's email and password.
 * @returns The Better Auth error object or `null` when sign-in succeeds.
 */
async function submitSignIn(credentials: SignInCredentials): Promise<{ message: string } | null> {
  const { error } = await authClient.signIn.email(credentials);
  return error ?? null;
}

/**
 * Sign-in screen for existing users.
 *
 * The component keeps the original UX but splits the async work and animation
 * setup into smaller helpers so the behavior is easier to follow.
 *
 * @returns The rendered React Native sign-in screen.
 */
export default function SignInScreen(): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const { currentWord, opacity } = useRotatingSecurityWord(
    ROTATING_SECURITY_WORDS,
    WORD_ROTATION_INTERVAL_MS,
    WORD_FADE_DURATION_MS
  );

  /**
   * Validates the local form state and sends the sign-in request.
   */
  async function handleSignIn(): Promise<void> {
    if (!email || !password) {
      showAlert("Error", EMPTY_CREDENTIALS_ERROR);
      return;
    }

    setLoading(true);

    const timeoutId = setTimeout(() => {
      setLoading(false);
      showAlert("Timeout", SIGN_IN_TIMEOUT_MESSAGE);
    }, SIGN_IN_REQUEST_TIMEOUT_MS);

    try {
      const authError = await submitSignIn({ email, password });

      if (authError !== null) {
        showAlert(SIGN_IN_ERROR_TITLE, authError.message);
        return;
      }

      showAlertWithAction(SIGN_IN_SUCCESS_TITLE, SIGN_IN_SUCCESS_MESSAGE, () => {
        router.replace(SIGN_IN_SUCCESS_ROUTE);
      });
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

      <View className="flex-1 items-center justify-center px-6">
        <View className="mb-8 items-center">
          <View className="mb-4 h-24 w-24 items-center justify-center rounded-full bg-primary-500/10">
            <Image
              source={require("@/assets/images/Logo.png")}
              style={{ width: 72, height: 72 }}
              resizeMode="contain"
            />
          </View>
          <Text className="text-4xl font-bold tracking-tight text-typography-900">
            {APP_NAME}
          </Text>
          <Text className="mt-1 text-sm text-typography-500">
            {APP_TAGLINE}
          </Text>
        </View>

        <View className="mb-8 h-12 items-center justify-center">
          <RNAnimated.View style={{ opacity }}>
            <Text className="text-2xl font-medium text-typography-600">
              Your data is {currentWord}
            </Text>
          </RNAnimated.View>
        </View>

        <View className="mb-8 w-full gap-4">
          <View className="rounded-xl border border-outline-200 bg-background-50 px-4 py-3">
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="Email address"
              placeholderTextColor={INPUT_PLACEHOLDER_COLOR}
              keyboardType="email-address"
              autoCapitalize="none"
              className="text-typography-900"
              editable={!loading}
            />
          </View>

          <View className="rounded-xl border border-outline-200 bg-background-50 px-4 py-3">
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="Password"
              placeholderTextColor={INPUT_PLACEHOLDER_COLOR}
              secureTextEntry
              className="text-typography-900"
              editable={!loading}
            />
          </View>
        </View>

        <View className="w-full gap-4">
          <Button
            variant="solid"
            size="lg"
            action="primary"
            isDisabled={loading}
            onPress={handleSignIn}
          >
            {loading ? (
              <ActivityIndicator color={LOADING_INDICATOR_COLOR} />
            ) : (
              <ButtonText>{SIGN_IN_TITLE}</ButtonText>
            )}
          </Button>

          <Button
            variant="outline"
            size="lg"
            action="primary"
            onPress={() => router.push(CREATE_ACCOUNT_ROUTE)}
          >
            <ButtonText>{CREATE_ACCOUNT_TITLE}</ButtonText>
          </Button>
        </View>
      </View>
    </View>
  );
}