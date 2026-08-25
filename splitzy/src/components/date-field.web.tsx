import { StyleSheet, TextInput } from "react-native";

function toInputValue(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function DateField({ value, onChange }: { value: Date; onChange: (date: Date) => void }) {
  return (
    <TextInput
      style={styles.input}
      value={toInputValue(value)}
      placeholder="YYYY-MM-DD"
      onChangeText={(text) => {
        const parsed = new Date(`${text}T00:00:00`);
        if (!Number.isNaN(parsed.getTime())) onChange(parsed);
      }}
    />
  );
}

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    alignSelf: "flex-start",
    minWidth: 130,
  },
});
