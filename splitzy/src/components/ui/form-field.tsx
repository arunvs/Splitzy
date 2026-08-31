import { forwardRef } from "react";
import { StyleSheet, TextInput, type TextInputProps, View } from "react-native";

import { colors, fonts, radius, spacing } from "@/constants/theme";

import { AppText } from "./app-text";

type FormFieldProps = TextInputProps & {
  label?: string;
  error?: string | null;
};

// Labelled text input with the standard field styling. Used across all the
// form screens (add expense, settle up, auth, add friend, create group).
export const FormField = forwardRef<TextInput, FormFieldProps>(function FormField(
  { label, error, style, multiline, ...rest },
  ref,
) {
  return (
    <View style={styles.wrap}>
      {label ? (
        <AppText variant="label" color="textMuted">
          {label.toUpperCase()}
        </AppText>
      ) : null}
      <TextInput
        ref={ref}
        placeholderTextColor={colors.textFaint}
        multiline={multiline}
        style={[
          styles.input,
          multiline && styles.multiline,
          !!error && styles.inputError,
          style,
        ]}
        {...rest}
      />
      {error ? (
        <AppText variant="body" color="negative">
          {error}
        </AppText>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.xs,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    fontSize: 16,
    fontFamily: fonts.regular,
    color: colors.text,
    includeFontPadding: false,
    textAlignVertical: "center",
  },
  multiline: {
    minHeight: 72,
    textAlignVertical: "top",
    paddingTop: 12,
  },
  inputError: {
    borderColor: colors.negative,
  },
});
