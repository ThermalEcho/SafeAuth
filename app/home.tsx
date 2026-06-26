import {
  BrandLogo,
  DangerButton,
  OutlineButton,
  PrimaryButton,
  Surface,
  useSafeAuthTheme,
} from "@/components/safeauth-ui";
import { Box } from "@/components/ui/box";
import { Heading } from "@/components/ui/heading";
import { HStack } from "@/components/ui/hstack";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { authClient, notifyAuthStateChanged, setBearerToken } from "@/lib/auth-client";
import { showAlert } from "@/lib/auth-utils";
import { router, type Href } from "expo-router";
import React, { useState } from "react";
import { ScrollView, useWindowDimensions } from "react-native";

const homeActions = [
  { action: "Open OTP codes", detail: "View current codes and add accounts manually or by QR.", eyebrow: "Authenticator", href: "/otp" as Href, title: "OTP code vault", variant: "primary" },
  { action: "Open camera", detail: "Scan and inspect QR data using the device camera.", eyebrow: "Scanner", href: "/camera" as Href, title: "QR camera", variant: "outline" },
  { action: "Open settings", detail: "Adjust appearance, PIN lock, and biometric unlock.", eyebrow: "Settings", href: "/settings" as Href, title: "App settings", variant: "outline" },
] as const;

export default function HomeScreen(): React.JSX.Element {
  const { colors } = useSafeAuthTheme();
  const [signingOut, setSigningOut] = useState(false);
  const { width } = useWindowDimensions();
  const wide = width >= 720;

  async function handleLogout(): Promise<void> {
    setSigningOut(true);
    try {
      const response = await authClient.signOut();
      if (response.error) {
        showAlert("Logout failed", response.error.message ?? "Failed to log out.");
        return;
      }
      setBearerToken(null);
      notifyAuthStateChanged();
    } catch (error: unknown) {
      showAlert("Logout failed", error instanceof Error ? error.message : "Unknown error.");
    } finally {
      setSigningOut(false);
    }
  }

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" style={{ backgroundColor: colors.background }} contentContainerStyle={{ flexGrow: 1, padding: 24 }}>
      <VStack className="mx-auto w-full max-w-[960px] gap-7 py-3">
        <BrandLogo compact />
        <Surface className="overflow-hidden">
          <HStack className={`gap-8 ${wide ? "items-center" : "flex-col"}`}>
            <VStack className="flex-1 gap-4">
              <HStack className="items-center gap-2">
                <Box className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: colors.positive }} />
                <Text className="text-sm font-bold uppercase tracking-[1.5px]" style={{ color: colors.positiveText }}>Authenticated</Text>
              </HStack>
              <Heading size="4xl" className="leading-tight" style={{ color: colors.ink }}>Your security hub</Heading>
              <Text className="max-w-[560px] text-lg leading-7" style={{ color: colors.muted }}>Manage one-time codes and scan authenticator QR codes from your protected SafeAuth session.</Text>
            </VStack>
            <Box className="h-32 w-32 items-center justify-center rounded-[36px]" style={{ backgroundColor: colors.accentSoft }}>
              <Text className="text-5xl font-black" style={{ color: colors.accent }}>✓</Text>
            </Box>
          </HStack>
        </Surface>

        <HStack className={`gap-5 ${wide ? "" : "flex-col"}`}>
          {homeActions.map((item) => (
            <Surface key={item.title} className="flex-1">
              <VStack className="gap-3">
                <Text className="text-sm font-bold uppercase tracking-[1.5px]" style={{ color: colors.accent }}>{item.eyebrow}</Text>
                <Heading size="2xl" style={{ color: colors.ink }}>{item.title}</Heading>
                <Text className="leading-6" style={{ color: colors.muted }}>{item.detail}</Text>
                {item.variant === "primary" ? (
                  <PrimaryButton onPress={() => router.push(item.href)}>{item.action}</PrimaryButton>
                ) : (
                  <OutlineButton onPress={() => router.push(item.href)}>{item.action}</OutlineButton>
                )}
              </VStack>
            </Surface>
          ))}
        </HStack>

        <DangerButton loading={signingOut} onPress={() => void handleLogout()}>
          {signingOut ? "Signing out" : "Sign out securely"}
        </DangerButton>
      </VStack>
    </ScrollView>
  );
}