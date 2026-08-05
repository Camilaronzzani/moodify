import { Brand, BrandFonts } from "@/constants/theme";
import { Pressable, StyleSheet, Text, View } from "react-native";

type Props = {
  titulo: string;
  children: React.ReactNode;
  rotuloAcao?: string;
  onAcao?: () => void;
};

/** Título de seção com ação opcional à direita ("Ver todos"). */
export function Secao({ titulo, children, rotuloAcao, onAcao }: Props) {
  return (
    <View style={styles.caixa}>
      <View style={styles.cabecalho}>
        <Text style={styles.titulo}>{titulo}</Text>
        {!!rotuloAcao && !!onAcao && (
          <Pressable onPress={onAcao} hitSlop={8}>
            <Text style={styles.acao}>{rotuloAcao}</Text>
          </Pressable>
        )}
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  caixa: {
    gap: 14,
  },
  cabecalho: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  titulo: {
    fontFamily: BrandFonts.titleSemibold,
    fontSize: 17,
    color: Brand.white,
  },
  acao: {
    fontFamily: BrandFonts.bodyMedium,
    fontSize: 13,
    color: Brand.violetLight,
  },
});
