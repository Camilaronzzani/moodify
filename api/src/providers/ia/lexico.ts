import { resolverRegra } from "../../dominio/mapa-emocional.ts";
import type { Contexto, Emocao } from "../../dominio/taxonomia.ts";
import type { AIProvider, PerfilEmocional } from "./contrato.ts";

/**
 * Classificador por palavras-chave.
 *
 * Não é um plano B improvisado: é a linha de base do sistema. Funciona offline,
 * responde em microssegundos, custa zero e nunca falha. Todo LLM que entrar no
 * projeto tem que provar que supera isto — e a mesma lógica atende quando o
 * modelo cai, demora ou devolve lixo.
 */

const PISTAS_EMOCAO: Record<Emocao, string[]> = {
  feliz: ["feliz", "alegre", "content", "otimo", "animad", "leve", "sorri", "bem"],
  triste: ["triste", "chatead", "chorar", "choro", "sozinh", "solidao", "magoad", "acabou"],
  cansado: ["cansad", "exaust", "acabad", "esgotad", "sono", "dormir", "sem energia"],
  ansioso: ["ansios", "nervos", "preocupad", "aflit", "medo", "angusti", "apreensiv"],
  calmo: ["calm", "tranquil", "relax", "paz", "sereno", "descansar", "respirar"],
  nostalgico: ["nostalg", "saudade", "lembranc", "passado", "antigamente", "memoria"],
  reflexivo: ["pensand", "reflet", "refleti", "duvida", "questionand", "entender"],
  animado: ["empolgad", "energia", "vibrand", "animo", "bora", "festa", "dancar"],
  irritado: ["irritad", "raiva", "bravo", "brava", "revoltad", "furios", "odeio", "estress"],
  melancolico: ["melancol", "vazio", "nublado", "cinza", "apatia", "desanimad", "chuv"],
  focado: ["estudar", "estudand", "foco", "concentr", "trabalhar", "prova", "produtiv"],
  apaixonado: ["apaixonad", "amor", "paixao", "crush", "namorad", "coracao"],
};

const PISTAS_CONTEXTO: Record<Exclude<Contexto, "qualquer">, string[]> = {
  madrugada: ["madrugada", "de noite", "a noite", "insonia", "nao consigo dormir", "3 da manha"],
  estudo: ["estudar", "estudand", "prova", "faculdade", "trabalho de", "concentr", "ler"],
  treino: ["academia", "treino", "treinar", "correr", "corrida", "malhar", "exercicio"],
  trajeto: ["onibus", "metro", "carro", "dirigindo", "viagem", "estrada", "caminhando"],
  descanso: ["descansar", "deitad", "cama", "dormir", "folga", "sofa"],
};

/** Minúsculas e sem acento, para comparar sem surpresa. */
function normalizar(texto: string): string {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function contarPistas(textoLimpo: string, pistas: string[]): number {
  return pistas.filter((pista) => textoLimpo.includes(normalizar(pista))).length;
}

export class LexicoProvider implements AIProvider {
  readonly nome = "lexico";

  async analisarHumor(texto: string): Promise<PerfilEmocional> {
    const limpo = normalizar(texto);

    // Emoções, ordenadas por quantas pistas apareceram.
    const pontuadas = (Object.entries(PISTAS_EMOCAO) as [Emocao, string[]][])
      .map(([emocao, pistas]) => ({ emocao, pontos: contarPistas(limpo, pistas) }))
      .filter((item) => item.pontos > 0)
      .sort((a, b) => b.pontos - a.pontos);

    // Nada reconhecido? "reflexivo" é o palpite mais seguro e nunca
    // devolve uma tela vazia. Confiança baixa sinaliza o chute.
    const emotion: Emocao = pontuadas[0]?.emocao ?? "reflexivo";
    const reconheceu = pontuadas.length > 0;

    const contexto = (Object.entries(PISTAS_CONTEXTO) as [Contexto, string[]][])
      .map(([ctx, pistas]) => ({ ctx, pontos: contarPistas(limpo, pistas) }))
      .filter((item) => item.pontos > 0)
      .sort((a, b) => b.pontos - a.pontos)[0];

    const context: Contexto = contexto?.ctx ?? "qualquer";
    const regra = resolverRegra(emotion, context);

    return {
      emotion,
      context,
      energy: regra.energia,
      tags: regra.tags.slice(0, 5).map((t) => t.tag),
      keywords: this.extrairPalavras(limpo),
      // Mais pistas encontradas = mais confiança, com teto em 0.75.
      // O léxico nunca se declara tão confiante quanto um modelo real.
      confidence: reconheceu ? Math.min(0.45 + pontuadas[0]!.pontos * 0.1, 0.75) : 0.25,
    };
  }

  /** Guarda apenas palavras longas — as curtas são preposições e ruído. */
  private extrairPalavras(textoLimpo: string): string[] {
    return [...new Set(textoLimpo.split(/[^a-z]+/).filter((p) => p.length >= 5))].slice(0, 8);
  }
}
