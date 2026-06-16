import {
  BrandLogo,
  OutlineButton,
  PrimaryButton,
  Surface,
  colors,
} from "@/components/safeauth-ui";
import { Box } from "@/components/ui/box";
import { Heading } from "@/components/ui/heading";
import { HStack } from "@/components/ui/hstack";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { router } from "expo-router";
import React from "react";
import { ScrollView, useWindowDimensions } from "react-native";

export default function LandingScreen(): React.JSX.Element {
  const { width } = useWindowDimensions();
  const wide = width >= 760;

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={{
        flexGrow: 1,
        justifyContent: "center",
        padding: 24,
      }}
    >
      <Box className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[#DDEBFF]" />
      <Box className="absolute -bottom-32 -left-24 h-80 w-80 rounded-full bg-[#E7F0FF]" />

      <Box className="mx-auto w-full max-w-[980px]">
        <Surface className={wide ? "p-10" : "p-7"}>
          <HStack className={`gap-10 ${wide ? "items-center" : "flex-col"}`}>
            <VStack className="flex-1 gap-7">
              <BrandLogo />
              <VStack className="gap-4">
                <Text className="text-sm font-bold uppercase tracking-[2px] text-[#146EF5]">
                  Your private authenticator
                </Text>
                <Heading
                  size={wide ? "5xl" : "4xl"}
                  className="max-w-[620px] leading-[1.08] text-[#10213A]"
                >
                  Secure access without the friction.
                </Heading>
                <Text className="max-w-[600px] text-lg leading-7 text-[#607089]">
                  Create your account, verify your identity, and keep one-time
                  authentication codes protected in one focused app.
                </Text>
              </VStack>

              <VStack className="gap-3">
                <PrimaryButton onPress={() => router.push("/create-account")}>
                  Create secure account
                </PrimaryButton>
                <OutlineButton onPress={() => router.push("/sign-in")}>
                  Sign in
                </OutlineButton>
              </VStack>
            </VStack>

            <Box
              className={`rounded-[28px] bg-[#0B2A57] p-7 ${
                wide ? "w-[310px]" : "w-full"
              }`}
            >
              <VStack className="gap-6">
                <Box className="h-12 w-12 items-center justify-center rounded-2xl bg-[#146EF5]">
                  <Text className="text-xl font-black text-white">✓</Text>
                </Box>
                <VStack className="gap-2">
                  <Heading size="xl" className="text-white">
                    Built for trust
                  </Heading>
                  <Text className="leading-6 text-[#C7D8F0]">
                    Email verification, protected sessions, and time-based codes
                    work together in a clean security workflow.
                  </Text>
                </VStack>
              </VStack>
            </Box>
          </HStack>
        </Surface>
      </Box>
    </ScrollView>
  );
}
