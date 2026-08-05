import { Brand, BrandFonts } from "@/constants/theme";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

type Props = {
  mensagem?: string;
};

/** Spinner centralizado, para quando a tela inteira está esperando. */
export function Carregamento({ mensagem = "Carregando..." }: Props) {
  return (
    <View style={styles.caixa}>
      <ActivityIndicator size="large" color={Brand.violetLight} />
      <Text style={styles.texto}>{mensagem}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  caixa: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 14,
    padding: 32,
  },
  texto: {
    fontFamily: BrandFonts.bodyRegular,
    fontSize: 14,
    textAlign: "center",
    color: Brand.gray,
  },
});
