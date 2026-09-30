import { Brand } from "@/constants/theme";
import { LinearGradient } from "expo-linear-gradient";
import { ScrollView, StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type Props = {
  children: React.ReactNode;
  /** `false` quando a tela já tem a própria lista rolável (FlatList). */
  comRolagem?: boolean;
  /** `false` nas telas de stack, onde o header já protege o topo. */
  protegerTopo?: boolean;
  style?: StyleProp<ViewStyle>;
};

/**
 * Largura máxima do conteúdo.
 *
 * No celular nunca é alcançada — a tela é mais estreita que isso. Existe para
 * a web: sem limite, num monitor de 1920px os cards esticam a largura toda e
 * a linha de texto fica longa demais para ler com conforto.
 */
const LARGURA_MAXIMA = 620;

/** Fundo em gradiente + área segura: a moldura de todas as telas do app. */
export function Tela({
  children,
  comRolagem = true,
  protegerTopo = true,
  style,
}: Props) {
  const conteudo = comRolagem ? (
    <ScrollView
      contentContainerStyle={styles.rolagem}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <View style={[styles.conteudo, style]}>{children}</View>
    </ScrollView>
  ) : (
    <View style={styles.rolagem}>
      <View style={[styles.fixo, style]}>{children}</View>
    </View>
  );

  return (
    <LinearGradient colors={[Brand.deepBlack, "#160B26", Brand.deepBlack]} style={styles.fundo}>
      <SafeAreaView style={styles.fundo} edges={protegerTopo ? ["top"] : []}>
        {conteudo}
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  fundo: {
    flex: 1,
  },
  /** Centraliza a coluna de conteúdo quando a tela é mais larga que ela. */
  rolagem: {
    flexGrow: 1,
    alignItems: "center",
  },
  conteudo: {
    width: "100%",
    maxWidth: LARGURA_MAXIMA,
    paddingHorizontal: 22,
    paddingTop: 16,
    paddingBottom: 36,
    gap: 22,
  },
  fixo: {
    flex: 1,
    width: "100%",
    maxWidth: LARGURA_MAXIMA,
    paddingHorizontal: 22,
    paddingTop: 16,
    gap: 18,
  },
});
