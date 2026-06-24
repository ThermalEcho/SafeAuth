import React, { createContext, useContext, useMemo } from "react";

export type SafeAuthThemeMode = "light" | "dark";

export type SafeAuthPalette = {
  accent: string;
  accentDark: string;
  accentSoft: string;
  background: string;
  border: string;
  danger: string;
  dangerBorder: string;
  dangerSoft: string;
  dangerText: string;
  field: string;
  fieldBorder: string;
  iconShell: string;
  ink: string;
  muted: string;
  navigation: string;
  overlay: string;
  positive: string;
  positiveText: string;
  segment: string;
  spinnerText: string;
  surface: string;
  surfaceAlt: string;
  warning: string;
  warningText: string;
  white: string;
};

const lightPalette: SafeAuthPalette = {
  accent: "#146EF5",
  accentDark: "#0B3B82",
  accentSoft: "#EAF2FF",
  background: "#F4F7FB",
  border: "#DDE5EF",
  danger: "#C43131",
  dangerBorder: "#F0B4B4",
  dangerSoft: "#FFF8F8",
  dangerText: "#C43131",
  field: "#F9FBFD",
  fieldBorder: "#D5DFEB",
  iconShell: "#0B2A57",
  ink: "#10213A",
  muted: "#607089",
  navigation: "#FFFFFF",
  overlay: "#0B2A57",
  positive: "#21A366",
  positiveText: "#34815C",
  segment: "#E4EAF2",
  spinnerText: "#315B91",
  surface: "#FFFFFF",
  surfaceAlt: "#F9FBFD",
  warning: "#E18A2D",
  warningText: "#B76617",
  white: "#FFFFFF",
};

const darkPalette: SafeAuthPalette = {
  accent: "#6EA8FF",
  accentDark: "#9FC7FF",
  accentSoft: "#142A4A",
  background: "#0E1624",
  border: "#24324A",
  danger: "#FF8E8E",
  dangerBorder: "#7B3636",
  dangerSoft: "#321B22",
  dangerText: "#FF9B9B",
  field: "#121D2E",
  fieldBorder: "#2D3D57",
  iconShell: "#0A2347",
  ink: "#F4F8FF",
  muted: "#A8B6CC",
  navigation: "#101928",
  overlay: "#071427",
  positive: "#4FD18B",
  positiveText: "#86E4B0",
  segment: "#182438",
  spinnerText: "#B9D4FF",
  surface: "#131E30",
  surfaceAlt: "#182438",
  warning: "#F1B15D",
  warningText: "#FFD08A",
  white: "#FFFFFF",
};

const palettes: Record<SafeAuthThemeMode, SafeAuthPalette> = {
  dark: darkPalette,
  light: lightPalette,
};

const SafeAuthThemeContext = createContext({
  colors: lightPalette,
  mode: "light" as SafeAuthThemeMode,
});

export function SafeAuthThemeProvider({
  children,
  mode,
}: {
  children: React.ReactNode;
  mode: SafeAuthThemeMode;
}): React.JSX.Element {
  const value = useMemo(() => ({ colors: palettes[mode], mode }), [mode]);
  return (
    <SafeAuthThemeContext.Provider value={value}>
      {children}
    </SafeAuthThemeContext.Provider>
  );
}

export function useSafeAuthTheme(): {
  colors: SafeAuthPalette;
  mode: SafeAuthThemeMode;
} {
  return useContext(SafeAuthThemeContext);
}

export function getSafeAuthPalette(mode: SafeAuthThemeMode): SafeAuthPalette {
  return palettes[mode];
}

export const defaultColors = lightPalette;