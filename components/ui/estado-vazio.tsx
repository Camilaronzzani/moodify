import { Button } from "@/components/ui/button";
import { Brand, BrandFonts } from "@/constants/theme";
import { Ionicons } from "@react-native-vector-icons/ionicons";
import { StyleSheet, Text, View } from "react-native";

type Props = {
  icone: React.ComponentProps<typeof Ionicons>["name"];
  titulo: string;
  descricao: string;
  rotuloAcao?: string;
  onAcao?: () => void;
};

/** Mensagem amigável para listas vazias — melhor que uma tela em branco. */
export function EstadoVazio({ icone, titulo, descricao, rotuloAcao, onAcao }: Props) {
  return (
    <View style={styles.caixa}>
      <View style={styles.circulo}>
        <Ionicons name={icone} size={30} color={Brand.violetLight} />
      </View>
      <Text style={styles.titulo}>{titulo}</Text>
      <Text style={styles.descricao}>{descricao}</Text>
      {!!rotuloAcao && !!onAcao && (
        <View style={styles.acao}>
          <Button label={rotuloAcao} variant="outline" onPress={onAcao} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  caixa: {
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 48,
    paddingHorizontal: 28,
  },
  circulo: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(147, 112, 219, 0.3)",
    backgroundColor: "rgba(106, 13, 173, 0.12)",
    marginBottom: 6,
  },
  titulo: {
    fontFamily: BrandFonts.titleSemibold,
    fontSize: 17,
    textAlign: "center",
    color: Brand.white,
  },
  descricao: {
    fontFamily: BrandFonts.bodyRegular,
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
    color: Brand.gray,
  },
  acao: {
    marginTop: 10,
    alignSelf: "stretch",
  },
});
