import type { RespostaApoio, RespostaRecomendacao } from "@/services/api/tipos";
import { createContext, useContext, useMemo, useState } from "react";

/**
 * Guarda o resultado da última análise, para as telas de resultado e de
 * recomendações lerem o mesmo dado sem refazer a chamada.
 *
 * Fica só na memória de propósito: ao fechar o app ela se perde. O que
 * persiste é o histórico salvo.
 */

type AnaliseAtual = {
  recomendacao: RespostaRecomendacao | null;
  apoio: RespostaApoio | null;
  definirRecomendacao: (resposta: RespostaRecomendacao) => void;
  definirApoio: (resposta: RespostaApoio) => void;
  limpar: () => void;
};

const AnaliseAtualContext = createContext<AnaliseAtual | null>(null);

export function AnaliseAtualProvider({ children }: { children: React.ReactNode }) {
  const [recomendacao, setRecomendacao] = useState<RespostaRecomendacao | null>(null);
  const [apoio, setApoio] = useState<RespostaApoio | null>(null);

  const valor = useMemo<AnaliseAtual>(
    () => ({
      recomendacao,
      apoio,
      // Os dois estados são mutuamente exclusivos: entrar em um limpa o outro.
      definirRecomendacao: (resposta) => {
        setApoio(null);
        setRecomendacao(resposta);
      },
      definirApoio: (resposta) => {
        setRecomendacao(null);
        setApoio(resposta);
      },
      limpar: () => {
        setRecomendacao(null);
        setApoio(null);
      },
    }),
    [recomendacao, apoio],
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
