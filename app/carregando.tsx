import { Brand, BrandFonts } from "@/constants/theme";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Stack, useRouter } from "expo-router";
import { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

const DURACAO_MS = 2400;

export default function Carregando() {
  const router = useRouter();
  const escala = useSharedValue(0.9);
  const opacidade = useSharedValue(0);
  const progresso = useSharedValue(0);

  useEffect(() => {
    escala.value = withTiming(1, { duration: 700, easing: Easing.out(Easing.cubic) });
    opacidade.value = withTiming(1, { duration: 700 });

    escala.value = withRepeat(
      withTiming(1.05, { duration: 1100, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );

    progresso.value = withTiming(1, { duration: DURACAO_MS, easing: Easing.inOut(Easing.ease) });
  }, [escala, opacidade, progresso]);

  useEffect(() => {
    const id = setTimeout(() => router.replace("/home"), DURACAO_MS);
    return () => clearTimeout(id);
  }, [router]);

  const estiloLogo = useAnimatedStyle(() => ({
    opacity: opacidade.value,
    transform: [{ scale: escala.value }],
  }));

  const estiloTexto = useAnimatedStyle(() => ({
    opacity: opacidade.value,
  }));

  const estiloBarra = useAnimatedStyle(() => ({
    width: `${progresso.value * 100}%`,
  }));

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />

      <LinearGradient
        colors={[Brand.deepBlack, "#150A24", Brand.deepBlack]}
        style={styles.fundo}
      >
        {/* Ondas decorativas: círculos gigantes com borda quase invisível */}
        <View style={[styles.onda, styles.ondaTopo]} pointerEvents="none" />
        <View style={[styles.onda, styles.ondaBase]} pointerEvents="none" />

        <View style={styles.centro}>
          <Animated.View style={estiloLogo}>
            <Image source={require("@/assets/images/icon_512x512.png")} style={styles.logo} />
          </Animated.View>

          <Animated.View style={[styles.textos, estiloTexto]}>
            <Text style={styles.nome}>Moodify</Text>
            <Text style={styles.slogan}>Música que entende você.</Text>
          </Animated.View>
        </View>

        <View style={styles.trilha}>
          <Animated.View style={[styles.barra, estiloBarra]} />
        </View>
      </LinearGradient>
    </>
  );
}

const styles = StyleSheet.create({
  fundo: {
    flex: 1,
    alignItems: "center",
    overflow: "hidden",
  },
  onda: {
    position: "absolute",
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: "rgba(147, 112, 219, 0.10)",
  },
  ondaTopo: {
    width: 620,
    height: 620,
    top: -300,
    left: -220,
  },
  ondaBase: {
    width: 700,
    height: 700,
    bottom: -380,
    right: -260,
  },
  centro: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 26,
  },
  logo: {
    width: 130,
    height: 130,
    borderRadius: 34,
  },
  textos: {
    alignItems: "center",
    gap: 8,
  },
  nome: {
    fontFamily: BrandFonts.titleBold,
    fontSize: 42,
    color: Brand.white,
  },
  slogan: {
    fontFamily: BrandFonts.bodyRegular,
    fontSize: 14,
    color: Brand.violetLight,
  },
  trilha: {
    width: 110,
    height: 4,
    borderRadius: 2,
    overflow: "hidden",
    backgroundColor: "rgba(147, 112, 219, 0.20)",
    marginBottom: 46,
  },
  barra: {
    height: "100%",
    borderRadius: 2,
    backgroundColor: Brand.violetLight,
  },
});
