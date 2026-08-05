import { useAnaliseAtual } from "@/contexts/analise-atual";
import { ErroApi } from "@/services/api/cliente";
import { analisarHumor, registrarEvento } from "@/services/api/moodify";
import { ehApoio } from "@/services/api/tipos";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { useDispositivo } from "./use-dispositivo";

/**
 * Executa a análise no backend e conduz a navegação.
 *
 * Também mede o que precisamos saber sobre o fluxo: latência real vista pelo
 * usuário, taxa de sucesso e abandono. O abandono é o mais difícil de capturar
 * e o mais revelador — é a pessoa desistindo enquanto espera.
 */
export function useAnalise() {
  const router = useRouter();
  const dispositivoId = useDispositivo();
  const { definirRecomendacao, definirApoio } = useAnaliseAtual();

  const [analisando, setAnalisando] = useState(false);
  const [erro, setErro] = useState<ErroApi | null>(null);

  // Refs porque o cleanup do efeito precisa ler o valor mais recente sem
  // recriar o efeito a cada render.
  const emAndamento = useRef(false);
  const inicioRef = useRef(0);
  const ultimoTexto = useRef("");

  // Se o componente sai de tela com análise em andamento, registra abandono.
  useEffect(() => {
    return () => {
      if (emAndamento.current && dispositivoId) {
        void registrarEvento(
          {
            analiseId: "pendente",
            tipo: "analise_abandonada",
            latenciaMs: Date.now() - inicioRef.current,
          },
          dispositivoId,
        );
      }
    };
  }, [dispositivoId]);

  const analisar = useCallback(
    async (texto: string) => {
      if (!dispositivoId || emAndamento.current) {
        return;
      }

      emAndamento.current = true;
      inicioRef.current = Date.now();
      ultimoTexto.current = texto;

      setAnalisando(true);
      setErro(null);

      void registrarEvento(
        { analiseId: "pendente", tipo: "analise_iniciada" },
        dispositivoId,
      );

      try {
        const resposta = await analisarHumor(texto, dispositivoId);
        const latenciaMs = Date.now() - inicioRef.current;

        if (ehApoio(resposta)) {
          definirApoio(resposta);
          void registrarEvento(
            { analiseId: "apoio", tipo: "analise_concluida", latenciaMs },
            dispositivoId,
          );
          router.push("/apoio");
          return;
        }

        definirRecomendacao(resposta);

        void registrarEvento(
          { analiseId: resposta.id, tipo: "analise_concluida", latenciaMs },
          dispositivoId,
        );

        // Marca como exibidas para a anti-repetição do servidor funcionar.
        resposta.faixas.forEach((faixa) => {
          void registrarEvento(
            {
              analiseId: resposta.id,
              faixaChave: `${faixa.artista}::${faixa.titulo}`,
              isrc: faixa.isrc,
              tipo: "exibida",
            },
            dispositivoId,
          );
        });

        router.push("/analise");
      } catch (causa) {
        const falha =
          causa instanceof ErroApi ? causa : new ErroApi(String(causa), "servidor");

        setErro(falha);

        void registrarEvento(
          {
            analiseId: "falhou",
            tipo: "analise_falhou",
            latenciaMs: Date.now() - inicioRef.current,
            motivo: `${falha.causa}: ${falha.message}`.slice(0, 200),
          },
          dispositivoId,
        );
      } finally {
        emAndamento.current = false;
        setAnalisando(false);
      }
    },
    [dispositivoId, definirRecomendacao, definirApoio, router],
  );

  /** Repete a última análise — usado pelo botão de "Tentar de novo". */
  const tentarDeNovo = useCallback(() => {
    if (ultimoTexto.current.length > 0) {
      void analisar(ultimoTexto.current);
    }
  }, [analisar]);

  return {
    analisar,
    tentarDeNovo,
    analisando,
    erro,
    /** `false` enquanto o id do dispositivo ainda está sendo lido do disco. */
    pronto: dispositivoId !== null,
  };
}
