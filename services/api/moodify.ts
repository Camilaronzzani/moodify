import { pedir } from "./cliente";
import type { Evento, RespostaAnalise, Taxonomia } from "./tipos";

/**
 * Chamadas do app ao backend. Uma função por operação, sem lógica de
 * recomendação — quem decide o que tocar é o servidor.
 */

export function analisarHumor(
  texto: string,
  dispositivoId: string,
  limite = 15,
): Promise<RespostaAnalise> {
  return pedir<RespostaAnalise>("/v1/analises", {
    metodo: "POST",
    corpo: { texto, dispositivoId, limite },
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
