import { Box } from "@/components/ui/box";
import {
  Button,
  ButtonSpinner,
  ButtonText,
} from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Heading } from "@/components/ui/heading";
import { HStack } from "@/components/ui/hstack";
import { Image } from "@/components/ui/image";
import { Input, InputField } from "@/components/ui/input";
import { Pressable } from "@/components/ui/pressable";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { defaultColors, useSafeAuthTheme } from "@/components/safeauth-theme";
import { router, type Href } from "expo-router";
import React from "react";
import type { TextInputProps } from "react-native";

export const colors = defaultColors;
export { useSafeAuthTheme } from "@/components/safeauth-theme";

export function goBackOrReplace(fallback: Href): void {
  if (router.canGoBack()) {
    router.back();
    return;
  }

  router.replace(fallback);
}

export function BrandLogo({
  compact = false,
  showName = true,
}: {
  compact?: boolean;
  showName?: boolean;
}) {
  const { colors } = useSafeAuthTheme();

  return (
    <HStack className="items-center gap-3">
      <Box
        className={`overflow-hidden ${
          compact ? "h-12 w-12 rounded-2xl" : "h-20 w-20 rounded-[24px]"
        }`}
        style={{ backgroundColor: colors.iconShell }}
      >
        <Image
          source={require("../assets/images/logo.png")}
          alt="SafeAuth shield and lock logo"
          size="full"
          className="h-full w-full"
          resizeMode="cover"
        />
      </Box>
      {showName ? (
        <VStack className="gap-0">
          <Heading size={compact ? "xl" : "2xl"} style={{ color: colors.ink }}>
            SafeAuth
          </Heading>
          <Text size="sm" className="font-semibold" style={{ color: colors.muted }}>
            Security, simplified.
          </Text>
        </VStack>
      ) : null}
    </HStack>
  );
}

export function PageHeader({
  title,
  subtitle,
  backTo,
}: {
  title: string;
  subtitle?: string;
  backTo?: Href;
}) {
  const { colors } = useSafeAuthTheme();

  return (
    <VStack className="gap-5">
      <HStack className="items-center justify-between gap-4">
        {backTo ? (
          <Pressable
            accessibilityRole="button"
            className="rounded-full border px-4 py-2"
            style={{ backgroundColor: colors.surface, borderColor: colors.border }}
            onPress={() => goBackOrReplace(backTo)}
          >
            <Text className="font-bold" style={{ color: colors.accent }}>Back</Text>
          </Pressable>
        ) : (
          <BrandLogo compact />
        )}
      </HStack>
      <VStack className="gap-2">
        <Heading size="3xl" style={{ color: colors.ink }}>
          {title}
        </Heading>
        {subtitle ? (
          <Text className="max-w-[520px] text-base leading-6" style={{ color: colors.muted }}>
            {subtitle}
          </Text>
        ) : null}
      </VStack>
    </VStack>
  );
}

export function Surface({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const { colors } = useSafeAuthTheme();

  return (
    <Card
      variant="elevated"
      className={`gap-5 rounded-[28px] border p-6 shadow-soft-1 ${className}`}
      style={{ backgroundColor: colors.surface, borderColor: colors.border }}
    >
      {children}
    </Card>
  );
}

export function Field({
  label,
  ...props
}: TextInputProps & { label: string }) {
  const { colors } = useSafeAuthTheme();

  return (
    <VStack className="gap-2">
      <Text className="text-sm font-bold" style={{ color: colors.ink }}>{label}</Text>
      <Input
        size="xl"
        className="h-14 rounded-2xl"
        style={{ backgroundColor: colors.field, borderColor: colors.fieldBorder }}
      >
        <InputField
          className="px-4 text-base"
          placeholderTextColor={colors.muted}
          style={{ color: colors.ink }}
          {...props}
        />
      </Input>
    </VStack>
  );
}

type AppButtonProps = {
  children: React.ReactNode;
  disabled?: boolean;
  loading?: boolean;
  onPress: () => void;
};

export function PrimaryButton({
  children,
  disabled,
  loading,
  onPress,
}: AppButtonProps) {
  const { colors } = useSafeAuthTheme();

  return (
    <Button
      size="xl"
      isDisabled={disabled || loading}
      onPress={onPress}
      className="h-14 rounded-2xl"
      style={{ backgroundColor: colors.accent }}
    >
      {loading ? <ButtonSpinner color={colors.white} /> : null}
      <ButtonText className="text-base font-bold" style={{ color: colors.white }}>
        {children}
      </ButtonText>
    </Button>
  );
}

export function OutlineButton({
  children,
  disabled,
  loading,
  onPress,
}: AppButtonProps) {
  const { colors } = useSafeAuthTheme();

  return (
    <Button
      size="xl"
      variant="outline"
      isDisabled={disabled || loading}
      onPress={onPress}
      className="h-14 rounded-2xl border"
      style={{ backgroundColor: colors.surface, borderColor: colors.fieldBorder }}
    >
      {loading ? <ButtonSpinner color={colors.accent} /> : null}
      <ButtonText className="text-base font-bold" style={{ color: colors.accent }}>
        {children}
      </ButtonText>
    </Button>
  );
}

export function DangerButton({
  children,
  disabled,
  loading,
  onPress,
}: AppButtonProps) {
  const { colors } = useSafeAuthTheme();

  return (
    <Button
      size="xl"
      variant="outline"
      isDisabled={disabled || loading}
      onPress={onPress}
      className="h-14 rounded-2xl border"
      style={{ backgroundColor: colors.dangerSoft, borderColor: colors.dangerBorder }}
    >
      {loading ? <ButtonSpinner color={colors.dangerText} /> : null}
      <ButtonText className="text-base font-bold" style={{ color: colors.dangerText }}>
        {children}
      </ButtonText>
    </Button>
  );
}