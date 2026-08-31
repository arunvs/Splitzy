import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useEffect, useRef } from "react";
import { Animated, Easing, Pressable, StyleSheet, TextInput } from "react-native";

import { colors, fonts, radius, webInputReset } from "@/constants/theme";

type SearchFieldProps = {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  // Controlled by the parent so the surrounding layout (screen title vs.
  // full-width field) and this component never get out of sync.
  expanded: boolean;
  onExpandedChange: (expanded: boolean) => void;
};

export function SearchField({
  value,
  onChangeText,
  placeholder,
  expanded,
  onExpandedChange,
}: SearchFieldProps) {
  const inputRef = useRef<TextInput>(null);
  const anim = useRef(new Animated.Value(expanded ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: expanded ? 1 : 0,
      duration: expanded ? 220 : 160,
      easing: expanded ? Easing.out(Easing.cubic) : Easing.in(Easing.cubic),
      useNativeDriver: false,
    }).start();

    if (expanded) {
      // Focus once the field has actually rendered.
      const id = setTimeout(() => inputRef.current?.focus(), 50);
      return () => clearTimeout(id);
    }
  }, [expanded, anim]);

  if (!expanded) {
    return (
      <Pressable style={styles.iconButton} onPress={() => onExpandedChange(true)} hitSlop={8}>
        <MaterialIcons name="search" size={22} color={colors.primary} />
      </Pressable>
    );
  }

  const scale = anim.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1] });

  return (
    <Animated.View style={[styles.expandedContainer, { opacity: anim, transform: [{ scale }] }]}>
      <MaterialIcons name="search" size={20} color={colors.primary} />
      <TextInput
        ref={inputRef}
        style={[styles.input, webInputReset]}
        placeholder={placeholder}
        placeholderTextColor={colors.textFaint}
        value={value}
        onChangeText={onChangeText}
        autoCapitalize="none"
        returnKeyType="search"
      />
      <Pressable
        onPress={() => {
          onChangeText("");
          onExpandedChange(false);
        }}
        hitSlop={8}>
        <MaterialIcons name="close" size={20} color={colors.textFaint} />
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: colors.primaryTint,
    alignItems: "center",
    justifyContent: "center",
  },
  expandedContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontFamily: fonts.regular,
    color: colors.text,
    includeFontPadding: false,
    textAlignVertical: "center",
    paddingVertical: 0,
  },
});
