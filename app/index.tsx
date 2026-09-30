import { Button } from "@/components/ui/button";
import { Brand, BrandFonts } from "@/constants/theme";
import { useSessao } from "@/contexts/sessao";
import { Ionicons } from "@react-native-vector-icons/ionicons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Link, Redirect, useRouter } from "expo-router";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const RECURSOS = [
  { icone: "bulb-outline", texto: "Análise emocional\navançada com IA" },
  { icone: "musical-notes-outline", texto: "Recomendações\npersonalizadas" },
  { icone: "headset-outline", texto: "Conexão com\nSpotify e Apple Music" },
  { icone: "options-outline", texto: "Sem reprodução interna\n100% recomendações" },
] as const;

export default function Index() {
  const router = useRouter();
  const { usuario, carregando } = useSessao();
  if (carregando) {
    return (
      <View style={styles.aguardando}>
        <ActivityIndicator color={Brand.violetLight} />
      </View>
    );
  }
  if (usuario) {
    return <Redirect href="/home" />;
  }

  return (
    <LinearGradient colors={[Brand.deepBlack, "#1A0B2E", Brand.deepBlack]} style={styles.fundo}>
      <SafeAreaView style={styles.fundo} edges={["top"]}>
        <ScrollView contentContainerStyle={styles.conteudo}>
          <View style={styles.glowExterno}>
            <View style={styles.glowInterno}>
              <Image source={require("@/assets/images/icon_512x512.png")} style={styles.logo} />
            </View>
          </View>

          <Text style={styles.nome}>Moodify</Text>
          <Text style={styles.slogan}>Música que entende você.</Text>

          <View style={styles.listaRecursos}>
            {RECURSOS.map((recurso) => (
              <View key={recurso.texto} style={styles.linhaRecurso}>
                <View style={styles.iconeCirculo}>
                  <Ionicons name={recurso.icone} size={20} color={Brand.violetLight} />
                </View>
                <Text style={styles.textoRecurso}>{recurso.texto}</Text>
              </View>
            ))}
          </View>

          <View style={styles.rodape}>
            <Ionicons name="leaf-outline" size={18} color={Brand.violetLight} />
            <Text style={styles.rodapeTexto}>
              Sua trilha. Seu momento.{"\n"}Nossa inteligência.
            </Text>
            <Ionicons name="leaf-outline" size={18} color={Brand.violetLight} />
          </View>

          <View style={styles.acoes}>
            <Button label="Começar" onPress={() => router.push("/criar-conta")} />
            <Button
              label="Já tenho conta"
              variant="outline"
              onPress={() => router.push("/login")}
            />
            <Link href="/sobre" style={styles.linkSecundario}>
              Saiba mais
            </Link>
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  fundo: {
    flex: 1,
  },
  aguardando: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Brand.deepBlack,
  },
  conteudo: {
    alignItems: "center",
    // Limite para a web: sem ele o conteúdo estica a largura do monitor.
    maxWidth: 620,
    alignSelf: "center",
    width: "100%",
    paddingHorizontal: 28,
    paddingTop: 20,
    paddingBottom: 40,
    gap: 20,
  },
  glowExterno: {
    padding: 14,
    borderRadius: 44,
    backgroundColor: "rgba(147, 112, 219, 0.10)",
  },
  glowInterno: {
    padding: 8,
    borderRadius: 32,
    backgroundColor: "rgba(147, 112, 219, 0.18)",
  },
  logo: {
    width: 96,
    height: 96,
    borderRadius: 26,
  },
  nome: {
    fontFamily: BrandFonts.titleBold,
    fontSize: 40,
    color: Brand.white,
  },
  slogan: {
    fontFamily: BrandFonts.bodyRegular,
    fontSize: 15,
    color: Brand.violetLight,
    marginTop: -12,
  },
  listaRecursos: {
    alignSelf: "stretch",
    gap: 22,
    marginTop: 8,
  },
  linhaRecurso: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  iconeCirculo: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(147, 112, 219, 0.35)",
    backgroundColor: "rgba(106, 13, 173, 0.12)",
  },
  textoRecurso: {
    flex: 1,
    fontFamily: BrandFonts.bodyRegular,
    fontSize: 14,
    lineHeight: 20,
    color: Brand.gray,
  },
  rodape: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 12,
  },
  rodapeTexto: {
    fontFamily: BrandFonts.bodyRegular,
    fontSize: 13,
    lineHeight: 19,
    textAlign: "center",
    color: Brand.gray,
  },
  acoes: {
    alignSelf: "stretch",
    gap: 12,
    marginTop: 8,
  },
  linkSecundario: {
    fontFamily: BrandFonts.bodyRegular,
    fontSize: 14,
    color: Brand.violetLight,
    paddingVertical: 6,
    textAlign: "center",
  },
});
