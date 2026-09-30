import { Carregamento } from "@/components/ui/carregamento";
import { EstadoVazio } from "@/components/ui/estado-vazio";
import { Tela } from "@/components/ui/tela";
import { Brand, BrandFonts } from "@/constants/theme";
import { useFavoritos, type FaixaFavorita } from "@/contexts/favoritos";
import { usePlayer } from "@/contexts/player";
import { Ionicons } from "@react-native-vector-icons/ionicons";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { Linking, Pressable, StyleSheet, Text, View } from "react-native";

export default function Favorito() {
  const router = useRouter();
  const { faixas, carregando, remover } = useFavoritos();
  const player = usePlayer();

  if (carregando) {
    return (
      <Tela comRolagem={false}>
        <Carregamento mensagem="Buscando seus favoritos..." />
      </Tela>
    );
  }

  if (faixas.length === 0) {
    return (
      <Tela comRolagem={false}>
        <EstadoVazio
          icone="heart-outline"
          titulo="Nenhuma música favorita"
          descricao="Toque no coração de uma recomendação para guardá-la aqui."
          rotuloAcao="Ver recomendações"
          onAcao={() => router.push("/recomendacao")}
        />
      </Tela>
    );
  }

  async function abrir(faixa: FaixaFavorita) {
    if (faixa.urlApp && (await Linking.canOpenURL(faixa.urlApp))) {
      await Linking.openURL(faixa.urlApp);
      return;
    }
    await Linking.openURL(faixa.urlWeb);
  }

  return (
    <Tela>
      <View>
        <Text style={styles.titulo}>Favoritos</Text>
        <Text style={styles.subtitulo}>
          {faixas.length} {faixas.length === 1 ? "música guardada" : "músicas guardadas"}
        </Text>
      </View>

      <View style={styles.lista}>
        {faixas.map((faixa) => (
          <View key={faixa.chave} style={styles.linha}>
            {faixa.capaUrl ? (
              <Image source={{ uri: faixa.capaUrl }} style={styles.capa} transition={200} />
            ) : (
              <View style={[styles.capa, styles.capaVazia]}>
                <Ionicons name="musical-notes" size={22} color={Brand.violetLight} />
              </View>
            )}

            <Pressable style={styles.textos} onPress={() => abrir(faixa)}>
              <Text style={styles.faixaTitulo} numberOfLines={1}>
                {faixa.titulo}
              </Text>
              <Text style={styles.faixaArtista} numberOfLines={1}>
                {faixa.artista}
              </Text>
            </Pressable>

            {!!faixa.previewUrl && (
              <Pressable
                onPress={() =>
                  player.alternar({
                    providerId: faixa.chave,
                    provider: faixa.provider,
                    titulo: faixa.titulo,
                    artista: faixa.artista,
                    capaUrl: faixa.capaUrl,
                    previewUrl: faixa.previewUrl,
                    urls: { web: faixa.urlWeb, app: faixa.urlApp },
                    motivos: [],
                    score: 0,
                  })
                }
                hitSlop={8}
                accessibilityLabel={`Ouvir 30 segundos de ${faixa.titulo}`}
              >
                <Ionicons
                  name={
                    player.tocando && player.faixa?.previewUrl === faixa.previewUrl
                      ? "pause-circle-outline"
                      : "play-circle-outline"
                  }
                  size={26}
                  color={Brand.violetLight}
                />
              </Pressable>
            )}

            <Pressable
              onPress={() => remover(faixa.chave)}
              hitSlop={8}
              accessibilityLabel={`Remover ${faixa.titulo} dos favoritos`}
            >
              <Ionicons name="heart" size={22} color={Brand.violetLight} />
            </Pressable>
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
  lista: {
    gap: 18,
  },
  linha: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  capa: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: "rgba(147, 112, 219, 0.15)",
  },
  capaVazia: {
    alignItems: "center",
    justifyContent: "center",
  },
  textos: {
    flex: 1,
    gap: 3,
  },
  faixaTitulo: {
    fontFamily: BrandFonts.bodyMedium,
    fontSize: 15,
    color: Brand.white,
  },
  faixaArtista: {
    fontFamily: BrandFonts.bodyRegular,
    fontSize: 13,
    color: Brand.gray,
  },
});
