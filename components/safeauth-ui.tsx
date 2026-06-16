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
import { router, type Href } from "expo-router";
import React from "react";
import type { TextInputProps } from "react-native";

export const colors = {
  background: "#F4F7FB",
  blue: "#146EF5",
  blueDark: "#0B3B82",
  border: "#DDE5EF",
  danger: "#C43131",
  ink: "#10213A",
  muted: "#607089",
  paleBlue: "#EAF2FF",
  white: "#FFFFFF",
} as const;

export function BrandLogo({
  compact = false,
  showName = true,
}: {
  compact?: boolean;
  showName?: boolean;
}) {
  return (
    <HStack className="items-center gap-3">
      <Box
        className={`overflow-hidden bg-[#0B2A57] ${
          compact ? "h-12 w-12 rounded-2xl" : "h-20 w-20 rounded-[24px]"
        }`}
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
          <Heading size={compact ? "xl" : "2xl"} className="text-[#10213A]">
            SafeAuth
          </Heading>
          <Text size="sm" className="font-semibold text-[#607089]">
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
  return (
    <VStack className="gap-5">
      <HStack className="items-center justify-between gap-4">
        {backTo ? (
          <Pressable
            accessibilityRole="button"
            className="rounded-full bg-white px-4 py-2"
            onPress={() => router.replace(backTo)}
          >
            <Text className="font-bold text-[#146EF5]">Back</Text>
          </Pressable>
        ) : (
          <BrandLogo compact />
        )}
      </HStack>
      <VStack className="gap-2">
        <Heading size="3xl" className="text-[#10213A]">
          {title}
        </Heading>
        {subtitle ? (
          <Text className="max-w-[520px] text-base leading-6 text-[#607089]">
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
  return (
    <Card
      variant="elevated"
      className={`gap-5 rounded-[28px] border border-[#DDE5EF] bg-white p-6 shadow-soft-1 ${className}`}
    >
      {children}
    </Card>
  );
}

export function Field({
  label,
  ...props
}: TextInputProps & { label: string }) {
  return (
    <VStack className="gap-2">
      <Text className="text-sm font-bold text-[#33445E]">{label}</Text>
      <Input
        size="xl"
        className="h-14 rounded-2xl border-[#D5DFEB] bg-[#F9FBFD] data-[focus=true]:border-[#146EF5]"
      >
        <InputField
          className="px-4 text-base text-[#10213A] placeholder:text-[#8492A6]"
          placeholderTextColor="#8492A6"
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
  return (
    <Button
      size="xl"
      isDisabled={disabled || loading}
      onPress={onPress}
      className="h-14 rounded-2xl bg-[#146EF5] data-[active=true]:bg-[#0B55C4]"
    >
      {loading ? <ButtonSpinner color="#FFFFFF" /> : null}
      <ButtonText className="text-base font-bold text-white">{children}</ButtonText>
    </Button>
  );
}

export function OutlineButton({
  children,
  disabled,
  loading,
  onPress,
}: AppButtonProps) {
  return (
    <Button
      size="xl"
      variant="outline"
      isDisabled={disabled || loading}
      onPress={onPress}
      className="h-14 rounded-2xl border-[#B8CAE2] bg-white"
    >
      {loading ? <ButtonSpinner color={colors.blue} /> : null}
      <ButtonText className="text-base font-bold text-[#146EF5]">{children}</ButtonText>
    </Button>
  );
}

export function DangerButton({
  children,
  disabled,
  loading,
  onPress,
}: AppButtonProps) {
  return (
    <Button
      size="xl"
      variant="outline"
      isDisabled={disabled || loading}
      onPress={onPress}
      className="h-14 rounded-2xl border-[#F0B4B4] bg-[#FFF8F8]"
    >
      {loading ? <ButtonSpinner color={colors.danger} /> : null}
      <ButtonText className="text-base font-bold text-[#C43131]">{children}</ButtonText>
    </Button>
  );
}
