import {
  DangerButton,
  Field,
  PageHeader,
  PrimaryButton,
  Surface,
  colors,
} from "@/components/safeauth-ui";
import { HStack } from "@/components/ui/hstack";
import { Spinner } from "@/components/ui/spinner";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import {
  clearPin,
  getAppLockSettings,
  hasStoredPin,
  saveAppLockSettings,
  savePin,
  type AppLockSettings,
} from "@/lib/app-settings";
import { showAlert } from "@/lib/auth-utils";
import * as LocalAuthentication from "expo-local-authentication";
import type { Href } from "expo-router";
import React, { useEffect, useState } from "react";
import { ScrollView, Switch } from "react-native";

type BiometricStatus = {
  available: boolean;
  enrolled: boolean;
  label: string;
};

const defaultLockSettings: AppLockSettings = {
  biometricsEnabled: false,
  pinEnabled: false,
};

const defaultBiometricStatus: BiometricStatus = {
  available: false,
  enrolled: false,
  label: "Biometrics",
};

function normalizePin(value: string): string {
  return value.replace(/\D/g, "").slice(0, 8);
}

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

export default function SecuritySettingsScreen(): React.JSX.Element {
  const [biometricStatus, setBiometricStatus] = useState<BiometricStatus>(
    defaultBiometricStatus,
  );
  const [confirmPin, setConfirmPin] = useState("");
  const [loading, setLoading] = useState(true);
  const [pin, setPin] = useState("");
  const [settings, setSettings] = useState<AppLockSettings>(defaultLockSettings);
  const [storedPinExists, setStoredPinExists] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadSettings(): Promise<void> {
      try {
        const [lockSettings, pinExists, hasHardware, enrolled, types] = await Promise.all([
          getAppLockSettings(),
          hasStoredPin(),
          LocalAuthentication.hasHardwareAsync(),
          LocalAuthentication.isEnrolledAsync(),
          LocalAuthentication.supportedAuthenticationTypesAsync(),
        ]);

        setSettings(lockSettings);
        setStoredPinExists(pinExists);
        setBiometricStatus({
          available: hasHardware,
          enrolled,
          label: getBiometricLabel(types),
        });
      } catch (error: unknown) {
        showAlert(
          "Security settings unavailable",
          error instanceof Error ? error.message : "Unknown error.",
        );
      } finally {
        setLoading(false);
      }
    }

    void loadSettings();
  }, []);

  async function persistSettings(nextSettings: AppLockSettings): Promise<void> {
    setSettings(nextSettings);
    await saveAppLockSettings(nextSettings);
  }

  async function enablePinLock(): Promise<void> {
    if (pin.length < 4) {
      showAlert("PIN too short", "Use 4 to 8 digits.");
      return;
    }

    if (pin !== confirmPin) {
      showAlert("PIN mismatch", "Enter the same PIN twice.");
      return;
    }

    setSaving(true);
    try {
      await savePin(pin);
      await persistSettings({ ...settings, pinEnabled: true });
      setStoredPinExists(true);
      setPin("");
      setConfirmPin("");
    } catch (error: unknown) {
      showAlert("PIN not saved", error instanceof Error ? error.message : "Unknown error.");
    } finally {
      setSaving(false);
    }
  }

  async function disablePinLock(): Promise<void> {
    setSaving(true);
    try {
      await clearPin();
      await persistSettings({ ...settings, pinEnabled: false });
      setStoredPinExists(false);
      setPin("");
      setConfirmPin("");
    } catch (error: unknown) {
      showAlert("PIN not removed", error instanceof Error ? error.message : "Unknown error.");
    } finally {
      setSaving(false);
    }
  }

  async function toggleBiometrics(enabled: boolean): Promise<void> {
    if (!enabled) {
      setSaving(true);
      try {
        await persistSettings({ ...settings, biometricsEnabled: false });
      } catch (error: unknown) {
        showAlert(
          "Biometrics not updated",
          error instanceof Error ? error.message : "Unknown error.",
        );
      } finally {
        setSaving(false);
      }
      return;
    }

    if (!biometricStatus.available || !biometricStatus.enrolled) {
      showAlert(
        "Biometrics unavailable",
        "Set up Face ID, fingerprint, or another biometric method in device settings.",
      );
      return;
    }

    setSaving(true);
    try {
      const result = await LocalAuthentication.authenticateAsync({
        cancelLabel: "Cancel",
        promptMessage: "Enable biometric unlock",
      });

      if (!result.success) return;

      await persistSettings({ ...settings, biometricsEnabled: true });
    } catch (error: unknown) {
      showAlert(
        "Biometrics not enabled",
        error instanceof Error ? error.message : "Unknown error.",
      );
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
          title="Security"
          subtitle="Lock SafeAuth with a PIN, biometrics, or both."
        />

        {loading ? (
          <HStack className="items-center gap-3 rounded-2xl bg-[#EAF2FF] p-4">
            <Spinner color="#146EF5" />
            <Text className="font-semibold text-[#315B91]">Loading security settings...</Text>
          </HStack>
        ) : null}

        <Surface>
          <VStack className="gap-4">
            <VStack className="gap-1">
              <Text className="text-xl font-black text-[#10213A]">PIN lock</Text>
              <Text className="leading-6 text-[#607089]">
                {settings.pinEnabled && storedPinExists
                  ? "PIN unlock is active."
                  : "Use a 4 to 8 digit PIN."}
              </Text>
            </VStack>

            {settings.pinEnabled && storedPinExists ? (
              <DangerButton
                disabled={saving}
                loading={saving}
                onPress={() => void disablePinLock()}
              >
                Remove PIN lock
              </DangerButton>
            ) : (
              <VStack className="gap-4">
                <Field
                  label="New PIN"
                  keyboardType="number-pad"
                  maxLength={8}
                  onChangeText={(value) => setPin(normalizePin(value))}
                  placeholder="4 to 8 digits"
                  secureTextEntry
                  value={pin}
                />
                <Field
                  label="Confirm PIN"
                  keyboardType="number-pad"
                  maxLength={8}
                  onChangeText={(value) => setConfirmPin(normalizePin(value))}
                  placeholder="Repeat PIN"
                  secureTextEntry
                  value={confirmPin}
                />
                <PrimaryButton
                  disabled={saving}
                  loading={saving}
                  onPress={() => void enablePinLock()}
                >
                  Enable PIN lock
                </PrimaryButton>
              </VStack>
            )}
          </VStack>
        </Surface>

        <Surface>
          <HStack className="items-center justify-between gap-4">
            <VStack className="min-w-0 flex-1 gap-1">
              <Text className="text-xl font-black text-[#10213A]">
                {biometricStatus.label}
              </Text>
              <Text className="leading-6 text-[#607089]">
                {biometricStatus.available && biometricStatus.enrolled
                  ? "Biometric unlock is available on this device."
                  : "No enrolled biometric method is available."}
              </Text>
            </VStack>
            <Switch
              disabled={saving || !biometricStatus.available || !biometricStatus.enrolled}
              ios_backgroundColor="#DDE5EF"
              onValueChange={(enabled) => void toggleBiometrics(enabled)}
              thumbColor={settings.biometricsEnabled ? "#FFFFFF" : "#F9FBFD"}
              trackColor={{ false: "#C8D3E0", true: "#146EF5" }}
              value={settings.biometricsEnabled}
            />
          </HStack>
        </Surface>
      </VStack>
    </ScrollView>
  );
}
