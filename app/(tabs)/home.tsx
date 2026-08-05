import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EsqueletoListaMusicas } from "@/components/ui/esqueleto";
import { Secao } from "@/components/ui/secao";
import { Tag } from "@/components/ui/tag";
import { Tela } from "@/components/ui/tela";
import { Brand, BrandFonts } from "@/constants/theme";
import { useSessao } from "@/contexts/sessao";
import { useAnalise } from "@/hooks/use-analise";
import { Ionicons } from "@react-native-vector-icons/ionicons";
import { useState } from "react";
import { ActivityIndicator, StyleSheet, Text, TextInput, View } from "react-native";

const LIMITE_TEXTO = 300;

/**
 * Chips em primeiro plano, texto livre como opção.
 *
 * Escrever exige esforço e uns 20 segundos; a maioria vai tocar num chip.
 * Deixar o caminho difícil como principal cobraria pedágio de quem só quer
 * uma resposta rápida — e o chip nem precisa de IA, responde na hora.
 */
const SUGESTOES = [
  { emoji: "😊", rotulo: "Feliz", texto: "Estou feliz e animado hoje." },
  { emoji: "😢", rotulo: "Triste", texto: "Estou triste e um pouco sozinho." },
  { emoji: "😴", rotulo: "Cansado", texto: "Estou cansado, sem energia." },
  { emoji: "📚", rotulo: "Estudar", texto: "Preciso estudar e me concentrar." },
  { emoji: "💪", rotulo: "Academia", texto: "Vou treinar na academia agora." },
  { emoji: "🌙", rotulo: "Relaxar", texto: "Quero relaxar e ficar tranquilo." },
] as const;

export default function Home() {
  const { usuario } = useSessao();
  const { analisar, tentarDeNovo, analisando, erro, pronto } = useAnalise();
  const [texto, setTexto] = useState("");

  const primeiroNome = usuario?.nome.split(" ")[0] ?? "visitante";
  const podeEnviar = texto.trim().length >= 3 && !analisando && pronto;

  return (
    <Tela>
      <Text style={styles.saudacao}>Olá, {primeiroNome} 👋</Text>

      <Secao titulo="Como você está agora?">
        <View style={styles.sugestoes}>
          {SUGESTOES.map((sugestao) => (
            <Tag
              key={sugestao.rotulo}
              texto={`${sugestao.emoji}  ${sugestao.rotulo}`}
              onPress={() => analisar(sugestao.texto)}
            />
          ))}
        </View>
      </Secao>

      <Card destacado>
        <Text style={styles.tituloCard}>Prefere escrever?</Text>
        <Text style={styles.descricaoCard}>
          Conte como foi o seu dia. Quanto mais detalhe, melhor a leitura.
        </Text>

        <TextInput
          value={texto}
          onChangeText={setTexto}
          placeholder="Hoje estou cansado, mas queria ouvir algo que me animasse."
          placeholderTextColor="rgba(204, 204, 204, 0.4)"
          style={styles.campoTexto}
          multiline
          maxLength={LIMITE_TEXTO}
          textAlignVertical="top"
          editable={!analisando}
        />
        <Text style={styles.contador}>
          {texto.length}/{LIMITE_TEXTO}
        </Text>

        <Button
          label="Encontrar músicas"
          disabled={!podeEnviar}
          loading={analisando}
          onPress={() => analisar(texto)}
        />
      </Card>

      {analisando && (
        <Card>
          <View style={styles.linhaAnalisando}>
            <ActivityIndicator color={Brand.violetLight} />
            <Text style={styles.textoAnalisando}>Analisando seu momento...</Text>
          </View>
          <View style={styles.esqueleto}>
            <EsqueletoListaMusicas quantidade={3} />
          </View>
        </Card>
      )}

      {!!erro && !analisando && (
        <Card>
          <View style={styles.linhaErro}>
            <Ionicons name="cloud-offline-outline" size={20} color="#E5534B" />
            <Text style={styles.tituloErro}>Não deu certo</Text>
          </View>
          <Text style={styles.textoErro}>{erro.mensagemAmigavel}</Text>

          {erro.causa === "rede" && (
            <Text style={styles.dicaErro}>
              Se você está desenvolvendo, confirme que o backend está rodando:{"\n"}
              <Text style={styles.comando}>cd api && npm run dev</Text>
            </Text>
          )}

          {erro.vaiAdiantarTentarDeNovo && (
            <View style={styles.acaoErro}>
              <Button label="Tentar de novo" variant="outline" onPress={tentarDeNovo} />
            </View>
          )}
        </Card>
      )}

      <Text style={styles.aviso}>
        O Moodify não reproduz música. Recomendamos e abrimos no seu streaming.
      </Text>
    </Tela>
  );
}

const styles = StyleSheet.create({
  saudacao: {
    fontFamily: BrandFonts.bodyRegular,
    fontSize: 15,
    color: Brand.gray,
  },
  sugestoes: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  tituloCard: {
    fontFamily: BrandFonts.titleBold,
    fontSize: 20,
    color: Brand.white,
  },
  descricaoCard: {
    fontFamily: BrandFonts.bodyRegular,
    fontSize: 14,
    lineHeight: 21,
    color: Brand.gray,
    marginTop: 6,
  },
  campoTexto: {
    minHeight: 92,
    marginTop: 14,
    borderRadius: 14,
    padding: 14,
    fontFamily: BrandFonts.bodyRegular,
    fontSize: 15,
    lineHeight: 22,
    color: Brand.white,
    borderWidth: 1,
    borderColor: "rgba(147, 112, 219, 0.3)",
    backgroundColor: "rgba(15, 23, 42, 0.5)",
  },
  contador: {
    fontFamily: BrandFonts.bodyRegular,
    fontSize: 12,
    textAlign: "right",
    color: Brand.gray,
    marginTop: 6,
    marginBottom: 14,
  },
  linhaAnalisando: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  textoAnalisando: {
    fontFamily: BrandFonts.titleSemibold,
    fontSize: 15,
    color: Brand.white,
  },
  esqueleto: {
    marginTop: 18,
    opacity: 0.7,
  },
  acaoErro: {
    marginTop: 14,
  },
  linhaErro: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  tituloErro: {
    fontFamily: BrandFonts.titleSemibold,
    fontSize: 15,
    color: Brand.white,
  },
  textoErro: {
    fontFamily: BrandFonts.bodyRegular,
    fontSize: 14,
    lineHeight: 21,
    color: Brand.gray,
  },
  dicaErro: {
    fontFamily: BrandFonts.bodyRegular,
    fontSize: 12,
    lineHeight: 19,
    color: Brand.gray,
    marginTop: 10,
  },
  comando: {
    fontFamily: BrandFonts.bodyMedium,
    color: Brand.violetLight,
  },
  aviso: {
    fontFamily: BrandFonts.bodyRegular,
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
    color: Brand.gray,
  },
});
