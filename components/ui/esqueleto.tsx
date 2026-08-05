import { useEffect } from "react";
import { StyleSheet, View, type DimensionValue } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

type Props = {
  largura?: DimensionValue;
  altura?: number;
  raio?: number;
};

/** Bloco cinza que pulsa, mostrado no lugar do conteúdo que ainda vem. */
export function Esqueleto({ largura = "100%", altura = 16, raio = 8 }: Props) {
  const brilho = useSharedValue(0.35);

  useEffect(() => {
    brilho.value = withRepeat(
      withTiming(0.85, { duration: 800, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, [brilho]);

  const estilo = useAnimatedStyle(() => ({ opacity: brilho.value }));

  return (
    <Animated.View
      style={[styles.bloco, { width: largura, height: altura, borderRadius: raio }, estilo]}
    />
  );
}

/** Três linhas de esqueleto no formato de um item de lista de música. */
export function EsqueletoListaMusicas({ quantidade = 5 }: { quantidade?: number }) {
  return (
    <View style={styles.lista}>
      {Array.from({ length: quantidade }).map((_, indice) => (
        // O índice serve de key aqui porque a lista é fixa e nunca reordena.
        <View key={indice} style={styles.linha}>
          <Esqueleto largura={56} altura={56} raio={12} />
          <View style={styles.textos}>
            <Esqueleto largura="70%" altura={14} />
            <Esqueleto largura="45%" altura={12} />
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  bloco: {
    backgroundColor: "rgba(147, 112, 219, 0.20)",
  },
  lista: {
    gap: 16,
  },
  linha: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  textos: {
    flex: 1,
    gap: 8,
  },
});
