import {
  goBackOrReplace,
  OutlineButton,
  PageHeader,
  PrimaryButton,
  Surface,
  useSafeAuthTheme,
} from "@/components/safeauth-ui";
import { Box } from "@/components/ui/box";
import { Pressable } from "@/components/ui/pressable";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import React, { useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type ExpoCameraModule = typeof import("expo-camera");

declare const require: (moduleName: string) => unknown;

function getCameraModule(): ExpoCameraModule | null {
  try {
    return require("expo-camera") as ExpoCameraModule;
  } catch {
    return null;
  }
}

const cameraModule = getCameraModule();

export default function CameraScreen(): React.JSX.Element {
  if (!cameraModule) return <MissingCameraModule />;
  return <CameraScanner cameraModule={cameraModule} />;
}

function CameraScanner({
  cameraModule: { CameraView, useCameraPermissions },
}: {
  cameraModule: ExpoCameraModule;
}): React.JSX.Element {
  const { colors } = useSafeAuthTheme();
  const [permission, requestPermission] = useCameraPermissions();
  const [lastScan, setLastScan] = useState<string | null>(null);

  if (!permission) {
    return <View style={{ backgroundColor: colors.background, flex: 1 }} />;
  }

  if (!permission.granted) {
    return (
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        style={{ backgroundColor: colors.background }}
        contentContainerStyle={{ flexGrow: 1, justifyContent: "center", padding: 24 }}
      >
        <VStack className="mx-auto w-full max-w-[560px] gap-6">
          <PageHeader
            backTo="/home"
            title="Camera access"
            subtitle="SafeAuth uses the camera to scan authenticator QR codes."
          />
          <Surface>
            <Text className="leading-6" style={{ color: colors.muted }}>
              Camera permission stays under your device settings and is only requested when you use scanning features.
            </Text>
            <PrimaryButton onPress={() => void requestPermission()}>
              Allow camera
            </PrimaryButton>
            <OutlineButton onPress={() => goBackOrReplace("/home")}>Not now</OutlineButton>
          </Surface>
        </VStack>
      </ScrollView>
    );
  }

  return (
    <View style={styles.cameraScreen}>
      <CameraView barcodeScannerSettings={{ barcodeTypes: ["qr"] }} onBarcodeScanned={({ data }) => setLastScan(data)} style={StyleSheet.absoluteFill} />
      <SafeAreaView style={styles.overlay}>
        <Pressable
          className="self-start rounded-full px-5 py-3"
          style={{ backgroundColor: `${colors.overlay}E6` }}
          onPress={() => goBackOrReplace("/home")}
        >
          <Text className="font-bold" style={{ color: colors.white }}>Back</Text>
        </Pressable>

        <Box className="mx-auto aspect-square w-[78%] max-w-[320px] rounded-[28px] border-4" style={{ borderColor: colors.white }} />

        <Box className="rounded-[24px] p-5" style={{ backgroundColor: `${colors.overlay}F2` }}>
          <VStack className="gap-2">
            <Text className="text-xs font-bold uppercase tracking-[1.5px]" style={{ color: "#AFC8EB" }}>
              Last scan
            </Text>
            <Text selectable numberOfLines={3} className="text-base leading-6" style={{ color: colors.white }}>
              {lastScan ?? "Point the camera at a QR code."}
            </Text>
          </VStack>
        </Box>
      </SafeAreaView>
    </View>
  );
}

function MissingCameraModule(): React.JSX.Element {
  const { colors } = useSafeAuthTheme();

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={{ flexGrow: 1, justifyContent: "center", padding: 24 }}
    >
      <VStack className="mx-auto w-full max-w-[560px] gap-6">
        <PageHeader
          backTo="/home"
          title="Camera unavailable"
          subtitle="This app build does not include the camera module."
        />
        <Surface>
          <Text selectable className="leading-6" style={{ color: colors.muted }}>
            Rebuild the native app, then restart Expo to enable QR scanning.
          </Text>
          <OutlineButton onPress={() => goBackOrReplace("/home")}>Back to SafeAuth</OutlineButton>
        </Surface>
      </VStack>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  cameraScreen: {
    backgroundColor: "#000000",
    flex: 1,
  },
  overlay: {
    flex: 1,
    justifyContent: "space-between",
    padding: 20,
  },
});