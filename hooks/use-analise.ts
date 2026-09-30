import { useAnaliseAtual } from "@/contexts/analise-atual";
import { ErroApi } from "@/services/api/cliente";
import { analisarHumor, buscarRecomendacoes, registrarEvento } from "@/services/api/moodify";
import { ehApoio, type Intencao, type PerfilEmocional } from "@/services/api/tipos";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { useDispositivo } from "./use-dispositivo";

/**
 * Conduz o fluxo em duas etapas.
 *
 * 1. `analisar(texto)` — lê o momento e leva à tela de acolhimento (rápido)
 * 2. `escolher(intencao)` — busca as faixas e leva às recomendações
 *
 * A separação existe por dois motivos. O primeiro é de produto: quem acabou
 * de contar algo difícil merece ser reconhecido antes de receber uma lista.
 * O segundo é de percepção: a etapa 1 responde em milissegundos, então a
 * espera pela busca acontece depois de a pessoa já ter sido acolhida.
 */
export function useAnalise() {
  const router = useRouter();
  const dispositivoId = useDispositivo();
  const { definirAcolhimento, definirRecomendacao, definirApoio } = useAnaliseAtual();

  const [analisando, setAnalisando] = useState(false);
  const [buscando, setBuscando] = useState(false);
  const [erro, setErro] = useState<ErroApi | null>(null);

  const emAndamento = useRef(false);
  const inicioRef = useRef(0);
  const ultimoTexto = useRef("");

  // Se a tela sai com análise em andamento, registra abandono.
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

  /** Etapa 1: interpreta o texto e abre o acolhimento. */
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

        definirAcolhimento(resposta);
        void registrarEvento(
          { analiseId: "acolhimento", tipo: "analise_concluida", latenciaMs },
          dispositivoId,
        );

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
    [dispositivoId, definirAcolhimento, definirApoio, router],
  );

  /** Etapa 2: a pessoa escolheu; busca as faixas e vai para a lista. */
  const escolher = useCallback(
    async (perfil: PerfilEmocional, intencao: Intencao) => {
      if (!dispositivoId) {
        return;
      }

      setBuscando(true);
      setErro(null);
      const inicio = Date.now();

      try {
        const resposta = await buscarRecomendacoes(perfil, intencao, dispositivoId);
        definirRecomendacao(resposta);

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

        void registrarEvento(
          {
            analiseId: resposta.id,
            tipo: "analise_concluida",
            latenciaMs: Date.now() - inicio,
          },
          dispositivoId,
        );

        // `replace`, não `push`: a pergunta já foi respondida, e voltar para
        // ela seria pedir a mesma escolha duas vezes. Trocar de intenção se
        // faz na própria tela de recomendações.
        router.replace("/recomendacao");
      } catch (causa) {
        setErro(causa instanceof ErroApi ? causa : new ErroApi(String(causa), "servidor"));
      } finally {
        setBuscando(false);
      }
    },
    [dispositivoId, definirRecomendacao, router],
  );

  const tentarDeNovo = useCallback(() => {
    if (ultimoTexto.current.length > 0) {
      void analisar(ultimoTexto.current);
    }
  }, [analisar]);

  return {
    analisar,
    escolher,
    tentarDeNovo,
    analisando,
    buscando,
    erro,
    /** `false` enquanto o id do dispositivo ainda está sendo lido do disco. */
    pronto: dispositivoId !== null,
  };
}
