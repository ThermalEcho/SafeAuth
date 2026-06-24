import { PageHeader, Surface, useSafeAuthTheme } from "@/components/safeauth-ui";
import { HStack } from "@/components/ui/hstack";
import { Pressable } from "@/components/ui/pressable";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { router, type Href } from "expo-router";
import React from "react";
import { ScrollView } from "react-native";

type SettingsRoute = {
  detail: string;
  href: Href;
  label: string;
  title: string;
};

const settingsRoutes: SettingsRoute[] = [
  {
    detail: "Light, dark, or system appearance",
    href: "/theme-settings" as Href,
    label: "Theme",
    title: "Appearance",
  },
  {
    detail: "PIN and biometric app lock",
    href: "/security-settings" as Href,
    label: "Security",
    title: "App protection",
  },
];

export default function SettingsScreen(): React.JSX.Element {
  const { colors } = useSafeAuthTheme();

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={{ flexGrow: 1, padding: 24, paddingBottom: 40 }}
    >
      <VStack className="mx-auto w-full max-w-[720px] gap-6">
        <PageHeader
          backTo="/home"
          title="Settings"
          subtitle="Tune how SafeAuth looks and how the app lock protects your session."
        />

        <VStack className="gap-4">
          {settingsRoutes.map((route) => (
            <Pressable
              key={route.label}
              accessibilityRole="button"
              onPress={() => router.push(route.href)}
            >
              <Surface>
                <HStack className="items-center justify-between gap-4">
                  <VStack className="min-w-0 flex-1 gap-1">
                    <Text
                      className="text-xs font-bold uppercase tracking-[1.5px]"
                      style={{ color: colors.accent }}
                    >
                      {route.label}
                    </Text>
                    <Text className="text-xl font-black" style={{ color: colors.ink }}>
                      {route.title}
                    </Text>
                    <Text className="leading-6" style={{ color: colors.muted }}>
                      {route.detail}
                    </Text>
                  </VStack>
                  <Text className="text-2xl font-black" style={{ color: colors.accent }}>
                    {">"}
                  </Text>
                </HStack>
              </Surface>
            </Pressable>
          ))}
        </VStack>
      </VStack>
    </ScrollView>
  );
}