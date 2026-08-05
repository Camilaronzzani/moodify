import { Brand } from "@/constants/theme";
import { ActivityIndicator, Pressable, StyleSheet, Text} from "react-native";

type Props = {
  label: string;
  onPress?: () => void;
  variant?: "primary" | "outline";
  disabled?: boolean;
  loading?: boolean;
};

export function Button({
  label,
  onPress,
  variant = "primary",
  disabled = false,
  loading = false,
}: Props) {
  const isOutline = variant === "outline";

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.base,
        isOutline ? styles.outline : styles.primary,
        (disabled || loading) && styles.disabled,
        pressed && !disabled && !loading && styles.pressed,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={isOutline ? Brand.violetLight : Brand.white} />
      ) : (
        <Text style={[styles.text, isOutline && styles.textOutline]}>
          {label}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  primary: {
    backgroundColor: Brand.purplePrimary,
    shadowColor: Brand.purpleDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  outline: {
    backgroundColor: "transparent",
    borderWidth: 1.5,
    borderColor: Brand.violetLight,
  },
  disabled: {
    opacity: 0.5,
  },
  pressed: {
    opacity: 0.85,
  },
  text: {
    color: Brand.white,
    fontSize: 16,
    fontWeight: "600",
  },
  textOutline: {
    color: Brand.violetLight,
  },
});
