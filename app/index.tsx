import { router } from "expo-router";
import React from "react";
import { Pressable, SafeAreaView, StyleSheet, Text, View } from "react-native";

const APP_NAME = "SafeAuth";

export default function LandingScreen(): React.JSX.Element {
  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.container}>
        <View style={styles.brandMark}>
          <Text style={styles.brandMarkText}>SA</Text>
        </View>

        <Text style={styles.eyebrow}>Secure mobile auth</Text>
        <Text style={styles.title}>{APP_NAME}</Text>
        <Text style={styles.subtitle}>
          Create an account, verify email, and sign in through the SafeAuth backend.
        </Text>

        <View style={styles.actions}>
          <Pressable style={styles.primaryButton} onPress={() => router.push("/create-account")}>
            <Text style={styles.primaryButtonText}>Create account</Text>
          </Pressable>

          <Pressable style={styles.secondaryButton} onPress={() => router.push("/sign-in")}>
            <Text style={styles.secondaryButtonText}>Sign in</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#f6f7fb",
  },
  container: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  brandMark: {
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "#174ea6",
    borderRadius: 16,
    height: 64,
    justifyContent: "center",
    marginBottom: 28,
    width: 64,
  },
  brandMarkText: {
    color: "#ffffff",
    fontSize: 20,
    fontWeight: "800",
  },
  eyebrow: {
    color: "#536176",
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0,
    marginBottom: 10,
    textTransform: "uppercase",
  },
  title: {
    color: "#101828",
    fontSize: 42,
    fontWeight: "800",
    letterSpacing: 0,
    marginBottom: 14,
  },
  subtitle: {
    color: "#475467",
    fontSize: 17,
    lineHeight: 26,
    maxWidth: 420,
  },
  actions: {
    gap: 12,
    marginTop: 36,
  },
  primaryButton: {
    alignItems: "center",
    backgroundColor: "#174ea6",
    borderRadius: 8,
    minHeight: 52,
    justifyContent: "center",
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
    minHeight: 52,
    justifyContent: "center",
  },
  secondaryButtonText: {
    color: "#174ea6",
    fontSize: 16,
    fontWeight: "700",
  },
});
