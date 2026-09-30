/**
 * Taxonomia fechada do Moodify.
 *
 * Esta é a fonte da verdade que a IA precisa respeitar. Qualquer emoção,
 * contexto ou tag que não esteja aqui é descartada na validação — é o que
 * impede o modelo de inventar rótulos que não existem na base.
 */

export const EMOCOES = [
  "feliz",
  "triste",
  "cansado",
  "ansioso",
  "calmo",
  "nostalgico",
  "reflexivo",
  "animado",
  "irritado",
  "melancolico",
  "focado",
  "apaixonado",
] as const;

export type Emocao = (typeof EMOCOES)[number];

export const CONTEXTOS = [
  "qualquer",
  "madrugada",
  "estudo",
  "treino",
  "trajeto",
  "descanso",
] as const;

export type Contexto = (typeof CONTEXTOS)[number];

export const ENERGIAS = ["low", "medium", "high"] as const;
export type Energia = (typeof ENERGIAS)[number];

/**
 * Temas de vida — o ASSUNTO do que a pessoa contou, não o sentimento.
 *
 * Existe porque emoção sozinha perde informação. "Acabei de terminar" e
 * "estou cansado do trabalho" podem gerar a mesma tristeza, mas pedem
 * músicas completamente diferentes. O tema é o que dá especificidade.
 */
export const TEMAS = [
  "nenhum",
  "termino",
  "luto",
  "solidao",
  "saudade",
  "conquista",
  "mudanca",
  "sobrecarga",
] as const;

export type Tema = (typeof TEMAS)[number];

export const NOMES_TEMA: Record<Tema, string> = {
  nenhum: "Seu momento",
  termino: "Fim de relacionamento",
  luto: "Perda",
  solidao: "Solidão",
  saudade: "Saudade",
  conquista: "Conquista",
  mudanca: "Mudança",
  sobrecarga: "Sobrecarga",
};

/**
 * Intenção: o que a pessoa quer que a música FAÇA com o sentimento.
 *
 * Quem escolhe é ela, não o algoritmo — é a diferença entre um app que acha
 * que sabe o que você precisa e um que pergunta. Mergulhar no sentimento
 * (catarse) e sair dele são ambos válidos, e só a pessoa sabe qual quer.
 */
export const INTENCOES = ["acolher", "levantar"] as const;
export type Intencao = (typeof INTENCOES)[number];

/**
 * Tags de descoberta. São propositalmente as tags sociais da Last.fm, e não
 * gêneros — `melancholic` e `late night` descrevem um momento muito melhor
 * que `Alternative Rock`.
 */
export const TAGS = [
  // Clima emocional
  "melancholic",
  "uplifting",
  "bittersweet",
  "hopeful",
  "angry",
  "romantic",
  "dreamy",
  // Temas de vida
  "heartbreak",
  "empowering",
  "healing",
  "letting go",
  // Momento
  "late night",
  "rainy day",
  "sunny",
  "roadtrip",
  // Função
  "chill",
  "focus",
  "study",
  "workout",
  "sleep",
  "energetic",
  // Sonoridade
  "acoustic",
  "instrumental",
  "ambient",
  "lo-fi",
  "indie",
  "folk",
  "dream pop",
  "soul",
  "pop",
  "dance",
  "rock",
  "metal",
  "jazz",
  "classical",
] as const;

export type Tag = (typeof TAGS)[number];

/** Rótulos em português para exibição no app. */
export const NOMES_EMOCAO: Record<Emocao, string> = {
  feliz: "Feliz",
  triste: "Triste",
  cansado: "Cansado",
  ansioso: "Ansioso",
  calmo: "Tranquilo",
  nostalgico: "Nostálgico",
  reflexivo: "Reflexivo",
  animado: "Animado",
  irritado: "Irritado",
  melancolico: "Melancólico",
  focado: "Focado",
  apaixonado: "Apaixonado",
};

export const EMOJIS_EMOCAO: Record<Emocao, string> = {
  feliz: "😊",
  triste: "😢",
  cansado: "😴",
  ansioso: "😟",
  calmo: "😌",
  nostalgico: "🌙",
  reflexivo: "💭",
  animado: "💪",
  irritado: "😠",
  melancolico: "🍂",
  focado: "📚",
  apaixonado: "💜",
};

export const NOMES_CONTEXTO: Record<Contexto, string> = {
  qualquer: "Qualquer momento",
  madrugada: "Madrugada",
  estudo: "Estudando",
  treino: "Treinando",
  trajeto: "No trajeto",
  descanso: "Descansando",
};

export const NOMES_ENERGIA: Record<Energia, string> = {
  low: "Baixa",
  medium: "Média",
  high: "Alta",
};

// Conjuntos para validação rápida — Set tem busca O(1), array tem O(n).
const SET_EMOCOES = new Set<string>(EMOCOES);
const SET_CONTEXTOS = new Set<string>(CONTEXTOS);
const SET_TAGS = new Set<string>(TAGS);

export function ehEmocaoValida(valor: string): valor is Emocao {
  return SET_EMOCOES.has(valor);
}

export function ehContextoValido(valor: string): valor is Contexto {
  return SET_CONTEXTOS.has(valor);
}

export function ehTagValida(valor: string): valor is Tag {
  return SET_TAGS.has(valor);
}

/** Descarta o que a IA inventou, preservando a ordem do que sobrou. */
export function filtrarTagsValidas(tags: string[]): Tag[] {
  const vistas = new Set<string>();
  const validas: Tag[] = [];

  for (const bruta of tags) {
    const normalizada = bruta.trim().toLowerCase();
    if (ehTagValida(normalizada) && !vistas.has(normalizada)) {
      vistas.add(normalizada);
      validas.push(normalizada);
    }
  }

  return validas;
}
