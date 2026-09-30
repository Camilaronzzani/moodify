import { z } from "zod";
import {
  CONTEXTOS,
  EMOCOES,
  ENERGIAS,
  TEMAS,
  filtrarTagsValidas,
  type Contexto,
  type Emocao,
  type Energia,
  type Intencao,
  type Tag,
  type Tema,
} from "../../dominio/taxonomia.ts";

/**
 * A IA interpreta sentimento e nada mais. Ela nunca nomeia artista, álbum
 * ou faixa — quem escolhe música é o motor de recomendação.
 */

export type PerfilEmocional = {
  emotion: Emocao;
  /** O assunto do que foi contado — dá especificidade à recomendação. */
  theme: Tema;
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
  /**
   * A intenção não muda a leitura do sentimento — ela muda quais tags
   * musicais o perfil carrega. Interpretar e recomendar são coisas
   * diferentes, e só a segunda depende do que a pessoa quer.
   */
  analisarHumor(texto: string, intencao?: Intencao): Promise<PerfilEmocional>;

  /**
   * Escreve a frase que reconhece o que a pessoa contou.
   *
   * AQUI é onde um modelo de linguagem é insubstituível. Classificar emoção
   * um dicionário faz quase igual; responder "sinto muito, seis anos é muito
   * tempo" a quem escreveu sobre um namoro de seis anos, não.
   *
   * Opcional de propósito: quem não implementa cai nos textos curados de
   * `dominio/acolhimento.ts`, que nunca falham e nunca dizem algo estranho.
   */
  gerarAcolhimento?(texto: string, perfil: PerfilEmocional): Promise<string>;
}

/**
 * Schema da resposta crua do modelo. Note que `tags` aceita qualquer string:
 * é o `filtrarTagsValidas` que descarta o que foi inventado, em vez de
 * rejeitar a resposta inteira por causa de uma tag ruim.
 */
export const RespostaModeloSchema = z.object({
  emotion: z.enum(EMOCOES),
  theme: z.enum(TEMAS).default("nenhum"),
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
