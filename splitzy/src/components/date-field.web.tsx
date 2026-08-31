function toInputValue(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function DateField({ value, onChange }: { value: Date; onChange: (date: Date) => void }) {
  return (
    <input
      type="date"
      style={style}
      value={toInputValue(value)}
      max={toInputValue(new Date())}
      onChange={(e) => {
        const parsed = new Date(`${e.target.value}T00:00:00`);
        if (!Number.isNaN(parsed.getTime())) onChange(parsed);
      }}
    />
  );
}

// Plain CSS-in-JS object — this file only ever bundles for web (Metro picks
// it over date-field.tsx there), so a raw <input> is fine and gets us a
// real native browser calendar picker instead of a hand-typed text field.
const style: Record<string, string | number> = {
  border: "1px solid #c2c6d6",
  borderRadius: 12,
  padding: "12px",
  fontSize: 16,
  fontFamily: "Inter_400Regular, sans-serif",
  color: "#151c27",
  backgroundColor: "#ffffff",
  minWidth: 160,
  alignSelf: "flex-start",
};
