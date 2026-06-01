import { Box } from "@/components/ui/box";
import { Button, ButtonText } from "@/components/ui/button";
import { Center } from "@/components/ui/center";
import { Divider } from "@/components/ui/divider";
import { Heading } from "@/components/ui/heading";
import { HStack } from "@/components/ui/hstack";
import { SafeAreaView } from "@/components/ui/safe-area-view";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { router } from "expo-router";
import { ArrowRight, ShieldCheck, Sparkles } from "lucide-react-native";
import React from "react";

const SIGN_IN_ROUTE = "/";

export default function HomeScreen(): React.JSX.Element {
  return (
    <SafeAreaView className="flex-1 bg-background-0 px-6" edges={["top"]}>
      <Box className="absolute -left-24 top-8 h-72 w-72 rounded-full bg-primary-500/10" />
      <Box className="absolute -right-28 bottom-0 h-80 w-80 rounded-full bg-secondary-400/20" />

      <Center className="flex-1">
        <Box className="w-full max-w-md rounded-[32px] border border-outline-200 bg-background-0/95 p-6 shadow-sm">
          <VStack space="lg" className="w-full">
            <HStack space="md" className="items-start">
              <Box className="h-12 w-12 items-center justify-center rounded-2xl bg-primary-500">
                <ShieldCheck size={24} color="#ffffff" />
              </Box>

              <VStack space="xs" className="flex-1">
                <Text className="text-xs font-semibold uppercase tracking-[0.24em] text-typography-400">
                  Authenticated
                </Text>
                <Heading size="xl">SafeAuth Home</Heading>
              </VStack>
            </HStack>

            <Box className="rounded-3xl bg-background-50 p-4">
              <HStack space="sm" className="items-center">
                <Sparkles size={18} color="#333333" />
                <Text className="text-sm font-semibold text-typography-900">
                  Your session is active.
                </Text>
              </HStack>

              <Divider className="my-4" />

              <Text className="text-sm leading-6 text-typography-600">
                The app now has a valid destination after sign-in, so navigation no longer breaks on
                the success path.
              </Text>
            </Box>

            <Button
              variant="solid"
              size="lg"
              action="primary"
              onPress={() => router.replace(SIGN_IN_ROUTE)}
            >
              <HStack space="sm">
                <ButtonText>Return to sign in</ButtonText>
                <ArrowRight size={18} color="#ffffff" />
              </HStack>
            </Button>
          </VStack>
        </Box>
      </Center>
    </SafeAreaView>
  );
}