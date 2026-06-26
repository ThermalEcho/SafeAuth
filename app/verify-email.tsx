import {
  BrandLogo,
  OutlineButton,
  PrimaryButton,
  Surface,
  useSafeAuthTheme,
} from "@/components/safeauth-ui";
import { Box } from "@/components/ui/box";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { router, useLocalSearchParams } from "expo-router";
import React from "react";
import { ScrollView } from "react-native";

const ERROR_MESSAGES: Record<string, string> = {
  invalid_token: "This verification link is invalid, expired, or has already been used.",
};

function getVerificationCopy(error: string | undefined): {
  body: string;
  eyebrow: string;
  isError: boolean;
  mark: string;
  title: string;
} {
  if (error) {
    return {
      body: ERROR_MESSAGES[error] ?? "We could not verify your email with this link.",
      eyebrow: "Verification failed",
      isError: true,
      mark: "!",
      title: "Link could not be verified",
    };
  }

  return {
    body: "Your email address is verified. You can now sign in to SafeAuth.",
    eyebrow: "Email verified",
    isError: false,
    mark: "OK",
    title: "You are ready to sign in",
  };
}

export default function VerifyEmailScreen(): React.JSX.Element {
  const { colors } = useSafeAuthTheme();
  const params = useLocalSearchParams<{ error?: string | string[] }>();
  const error = Array.isArray(params.error) ? params.error[0] : params.error;
  const copy = getVerificationCopy(error);
  const accentColor = copy.isError ? colors.dangerText : colors.positiveText;

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      style={{ backgroundColor: colors.background, flex: 1 }}
      contentContainerStyle={{ flexGrow: 1, justifyContent: "center", padding: 24 }}
    >
      <VStack className="mx-auto w-full max-w-[520px] gap-6">
        <BrandLogo compact />
        <Surface>
          <VStack className="items-center gap-5">
            <Box
              className="h-16 w-16 items-center justify-center rounded-full border"
              style={{
                backgroundColor: copy.isError ? colors.dangerSoft : colors.accentSoft,
                borderColor: copy.isError ? colors.dangerBorder : colors.border,
              }}
            >
              <Text className="text-2xl font-black" style={{ color: accentColor }}>
                {copy.mark}
              </Text>
            </Box>

            <VStack className="items-center gap-2">
              <Text
                className="text-sm font-bold uppercase tracking-[1.5px]"
                style={{ color: accentColor }}
              >
                {copy.eyebrow}
              </Text>
              <Text className="text-center text-3xl font-black" style={{ color: colors.ink }}>
                {copy.title}
              </Text>
              <Text className="text-center leading-6" selectable style={{ color: colors.muted }}>
                {copy.body}
              </Text>
            </VStack>
          </VStack>

          <VStack className="gap-3">
            <PrimaryButton onPress={() => router.replace("/sign-in")}>
              Go to sign in
            </PrimaryButton>
            {copy.isError ? (
              <OutlineButton onPress={() => router.replace("/create-account")}>
                Create a new account
              </OutlineButton>
            ) : null}
          </VStack>
        </Surface>
      </VStack>
    </ScrollView>
  );
}
