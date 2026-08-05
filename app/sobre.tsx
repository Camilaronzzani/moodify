import { Brand, BrandFonts } from "@/constants/theme";
import { Ionicons } from "@react-native-vector-icons/ionicons";
import { LinearGradient } from "expo-linear-gradient";
import { Stack } from "expo-router";
import { ScrollView, StyleSheet, Text, View } from "react-native";

const VALORES = [
  {
    icone: "contrast-outline",
    titulo: "Autoconhecimento",
    descricao: "Entenda suas emoções",
  },
  {
    icone: "heart-outline",
    titulo: "Bem-estar",
    descricao: "Músicas que acolhem e equilibram",
  },
  {
    icone: "git-network-outline",
    titulo: "Experiência única",
    descricao: "Recomendações feitas só para você",
  },
  {
    icone: "lock-closed-outline",
    titulo: "Segurança",
    descricao: "Privacidade em primeiro lugar",
  },
] as const;

const LOJAS = [
  { icone: "logo-apple", chamada: "Baixar na", nome: "App Store" },
  { icone: "logo-google-playstore", chamada: "DISPONÍVEL NO", nome: "Google Play" },
] as const;

export default function Sobre() {
  return (
    <>
      <Stack.Screen
        options={{
          title: "",
          headerStyle: { backgroundColor: Brand.deepBlack },
          headerTintColor: Brand.violetLight,
          headerShadowVisible: false,
        }}
      />

      <LinearGradient colors={[Brand.deepBlack, "#1A0B2E", Brand.deepBlack]} style={styles.fundo}>
        <ScrollView contentContainerStyle={styles.conteudo}>
          <Text style={styles.titulo}>
            Mais que um{"\n"}player de música
          </Text>
          <Text style={styles.subtitulo}>
            Moodify é sobre conexão,{"\n"}autoconhecimento e{"\n"}bem-estar emocional.
          </Text>

          <View style={styles.listaValores}>
            {VALORES.map((valor) => (
              <View key={valor.titulo} style={styles.linhaValor}>
                <View style={styles.iconeCirculo}>
                  <Ionicons name={valor.icone} size={20} color={Brand.violetLight} />
                </View>
                <View style={styles.textoValor}>
                  <Text style={styles.valorTitulo}>{valor.titulo}</Text>
                  <Text style={styles.valorDescricao}>{valor.descricao}</Text>
                </View>
              </View>
            ))}
          </View>

          <View style={styles.cardDownload}>
            <Text style={styles.chamadaDownload}>
              Baixe agora e descubra músicas que combinam com você.
            </Text>

            <View style={styles.linhaLojas}>
              {LOJAS.map((loja) => (
                <View key={loja.nome} style={styles.botaoLoja}>
                  <Ionicons name={loja.icone} size={26} color={Brand.white} />
                  <View>
                    <Text style={styles.lojaChamada}>{loja.chamada}</Text>
                    <Text style={styles.lojaNome}>{loja.nome}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        </ScrollView>
      </LinearGradient>
    </>
  );
}

const styles = StyleSheet.create({
  fundo: {
    flex: 1,
  },
  conteudo: {
    paddingHorizontal: 28,
    paddingBottom: 40,
    gap: 22,
  },
  titulo: {
    fontFamily: BrandFonts.titleBold,
    fontSize: 30,
    lineHeight: 38,
    color: Brand.white,
  },
  subtitulo: {
    fontFamily: BrandFonts.bodyRegular,
    fontSize: 15,
    lineHeight: 23,
    color: Brand.gray,
    marginTop: -10,
  },
  listaValores: {
    gap: 24,
  },
  linhaValor: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  iconeCirculo: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(147, 112, 219, 0.35)",
    backgroundColor: "rgba(106, 13, 173, 0.12)",
  },
  textoValor: {
    flex: 1,
    gap: 3,
  },
  valorTitulo: {
    fontFamily: BrandFonts.titleSemibold,
    fontSize: 16,
    color: Brand.white,
  },
  valorDescricao: {
    fontFamily: BrandFonts.bodyRegular,
    fontSize: 14,
    lineHeight: 20,
    color: Brand.gray,
  },
  cardDownload: {
    borderRadius: 20,
    padding: 22,
    gap: 18,
    borderWidth: 1,
    borderColor: "rgba(147, 112, 219, 0.25)",
    backgroundColor: "rgba(106, 13, 173, 0.15)",
  },
  chamadaDownload: {
    fontFamily: BrandFonts.bodyRegular,
    fontSize: 15,
    lineHeight: 23,
    textAlign: "center",
    color: Brand.gray,
  },
  linhaLojas: {
    flexDirection: "row",
    gap: 12,
  },
  botaoLoja: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: "#000000",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.15)",
  },
  lojaChamada: {
    fontFamily: BrandFonts.bodyRegular,
    fontSize: 8,
    letterSpacing: 0.5,
    color: Brand.gray,
  },
  lojaNome: {
    fontFamily: BrandFonts.titleSemibold,
    fontSize: 14,
    color: Brand.white,

},
});
