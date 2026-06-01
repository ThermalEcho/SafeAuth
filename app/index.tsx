import { ThemeToggle } from "@/components/ThemeToggle";
import { Box } from "@/components/ui/box";
import { Button, ButtonText } from "@/components/ui/button";
import { Center } from "@/components/ui/center";
import { Heading } from "@/components/ui/heading";
import { HStack } from "@/components/ui/hstack";
import { SafeAreaView } from "@/components/ui/safe-area-view";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { router } from "expo-router";
import { ArrowRight, Fingerprint, LockKeyhole, ShieldCheck, Sparkles } from "lucide-react-native";
import React from "react";
import { StatusBar } from "react-native";

const APP_NAME = "SafeAuth";
const LOGIN_ROUTE = "/sign-in";
const SIGNUP_ROUTE = "/create-account";

function StatCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}): React.JSX.Element {
  return (
    <Box className="flex-1 rounded-[24px] border border-outline-200 bg-background-0/90 p-4">
      <Box className="h-11 w-11 items-center justify-center rounded-2xl bg-primary-500/10">
        {icon}
      </Box>

      <Text className="mt-4 text-base font-semibold text-typography-900">
        {title}
      </Text>

      <Text className="mt-1 text-sm leading-5 text-typography-500">
        {description}
      </Text>
    </Box>
  );
}

export default function LandingScreen(): React.JSX.Element {
  return (
    <SafeAreaView className="flex-1 bg-[#F5F7FB]" edges={["top", "bottom"]}>
      <StatusBar barStyle="dark-content" backgroundColor="#F5F7FB" />

      <Box className="absolute -left-24 top-[-60px] h-72 w-72 rounded-full bg-primary-500/10" />
      <Box className="absolute -right-24 bottom-[-100px] h-96 w-96 rounded-full bg-secondary-400/20" />

      <Box className="flex-1 px-6">
        <HStack className="items-center justify-between pt-4">
          <HStack className="items-center rounded-full border border-outline-200 bg-background-0/95 px-3 py-2">
            <Box className="h-8 w-8 items-center justify-center rounded-full bg-primary-500">
              <ShieldCheck size={16} color="#ffffff" />
            </Box>

            <Text className="ml-2 text-sm font-semibold text-typography-900">
              {APP_NAME}
            </Text>
          </HStack>

          <ThemeToggle />
        </HStack>

        <Center className="flex-1">
          <VStack space="xl" className="w-full max-w-md">
            <Box className="items-center">
              <Box className="h-28 w-28 items-center justify-center rounded-[32px] bg-primary-500 shadow-sm">
                <Fingerprint size={54} color="#ffffff" />
              </Box>

              <HStack className="mt-5 items-center rounded-full border border-primary-200 bg-primary-50 px-4 py-2">
                <Sparkles size={14} color="#2563eb" />
                <Text className="ml-2 text-xs font-semibold uppercase tracking-[0.18em] text-primary-700">
                  Android-ready auth
                </Text>
              </HStack>
            </Box>

            <VStack space="md" className="items-center px-2">
              <Heading size="2xl" className="text-center text-typography-900">
                Secure sign-in without the web app feel
              </Heading>

              <Text className="text-center text-base leading-7 text-typography-500">
                A focused mobile interface for account creation and login that keeps the keyboard,
                safe areas, and action buttons stable on Android.
              </Text>
            </VStack>

            <HStack className="gap-3">
              <StatCard
                icon={<LockKeyhole size={20} color="#2563eb" />}
                title="Protected"
                description="Trimmed flows with validation and backend feedback."
              />
              <StatCard
                icon={<ShieldCheck size={20} color="#2563eb" />}
                title="Native"
                description="Scroll-safe layouts and keyboard-aware forms."
              />
            </HStack>

            <Box className="rounded-[28px] border border-outline-200 bg-background-0/95 p-5 shadow-sm">
              <VStack space="md">
                <Text className="text-xs font-semibold uppercase tracking-[0.24em] text-typography-400">
                  Start here
                </Text>

                <Button
                  size="xl"
                  action="primary"
                  className="h-14 rounded-[20px]"
                  onPress={() => router.push(SIGNUP_ROUTE)}
                >
                  <HStack className="items-center">
                    <ButtonText>Create account</ButtonText>
                    <ArrowRight size={18} color="#ffffff" />
                  </HStack>
                </Button>

                <Button
                  size="xl"
                  variant="outline"
                  action="primary"
                  className="h-14 rounded-[20px] border-outline-300 bg-background-0"
                  onPress={() => router.push(LOGIN_ROUTE)}
                >
                  <ButtonText>Sign in</ButtonText>
                </Button>
              </VStack>
            </Box>
          </VStack>
        </Center>
      </Box>
    </SafeAreaView>
  );
}