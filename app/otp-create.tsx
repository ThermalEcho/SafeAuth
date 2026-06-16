import {
  Field,
  OutlineButton,
  PageHeader,
  PrimaryButton,
  Surface,
  colors,
} from "@/components/safeauth-ui";
import { Box } from "@/components/ui/box";
import { HStack } from "@/components/ui/hstack";
import { Pressable } from "@/components/ui/pressable";
import { Spinner } from "@/components/ui/spinner";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { showAlert } from "@/lib/auth-utils";
import { createOtpAccount } from "@/lib/otp-api";
import type { BarcodeScanningResult } from "expo-camera";
import { router } from "expo-router";
import React, { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from "react-native";

type EntryMode = "manual" | "scan";
type ExpoCameraModule = typeof import("expo-camera");
type ExpoImagePickerModule = typeof import("expo-image-picker");

function getExpoCamera(): ExpoCameraModule | null {
  try {
    // Native modules may be absent from a stale development build.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require("expo-camera") as ExpoCameraModule;
  } catch {
    return null;
  }
}

function getExpoImagePicker(): ExpoImagePickerModule | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require("expo-image-picker") as ExpoImagePickerModule;
  } catch {
    return null;
  }
}

export default function CreateOtpScreen(): React.JSX.Element {
  const [accountName, setAccountName] = useState("");
  const [issuer, setIssuer] = useState("");
  const [secret, setSecret] = useState("");
  const [entryMode, setEntryMode] = useState<EntryMode>("manual");
  const [saving, setSaving] = useState(false);
  const [scanned, setScanned] = useState(false);

  async function saveManualSecret(): Promise<void> {
    if (!secret.trim()) {
      showAlert("Missing secret", "Paste the TOTP secret from the account setup screen.");
      return;
    }

    setSaving(true);
    try {
      await createOtpAccount({
        accountName: accountName.trim(),
        issuer: issuer.trim(),
        secret: secret.trim(),
      });
      router.replace("/otp");
    } catch (error: unknown) {
      showAlert("Could not save code", error instanceof Error ? error.message : "Unknown error.");
    } finally {
      setSaving(false);
    }
  }

  async function saveScannedCode(result: BarcodeScanningResult): Promise<void> {
    if (scanned || saving) return;
    if (!result.data.trim().toLowerCase().startsWith("otpauth://totp/")) {
      showAlert("QR code not supported", "Choose a TOTP authenticator QR code.");
      return;
    }

    setScanned(true);
    setSaving(true);
    try {
      await createOtpAccount({ otpauthUrl: result.data.trim() });
      router.replace("/otp");
    } catch (error: unknown) {
      showAlert("QR code not supported", error instanceof Error ? error.message : "Unknown error.");
      setScanned(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ backgroundColor: colors.background, flex: 1 }}
    >
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ padding: 24, paddingBottom: 40 }}
      >
        <VStack className="mx-auto w-full max-w-[680px] gap-6">
          <PageHeader
            backTo="/otp"
            title="Add an OTP code"
            subtitle="Enter a secret manually or scan the authenticator QR code."
          />

          <HStack className="rounded-2xl bg-[#E4EAF2] p-1">
            {(["manual", "scan"] as const).map((mode) => {
              const active = entryMode === mode;
              return (
                <Pressable
                  key={mode}
                  className={`flex-1 items-center rounded-xl px-4 py-3 ${
                    active ? "bg-white shadow-soft-1" : ""
                  }`}
                  onPress={() => {
                    setEntryMode(mode);
                    if (mode === "scan") setScanned(false);
                  }}
                >
                  <Text
                    className={`font-bold ${
                      active ? "text-[#146EF5]" : "text-[#607089]"
                    }`}
                  >
                    {mode === "manual" ? "Manual entry" : "Scan QR"}
                  </Text>
                </Pressable>
              );
            })}
          </HStack>

          {entryMode === "manual" ? (
            <Surface>
              <VStack className="gap-4">
                <Field
                  label="Issuer"
                  autoCapitalize="words"
                  editable={!saving}
                  onChangeText={setIssuer}
                  placeholder="Example: GitHub"
                  value={issuer}
                />
                <Field
                  label="Account name"
                  autoCapitalize="none"
                  editable={!saving}
                  onChangeText={setAccountName}
                  placeholder="you@example.com"
                  value={accountName}
                />
                <Field
                  label="Secret key"
                  autoCapitalize="characters"
                  autoCorrect={false}
                  editable={!saving}
                  onChangeText={setSecret}
                  placeholder="Paste the TOTP secret"
                  value={secret}
                />
              </VStack>
              <PrimaryButton loading={saving} onPress={() => void saveManualSecret()}>
                {saving ? "Saving code" : "Save code"}
              </PrimaryButton>
            </Surface>
          ) : (
            <OtpScannerPanel
              disabled={saving}
              onScan={(result) => void saveScannedCode(result)}
            />
          )}
        </VStack>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function OtpScannerPanel({
  disabled,
  onScan,
}: {
  disabled: boolean;
  onScan: (result: BarcodeScanningResult) => void;
}): React.JSX.Element {
  const cameraModule = getExpoCamera();

  if (!cameraModule) {
    return (
      <Surface>
        <Text selectable className="text-center leading-6 text-[#607089]">
          Camera scanning is unavailable in this native build. Rebuild the app
          after installing expo-camera.
        </Text>
      </Surface>
    );
  }

  return (
    <LoadedOtpScannerPanel cameraModule={cameraModule} disabled={disabled} onScan={onScan} />
  );
}

function LoadedOtpScannerPanel({
  cameraModule,
  disabled,
  onScan,
}: {
  cameraModule: ExpoCameraModule;
  disabled: boolean;
  onScan: (result: BarcodeScanningResult) => void;
}): React.JSX.Element {
  const { CameraView, useCameraPermissions } = cameraModule;
  const [permission, requestPermission] = useCameraPermissions();
  const [selectingImage, setSelectingImage] = useState(false);
  const canScan = permission?.granted === true;

  async function scanImageFromGallery(): Promise<void> {
    const imagePicker = getExpoImagePicker();
    if (!imagePicker) {
      showAlert("Photo gallery unavailable", "Rebuild the app after installing expo-image-picker.");
      return;
    }

    setSelectingImage(true);
    try {
      const selection = await imagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        allowsMultipleSelection: false,
        aspect: [1, 1],
        mediaTypes: ["images"],
        quality: 1,
      });

      if (selection.canceled || !selection.assets[0]?.uri) return;
      const results = await cameraModule.Camera.scanFromURLAsync(selection.assets[0].uri, ["qr"]);
      const qrCode = results.find((result) => result.type === "qr") ?? results[0];
      if (!qrCode) {
        showAlert("No QR code found", "Crop tightly around the QR code, then try again.");
        return;
      }
      onScan(qrCode);
    } catch (error: unknown) {
      showAlert("Could not scan image", error instanceof Error ? error.message : "Unknown error.");
    } finally {
      setSelectingImage(false);
    }
  }

  return (
    <Surface>
      <VStack className="gap-3">
        <Text className="text-center leading-6 text-[#607089]">
          Center the authenticator QR code inside the frame.
        </Text>
        <Box className="h-[320px] overflow-hidden rounded-[24px] bg-[#0B2A57]">
          {!permission ? (
            <Box className="flex-1 items-center justify-center">
              <Spinner color="#FFFFFF" />
            </Box>
          ) : canScan ? (
            <CameraView
              barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
              onBarcodeScanned={disabled ? undefined : onScan}
              style={StyleSheet.absoluteFill}
            />
          ) : (
            <View style={styles.permissionPanel}>
              <Text className="text-center leading-6 text-white">
                Camera access is required for live scanning.
              </Text>
              <PrimaryButton onPress={() => void requestPermission()}>
                Allow camera
              </PrimaryButton>
            </View>
          )}
        </Box>
      </VStack>
      <OutlineButton
        disabled={disabled || selectingImage}
        loading={selectingImage}
        onPress={() => void scanImageFromGallery()}
      >
        {selectingImage ? "Scanning image" : "Choose QR image"}
      </OutlineButton>
    </Surface>
  );
}

const styles = StyleSheet.create({
  permissionPanel: {
    flex: 1,
    gap: 18,
    justifyContent: "center",
    padding: 24,
  },
});
