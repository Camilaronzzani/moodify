import { Brand, BrandFonts } from "@/constants/theme";
import { StyleSheet, Text, TextInput, View, type TextInputProps } from "react-native";

type Props = TextInputProps & {
  rotulo: string;
  erro?: string;
};

export function CampoTexto({ rotulo, erro, style, ...resto }: Props) {
  return (
    <View style={styles.grupo}>
      <Text style={styles.rotulo}>{rotulo}</Text>
      <TextInput
        placeholderTextColor="rgba(204, 204, 204, 0.45)"
        style={[styles.campo, !!erro && styles.campoComErro, style]}
        {...resto}
      />
      {!!erro && <Text style={styles.erro}>{erro}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  grupo: {
    gap: 8,
  },
  rotulo: {
    fontFamily: BrandFonts.titleSemibold,
    fontSize: 13,
    color: Brand.gray,
  },
  campo: {
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontFamily: BrandFonts.bodyRegular,
    fontSize: 15,
    color: Brand.white,
    borderWidth: 1,
    borderColor: "rgba(147, 112, 219, 0.30)",
    backgroundColor: "rgba(106, 13, 173, 0.12)",
  },
  campoComErro: {
    borderColor: "#E5534B",
  },
  erro: {
    fontFamily: BrandFonts.bodyRegular,
    fontSize: 12,
    color: "#E5534B",
  },
});
