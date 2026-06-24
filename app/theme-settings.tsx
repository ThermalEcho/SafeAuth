import {
  PageHeader,
  Surface,
  useSafeAuthTheme,
} from "@/components/safeauth-ui";
import { Box } from "@/components/ui/box";
import { HStack } from "@/components/ui/hstack";
import { Pressable } from "@/components/ui/pressable";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import {
  getThemePreference,
  setThemePreference,
  type ThemePreference,
} from "@/lib/app-settings";
import { showAlert } from "@/lib/auth-utils";
import type { Href } from "expo-router";
import React, { useEffect, useState } from "react";
import { ScrollView } from "react-native";

const themeOptions: {
  detail: string;
  label: string;
  value: ThemePreference;
}[] = [
  {
    detail: "Follow the device appearance",
    label: "System",
    value: "system",
  },
  {
    detail: "Keep SafeAuth bright",
    label: "Light",
    value: "light",
  },
  {
    detail: "Use a darker app shell",
    label: "Dark",
    value: "dark",
  },
];

export default function ThemeSettingsScreen(): React.JSX.Element {
  const { colors } = useSafeAuthTheme();
  const [preference, setPreference] = useState<ThemePreference>("system");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadPreference(): Promise<void> {
      setPreference(await getThemePreference());
    }

    void loadPreference();
  }, []);

  async function chooseTheme(nextPreference: ThemePreference): Promise<void> {
    setPreference(nextPreference);
    setSaving(true);
    try {
      await setThemePreference(nextPreference);
    } catch (error: unknown) {
      showAlert("Theme not saved", error instanceof Error ? error.message : "Unknown error.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={{ flexGrow: 1, padding: 24, paddingBottom: 40 }}
    >
      <VStack className="mx-auto w-full max-w-[680px] gap-6">
        <PageHeader
          backTo={"/settings" as Href}
          title="Theme"
          subtitle="Choose the appearance SafeAuth should use."
        />

        <Surface>
          <VStack className="gap-3">
            {themeOptions.map((option) => {
              const selected = preference === option.value;
              return (
                <Pressable
                  key={option.value}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: selected, disabled: saving }}
                  className="rounded-2xl border p-4"
                  style={{
                    backgroundColor: selected ? colors.accentSoft : colors.surfaceAlt,
                    borderColor: selected ? colors.accent : colors.border,
                  }}
                  disabled={saving}
                  onPress={() => void chooseTheme(option.value)}
                >
                  <HStack className="items-center justify-between gap-4">
                    <VStack className="min-w-0 flex-1 gap-1">
                      <Text className="text-lg font-black" style={{ color: colors.ink }}>
                        {option.label}
                      </Text>
                      <Text className="leading-6" style={{ color: colors.muted }}>
                        {option.detail}
                      </Text>
                    </VStack>
                    <Box
                      className="h-7 w-7 items-center justify-center rounded-full border"
                      style={{
                        backgroundColor: selected ? colors.accent : colors.surface,
                        borderColor: selected ? colors.accent : colors.fieldBorder,
                      }}
                    >
                      {selected ? (
                        <Text className="text-sm font-black" style={{ color: colors.white }}>
                          OK
                        </Text>
                      ) : null}
                    </Box>
                  </HStack>
                </Pressable>
              );
            })}
          </VStack>
        </Surface>
      </VStack>
    </ScrollView>
  );
}