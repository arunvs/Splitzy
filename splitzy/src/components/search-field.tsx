import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRef, useState } from "react";
import { Animated, Easing, Pressable, StyleSheet, TextInput } from "react-native";

type SearchFieldProps = {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  onExpandedChange?: (expanded: boolean) => void;
};

export function SearchField({ value, onChangeText, placeholder, onExpandedChange }: SearchFieldProps) {
  const [expanded, setExpanded] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const anim = useRef(new Animated.Value(0)).current;

  function open() {
    setExpanded(true);
    onExpandedChange?.(true);
    Animated.timing(anim, {
      toValue: 1,
      duration: 220,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start(() => inputRef.current?.focus());
  }

  function close() {
    Animated.timing(anim, {
      toValue: 0,
      duration: 180,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: false,
    }).start(() => {
      setExpanded(false);
      onExpandedChange?.(false);
      onChangeText("");
    });
  }

  if (!expanded) {
    return (
      <Pressable style={styles.iconButton} onPress={open} hitSlop={8}>
        <MaterialIcons name="search" size={22} color="#555" />
      </Pressable>
    );
  }

  const scale = anim.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1] });

  return (
    <Animated.View style={[styles.expandedContainer, { opacity: anim, transform: [{ scale }] }]}>
      <MaterialIcons name="search" size={20} color="#2f6feb" />
      <TextInput
        ref={inputRef}
        style={styles.input}
        placeholder={placeholder}
        value={value}
        onChangeText={onChangeText}
        autoCapitalize="none"
      />
      <Pressable onPress={close} hitSlop={8}>
        <MaterialIcons name="close" size={20} color="#888" />
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#f2f2f2",
    alignItems: "center",
    justifyContent: "center",
  },
  expandedContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#2f6feb",
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  input: {
    flex: 1,
    fontSize: 15,
  },
});
