import { pedir } from "./cliente";
import type {
  Evento,
  Intencao,
  PerfilEmocional,
  RespostaAnalise,
  RespostaRecomendacao,
  Taxonomia,
} from "./tipos";

/**
 * Chamadas do app ao backend. Uma função por operação, sem lógica de
 * recomendação — quem decide o que tocar é o servidor.
 */

/** Etapa 1: interpreta o texto e devolve o acolhimento. Rápido. */
export function analisarHumor(
  texto: string,
  dispositivoId: string,
): Promise<RespostaAnalise> {
  return pedir<RespostaAnalise>("/v1/analises", {
    metodo: "POST",
    corpo: { texto, dispositivoId },
  });
}

/**
 * Etapa 2: busca as faixas conforme a escolha.
 *
 * Manda o perfil de volta em vez do texto — o que a pessoa escreveu não
 * sai do aparelho novamente.
 */
export function buscarRecomendacoes(
  perfil: PerfilEmocional,
  intencao: Intencao,
  dispositivoId: string,
  limite = 15,
): Promise<RespostaRecomendacao> {
  return pedir<RespostaRecomendacao>("/v1/recomendacoes", {
    metodo: "POST",
    corpo: {
      dispositivoId,
      intencao,
      limite,
      perfil: {
        emotion: perfil.emotion,
        theme: perfil.theme,
        context: perfil.context,
        energy: perfil.energy,
        tags: perfil.tags,
        keywords: perfil.keywords,
        confidence: perfil.confidence,
      },
    },
    timeoutMs: 30_000,
  });
}

export function buscarTaxonomia(): Promise<Taxonomia> {
  return pedir<Taxonomia>("/v1/taxonomia");
}

/**
 * Telemetria. Nunca deixa uma falha aqui atrapalhar o usuário: medir é
 * importante, mas não é mais importante que a tela funcionar.
 */
export async function registrarEvento(
  evento: Evento,
  dispositivoId: string,
): Promise<void> {
  try {
    await pedir<void>("/v1/eventos", {
      metodo: "POST",
      corpo: { ...evento, dispositivoId },
      tentativas: 1,
      timeoutMs: 4_000,
    });
  } catch {
    // Silencioso de propósito.
  }
}
