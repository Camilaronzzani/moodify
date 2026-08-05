import type { Faixa } from "@/services/api/tipos";
import { chaveDeFaixa } from "@/services/api/tipos";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

/**
 * Favoritos do usuário, guardados no próprio aparelho.
 *
 * Guardamos os DADOS da faixa, não só um id. Antes existia um catálogo local
 * para resolver ids; agora a fonte é a API, e uma faixa favoritada precisa
 * continuar visível mesmo offline ou se a busca deixar de encontrá-la.
 *
 * A chave é canônica (artista::titulo), não o id do provider: a mesma música
 * aparece com ids diferentes em single, álbum e remaster.
 */

/**
 * A chave é versionada de propósito.
 *
 * A v1 guardava `{ musica: [], artista: [], album: [] }` — ids agrupados por
 * tipo. A v2 guarda um array de faixas completas. Reaproveitar o mesmo nome
 * fazia o app ler um objeto onde esperava array e quebrar em `faixas.map`.
 *
 * Ao mudar o FORMATO do que é gravado, suba a versão. Dados antigos ficam
 * órfãos e são ignorados, em vez de virarem um crash no primeiro render.
 */
const CHAVE = "moodify:favoritos:v2";

/** Aceita apenas o que tem a forma de FaixaFavorita. */
function ehFaixaValida(valor: unknown): valor is FaixaFavorita {
  if (typeof valor !== "object" || valor === null) {
    return false;
  }
  const candidata = valor as Partial<FaixaFavorita>;
  return (
    typeof candidata.chave === "string" &&
    typeof candidata.titulo === "string" &&
    typeof candidata.artista === "string" &&
    typeof candidata.urlWeb === "string"
  );
}

export type FaixaFavorita = {
  chave: string;
  titulo: string;
  artista: string;
  album?: string;
  isrc?: string;
  capaUrl?: string;
  previewUrl?: string;
  urlWeb: string;
  urlApp?: string;
  provider: string;
  salvaEm: string;
};

type Favoritos = {
  faixas: FaixaFavorita[];
  carregando: boolean;
  ehFavorita: (chave: string) => boolean;
  alternar: (faixa: Faixa) => Promise<boolean>;
  remover: (chave: string) => Promise<void>;
  limpar: () => Promise<void>;
};

const FavoritosContext = createContext<Favoritos | null>(null);

function paraFavorita(faixa: Faixa): FaixaFavorita {
  return {
    chave: chaveDeFaixa(faixa),
    titulo: faixa.titulo,
    artista: faixa.artista,
    album: faixa.album,
    isrc: faixa.isrc,
    capaUrl: faixa.capaUrl,
    previewUrl: faixa.previewUrl,
    urlWeb: faixa.urls.web,
    urlApp: faixa.urls.app,
    provider: faixa.provider,
    salvaEm: new Date().toISOString(),
  };
}

export function FavoritosProvider({ children }: { children: React.ReactNode }) {
  const [faixas, setFaixas] = useState<FaixaFavorita[]>([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    async function recuperar() {
      try {
        const salvo = await AsyncStorage.getItem(CHAVE);

        if (salvo) {
          const bruto: unknown = JSON.parse(salvo);

          // Nunca confie no que veio do disco: pode ser de uma versão
          // anterior do app, ou ter sido truncado numa escrita interrompida.
          if (Array.isArray(bruto)) {
            setFaixas(bruto.filter(ehFaixaValida));
          }
        }
      } catch {
        // Dado corrompido: começa vazio em vez de derrubar o app.
      } finally {
        setCarregando(false);
      }
    }
    recuperar();
  }, []);

  const ehFavorita = useCallback(
    (chave: string) => faixas.some((f) => f.chave === chave),
    [faixas],
  );

  /** Devolve `true` se acabou de favoritar, `false` se removeu. */
  const alternar = useCallback(
    async (faixa: Faixa) => {
      const chave = chaveDeFaixa(faixa);
      const jaEra = faixas.some((f) => f.chave === chave);

      const atualizada = jaEra
        ? faixas.filter((f) => f.chave !== chave)
        : [paraFavorita(faixa), ...faixas];

      setFaixas(atualizada);
      await AsyncStorage.setItem(CHAVE, JSON.stringify(atualizada));

      return !jaEra;
    },
    [faixas],
  );

  const remover = useCallback(
    async (chave: string) => {
      const atualizada = faixas.filter((f) => f.chave !== chave);
      setFaixas(atualizada);
      await AsyncStorage.setItem(CHAVE, JSON.stringify(atualizada));
    },
    [faixas],
  );

  const limpar = useCallback(async () => {
    setFaixas([]);
    await AsyncStorage.removeItem(CHAVE);
  }, []);

  const valor = useMemo(
    () => ({ faixas, carregando, ehFavorita, alternar, remover, limpar }),
    [faixas, carregando, ehFavorita, alternar, remover, limpar],
  );

  return <FavoritosContext.Provider value={valor}>{children}</FavoritosContext.Provider>;
}

export function useFavoritos() {
  const contexto = useContext(FavoritosContext);
  if (!contexto) {
    throw new Error("useFavoritos precisa estar dentro de <FavoritosProvider>");
  }
  return contexto;
}
