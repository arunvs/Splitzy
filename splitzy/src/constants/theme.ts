import { Platform, type TextStyle, type ViewStyle } from "react-native";

// Design tokens for the app. Derived from the Stitch "Frictionless Shared
// Finance" design system (DESIGN.md). One source of truth — screens should
// pull colours / type / spacing from here rather than hardcoding hex values.

export const colors = {
  // Brand / actions. `primary` is the action blue used on buttons, the FAB,
  // links and active states. `primaryPressed` is the darker shade for
  // pressed/hover. `primaryTint` is the pale fill behind icon buttons.
  primary: "#2f6feb",
  primaryPressed: "#0055cd",
  primaryTint: "#e8effd",
  onPrimary: "#ffffff",

  // Semantic balance colours. `positive` = "you are owed", `negative` =
  // "you owe". Tints are the pale circle/badge backgrounds.
  positive: "#006c49",
  positiveTint: "#e4f5ec",
  negative: "#b71822",
  negativeTint: "#fdeceb",

  // Surfaces. `background` is the screen behind everything; `surface` is a
  // card; `surfaceAlt` / `surfaceSunken` are progressively more tinted
  // raised/inset fills (segmented controls, chips, avatars).
  background: "#f9f9ff",
  surface: "#ffffff",
  surfaceAlt: "#f0f3ff",
  surfaceSunken: "#e7eefe",

  // Text.
  text: "#151c27",
  textMuted: "#424654",
  textFaint: "#737785",

  // Lines. `border` is a hairline on cards; `borderStrong` is a visible
  // divider / outline.
  border: "#e2e8f8",
  borderStrong: "#c2c6d6",

  // Full-screen modal scrim.
  overlay: "rgba(42, 49, 61, 0.4)",
} as const;

// Type scale. Inter is loaded in the root layout via @expo-google-fonts.
// React Native picks the weight by font family (not fontWeight), so the
// weight is baked into each token — don't also set fontWeight on top.
const FONT = {
  regular: "Inter_400Regular",
  semibold: "Inter_600SemiBold",
  bold: "Inter_700Bold",
} as const;

export const typography = {
  // Big balance figures ("$18.50").
  displayCurrency: {
    fontFamily: FONT.bold,
    fontSize: 40,
    lineHeight: 48,
    letterSpacing: -0.8,
  },
  // Screen titles ("Friends").
  headlineLg: { fontFamily: FONT.bold, fontSize: 28, lineHeight: 34, letterSpacing: -0.3 },
  // Section headers, card titles, dialog titles.
  title: { fontFamily: FONT.semibold, fontSize: 20, lineHeight: 28 },
  // Primary body / list-row names.
  bodyLg: { fontFamily: FONT.regular, fontSize: 16, lineHeight: 24 },
  bodyLgSemibold: { fontFamily: FONT.semibold, fontSize: 16, lineHeight: 24 },
  // Secondary body / metadata.
  body: { fontFamily: FONT.regular, fontSize: 14, lineHeight: 20 },
  bodySemibold: { fontFamily: FONT.semibold, fontSize: 14, lineHeight: 20 },
  // Small uppercase labels (card eyebrows, button text).
  label: {
    fontFamily: FONT.semibold,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.5,
  },
} as const satisfies Record<string, TextStyle>;

// Back-compat / ergonomic alias.
export const fonts = FONT;

// 8px rhythm. `screen` is the consistent side gutter on every screen.
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  gutter: 16,
  lg: 24,
  xl: 32,
  screen: 20,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  pill: 999,
} as const;

// Soft ambient elevation. `card` is the diffuse shadow on white surfaces;
// `fab` is the stronger, primary-tinted lift on the floating button.
export const shadow = {
  card: Platform.select({
    web: { boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)" },
    default: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.05,
      shadowRadius: 12,
      elevation: 2,
    },
  }) as ViewStyle,
  fab: Platform.select({
    web: { boxShadow: "0 8px 20px rgba(47, 111, 235, 0.28)" },
    default: {
      shadowColor: "#2f6feb",
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.28,
      shadowRadius: 16,
      elevation: 8,
    },
  }) as ViewStyle,
} as const;

// On the web build, react-native-web renders TextInput as a real <input>, and
// the browser paints its own (black) focus outline. Kill it — our inputs show
// focus by turning the border blue instead. No-op on native.
export const webInputReset = (
  Platform.OS === "web" ? { outlineWidth: 0, outlineStyle: "none" } : null
) as TextStyle | null;

export const theme = { colors, typography, fonts, spacing, radius, shadow } as const;
