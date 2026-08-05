import { Brand, BrandFonts } from "@/constants/theme";
import { useFavoritos } from "@/contexts/favoritos";
import { chaveDeFaixa, type Faixa } from "@/services/api/tipos";
import { Ionicons } from "@react-native-vector-icons/ionicons";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { Linking, Pressable, StyleSheet, Text, View } from "react-native";

type Props = {
  faixa: Faixa;
  /** Chamado ao abrir no streaming — usado para telemetria. */
  onAbrir?: (faixa: Faixa) => void;
  /** Chamado ao tocar o preview de 30s. */
  onPreview?: (faixa: Faixa) => void;
};

function formatarDuracao(segundos?: number) {
  if (!segundos) {
    return null;
  }
  const minutos = Math.floor(segundos / 60);
  const resto = segundos % 60;
  return `${minutos}:${String(resto).padStart(2, "0")}`;
}

export function CartaoFaixa({ faixa, onAbrir, onPreview }: Props) {
  const { ehFavorita, alternar } = useFavoritos();

  // A chave canônica é o id estável da faixa: o id do provider muda entre
  // single, álbum e remaster, mas artista+título não.
  const favoritada = ehFavorita(chaveDeFaixa(faixa));
  const duracao = formatarDuracao(faixa.duracaoSegundos);

  async function aoFavoritar() {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await alternar(faixa);
  }

  async function aoAbrir() {
    onAbrir?.(faixa);

    // Tenta o deep link primeiro (abre o app instalado); se não der, cai na web.
    if (faixa.urls.app) {
      const podeAbrir = await Linking.canOpenURL(faixa.urls.app);
      if (podeAbrir) {
        await Linking.openURL(faixa.urls.app);
        return;
      }
    }

    await Linking.openURL(faixa.urls.web);
  }

  return (
    <View style={styles.linha}>
      {faixa.capaUrl ? (
        <Image source={{ uri: faixa.capaUrl }} style={styles.capa} transition={200} />
      ) : (
        <View style={[styles.capa, styles.capaVazia]}>
          <Ionicons name="musical-notes" size={22} color={Brand.violetLight} />
        </View>
      )}

      <Pressable style={styles.textos} onPress={aoAbrir}>
        <Text style={styles.titulo} numberOfLines={1}>
          {faixa.titulo}
        </Text>
        <Text style={styles.artista} numberOfLines={1}>
          {faixa.artista}
          {duracao ? ` · ${duracao}` : ""}
        </Text>
        {faixa.motivos.length > 0 && (
          <Text style={styles.motivos} numberOfLines={1}>
            {faixa.motivos.join(" · ")}
          </Text>
        )}
      </Pressable>

      {!!faixa.previewUrl && !!onPreview && (
        <Pressable
          onPress={() => onPreview(faixa)}
          hitSlop={8}
          accessibilityLabel={`Ouvir 30 segundos de ${faixa.titulo}`}
        >
          <Ionicons name="play-circle-outline" size={26} color={Brand.violetLight} />
        </Pressable>
      )}

      <Pressable
        onPress={aoFavoritar}
        hitSlop={8}
        accessibilityLabel={favoritada ? "Remover dos favoritos" : "Adicionar aos favoritos"}
      >
        <Ionicons
          name={favoritada ? "heart" : "heart-outline"}
          size={22}
          color={favoritada ? Brand.violetLight : Brand.gray}
        />
      </Pressable>

      <Pressable onPress={aoAbrir} hitSlop={8} accessibilityLabel="Abrir no streaming">
        <Ionicons name="open-outline" size={20} color={Brand.gray} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
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
  titulo: {
    fontFamily: BrandFonts.bodyMedium,
    fontSize: 15,
    color: Brand.white,
  },
  artista: {
    fontFamily: BrandFonts.bodyRegular,
    fontSize: 13,
    color: Brand.gray,
  },
  motivos: {
    fontFamily: BrandFonts.bodyRegular,
    fontSize: 11,
    color: Brand.violetLight,
  },
});
