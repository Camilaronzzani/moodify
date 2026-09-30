import { Brand, BrandFonts } from "@/constants/theme";
import { usePlayer } from "@/contexts/player";
import { Ionicons } from "@react-native-vector-icons/ionicons";
import { Image } from "expo-image";
import { useEffect } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

/**
 * Mini-player com a capa girando como um disco.
 *
 * Aparece só quando um trecho está tocando. A rotação existe para dar uma
 * pista visual imediata de que há som — em telas silenciosas o usuário não
 * sabe se o toque funcionou, e o disco parado versus girando responde isso
 * sem texto nenhum.
 */

/** Uma volta completa a cada 8 segundos: perceptível sem distrair. */
const DURACAO_VOLTA_MS = 8_000;

export function MiniPlayer() {
  const { faixa, tocando, carregando, progresso, alternar, pausar, fechar } = usePlayer();

  const giro = useSharedValue(0);

  // A rotação segue o estado real do áudio: gira tocando, congela na posição
  // atual ao pausar (em vez de saltar para zero) e retoma dali.
  useEffect(() => {
    if (tocando) {
      giro.value = withRepeat(
        withTiming(giro.value + 360, {
          duration: DURACAO_VOLTA_MS,
          easing: Easing.linear,
        }),
        -1,
        false,
      );
    } else {
      cancelAnimation(giro);
    }

    return () => cancelAnimation(giro);
  }, [tocando, giro]);

  const estiloDisco = useAnimatedStyle(() => ({
    transform: [{ rotate: `${giro.value}deg` }],
  }));

  const estiloProgresso = useAnimatedStyle(() => ({
    width: `${Math.round(progresso * 100)}%`,
  }));

  if (!faixa) {
    return null;
  }

  return (
    <View style={styles.caixa}>
      {/* Barra de progresso do trecho, no topo da barra */}
      <View style={styles.trilha}>
        <Animated.View style={[styles.progresso, estiloProgresso]} />
      </View>

      <View style={styles.conteudo}>
        <Animated.View style={[styles.discoContainer, estiloDisco]}>
          {faixa.capaUrl ? (
            <Image source={{ uri: faixa.capaUrl }} style={styles.disco} />
          ) : (
            <View style={[styles.disco, styles.discoVazio]}>
              <Ionicons name="musical-notes" size={18} color={Brand.violetLight} />
            </View>
          )}
          {/* Furo central, como num vinil */}
          <View style={styles.furo} />
        </Animated.View>

        <View style={styles.textos}>
          <Text style={styles.titulo} numberOfLines={1}>
            {faixa.titulo}
          </Text>
          <Text style={styles.artista} numberOfLines={1}>
            {carregando ? "Carregando..." : faixa.artista}
          </Text>
        </View>

        <Pressable
          onPress={() => (tocando ? pausar() : alternarMesmaFaixa())}
          hitSlop={10}
          accessibilityLabel={tocando ? "Pausar trecho" : "Continuar trecho"}
        >
          <Ionicons
            name={tocando ? "pause-circle" : "play-circle"}
            size={34}
            color={Brand.violetLight}
          />
        </Pressable>

        <Pressable onPress={fechar} hitSlop={10} accessibilityLabel="Fechar player">
          <Ionicons name="close" size={22} color={Brand.gray} />
        </Pressable>
      </View>

      <Text style={styles.aviso}>Trecho de 30s · abra no streaming para ouvir tudo</Text>
    </View>
  );

  /**
   * Retomar exige passar uma faixa ao `alternar`, que só guarda o essencial.
   * Reconstruímos o mínimo a partir do que o player já tem.
   */
  function alternarMesmaFaixa() {
    alternar({
      providerId: faixa!.chave.split("-").slice(1).join("-"),
      provider: faixa!.chave.split("-")[0]!,
      titulo: faixa!.titulo,
      artista: faixa!.artista,
      capaUrl: faixa!.capaUrl,
      previewUrl: faixa!.previewUrl,
      urls: { web: "" },
      motivos: [],
      score: 0,
    });
  }
}

const styles = StyleSheet.create({
  caixa: {
    borderTopWidth: 1,
    borderTopColor: "rgba(147, 112, 219, 0.28)",
    backgroundColor: "#150B24",
  },
  trilha: {
    height: 2,
    backgroundColor: "rgba(147, 112, 219, 0.18)",
  },
  progresso: {
    height: "100%",
    backgroundColor: Brand.violetLight,
  },
  conteudo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  discoContainer: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  disco: {
    width: 44,
    height: 44,
    // Circular: é o que faz a rotação parecer um disco e não uma capa torta.
    borderRadius: 22,
    backgroundColor: "rgba(147, 112, 219, 0.15)",
  },
  discoVazio: {
    alignItems: "center",
    justifyContent: "center",
  },
  furo: {
    position: "absolute",
    width: 11,
    height: 11,
    borderRadius: 6,
    backgroundColor: "#150B24",
    borderWidth: 1,
    borderColor: "rgba(147, 112, 219, 0.4)",
  },
  textos: {
    flex: 1,
    gap: 2,
  },
  titulo: {
    fontFamily: BrandFonts.bodyMedium,
    fontSize: 14,
    color: Brand.white,
  },
  artista: {
    fontFamily: BrandFonts.bodyRegular,
    fontSize: 12,
    color: Brand.gray,
  },
  aviso: {
    fontFamily: BrandFonts.bodyRegular,
    fontSize: 10,
    textAlign: "center",
    color: "rgba(204, 204, 204, 0.5)",
    paddingBottom: 8,
    paddingTop: 6,
  },
});
