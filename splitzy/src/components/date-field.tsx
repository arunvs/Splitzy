import DateTimePicker from "@react-native-community/datetimepicker";
import { useState } from "react";
import { Platform, Pressable, StyleSheet, Text } from "react-native";

export function DateField({ value, onChange }: { value: Date; onChange: (date: Date) => void }) {
  const [show, setShow] = useState(false);

  return (
    <>
      <Pressable style={styles.button} onPress={() => setShow(true)}>
        <Text style={styles.buttonText}>{value.toLocaleDateString()}</Text>
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
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    alignSelf: "flex-start",
  },
  buttonText: {
    fontSize: 15,
  },
});
