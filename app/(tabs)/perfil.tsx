import { Capa } from "@/components/capa";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tela } from "@/components/ui/tela";
import { Brand, BrandFonts } from "@/constants/theme";
import { useFavoritos } from "@/contexts/favoritos";
import { useHistorico, type AnaliseSalva } from "@/contexts/historico";
import { useSessao } from "@/contexts/sessao";
import { Ionicons } from "@react-native-vector-icons/ionicons";
import { useRouter } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

/** Conta qual emoção mais apareceu no histórico salvo. */
function emocaoMaisFrequente(analises: AnaliseSalva[]): string {
  const contagem = new Map<string, { nome: string; emoji: string; total: number }>();

  for (const analise of analises) {
    const atual = contagem.get(analise.emocao);
    contagem.set(analise.emocao, {
      nome: analise.emocaoNome,
      emoji: analise.emocaoEmoji,
      total: (atual?.total ?? 0) + 1,
    });
  }

  const campea = [...contagem.values()].sort((a, b) => b.total - a.total)[0];

  if (!campea) {
    return "Sem dados ainda.";
  }

  const vezes = campea.total === 1 ? "1 vez" : `${campea.total} vezes`;
  return `${campea.emoji}  ${campea.nome} — ${vezes} de ${analises.length}.`;
}

export default function Perfil() {
  const router = useRouter();
  const { usuario, sair } = useSessao();
  const { faixas } = useFavoritos();
  const { analises } = useHistorico();

  // As estatísticas saem dos dados reais, não são números inventados.
  const artistasDistintos = new Set(faixas.map((f) => f.artista.toLowerCase())).size;

  const estatisticas = [
    { rotulo: "Humores\nanalisados", valor: analises.length },
    { rotulo: "Músicas\nfavoritas", valor: faixas.length },
    { rotulo: "Artistas\ndiferentes", valor: artistasDistintos },
  ];

  async function aoSair() {
    await sair();
    router.replace("/");
  }

  return (
    <Tela>
      <View style={styles.cabecalho}>
        {usuario ? (
          <Capa id={usuario.email} nome={usuario.nome} tamanho={92} raio={46} />
        ) : (
          <View style={styles.avatarVazio}>
            <Ionicons name="person" size={34} color={Brand.violetLight} />
          </View>
        )}
        <Text style={styles.nome}>{usuario?.nome ?? "Visitante"}</Text>
        <Text style={styles.email}>{usuario?.email ?? "Sem sessão ativa"}</Text>
      </View>

      <View style={styles.linhaEstatisticas}>
        {estatisticas.map((item) => (
          <Card key={item.rotulo} style={styles.cardEstatistica}>
            <Text style={styles.estatisticaValor}>{item.valor}</Text>
            <Text style={styles.estatisticaRotulo}>{item.rotulo}</Text>
          </Card>
        ))}
      </View>

      <Card>
        <Text style={styles.tituloBloco}>Emoção mais frequente</Text>
        <Text style={styles.detalheBloco}>
          {analises.length === 0
            ? "Faça algumas análises para ver seu padrão emocional aqui."
            : emocaoMaisFrequente(analises)}
        </Text>
      </Card>

      <View style={styles.acoes}>
        <Button label="Configurações" onPress={() => router.push("/configuracoes")} />
        <Button label="Sair da conta" variant="outline" onPress={aoSair} />
      </View>
    </Tela>
  );
}

const styles = StyleSheet.create({
  cabecalho: {
    alignItems: "center",
    gap: 6,
    marginTop: 8,
  },
  avatarVazio: {
    width: 92,
    height: 92,
    borderRadius: 46,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "rgba(147, 112, 219, 0.4)",
    backgroundColor: "rgba(106, 13, 173, 0.15)",
  },
  nome: {
    fontFamily: BrandFonts.titleBold,
    fontSize: 22,
    color: Brand.white,
    marginTop: 10,
  },
  email: {
    fontFamily: BrandFonts.bodyRegular,
    fontSize: 14,
    color: Brand.gray,
  },
  linhaEstatisticas: {
    flexDirection: "row",
    gap: 12,
  },
  cardEstatistica: {
    flex: 1,
    alignItems: "center",
    gap: 6,
    paddingVertical: 18,
  },
  estatisticaValor: {
    fontFamily: BrandFonts.titleBold,
    fontSize: 24,
    color: Brand.violetLight,
  },
  estatisticaRotulo: {
    fontFamily: BrandFonts.bodyRegular,
    fontSize: 12,
    lineHeight: 17,
    textAlign: "center",
    color: Brand.gray,
  },
  tituloBloco: {
    fontFamily: BrandFonts.titleSemibold,
    fontSize: 15,
    color: Brand.white,
    marginBottom: 6,
  },
  detalheBloco: {
    fontFamily: BrandFonts.bodyRegular,
    fontSize: 13,
    lineHeight: 20,
    color: Brand.gray,
  },
  acoes: {
    gap: 12,
    marginTop: 4,
  },
});
