import { Image } from "expo-image";
import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";

import { colors, fonts, radius } from "@/constants/theme";

type AvatarProps = {
  // Name or email — used to derive initials when there's no image.
  name?: string;
  uri?: string | null;
  size?: number;
};

function initials(name: string): string {
  const cleaned = name.trim();
  if (!cleaned) return "?";
  const namePart = cleaned.includes("@") ? cleaned.split("@")[0] : cleaned;
  const words = namePart.split(/[\s._-]+/).filter(Boolean);
  if (words.length === 0) return "?";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}

export function Avatar({ name = "", uri, size = 48 }: AvatarProps) {
  const label = useMemo(() => initials(name), [name]);
  const dimension = { width: size, height: size, borderRadius: radius.pill };

  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={[dimension, { backgroundColor: colors.surfaceSunken }]}
        contentFit="cover"
      />
    );
  }

  const fontSize = Math.round(size * 0.36);

  return (
    <View style={[styles.fallback, dimension]}>
      <Text
        allowFontScaling={false}
        style={{
          fontFamily: fonts.semibold,
          fontSize,
          lineHeight: fontSize,
          color: colors.primary,
          textAlign: "center",
          textAlignVertical: "center",
          includeFontPadding: false,
        }}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  fallback: {
    backgroundColor: colors.primaryTint,
    alignItems: "center",
    justifyContent: "center",
  },
});
