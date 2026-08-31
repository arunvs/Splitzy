import DateTimePicker from "@react-native-community/datetimepicker";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useState } from "react";
import { Platform, Pressable, StyleSheet } from "react-native";

import { AppText } from "@/components/ui";
import { colors, radius, spacing } from "@/constants/theme";

export function DateField({ value, onChange }: { value: Date; onChange: (date: Date) => void }) {
  const [show, setShow] = useState(false);

  return (
    <>
      <Pressable style={styles.button} onPress={() => setShow(true)}>
        <MaterialIcons name="calendar-today" size={18} color={colors.textFaint} />
        <AppText variant="bodyLg">{value.toLocaleDateString()}</AppText>
      </Pressable>
      {show && (
        <DateTimePicker
          value={value}
          mode="date"
          maximumDate={new Date()}
          onChange={(_event, selectedDate) => {
            setShow(Platform.OS === "ios");
            if (selectedDate) onChange(selectedDate);
          }}
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    alignSelf: "flex-start",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
  },
});
