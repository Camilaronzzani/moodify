import { Brand } from "@/constants/theme";
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";

type Props = {
  children: React.ReactNode;
  onPress?: () => void;
  destacado?: boolean;
  style?: StyleProp<ViewStyle>;
};

/** Caixa translúcida com borda roxa — a base visual de quase toda tela. */
export function Card({ children, onPress, destacado = false, style }: Props) {
  const estilos = [styles.base, destacado && styles.destacado, style];

  if (!onPress) {
    return <View style={estilos}>{children}</View>;
  }

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [...estilos, pressed && styles.pressionado]}
    >
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: "rgba(147, 112, 219, 0.22)",
    backgroundColor: "rgba(106, 13, 173, 0.12)",
  },
  destacado: {
    borderColor: "rgba(147, 112, 219, 0.5)",
    backgroundColor: "rgba(106, 13, 173, 0.22)",
    shadowColor: Brand.purpleDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
  },
  pressionado: {
    opacity: 0.75,
  },
});
