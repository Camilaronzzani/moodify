import type { Faixa } from "@/services/api/tipos";
import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import { createContext, useCallback, useContext, useMemo, useState } from "react";

/**
 * Player dos trechos de 30 segundos.
 *
 * Vive num contexto, e não em cada tela, por um motivo prático: se o áudio
 * ficasse dentro da tela de recomendações, trocar de aba pararia a música ou
 * — pior — deixaria o som tocando sem nenhum controle visível.
 *
 * O Moodify não é um player. Isto existe só para a pessoa decidir se vale
 * abrir o streaming, sem sair do app às cegas.
 */

/** Só o necessário para o mini-player desenhar a faixa. */
export type FaixaTocando = {
  chave: string;
  titulo: string;
  artista: string;
  capaUrl?: string;
  previewUrl: string;
};

type Player = {
  faixa: FaixaTocando | null;
  tocando: boolean;
  carregando: boolean;
  /** 0 a 1 — quanto do trecho já passou. */
  progresso: number;
  segundosAtuais: number;
  segundosTotais: number;
  alternar: (faixa: Faixa) => void;
  pausar: () => void;
  fechar: () => void;
};

const PlayerContext = createContext<Player | null>(null);

function paraFaixaTocando(faixa: Faixa, chave: string): FaixaTocando | null {
  if (!faixa.previewUrl) {
    return null;
  }

  return {
    chave,
    titulo: faixa.titulo,
    artista: faixa.artista,
    capaUrl: faixa.capaUrl,
    previewUrl: faixa.previewUrl,
  };
}

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const player = useAudioPlayer(null);
  const status = useAudioPlayerStatus(player);
  const [faixa, setFaixa] = useState<FaixaTocando | null>(null);

  const alternar = useCallback(
    (nova: Faixa) => {
      const chave = `${nova.provider}-${nova.providerId}`;

      // Mesma faixa: funciona como pausar / retomar.
      if (faixa?.chave === chave) {
        if (status.playing) {
          player.pause();
        } else {
          player.play();
        }
        return;
      }

      const convertida = paraFaixaTocando(nova, chave);

      if (!convertida) {
        return;
      }

      // Faixa nova: troca a fonte, volta ao início e toca.
      player.replace(convertida.previewUrl);
      player.seekTo(0);
      player.play();
      setFaixa(convertida);
    },
    [player, status.playing, faixa],
  );

  const pausar = useCallback(() => {
    player.pause();
  }, [player]);

  /** Para o som e esconde o mini-player. */
  const fechar = useCallback(() => {
    player.pause();
    setFaixa(null);
  }, [player]);

  const valor = useMemo<Player>(() => {
    const totais = status.duration || 30;
    const atuais = status.currentTime || 0;

    return {
      faixa,
      tocando: status.playing,
      carregando: status.isBuffering,
      // Limitado a 1 porque o tempo relatado às vezes passa da duração.
      progresso: totais > 0 ? Math.min(atuais / totais, 1) : 0,
      segundosAtuais: atuais,
      segundosTotais: totais,
      alternar,
      pausar,
      fechar,
    };
  }, [faixa, status, alternar, pausar, fechar]);

  return <PlayerContext.Provider value={valor}>{children}</PlayerContext.Provider>;
}

export function usePlayer() {
  const contexto = useContext(PlayerContext);
  if (!contexto) {
    throw new Error("usePlayer precisa estar dentro de <PlayerProvider>");
  }
  return contexto;
}
