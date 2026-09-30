import { Ionicons } from "@react-native-vector-icons/ionicons";
import { CartaoFaixa } from "@/components/cartao-faixa";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EstadoVazio } from "@/components/ui/estado-vazio";
import { Secao } from "@/components/ui/secao";
import { Tag } from "@/components/ui/tag";
import { Tela } from "@/components/ui/tela";
import { Brand, BrandFonts } from "@/constants/theme";
import { useAnaliseAtual } from "@/contexts/analise-atual";
import { useDispositivo } from "@/hooks/use-dispositivo";
import { useAnalise } from "@/hooks/use-analise";
import { usePlaylistSpotify } from "@/hooks/use-playlist-spotify";
import { usePlayer } from "@/contexts/player";
import { registrarEvento } from "@/services/api/moodify";
import { montarTextoParaCompartilhar } from "@/services/links-universais";
import { chaveDeFaixa, type Faixa } from "@/services/api/tipos";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { Linking, Pressable, ScrollView, Share, StyleSheet, Text, View } from "react-native";

export default function Recomendacao() {
  const router = useRouter();
  const { recomendacao } = useAnaliseAtual();
  const dispositivoId = useDispositivo();
  const player = usePlayer();
  const playlist = usePlaylistSpotify();
  const { escolher, buscando } = useAnalise();

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

    player.alternar(faixa);

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

  async function compartilhar() {
    try {
      await Share.share({
        message: montarTextoParaCompartilhar(
          filtradas,
          recomendacao!.perfil.emocaoNome,
        ),
      });
    } catch {
      // Usuário cancelou o compartilhamento — não é erro.
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
          {"\n"}
          <Text style={styles.destaque}>
            {recomendacao.intencao === "acolher"
              ? "Para acompanhar o momento"
              : "Para levantar o astral"}
          </Text>
        </Text>
      </View>

      {/* Trocar de escolha aqui, em vez de voltar para a pergunta: quem
          pediu para acolher e mudou de ideia não precisa refazer a análise. */}
      <Pressable
        onPress={() =>
          escolher(
            recomendacao.perfil,
            recomendacao.intencao === "acolher" ? "levantar" : "acolher",
          )
        }
        disabled={buscando}
        style={({ pressed }) => [
          styles.trocar,
          pressed && styles.trocarPressionado,
          buscando && styles.trocarPressionado,
        ]}
      >
        <Ionicons
          name={buscando ? "hourglass-outline" : "swap-horizontal-outline"}
          size={18}
          color={Brand.violetLight}
        />
        <Text style={styles.trocarTexto}>
          {buscando
            ? "Buscando outras músicas..."
            : recomendacao.intencao === "acolher"
              ? "Na verdade, quero levantar o astral"
              : "Na verdade, quero músicas que acompanhem o momento"}
        </Text>
      </Pressable>

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

      {filtradas.length > 0 && (
        <Card>
          <Text style={styles.playlistTitulo}>Levar para o seu serviço</Text>
          <Text style={styles.playlistTexto}>
            Compartilhe a seleção com links que abrem no Spotify, Deezer, YouTube
            Music, Apple Music ou Tidal — cada um escolhe onde ouvir.
          </Text>
          <View style={styles.playlistAcao}>
            <Button label="Compartilhar seleção" variant="outline" onPress={compartilhar} />
          </View>
        </Card>
      )}

      {/* Só aparece quando o servidor tem credenciais do Spotify. Sem elas,
          o app segue funcionando com deep links. */}
      {playlist.disponivel && filtradas.length > 0 && (
        <Card destacado>
          <Text style={styles.playlistTitulo}>Salvar como playlist</Text>
          <Text style={styles.playlistTexto}>
            {playlist.urlCriada
              ? "Playlist criada na sua conta do Spotify."
              : "Criamos uma playlist na sua conta do Spotify com estas músicas — assim você não precisa abrir uma por uma."}
          </Text>

          {!!playlist.erro && <Text style={styles.playlistErro}>{playlist.erro}</Text>}

          <View style={styles.playlistAcao}>
            {playlist.urlCriada ? (
              <Button
                label="Abrir playlist"
                onPress={() => Linking.openURL(playlist.urlCriada!)}
              />
            ) : (
              <Button
                label="Criar playlist no Spotify"
                loading={playlist.criando}
                onPress={() =>
                  playlist.criar(
                    `Moodify · ${recomendacao.perfil.emocaoNome}`,
                    filtradas,
                  )
                }
              />
            )}
          </View>
        </Card>
      )}

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
  trocar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(147, 112, 219, 0.3)",
    backgroundColor: "rgba(106, 13, 173, 0.10)",
  },
  trocarPressionado: {
    opacity: 0.6,
  },
  trocarTexto: {
    flex: 1,
    fontFamily: BrandFonts.bodyMedium,
    fontSize: 13,
    color: Brand.violetLight,
  },
  playlistTitulo: {
    fontFamily: BrandFonts.titleSemibold,
    fontSize: 16,
    color: Brand.white,
    marginBottom: 6,
  },
  playlistTexto: {
    fontFamily: BrandFonts.bodyRegular,
    fontSize: 14,
    lineHeight: 21,
    color: Brand.gray,
  },
  playlistErro: {
    fontFamily: BrandFonts.bodyRegular,
    fontSize: 13,
    lineHeight: 20,
    color: "#E5534B",
    marginTop: 10,
  },
  playlistAcao: {
    marginTop: 14,
  },
  aviso: {
    fontFamily: BrandFonts.bodyRegular,
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
    color: Brand.gray,
  },
});
