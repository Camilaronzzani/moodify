import type {
  RespostaAcolhimento,
  RespostaApoio,
  RespostaRecomendacao,
} from "@/services/api/tipos";
import { createContext, useContext, useMemo, useState } from "react";

/**
 * Guarda o estado da análise em curso, para as telas lerem o mesmo dado.
 *
 * Três estados mutuamente exclusivos:
 * - `acolhimento`: leu o momento, esperando a pessoa escolher o que quer
 * - `recomendacao`: escolheu, as faixas estão prontas
 * - `apoio`: a triagem detectou risco — não há música aqui
 *
 * Fica só na memória de propósito. O que persiste é o histórico salvo.
 */

type AnaliseAtual = {
  acolhimento: RespostaAcolhimento | null;
  recomendacao: RespostaRecomendacao | null;
  apoio: RespostaApoio | null;
  definirAcolhimento: (resposta: RespostaAcolhimento) => void;
  definirRecomendacao: (resposta: RespostaRecomendacao) => void;
  definirApoio: (resposta: RespostaApoio) => void;
  limpar: () => void;
};

const AnaliseAtualContext = createContext<AnaliseAtual | null>(null);

export function AnaliseAtualProvider({ children }: { children: React.ReactNode }) {
  const [acolhimento, setAcolhimento] = useState<RespostaAcolhimento | null>(null);
  const [recomendacao, setRecomendacao] = useState<RespostaRecomendacao | null>(null);
  const [apoio, setApoio] = useState<RespostaApoio | null>(null);

  const valor = useMemo<AnaliseAtual>(
    () => ({
      acolhimento,
      recomendacao,
      apoio,

      // Novo acolhimento zera o resto: começou uma análise nova.
      definirAcolhimento: (resposta) => {
        setApoio(null);
        setRecomendacao(null);
        setAcolhimento(resposta);
      },

      // A recomendação convive com o acolhimento — a tela de faixas mostra
      // qual emoção e escolha a originaram.
      definirRecomendacao: (resposta) => {
        setApoio(null);
        setRecomendacao(resposta);
      },

      definirApoio: (resposta) => {
        setAcolhimento(null);
        setRecomendacao(null);
        setApoio(resposta);
      },

      limpar: () => {
        setAcolhimento(null);
        setRecomendacao(null);
        setApoio(null);
      },
    }),
    [acolhimento, recomendacao, apoio],
  );

  return <AnaliseAtualContext.Provider value={valor}>{children}</AnaliseAtualContext.Provider>;
}

export function useAnaliseAtual() {
  const contexto = useContext(AnaliseAtualContext);
  if (!contexto) {
    throw new Error("useAnaliseAtual precisa estar dentro de <AnaliseAtualProvider>");
  }
  return contexto;
}
