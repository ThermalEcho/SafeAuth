import { router } from "expo-router";
import React, { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
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
  if (!cameraModule) {
    return <MissingCameraModule />;
  }

  return <CameraScanner cameraModule={cameraModule} />;
}

function CameraScanner({
  cameraModule: { CameraView, useCameraPermissions },
}: {
  cameraModule: ExpoCameraModule;
}): React.JSX.Element {
  const [permission, requestPermission] = useCameraPermissions();
  const [lastScan, setLastScan] = useState<string | null>(null);

  if (!permission) {
    return <SafeAreaView style={styles.screen} />;
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.permissionContainer}>
          <Text style={styles.title}>Camera access</Text>
          <Text style={styles.body}>
            SafeAuth needs camera access to scan authenticator QR codes.
          </Text>
          <Pressable style={styles.primaryButton} onPress={requestPermission}>
            <Text style={styles.primaryButtonText}>Allow camera</Text>
          </Pressable>
          <Pressable style={styles.secondaryButton} onPress={() => router.back()}>
            <Text style={styles.secondaryButtonText}>Back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.cameraScreen}>
      <CameraView
        barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
        onBarcodeScanned={({ data }) => setLastScan(data)}
        style={styles.camera}
      />
      <SafeAreaView style={styles.overlay}>
        <View style={styles.topBar}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Back</Text>
          </Pressable>
        </View>

        <View style={styles.scanFrame} />

        <View style={styles.resultPanel}>
          <Text style={styles.resultLabel}>Last scan</Text>
          <Text numberOfLines={2} style={styles.resultText}>
            {lastScan ?? "Point the camera at a QR code."}
          </Text>
        </View>
      </SafeAreaView>
    </View>
  );
}

function MissingCameraModule(): React.JSX.Element {
  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.permissionContainer}>
        <Text style={styles.title}>Camera unavailable</Text>
        <Text selectable style={styles.body}>
          This app build does not include expo-camera. Rebuild the native app, then
          restart Expo.
        </Text>
        <Pressable style={styles.secondaryButton} onPress={() => router.back()}>
          <Text style={styles.secondaryButtonText}>Back</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: "#f6f7fb",
    flex: 1,
  },
  cameraScreen: {
    backgroundColor: "#000000",
    flex: 1,
  },
  camera: {
    ...StyleSheet.absoluteFillObject,
  },
  overlay: {
    flex: 1,
    justifyContent: "space-between",
    padding: 20,
  },
  topBar: {
    alignItems: "flex-start",
  },
  backButton: {
    backgroundColor: "rgba(16, 24, 40, 0.72)",
    borderRadius: 8,
    minHeight: 44,
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  backButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
  },
  scanFrame: {
    alignSelf: "center",
    aspectRatio: 1,
    borderColor: "#ffffff",
    borderRadius: 8,
    borderWidth: 3,
    maxWidth: 320,
    width: "78%",
  },
  resultPanel: {
    backgroundColor: "rgba(16, 24, 40, 0.86)",
    borderRadius: 8,
    gap: 6,
    padding: 16,
  },
  resultLabel: {
    color: "#cbd5e1",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0,
    textTransform: "uppercase",
  },
  resultText: {
    color: "#ffffff",
    fontSize: 15,
    lineHeight: 22,
  },
  permissionContainer: {
    flex: 1,
    gap: 14,
    justifyContent: "center",
    padding: 24,
  },
  title: {
    color: "#101828",
    fontSize: 30,
    fontWeight: "800",
    letterSpacing: 0,
  },
  body: {
    color: "#475467",
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 12,
  },
  primaryButton: {
    alignItems: "center",
    backgroundColor: "#174ea6",
    borderRadius: 8,
    justifyContent: "center",
    minHeight: 52,
  },
  primaryButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
  },
  secondaryButton: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderColor: "#cbd5e1",
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 52,
  },
  secondaryButtonText: {
    color: "#174ea6",
    fontSize: 16,
    fontWeight: "700",
  },
});
