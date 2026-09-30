import { resolverRegra } from "../../dominio/mapa-emocional.ts";
import type { Contexto, Emocao, Intencao, Tema } from "../../dominio/taxonomia.ts";
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
  apaixonado: ["apaixonad", "paixao", "crush", "gamad", "amo ela", "amo ele", "estou amando"],
};

const PISTAS_CONTEXTO: Record<Exclude<Contexto, "qualquer">, string[]> = {
  madrugada: ["madrugada", "de noite", "a noite", "insonia", "nao consigo dormir", "3 da manha"],
  estudo: ["estudar", "estudand", "prova", "faculdade", "trabalho de", "concentr", "ler"],
  treino: ["academia", "treino", "treinar", "correr", "corrida", "malhar", "exercicio"],
  trajeto: ["onibus", "metro", "carro", "dirigindo", "viagem", "estrada", "caminhando"],
  descanso: ["descansar", "deitad", "cama", "dormir", "folga", "sofa"],
};

/**
 * Pistas de TEMA — o assunto, não o sentimento.
 *
 * Vem antes da emoção na ordem de importância: quem escreve "acabei de
 * terminar" está dizendo algo muito mais específico que "estou triste", e
 * a recomendação precisa refletir isso.
 */
const PISTAS_TEMA: Record<Exclude<Tema, "nenhum">, string[]> = {
  termino: [
    "terminei", "terminamos", "acabei de terminar", "acabou o namoro",
    "meu namoro acabou", "terminou comigo", "me deixou", "fui largad",
    "levei um pe na bunda", "separacao", "divorcio", "ex namorad",
    "rompi", "acabou tudo entre",
  ],
  luto: [
    "faleceu", "morreu", "perdi meu", "perdi minha", "enterro", "velorio",
    "luto", "saudade de quem", "partiu dessa",
  ],
  solidao: [
    "sozinh", "solidao", "ninguem me", "sem amigos", "abandonad", "isolad",
  ],
  saudade: [
    "saudade", "sinto falta", "lembranc", "antigamente", "aquela epoca",
    "queria voltar no tempo",
  ],
  conquista: [
    "consegui", "passei na prova", "fui aprovad", "promocao", "deu certo",
    "conquistei", "ganhei", "me formei", "novo emprego",
  ],
  mudanca: [
    "mudei de", "vou mudar", "nova cidade", "comecando de novo", "recomec",
    "virada de vida", "novo capitulo", "primeiro dia",
  ],
  sobrecarga: [
    "sobrecarregad", "nao dou conta", "muita coisa", "esgotad", "burnout",
    "sem tempo pra nada", "no meu limite", "estressad com tudo",
  ],
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

/**
 * Emoção provável de cada tema, para quando a pessoa conta o fato sem
 * nomear o sentimento — "acabei de terminar" não diz "estou triste", mas
 * responder com música alegre seria uma leitura ruim da situação.
 */
const EMOCAO_DO_TEMA: Record<Tema, Emocao | null> = {
  nenhum: null,
  termino: "triste",
  luto: "triste",
  solidao: "melancolico",
  saudade: "nostalgico",
  conquista: "feliz",
  mudanca: "reflexivo",
  sobrecarga: "cansado",
};

function emocaoDoTema(tema: Tema): Emocao | null {
  return EMOCAO_DO_TEMA[tema];
}

/**
 * Quanto vale um tema, medido em "pistas de emoção".
 *
 * 2 significa: um tema reconhecido só perde para uma emoção com 3+ pistas —
 * ou seja, quando a pessoa foi muito explícita sobre o sentimento.
 */
const FORCA_BASE_DO_TEMA = 2;

/** O léxico nunca se declara tão confiante quanto um modelo de verdade. */
function calcularConfianca(pistasDeEmocao: number, temTema: boolean): number {
  if (pistasDeEmocao === 0 && !temTema) {
    return 0.25;
  }

  const base = pistasDeEmocao > 0 ? 0.45 + pistasDeEmocao * 0.1 : 0.5;
  return Math.min(temTema ? base + 0.15 : base, 0.8);
}

export class LexicoProvider implements AIProvider {
  readonly nome = "lexico";

  async analisarHumor(texto: string, intencao: Intencao = "acolher"): Promise<PerfilEmocional> {
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

    const temaEncontrado = (Object.entries(PISTAS_TEMA) as [Tema, string[]][])
      .map(([tema, pistas]) => ({ tema, pontos: contarPistas(limpo, pistas) }))
      .filter((item) => item.pontos > 0)
      .sort((a, b) => b.pontos - a.pontos)[0];

    const theme: Tema = temaEncontrado?.tema ?? "nenhum";

    // O TEMA tem prioridade sobre a emoção detectada por palavra solta.
    //
    // "acabei de terminar com a minha namorada" tem uma pista de paixão
    // ("namorada") e um tema claro (término). Confiar na palavra solta fazia
    // o app responder com música romântica a quem acabou de levar um fora.
    // Um tema reconhecido vale mais que uma pista isolada de emoção.
    const forcaDoTema = temaEncontrado ? temaEncontrado.pontos + FORCA_BASE_DO_TEMA : 0;
    const forcaDaEmocao = pontuadas[0]?.pontos ?? 0;

    const emotionFinal =
      forcaDoTema > forcaDaEmocao ? (emocaoDoTema(theme) ?? emotion) : emotion;

    const regra = resolverRegra(emotionFinal, context, theme, intencao);

    return {
      emotion: emotionFinal,
      theme,
      context,
      energy: regra.energia,
      tags: regra.tags.slice(0, 5).map((t) => t.tag),
      keywords: this.extrairPalavras(limpo),
      // Mais pistas encontradas = mais confiança, com teto em 0.75.
      // O léxico nunca se declara tão confiante quanto um modelo real.
      // Tema reconhecido levanta a confiança mesmo sem pista de emoção:
      // "acabei de terminar" é informação clara, não um chute.
      confidence: calcularConfianca(pontuadas[0]?.pontos ?? 0, theme !== "nenhum"),
    };
  }

  /** Guarda apenas palavras longas — as curtas são preposições e ruído. */
  private extrairPalavras(textoLimpo: string): string[] {
    return [...new Set(textoLimpo.split(/[^a-z]+/).filter((p) => p.length >= 5))].slice(0, 8);
  }
}
