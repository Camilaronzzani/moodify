import { Card } from "@/components/ui/card";
import { Tela } from "@/components/ui/tela";
import { Brand, BrandFonts } from "@/constants/theme";
import { useAnaliseAtual } from "@/contexts/analise-atual";
import { useAnalise } from "@/hooks/use-analise";
import { Ionicons } from "@react-native-vector-icons/ionicons";
import { Redirect, Stack } from "expo-router";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";

/**
 * Tela de acolhimento.
 *
 * Não é uma tela de "resultado da análise" com dados técnicos e um botão de
 * "ver recomendações". É o momento em que o app reconhece o que a pessoa
 * contou e pergunta o que ela quer — porque tratar tristeza com música alegre
 * ou com música triste são escolhas legítimas, e só ela sabe qual quer agora.
 *
 * A escolha leva direto às faixas. Sem tela intermediária.
 */
export default function AnaliseScreen() {
  const { acolhimento } = useAnaliseAtual();
  const { escolher, buscando, erro } = useAnalise();

  // Aberta direto, sem análise na memória: volta para a Home.
  if (!acolhimento) {
    return <Redirect href="/home" />;
  }

  const { perfil, mensagem, pergunta, escolhas } = acolhimento;

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
        <View style={styles.topo}>
          <Text style={styles.emoji}>{perfil.emocaoEmoji}</Text>
          {perfil.theme !== "nenhum" && <Text style={styles.tema}>{perfil.temaNome}</Text>}
        </View>

        {/* O reconhecimento vem primeiro, em corpo de texto grande: é a
            parte mais importante da tela, não um rótulo técnico. */}
        <Text style={styles.mensagem}>{mensagem}</Text>

        <Text style={styles.pergunta}>{pergunta}</Text>

        <View style={styles.escolhas}>
          {escolhas.map((escolha) => (
            <Pressable
              key={escolha.intencao}
              onPress={() => escolher(perfil, escolha.intencao)}
              disabled={buscando}
              style={({ pressed }) => [
                styles.escolha,
                pressed && styles.escolhaPressionada,
                buscando && styles.escolhaDesabilitada,
              ]}
            >
              <View style={styles.escolhaTextos}>
                <Text style={styles.escolhaRotulo}>{escolha.rotulo}</Text>
                <Text style={styles.escolhaDescricao}>{escolha.descricao}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={Brand.violetLight} />
            </Pressable>
          ))}
        </View>

        {buscando && (
          <View style={styles.buscando}>
            <ActivityIndicator color={Brand.violetLight} />
            <Text style={styles.buscandoTexto}>Escolhendo as músicas...</Text>
          </View>
        )}

        {!!erro && !buscando && (
          <Card>
            <Text style={styles.erro}>{erro.mensagemAmigavel}</Text>
          </Card>
        )}
      </Tela>
    </>
  );
}

const styles = StyleSheet.create({
  topo: {
    alignItems: "center",
    gap: 10,
    paddingTop: 12,
  },
  emoji: {
    fontSize: 56,
  },
  tema: {
    fontFamily: BrandFonts.bodyMedium,
    fontSize: 13,
    letterSpacing: 0.5,
    color: Brand.violetLight,
    textTransform: "uppercase",
  },
  mensagem: {
    fontFamily: BrandFonts.titleSemibold,
    fontSize: 21,
    lineHeight: 31,
    textAlign: "center",
    color: Brand.white,
  },
  pergunta: {
    fontFamily: BrandFonts.bodyRegular,
    fontSize: 15,
    textAlign: "center",
    color: Brand.gray,
    marginTop: -8,
  },
  escolhas: {
    gap: 14,
    marginTop: 4,
  },
  escolha: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 20,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(147, 112, 219, 0.4)",
    backgroundColor: "rgba(106, 13, 173, 0.18)",
  },
  escolhaPressionada: {
    opacity: 0.75,
  },
  escolhaDesabilitada: {
    opacity: 0.5,
  },
  escolhaTextos: {
    flex: 1,
    gap: 5,
  },
  escolhaRotulo: {
    fontFamily: BrandFonts.titleSemibold,
    fontSize: 17,
    color: Brand.white,
  },
  escolhaDescricao: {
    fontFamily: BrandFonts.bodyRegular,
    fontSize: 14,
    lineHeight: 20,
    color: Brand.gray,
  },
  buscando: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  buscandoTexto: {
    fontFamily: BrandFonts.bodyRegular,
    fontSize: 14,
    color: Brand.gray,
  },
  erro: {
    fontFamily: BrandFonts.bodyRegular,
    fontSize: 14,
    lineHeight: 21,
    color: Brand.gray,
  },
});
