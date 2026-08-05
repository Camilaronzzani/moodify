import { CartaoFaixa } from "@/components/cartao-faixa";
import { EstadoVazio } from "@/components/ui/estado-vazio";
import { Secao } from "@/components/ui/secao";
import { Tag } from "@/components/ui/tag";
import { Tela } from "@/components/ui/tela";
import { Brand, BrandFonts } from "@/constants/theme";
import { useAnaliseAtual } from "@/contexts/analise-atual";
import { useDispositivo } from "@/hooks/use-dispositivo";
import { usePreview } from "@/hooks/use-preview";
import { registrarEvento } from "@/services/api/moodify";
import { chaveDeFaixa, type Faixa } from "@/services/api/tipos";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

export default function Recomendacao() {
  const router = useRouter();
  const { recomendacao } = useAnaliseAtual();
  const dispositivoId = useDispositivo();
  const preview = usePreview();

  const [tagAtiva, setTagAtiva] = useState<string | null>(null);

  // Guarda contra resposta malformada: se `faixas` não vier como array, a tela
  // mostra o estado vazio em vez de estourar num `.map` de tipo errado.
  const faixas = useMemo(
    () => (Array.isArray(recomendacao?.faixas) ? recomendacao.faixas : []),
    [recomendacao],
  );

  // Só oferece filtros que existem no resultado — filtro que devolve zero
  // é pior que filtro nenhum.
  const tags = useMemo(
    () => Array.from(new Set(faixas.flatMap((f) => f.motivos ?? []))).sort(),
    [faixas],
  );

  const filtradas = useMemo(
    () => (tagAtiva ? faixas.filter((f) => f.motivos?.includes(tagAtiva)) : faixas),
    [faixas, tagAtiva],
  );

  if (!recomendacao) {
    return (
      <Tela comRolagem={false}>
        <EstadoVazio
          icone="sparkles-outline"
          titulo="Nenhuma recomendação ainda"
          descricao="Conte como você está se sentindo e a gente monta uma seleção para o seu momento."
          rotuloAcao="Fazer uma análise"
          onAcao={() => router.push("/home")}
        />
      </Tela>
    );
  }

  function aoAbrir(faixa: Faixa) {
    if (dispositivoId) {
      void registrarEvento(
        {
          analiseId: recomendacao!.id,
          faixaChave: chaveDeFaixa(faixa),
          isrc: faixa.isrc,
          tipo: "aberta",
        },
        dispositivoId,
      );
    }
  }

  function aoPreview(faixa: Faixa) {
    if (!faixa.previewUrl) {
      return;
    }

    preview.alternar(faixa.previewUrl);

    if (dispositivoId) {
      void registrarEvento(
        {
          analiseId: recomendacao!.id,
          faixaChave: chaveDeFaixa(faixa),
          isrc: faixa.isrc,
          tipo: "preview",
        },
        dispositivoId,
      );
    }
  }

  return (
    <Tela>
      <View>
        <Text style={styles.titulo}>Recomendações para você</Text>
        <Text style={styles.subtitulo}>
          Baseado em{" "}
          <Text style={styles.destaque}>
            {recomendacao.perfil.emocaoNome.toLowerCase()}
          </Text>{" "}
          · energia {recomendacao.perfil.energiaNome.toLowerCase()}
        </Text>
      </View>

      {tags.length > 1 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtros}
        >
          <Tag texto="Todas" ativa={tagAtiva === null} onPress={() => setTagAtiva(null)} />
          {tags.map((tag) => (
            <Tag
              key={tag}
              texto={tag}
              ativa={tagAtiva === tag}
              onPress={() => setTagAtiva(tag)}
            />
          ))}
        </ScrollView>
      )}

      <Secao titulo={`${filtradas.length} músicas`}>
        {filtradas.length === 0 ? (
          <EstadoVazio
            icone="funnel-outline"
            titulo="Nada nesse filtro"
            descricao="Tente outra tag para ver mais músicas desta seleção."
            rotuloAcao="Limpar filtro"
            onAcao={() => setTagAtiva(null)}
          />
        ) : (
          <View style={styles.lista}>
            {filtradas.map((faixa) => (
              <CartaoFaixa
                key={`${faixa.provider}-${faixa.providerId}`}
                faixa={faixa}
                onAbrir={aoAbrir}
                onPreview={aoPreview}
              />
            ))}
          </View>
        )}
      </Secao>

      <Text style={styles.aviso}>
        Toque no ▶ para ouvir 30 segundos. O botão de abrir leva ao streaming.
      </Text>
    </Tela>
  );
}

const styles = StyleSheet.create({
  titulo: {
    fontFamily: BrandFonts.titleBold,
    fontSize: 24,
    color: Brand.white,
  },
  subtitulo: {
    fontFamily: BrandFonts.bodyRegular,
    fontSize: 14,
    lineHeight: 21,
    color: Brand.gray,
    marginTop: 6,
  },
  destaque: {
    fontFamily: BrandFonts.bodyMedium,
    color: Brand.violetLight,
  },
  filtros: {
    gap: 10,
    paddingRight: 22,
  },
  lista: {
    gap: 18,
  },
  aviso: {
    fontFamily: BrandFonts.bodyRegular,
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
    color: Brand.gray,
  },
});
