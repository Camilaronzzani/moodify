import { Brand, BrandFonts } from "@/constants/theme";
import { Pressable, StyleSheet, Text } from "react-native";

type Props = {
  texto: string;
  ativa?: boolean;
  onPress?: () => void;
};

/** Etiqueta usada para gêneros, emoções e filtros. */
export function Tag({ texto, ativa = false, onPress }: Props) {
  if (!onPress) {
    return (
      <Text style={[styles.base, ativa ? styles.ativa : styles.inativa]}>{texto}</Text>
    );
  }

  return (
    <Pressable onPress={onPress}>
      {({ pressed }) => (
        <Text
          style={[
            styles.base,
            ativa ? styles.ativa : styles.inativa,
            pressed && styles.pressionada,
          ]}
        >
          {texto}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    fontFamily: BrandFonts.bodyMedium,
    fontSize: 13,
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    overflow: "hidden", // sem isso o borderRadius não corta no Android
  },
  ativa: {
    color: Brand.white,
    borderColor: Brand.violetLight,
    backgroundColor: Brand.purplePrimary,
  },
  inativa: {
    color: Brand.violetLight,
    borderColor: "rgba(147, 112, 219, 0.35)",
    backgroundColor: "rgba(106, 13, 173, 0.12)",
  },
  pressionada: {
    opacity: 0.7,
  },
});
