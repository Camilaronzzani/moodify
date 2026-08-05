import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Secao } from "@/components/ui/secao";
import { Tag } from "@/components/ui/tag";
import { Tela } from "@/components/ui/tela";
import { Brand, BrandFonts } from "@/constants/theme";
import { useAnaliseAtual } from "@/contexts/analise-atual";
import { useHistorico } from "@/contexts/historico";
import { Ionicons } from "@react-native-vector-icons/ionicons";
import { Redirect, Stack, useRouter } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";

export default function AnaliseScreen() {
  const router = useRouter();
  const { recomendacao } = useAnaliseAtual();
  const { salvar } = useHistorico();
  const [salva, setSalva] = useState(false);

  // Aberta direto, sem análise na memória: volta para a Home.
  if (!recomendacao) {
    return <Redirect href="/home" />;
  }

  const { perfil, mensagem, faixas, diagnostico } = recomendacao;

  async function aoSalvar() {
    if (!recomendacao) {
      return;
    }

    await salvar({
      id: recomendacao.id,
      emocao: perfil.emotion,
      emocaoNome: perfil.emocaoNome,
      emocaoEmoji: perfil.emocaoEmoji,
      energiaNome: perfil.energiaNome,
      contextoNome: perfil.contextoNome,
      tags: perfil.tags,
      mensagem,
      criadaEm: new Date().toISOString(),
    });

    setSalva(true);
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: "Resultado",
          headerStyle: { backgroundColor: Brand.deepBlack },
          headerTintColor: Brand.violetLight,
          headerTitleStyle: { fontFamily: BrandFonts.titleSemibold, fontSize: 16 },
          headerShadowVisible: false,
        }}
      />

      <Tela protegerTopo={false}>
        <View style={styles.centro}>
          <View style={styles.emojiCirculo}>
            <Text style={styles.emoji}>{perfil.emocaoEmoji}</Text>
          </View>
          <Text style={styles.emocaoNome}>{perfil.emocaoNome}</Text>
          <Text style={styles.emocaoRotulo}>Emoção identificada</Text>
        </View>

        <Card>
          <View style={styles.linhaInfo}>
            <Ionicons name="pulse-outline" size={19} color={Brand.violetLight} />
            <Text style={styles.infoRotulo}>Energia</Text>
            <Text style={styles.infoValor}>{perfil.energiaNome}</Text>
          </View>
          <View style={styles.divisor} />
          <View style={styles.linhaInfo}>
            <Ionicons name="time-outline" size={19} color={Brand.violetLight} />
            <Text style={styles.infoRotulo}>Momento</Text>
            <Text style={styles.infoValor}>{perfil.contextoNome}</Text>
          </View>
        </Card>

        <Secao titulo="O que combina com você agora">
          <View style={styles.tags}>
            {perfil.tags.map((tag) => (
              <Tag key={tag} texto={tag} />
            ))}
          </View>
        </Secao>

        <Card destacado>
          <View style={styles.linhaMensagem}>
            <Ionicons name="sparkles" size={17} color={Brand.violetLight} />
            <Text style={styles.mensagemTitulo}>Por que essas músicas</Text>
          </View>
          <Text style={styles.mensagemTexto}>{mensagem}</Text>
        </Card>

        <View style={styles.acoes}>
          <Button
            label={`Ver ${faixas.length} recomendações`}
            onPress={() => router.push("/recomendacao")}
          />
          <Button
            label={salva ? "Análise salva ✓" : "Salvar análise"}
            variant="outline"
            disabled={salva}
            onPress={aoSalvar}
          />
        </View>

        {/* Visível de propósito durante o desenvolvimento: mostra qual provider
            respondeu e quanto demorou, sem precisar abrir o log. */}
        <Text style={styles.diagnostico}>
          {diagnostico.providerIa} · {diagnostico.providerMusica} ·{" "}
          {diagnostico.latenciaMs}ms
        </Text>
      </Tela>
    </>
  );
}

const styles = StyleSheet.create({
  centro: {
    alignItems: "center",
    gap: 6,
    paddingVertical: 12,
  },
  emojiCirculo: {
    width: 112,
    height: 112,
    borderRadius: 56,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "rgba(147, 112, 219, 0.45)",
    backgroundColor: "rgba(106, 13, 173, 0.22)",
    marginBottom: 8,
  },
  emoji: {
    fontSize: 50,
  },
  emocaoNome: {
    fontFamily: BrandFonts.titleBold,
    fontSize: 26,
    color: Brand.white,
  },
  emocaoRotulo: {
    fontFamily: BrandFonts.bodyMedium,
    fontSize: 13,
    color: Brand.violetLight,
  },
  linhaInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  infoRotulo: {
    flex: 1,
    fontFamily: BrandFonts.bodyMedium,
    fontSize: 15,
    color: Brand.white,
  },
  infoValor: {
    fontFamily: BrandFonts.titleSemibold,
    fontSize: 15,
    color: Brand.violetLight,
  },
  divisor: {
    height: 1,
    backgroundColor: "rgba(147, 112, 219, 0.18)",
    marginVertical: 12,
  },
  tags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  linhaMensagem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  mensagemTitulo: {
    fontFamily: BrandFonts.titleSemibold,
    fontSize: 15,
    color: Brand.white,
  },
  mensagemTexto: {
    fontFamily: BrandFonts.bodyRegular,
    fontSize: 14,
    lineHeight: 21,
    color: Brand.gray,
  },
  acoes: {
    gap: 12,
  },
  diagnostico: {
    fontFamily: BrandFonts.bodyRegular,
    fontSize: 11,
    textAlign: "center",
    color: "rgba(204, 204, 204, 0.45)",
  },
});
