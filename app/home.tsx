import { router } from "expo-router";
import React from "react";
import { Pressable, SafeAreaView, StyleSheet, Text, View } from "react-native";

export default function HomeScreen(): React.JSX.Element {
  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.container}>
        <View style={styles.panel}>
          <Text style={styles.eyebrow}>Authenticated</Text>
          <Text style={styles.title}>SafeAuth Home</Text>
          <Text style={styles.body}>
            Manage the authenticator codes saved to your SafeAuth account.
          </Text>

          <Pressable style={styles.primaryButton} onPress={() => router.push("/otp")}>
            <Text style={styles.primaryButtonText}>Open OTP codes</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: "#f6f7fb",
    flex: 1,
  },
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
  },
  panel: {
    backgroundColor: "#ffffff",
    borderColor: "#d8dee9",
    borderRadius: 8,
    borderWidth: 1,
    gap: 14,
    padding: 20,
  },
  eyebrow: {
    color: "#536176",
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0,
    textTransform: "uppercase",
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
  },
  primaryButton: {
    alignItems: "center",
    backgroundColor: "#174ea6",
    borderRadius: 8,
    justifyContent: "center",
    marginTop: 12,
    minHeight: 52,
  },
  primaryButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
  },
});
