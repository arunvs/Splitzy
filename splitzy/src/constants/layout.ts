import type { ViewStyle } from "react-native";

// Caps form-style screens to a comfortable reading width and centers them.
// On native this does nothing (phone screens are already narrower than the
// cap) — it only matters on web, where these screens would otherwise
// stretch edge-to-edge across a wide browser window.
export const centeredContent: ViewStyle = {
  width: "100%",
  maxWidth: 480,
  alignSelf: "center",
};
