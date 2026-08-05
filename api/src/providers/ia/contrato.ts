import { z } from "zod";
import {
  CONTEXTOS,
  EMOCOES,
  ENERGIAS,
  filtrarTagsValidas,
  type Contexto,
  type Emocao,
  type Energia,
  type Tag,
} from "../../dominio/taxonomia.ts";

/**
 * A IA interpreta sentimento e nada mais. Ela nunca nomeia artista, álbum
 * ou faixa — quem escolhe música é o motor de recomendação.
 */

export type PerfilEmocional = {
  emotion: Emocao;
  context: Contexto;
  energy: Energia;
  tags: Tag[];
  /** Palavras livres extraídas do texto — só para telemetria e insight. */
  keywords: string[];
  /** 0 a 1. Abaixo do limiar, o orquestrador cai para o próximo provider. */
  confidence: number;
};

export interface AIProvider {
  readonly nome: string;
  analisarHumor(texto: string): Promise<PerfilEmocional>;
}

/**
 * Schema da resposta crua do modelo. Note que `tags` aceita qualquer string:
 * é o `filtrarTagsValidas` que descarta o que foi inventado, em vez de
 * rejeitar a resposta inteira por causa de uma tag ruim.
 */
export const RespostaModeloSchema = z.object({
  emotion: z.enum(EMOCOES),
  context: z.enum(CONTEXTOS).default("qualquer"),
  energy: z.enum(ENERGIAS),
  tags: z.array(z.string()).default([]),
  keywords: z.array(z.string()).default([]),
  confidence: z.number().min(0).max(1).default(0.7),
});

export class RespostaInvalidaError extends Error {
  constructor(motivo: string) {
    super(`Resposta do modelo inválida: ${motivo}`);
    this.name = "RespostaInvalidaError";
  }
}

/**
 * Valida a saída crua de um modelo e converte em perfil confiável.
 * Lança `RespostaInvalidaError` se nem uma tag válida sobrar — sinal de que
 * o modelo não entendeu a taxonomia e é melhor usar o fallback.
 */
export function validarRespostaModelo(bruta: unknown): PerfilEmocional {
  const analise = RespostaModeloSchema.safeParse(bruta);

  if (!analise.success) {
    throw new RespostaInvalidaError(analise.error.issues.map((i) => i.message).join("; "));
  }

  const tags = filtrarTagsValidas(analise.data.tags);

  if (tags.length === 0) {
    throw new RespostaInvalidaError("nenhuma tag pertence à taxonomia");
  }

  return { ...analise.data, tags };
}
