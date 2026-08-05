import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import { useCallback, useState } from "react";

/**
 * Toca os trechos de 30s que a Deezer fornece.
 *
 * O Moodify não é um player — este preview existe só para o usuário decidir
 * se vale abrir o streaming, sem sair do app às cegas. Um trecho por vez:
 * tocar outro para o anterior.
 */
export function usePreview() {
  const player = useAudioPlayer(null);
  const status = useAudioPlayerStatus(player);
  const [urlAtual, setUrlAtual] = useState<string | null>(null);

  const alternar = useCallback(
    (url: string) => {
      // Mesmo trecho: funciona como pausar / retomar.
      if (urlAtual === url) {
        if (status.playing) {
          player.pause();
        } else {
          player.play();
        }
        return;
      }

      // Trecho novo: troca a fonte, volta ao início e toca.
      player.replace(url);
      player.seekTo(0);
      player.play();
      setUrlAtual(url);
    },
    [player, status.playing, urlAtual],
  );

  const parar = useCallback(() => {
    player.pause();
    setUrlAtual(null);
  }, [player]);

  return {
    alternar,
    parar,
    urlTocando: status.playing ? urlAtual : null,
    carregando: status.isBuffering,
  };
}
