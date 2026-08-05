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

/** Fundo em gradiente + área segura: a moldura de todas as telas do app. */
export function Tela({
  children,
  comRolagem = true,
  protegerTopo = true,
  style,
}: Props) {
  const conteudo = comRolagem ? (
    <ScrollView
      contentContainerStyle={[styles.conteudo, style]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.fixo, style]}>{children}</View>
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
  conteudo: {
    paddingHorizontal: 22,
    paddingTop: 16,
    paddingBottom: 36,
    gap: 22,
  },
  fixo: {
    flex: 1,
    paddingHorizontal: 22,
    paddingTop: 16,
    gap: 18,
  },
});
