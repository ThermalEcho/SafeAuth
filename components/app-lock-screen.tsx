import {
  BrandLogo,
  Field,
  OutlineButton,
  PrimaryButton,
  Surface,
  colors,
} from "@/components/safeauth-ui";
import { Box } from "@/components/ui/box";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import type { AppLockSettings } from "@/lib/app-settings";
import { verifyPin } from "@/lib/app-settings";
import { showAlert } from "@/lib/auth-utils";
import * as LocalAuthentication from "expo-local-authentication";
import React, { useCallback, useEffect, useState } from "react";
import { ScrollView } from "react-native";

function getBiometricLabel(types: LocalAuthentication.AuthenticationType[]): string {
  const hasFace = types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION);
  const hasFingerprint = types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT);
  const hasIris = types.includes(LocalAuthentication.AuthenticationType.IRIS);

  if (hasFace && hasFingerprint) return "Face ID or fingerprint";
  if (hasFace) return "Face ID";
  if (hasFingerprint) return "Fingerprint";
  if (hasIris) return "Iris";
  return "Biometrics";
}

export function AppLockScreen({
  onUnlocked,
  settings,
}: {
  onUnlocked: () => void;
  settings: AppLockSettings;
}): React.JSX.Element {
  const [biometricLabel, setBiometricLabel] = useState("Biometrics");
  const [pin, setPin] = useState("");
  const [checkingBiometrics, setCheckingBiometrics] = useState(false);

  const unlockWithBiometrics = useCallback(async (): Promise<void> => {
    setCheckingBiometrics(true);
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();

      if (!hasHardware || !isEnrolled) {
        showAlert(
          "Biometrics unavailable",
          "Use your PIN or enroll biometrics in device settings.",
        );
        return;
      }

      const result = await LocalAuthentication.authenticateAsync({
        cancelLabel: "Cancel",
        fallbackLabel: settings.pinEnabled ? "Use PIN" : "Cancel",
        promptMessage: "Unlock SafeAuth",
      });

      if (result.success) {
        onUnlocked();
      }
    } catch (error: unknown) {
      showAlert(
        "Could not unlock",
        error instanceof Error ? error.message : "Biometric authentication failed.",
      );
    } finally {
      setCheckingBiometrics(false);
    }
  }, [onUnlocked, settings.pinEnabled]);

  useEffect(() => {
    if (!settings.biometricsEnabled) return;

    async function loadBiometricLabel(): Promise<void> {
      const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
      setBiometricLabel(getBiometricLabel(types));
    }

    void loadBiometricLabel();
    void unlockWithBiometrics();
  }, [settings.biometricsEnabled, unlockWithBiometrics]);

  async function unlockWithPin(): Promise<void> {
    if (pin.length < 4) {
      showAlert("PIN required", "Enter your SafeAuth PIN.");
      return;
    }

    if (await verifyPin(pin)) {
      setPin("");
      onUnlocked();
      return;
    }

    setPin("");
    showAlert("Incorrect PIN", "Try again.");
  }

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
      <VStack className="mx-auto w-full max-w-[520px] gap-6">
        <BrandLogo compact />
        <Surface>
          <VStack className="gap-2">
            <Box className="h-12 w-12 items-center justify-center rounded-2xl bg-[#EAF2FF]">
              <Text className="text-sm font-black text-[#146EF5]">PIN</Text>
            </Box>
            <Heading size="2xl" className="text-[#10213A]">
              SafeAuth is locked
            </Heading>
            <Text className="leading-6 text-[#607089]">
              Confirm your app lock method to continue.
            </Text>
          </VStack>

          {settings.pinEnabled ? (
            <VStack className="gap-4">
              <Field
                label="PIN"
                keyboardType="number-pad"
                maxLength={8}
                onChangeText={(value) => setPin(value.replace(/\D/g, "").slice(0, 8))}
                placeholder="Enter PIN"
                secureTextEntry
                value={pin}
              />
              <PrimaryButton onPress={() => void unlockWithPin()}>Unlock with PIN</PrimaryButton>
            </VStack>
          ) : null}

          {settings.biometricsEnabled ? (
            <OutlineButton
              loading={checkingBiometrics}
              onPress={() => void unlockWithBiometrics()}
            >
              {checkingBiometrics ? "Checking" : `Unlock with ${biometricLabel}`}
            </OutlineButton>
          ) : null}
        </Surface>
      </VStack>
    </ScrollView>
  );
}
