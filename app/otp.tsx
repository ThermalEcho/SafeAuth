import { authClient } from "@/lib/auth-client";
import { showAlert } from "@/lib/auth-utils";
import {
  createOtpAccount,
  deleteOtpAccount,
  listOtpAccounts,
  type OtpAccount,
} from "@/lib/otp-api";
import type { BarcodeScanningResult } from "expo-camera";
import { router } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const REFRESH_INTERVAL_MS = 1000;

type EntryMode = "manual" | "scan";
type ExpoCameraModule = typeof import("expo-camera");

function getExpoCamera(): ExpoCameraModule | null {
  try {
    // Keep native camera loading out of Expo Router's route evaluation.
    // A stale dev client can lack ExpoCamera even when the package is installed.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require("expo-camera") as ExpoCameraModule;
  } catch {
    return null;
  }
}

export default function OtpScreen(): React.JSX.Element {
  const [accounts, setAccounts] = useState<OtpAccount[]>([]);
  const [accountName, setAccountName] = useState("");
  const [issuer, setIssuer] = useState("");
  const [secret, setSecret] = useState("");
  const [entryMode, setEntryMode] = useState<EntryMode>("manual");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [scanned, setScanned] = useState(false);

  const loadAccounts = useCallback(async (): Promise<void> => {
    try {
      const response = await authClient.getSession();

      if (response.error || !response.data?.user) {
        router.replace("/sign-in");
        return;
      }

      const nextAccounts = await listOtpAccounts();
      setAccounts(nextAccounts);
    } catch (error: unknown) {
      showAlert("OTP vault unavailable", error instanceof Error ? error.message : "Unknown error.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAccounts();
  }, [loadAccounts]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      void loadAccounts();
    }, REFRESH_INTERVAL_MS);

    return () => clearInterval(intervalId);
  }, [loadAccounts]);

  const sortedAccounts = useMemo(
    () => [...accounts].sort((left, right) => left.issuer.localeCompare(right.issuer)),
    [accounts],
  );

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
      setAccountName("");
      setIssuer("");
      setSecret("");
      await loadAccounts();
    } catch (error: unknown) {
      showAlert("Could not save code", error instanceof Error ? error.message : "Unknown error.");
    } finally {
      setSaving(false);
    }
  }

  async function saveScannedCode(result: BarcodeScanningResult): Promise<void> {
    if (scanned) {
      return;
    }

    setScanned(true);
    setSaving(true);

    try {
      await createOtpAccount({ otpauthUrl: result.data });
      setEntryMode("manual");
      await loadAccounts();
    } catch (error: unknown) {
      showAlert("QR code not supported", error instanceof Error ? error.message : "Unknown error.");
      setScanned(false);
    } finally {
      setSaving(false);
    }
  }

  async function removeAccount(id: string): Promise<void> {
    try {
      await deleteOtpAccount(id);
      await loadAccounts();
    } catch (error: unknown) {
      showAlert("Could not delete code", error instanceof Error ? error.message : "Unknown error.");
    }
  }

  function renderAccount({ item }: { item: OtpAccount }): React.JSX.Element {
    return (
      <View style={styles.codeRow}>
        <View style={styles.codeDetails}>
          <Text style={styles.issuer}>{item.issuer}</Text>
          <Text style={styles.accountName}>{item.accountName}</Text>
          <Text style={styles.timer}>{item.remainingSeconds}s</Text>
        </View>
        <View style={styles.codeActions}>
          <Text style={styles.code}>{item.code}</Text>
          <Pressable onPress={() => void removeAccount(item.id)} style={styles.deleteButton}>
            <Text style={styles.deleteButtonText}>Delete</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.flex}
      >
        <View style={styles.header}>
          <Pressable onPress={() => router.replace("/home")} hitSlop={12}>
            <Text style={styles.backText}>Back</Text>
          </Pressable>
          <Text style={styles.title}>OTP Codes</Text>
        </View>

        <View style={styles.modeControl}>
          <Pressable
            onPress={() => setEntryMode("manual")}
            style={[styles.modeButton, entryMode === "manual" && styles.modeButtonActive]}
          >
            <Text style={[styles.modeText, entryMode === "manual" && styles.modeTextActive]}>
              Manual
            </Text>
          </Pressable>
          <Pressable
            onPress={() => {
              setEntryMode("scan");
              setScanned(false);
            }}
            style={[styles.modeButton, entryMode === "scan" && styles.modeButtonActive]}
          >
            <Text style={[styles.modeText, entryMode === "scan" && styles.modeTextActive]}>
              Scan QR
            </Text>
          </Pressable>
        </View>

        {entryMode === "manual" ? (
          <View style={styles.form}>
            <TextInput
              autoCapitalize="words"
              editable={!saving}
              onChangeText={setIssuer}
              placeholder="Issuer"
              placeholderTextColor="#7c8798"
              style={styles.input}
              value={issuer}
            />
            <TextInput
              autoCapitalize="none"
              editable={!saving}
              onChangeText={setAccountName}
              placeholder="Account name"
              placeholderTextColor="#7c8798"
              style={styles.input}
              value={accountName}
            />
            <TextInput
              autoCapitalize="characters"
              editable={!saving}
              onChangeText={setSecret}
              placeholder="Secret key"
              placeholderTextColor="#7c8798"
              style={styles.input}
              value={secret}
            />
            <Pressable
              disabled={saving}
              onPress={saveManualSecret}
              style={[styles.primaryButton, saving && styles.disabledButton]}
            >
              <Text style={styles.primaryButtonText}>{saving ? "Saving..." : "Save code"}</Text>
            </Pressable>
          </View>
        ) : (
          <OtpScannerPanel onScan={(result) => void saveScannedCode(result)} />
        )}

        <View style={styles.listHeader}>
          <Text style={styles.sectionTitle}>Saved codes</Text>
          {loading ? <ActivityIndicator color="#174ea6" /> : null}
        </View>

        <FlatList
          contentContainerStyle={styles.listContent}
          data={sortedAccounts}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={
            loading ? null : <Text style={styles.emptyText}>No OTP codes saved yet.</Text>
          }
          renderItem={renderAccount}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function OtpScannerPanel({
  onScan,
}: {
  onScan: (result: BarcodeScanningResult) => void;
}): React.JSX.Element {
  const cameraModule = getExpoCamera();

  if (!cameraModule) {
    return (
      <View style={styles.scannerPanel}>
        <View style={styles.permissionPanel}>
          <Text style={styles.permissionText}>
            Camera scanning is unavailable in this native build. Rebuild the app after installing
            expo-camera.
          </Text>
        </View>
      </View>
    );
  }

  return <LoadedOtpScannerPanel cameraModule={cameraModule} onScan={onScan} />;
}

function LoadedOtpScannerPanel({
  cameraModule,
  onScan,
}: {
  cameraModule: ExpoCameraModule;
  onScan: (result: BarcodeScanningResult) => void;
}): React.JSX.Element {
  const { CameraView, useCameraPermissions } = cameraModule;
  const [permission, requestPermission] = useCameraPermissions();
  const canScan = permission?.granted === true;

  return (
    <View style={styles.scannerPanel}>
      {!permission ? (
        <ActivityIndicator color="#174ea6" />
      ) : canScan ? (
        <CameraView
          barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
          onBarcodeScanned={onScan}
          style={styles.camera}
        />
      ) : (
        <View style={styles.permissionPanel}>
          <Text style={styles.permissionText}>Camera access is required to scan QR codes.</Text>
          <Pressable onPress={requestPermission} style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>Allow camera</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  accountName: {
    color: "#475467",
    fontSize: 14,
    lineHeight: 20,
  },
  backText: {
    color: "#174ea6",
    fontSize: 16,
    fontWeight: "700",
  },
  camera: {
    borderRadius: 8,
    flex: 1,
    overflow: "hidden",
  },
  code: {
    color: "#101828",
    fontSize: 30,
    fontVariant: ["tabular-nums"],
    fontWeight: "800",
    letterSpacing: 0,
  },
  codeActions: {
    alignItems: "flex-end",
    gap: 8,
  },
  codeDetails: {
    flex: 1,
    gap: 4,
    minWidth: 0,
  },
  codeRow: {
    backgroundColor: "#ffffff",
    borderColor: "#d8dee9",
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
    padding: 16,
  },
  deleteButton: {
    alignItems: "center",
    borderColor: "#f0a7a7",
    borderRadius: 8,
    borderWidth: 1,
    minHeight: 36,
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  deleteButtonText: {
    color: "#b42318",
    fontSize: 13,
    fontWeight: "700",
  },
  disabledButton: {
    opacity: 0.7,
  },
  emptyText: {
    color: "#667085",
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
  },
  flex: {
    flex: 1,
  },
  form: {
    gap: 12,
    padding: 20,
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    gap: 18,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  input: {
    backgroundColor: "#ffffff",
    borderColor: "#cbd5e1",
    borderRadius: 8,
    borderWidth: 1,
    color: "#101828",
    fontSize: 16,
    minHeight: 52,
    paddingHorizontal: 14,
  },
  issuer: {
    color: "#101828",
    fontSize: 17,
    fontWeight: "800",
    letterSpacing: 0,
  },
  listContent: {
    gap: 12,
    padding: 20,
    paddingTop: 8,
  },
  listHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  modeButton: {
    alignItems: "center",
    borderRadius: 8,
    flex: 1,
    justifyContent: "center",
    minHeight: 44,
  },
  modeButtonActive: {
    backgroundColor: "#174ea6",
  },
  modeControl: {
    backgroundColor: "#e6ebf2",
    borderRadius: 8,
    flexDirection: "row",
    gap: 4,
    margin: 20,
    padding: 4,
  },
  modeText: {
    color: "#344054",
    fontSize: 15,
    fontWeight: "700",
  },
  modeTextActive: {
    color: "#ffffff",
  },
  permissionPanel: {
    backgroundColor: "#ffffff",
    borderColor: "#d8dee9",
    borderRadius: 8,
    borderWidth: 1,
    gap: 16,
    padding: 20,
  },
  permissionText: {
    color: "#475467",
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
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
  scannerPanel: {
    height: 260,
    paddingHorizontal: 20,
  },
  screen: {
    backgroundColor: "#f6f7fb",
    flex: 1,
  },
  sectionTitle: {
    color: "#101828",
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: 0,
  },
  timer: {
    color: "#667085",
    fontSize: 13,
    fontVariant: ["tabular-nums"],
    fontWeight: "700",
  },
  title: {
    color: "#101828",
    fontSize: 30,
    fontWeight: "800",
    letterSpacing: 0,
  },
});
