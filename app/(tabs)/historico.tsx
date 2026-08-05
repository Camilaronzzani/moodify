import { Card } from "@/components/ui/card";
import { Carregamento } from "@/components/ui/carregamento";
import { EstadoVazio } from "@/components/ui/estado-vazio";
import { Tag } from "@/components/ui/tag";
import { Tela } from "@/components/ui/tela";
import { Brand, BrandFonts } from "@/constants/theme";
import { useHistorico } from "@/contexts/historico";
import { useRouter } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

/** Transforma a data ISO em "28/07/2026 às 14:32". */
function formatarData(iso: string) {
  const data = new Date(iso);
  const dia = String(data.getDate()).padStart(2, "0");
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  const hora = String(data.getHours()).padStart(2, "0");
  const minuto = String(data.getMinutes()).padStart(2, "0");
  return `${dia}/${mes}/${data.getFullYear()} às ${hora}:${minuto}`;
}

export default function Historico() {
  const router = useRouter();
  const { analises, carregando } = useHistorico();

  if (carregando) {
    return (
      <Tela comRolagem={false}>
        <Carregamento mensagem="Abrindo seu histórico..." />
      </Tela>
    );
  }

  if (analises.length === 0) {
    return (
      <Tela comRolagem={false}>
        <EstadoVazio
          icone="time-outline"
          titulo="Seu histórico está vazio"
          descricao="As análises que você salvar aparecem aqui, do mais recente para o mais antigo."
          rotuloAcao="Fazer uma análise"
          onAcao={() => router.push("/home")}
        />
      </Tela>
    );
  }

  return (
    <Tela>
      <View>
        <Text style={styles.titulo}>Histórico</Text>
        <Text style={styles.subtitulo}>
          {analises.length} {analises.length === 1 ? "análise salva" : "análises salvas"}
        </Text>
      </View>

      <View style={styles.linhaDoTempo}>
        {analises.map((analise) => (
          <View key={analise.id} style={styles.item}>
            {/* Marcador e fio da timeline */}
            <View style={styles.marcadorColuna}>
              <View style={styles.marcador} />
              <View style={styles.fio} />
            </View>

            <Card style={styles.cartao}>
              <View style={styles.cabecalho}>
                <Text style={styles.emoji}>{analise.emocaoEmoji}</Text>
                <View style={styles.cabecalhoTextos}>
                  <Text style={styles.emocao}>{analise.emocaoNome}</Text>
                  <Text style={styles.data}>{formatarData(analise.criadaEm)}</Text>
                </View>
                <Text style={styles.energia}>{analise.energiaNome}</Text>
              </View>

              <Text style={styles.contexto}>{analise.contextoNome}</Text>

              <View style={styles.tags}>
                {analise.tags.map((tag) => (
                  <Tag key={tag} texto={tag} />
                ))}
              </View>
            </Card>
          </View>
        ))}
      </View>
    </Tela>
  );
}

const styles = StyleSheet.create({
  titulo: {
    fontFamily: BrandFonts.titleBold,
    fontSize: 26,
    color: Brand.white,
  },
  subtitulo: {
    fontFamily: BrandFonts.bodyRegular,
    fontSize: 14,
    color: Brand.gray,
    marginTop: 4,
  },
  linhaDoTempo: {
    gap: 4,
  },
  item: {
    flexDirection: "row",
    gap: 14,
  },
  marcadorColuna: {
    alignItems: "center",
    paddingTop: 22,
  },
  marcador: {
    width: 11,
    height: 11,
    borderRadius: 6,
    backgroundColor: Brand.violetLight,
  },
  fio: {
    flex: 1,
    width: 1.5,
    backgroundColor: "rgba(147, 112, 219, 0.25)",
    marginTop: 4,
  },
  cartao: {
    flex: 1,
    marginBottom: 16,
    gap: 10,
  },
  cabecalho: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  emoji: {
    fontSize: 28,
  },
  cabecalhoTextos: {
    flex: 1,
    gap: 2,
  },
  emocao: {
    fontFamily: BrandFonts.titleSemibold,
    fontSize: 16,
    color: Brand.white,
  },
  data: {
    fontFamily: BrandFonts.bodyRegular,
    fontSize: 12,
    color: Brand.gray,
  },
  energia: {
    fontFamily: BrandFonts.bodyMedium,
    fontSize: 12,
    color: Brand.violetLight,
  },
  contexto: {
    fontFamily: BrandFonts.bodyRegular,
    fontSize: 13,
    color: Brand.gray,
  },
  tags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
});
