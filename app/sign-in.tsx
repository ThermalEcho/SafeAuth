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
import { showAlert, showAlertWithAction } from "@/lib/auth-utils";
import { router } from "expo-router";
import { ArrowLeft, Fingerprint, Lock, Mail } from "lucide-react-native";
import React, { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StatusBar } from "react-native";

const INPUT_PLACEHOLDER_COLOR = "#7C8798";
const SIGN_IN_TITLE = "Welcome back";
const CREATE_ACCOUNT_TITLE = "Create account";
const SIGN_IN_SUCCESS_ROUTE = "/(tabs)/home";

export default function SignInScreen(): React.JSX.Element {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSignIn() {
    if (!email || !password) {
      showAlert("Error", "Please enter email and password");
      return;
    }

    setLoading(true);

    try {
      const normalizedEmail = email.trim().toLowerCase();
      const res = await authClient.signIn.email({ email: normalizedEmail, password });

      if (res.error) {
        showAlert("Sign In Error", res.error.message ?? "Failed to sign in");
        return;
      }

      showAlertWithAction("Signed in", "Welcome back!", () => {
        router.replace(SIGN_IN_SUCCESS_ROUTE);
      });
    } catch (err) {
      showAlert("Error", (err as Error)?.message ?? "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-[#F5F7FB]" edges={["top", "bottom"]}>
      <StatusBar barStyle="dark-content" backgroundColor="#F5F7FB" />

      <Box className="absolute -left-20 top-12 h-64 w-64 rounded-full bg-primary-500/10" />
      <Box className="absolute -right-24 bottom-8 h-72 w-72 rounded-full bg-secondary-400/20" />

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

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} className="flex-1">
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
                  {SIGN_IN_TITLE}
                </Heading>

                <Text className="mt-3 text-center text-base leading-7 text-typography-500">
                  Sign in with the same mobile-friendly flow you used to create your account.
                </Text>
              </Box>

              <Box className="w-full rounded-[30px] border border-outline-200 bg-background-0/95 p-5 shadow-sm">
                <VStack space="md" className="w-full">
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

                  <Button
                    variant="solid"
                    size="lg"
                    action="primary"
                    disabled={loading}
                    onPress={handleSignIn}
                    className="h-14 rounded-[20px]"
                  >
                    <ButtonText>{loading ? "Signing in..." : "Sign In"}</ButtonText>
                  </Button>

                  <Button
                    variant="outline"
                    size="lg"
                    action="primary"
                    className="h-14 rounded-[20px] border-outline-300 bg-background-0"
                    onPress={() => router.push("/create-account")}
                  >
                    <ButtonText>{CREATE_ACCOUNT_TITLE}</ButtonText>
                  </Button>

                  <Text className="text-center text-xs leading-5 text-typography-500">
                    Android keeps this form scrollable so the keyboard will not cover your inputs.
                  </Text>
                </VStack>
              </Box>
            </VStack>
          </Box>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
