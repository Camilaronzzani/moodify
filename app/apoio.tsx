import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tela } from "@/components/ui/tela";
import { Brand, BrandFonts } from "@/constants/theme";
import { useAnaliseAtual } from "@/contexts/analise-atual";
import { Ionicons } from "@react-native-vector-icons/ionicons";
import { Redirect, Stack, useRouter } from "expo-router";
import { Linking, Pressable, StyleSheet, Text, View } from "react-native";

/**
 * Tela mostrada quando a triagem detecta sinais de risco de autoagressão.
 *
 * Aqui NÃO há música, nem análise, nem botão para "ver recomendações". Uma
 * pessoa em sofrimento grave não precisa de playlist, e oferecer uma seria
 * uma resposta errada. A única coisa nesta tela é caminho para ajuda real.
 */
export default function ApoioScreen() {
  const router = useRouter();
  const { apoio } = useAnaliseAtual();

  if (!apoio) {
    return <Redirect href="/home" />;
  }

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

      <Tela protegerTopo={false}>
        <View style={styles.centro}>
          <View style={styles.circulo}>
            <Ionicons name="heart" size={38} color={Brand.violetLight} />
          </View>
          <Text style={styles.titulo}>Você não está sozinho</Text>
        </View>

        <Text style={styles.mensagem}>{apoio.mensagem}</Text>

        <View style={styles.recursos}>
          {apoio.recursos.map((recurso) => (
            <Card key={recurso.nome}>
              <Text style={styles.recursoNome}>{recurso.nome}</Text>
              <Text style={styles.recursoDescricao}>{recurso.descricao}</Text>

              <View style={styles.acoesRecurso}>
                {!!recurso.telefone && (
                  <Pressable
                    style={styles.botaoTelefone}
                    onPress={() => Linking.openURL(`tel:${recurso.telefone}`)}
                    accessibilityLabel={`Ligar para ${recurso.nome}`}
                  >
                    <Ionicons name="call" size={17} color={Brand.white} />
                    <Text style={styles.textoTelefone}>Ligar {recurso.telefone}</Text>
                  </Pressable>
                )}

                {!!recurso.url && (
                  <Pressable
                    style={styles.botaoSite}
                    onPress={() => Linking.openURL(recurso.url!)}
                    accessibilityLabel={`Abrir site de ${recurso.nome}`}
                  >
                    <Ionicons name="globe-outline" size={17} color={Brand.violetLight} />
                    <Text style={styles.textoSite}>Abrir site</Text>
                  </Pressable>
                )}
              </View>
            </Card>
          ))}
        </View>

        <Button label="Voltar" variant="outline" onPress={() => router.replace("/home")} />
      </Tela>
    </>
  );
}

const styles = StyleSheet.create({
  centro: {
    alignItems: "center",
    gap: 14,
    paddingTop: 8,
  },
  circulo: {
    width: 84,
    height: 84,
    borderRadius: 42,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "rgba(147, 112, 219, 0.45)",
    backgroundColor: "rgba(106, 13, 173, 0.22)",
  },
  titulo: {
    fontFamily: BrandFonts.titleBold,
    fontSize: 24,
    textAlign: "center",
    color: Brand.white,
  },
  mensagem: {
    fontFamily: BrandFonts.bodyRegular,
    fontSize: 15,
    lineHeight: 24,
    textAlign: "center",
    color: Brand.gray,
  },
  recursos: {
    gap: 14,
  },
  recursoNome: {
    fontFamily: BrandFonts.titleSemibold,
    fontSize: 16,
    color: Brand.white,
  },
  recursoDescricao: {
    fontFamily: BrandFonts.bodyRegular,
    fontSize: 14,
    lineHeight: 21,
    color: Brand.gray,
    marginTop: 4,
  },
  acoesRecurso: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 14,
  },
  botaoTelefone: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 11,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: Brand.purplePrimary,
  },
  textoTelefone: {
    fontFamily: BrandFonts.titleSemibold,
    fontSize: 14,
    color: Brand.white,
  },
  botaoSite: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 11,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Brand.violetLight,
  },
  textoSite: {
    fontFamily: BrandFonts.bodyMedium,
    fontSize: 14,
    color: Brand.violetLight,
  },
});
