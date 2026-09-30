import type { Contexto, Emocao, Energia, Intencao, Tag, Tema } from "./taxonomia.ts";

/**
 * O mapa emocional: emoção (+ contexto) → tags com peso.
 *
 * Esta é a semente curada à mão que substitui o endpoint de recomendações do
 * Spotify. É deliberadamente pequena: o objetivo é cobrir bem o essencial e
 * deixar a Last.fm expandir depois.
 *
 * `peso` vai de 0 a 1 e entra direto na pontuação das faixas.
 */

export type RegraEmocional = {
  tags: { tag: Tag; peso: number }[];
  energia: Energia;
};

/** Regra base por emoção, válida quando não há contexto específico. */
export const MAPA_BASE: Record<Emocao, RegraEmocional> = {
  feliz: {
    energia: "high",
    tags: [
      { tag: "uplifting", peso: 1.0 },
      { tag: "pop", peso: 0.8 },
      { tag: "dance", peso: 0.7 },
      { tag: "sunny", peso: 0.6 },
    ],
  },
  triste: {
    energia: "low",
    tags: [
      { tag: "melancholic", peso: 1.0 },
      { tag: "acoustic", peso: 0.8 },
      { tag: "soul", peso: 0.7 },
      { tag: "folk", peso: 0.6 },
    ],
  },
  cansado: {
    energia: "low",
    tags: [
      { tag: "chill", peso: 1.0 },
      { tag: "lo-fi", peso: 0.9 },
      { tag: "ambient", peso: 0.7 },
      { tag: "instrumental", peso: 0.6 },
    ],
  },
  ansioso: {
    energia: "low",
    tags: [
      { tag: "ambient", peso: 1.0 },
      { tag: "classical", peso: 0.8 },
      { tag: "instrumental", peso: 0.8 },
      { tag: "chill", peso: 0.6 },
    ],
  },
  calmo: {
    energia: "low",
    tags: [
      { tag: "chill", peso: 1.0 },
      { tag: "acoustic", peso: 0.7 },
      { tag: "ambient", peso: 0.7 },
      { tag: "classical", peso: 0.6 },
    ],
  },
  nostalgico: {
    energia: "low",
    tags: [
      { tag: "bittersweet", peso: 1.0 },
      { tag: "indie", peso: 0.8 },
      { tag: "dream pop", peso: 0.7 },
      { tag: "folk", peso: 0.6 },
    ],
  },
  reflexivo: {
    energia: "medium",
    tags: [
      { tag: "indie", peso: 0.9 },
      { tag: "instrumental", peso: 0.8 },
      { tag: "folk", peso: 0.7 },
      { tag: "classical", peso: 0.6 },
    ],
  },
  animado: {
    energia: "high",
    tags: [
      { tag: "energetic", peso: 1.0 },
      { tag: "dance", peso: 0.8 },
      { tag: "rock", peso: 0.7 },
      { tag: "pop", peso: 0.6 },
    ],
  },
  irritado: {
    energia: "high",
    tags: [
      { tag: "angry", peso: 1.0 },
      { tag: "rock", peso: 0.8 },
      { tag: "metal", peso: 0.8 },
      { tag: "energetic", peso: 0.5 },
    ],
  },
  melancolico: {
    energia: "low",
    tags: [
      { tag: "melancholic", peso: 1.0 },
      { tag: "dream pop", peso: 0.8 },
      { tag: "indie", peso: 0.7 },
      { tag: "rainy day", peso: 0.6 },
    ],
  },
  focado: {
    energia: "medium",
    tags: [
      { tag: "focus", peso: 1.0 },
      { tag: "instrumental", peso: 0.9 },
      { tag: "lo-fi", peso: 0.8 },
      { tag: "classical", peso: 0.6 },
    ],
  },
  apaixonado: {
    energia: "medium",
    tags: [
      { tag: "romantic", peso: 1.0 },
      { tag: "soul", peso: 0.8 },
      { tag: "dreamy", peso: 0.7 },
      { tag: "pop", peso: 0.5 },
    ],
  },
};

/**
 * Ajustes por contexto. Sobrepõem-se ao mapa base — é aqui que
 * "triste às 3h da manhã" se separa de "triste na academia".
 *
 * Só as combinações que realmente mudam o resultado estão aqui; o resto
 * cai no mapa base, e isso é intencional para a curadoria não explodir.
 */
export const AJUSTES_CONTEXTO: Partial<
  Record<Contexto, { tags: { tag: Tag; peso: number }[]; energia?: Energia }>
> = {
  madrugada: {
    energia: "low",
    tags: [
      { tag: "late night", peso: 1.0 },
      { tag: "dreamy", peso: 0.7 },
      { tag: "ambient", peso: 0.6 },
    ],
  },
  estudo: {
    energia: "medium",
    tags: [
      { tag: "study", peso: 1.0 },
      { tag: "focus", peso: 0.9 },
      { tag: "instrumental", peso: 0.8 },
      { tag: "lo-fi", peso: 0.7 },
    ],
  },
  treino: {
    energia: "high",
    tags: [
      { tag: "workout", peso: 1.0 },
      { tag: "energetic", peso: 0.9 },
      { tag: "dance", peso: 0.5 },
    ],
  },
  trajeto: {
    tags: [
      { tag: "roadtrip", peso: 0.9 },
      { tag: "indie", peso: 0.5 },
    ],
  },
  descanso: {
    energia: "low",
    tags: [
      { tag: "sleep", peso: 0.9 },
      { tag: "ambient", peso: 0.8 },
      { tag: "chill", peso: 0.7 },
    ],
  },
};

/**
 * Tags por tema de vida.
 *
 * É o que dá especificidade: "acabei de terminar" pede `heartbreak`, não
 * apenas `melancholic` genérico. Os pesos são altos porque o tema é mais
 * informativo que a emoção quando ele existe.
 */
export const MAPA_TEMA: Record<Tema, { tag: Tag; peso: number }[]> = {
  nenhum: [],
  termino: [
    { tag: "heartbreak", peso: 1.0 },
    { tag: "letting go", peso: 0.9 },
    { tag: "soul", peso: 0.7 },
    { tag: "acoustic", peso: 0.6 },
  ],
  luto: [
    { tag: "healing", peso: 1.0 },
    { tag: "instrumental", peso: 0.8 },
    { tag: "classical", peso: 0.7 },
    { tag: "ambient", peso: 0.6 },
  ],
  solidao: [
    { tag: "melancholic", peso: 0.9 },
    { tag: "late night", peso: 0.8 },
    { tag: "indie", peso: 0.6 },
  ],
  saudade: [
    { tag: "bittersweet", peso: 1.0 },
    { tag: "folk", peso: 0.7 },
    { tag: "dream pop", peso: 0.6 },
  ],
  conquista: [
    { tag: "empowering", peso: 1.0 },
    { tag: "uplifting", peso: 0.9 },
    { tag: "dance", peso: 0.7 },
  ],
  mudanca: [
    { tag: "hopeful", peso: 1.0 },
    { tag: "roadtrip", peso: 0.7 },
    { tag: "indie", peso: 0.6 },
  ],
  sobrecarga: [
    { tag: "chill", peso: 1.0 },
    { tag: "ambient", peso: 0.9 },
    { tag: "instrumental", peso: 0.7 },
  ],
};

/**
 * Tags de contraste — para quando a pessoa quer SAIR do estado atual.
 *
 * Não é o oposto mecânico: para tristeza, `empowering` e `healing` funcionam
 * melhor que música alegre, que soa desconectada de quem está mal. A ideia é
 * puxar para cima sem negar o que a pessoa está sentindo.
 */
const CONTRASTE: Record<Emocao, { tag: Tag; peso: number }[]> = {
  triste: [
    { tag: "empowering", peso: 1.0 },
    { tag: "hopeful", peso: 0.9 },
    { tag: "uplifting", peso: 0.8 },
    { tag: "soul", peso: 0.6 },
  ],
  melancolico: [
    { tag: "uplifting", peso: 1.0 },
    { tag: "sunny", peso: 0.8 },
    { tag: "pop", peso: 0.7 },
  ],
  cansado: [
    { tag: "energetic", peso: 1.0 },
    { tag: "uplifting", peso: 0.8 },
    { tag: "dance", peso: 0.7 },
  ],
  ansioso: [
    { tag: "ambient", peso: 1.0 },
    { tag: "healing", peso: 0.9 },
    { tag: "classical", peso: 0.7 },
  ],
  irritado: [
    { tag: "chill", peso: 1.0 },
    { tag: "ambient", peso: 0.9 },
    { tag: "healing", peso: 0.7 },
  ],
  nostalgico: [
    { tag: "hopeful", peso: 1.0 },
    { tag: "sunny", peso: 0.8 },
    { tag: "uplifting", peso: 0.7 },
  ],
  reflexivo: [
    { tag: "uplifting", peso: 0.9 },
    { tag: "energetic", peso: 0.7 },
  ],
  // Para quem já está bem, "levantar" é manter e ampliar.
  feliz: [
    { tag: "dance", peso: 1.0 },
    { tag: "energetic", peso: 0.9 },
  ],
  animado: [
    { tag: "energetic", peso: 1.0 },
    { tag: "dance", peso: 0.9 },
  ],
  calmo: [
    { tag: "uplifting", peso: 0.9 },
    { tag: "sunny", peso: 0.7 },
  ],
  focado: [
    { tag: "energetic", peso: 0.9 },
    { tag: "uplifting", peso: 0.7 },
  ],
  apaixonado: [
    { tag: "romantic", peso: 1.0 },
    { tag: "dance", peso: 0.7 },
  ],
};

/** Energia alvo quando a pessoa quer sair do estado atual. */
const ENERGIA_AO_LEVANTAR: Record<Energia, Energia> = {
  low: "medium",
  medium: "high",
  high: "high",
};

/**
 * Combina emoção, contexto, tema e intenção numa regra única.
 *
 * Ordem de influência: a intenção decide QUAL conjunto de tags usar; o tema
 * acrescenta especificidade; o contexto ajusta a energia.
 */
export function resolverRegra(
  emocao: Emocao,
  contexto: Contexto,
  tema: Tema = "nenhum",
  intencao: Intencao = "acolher",
): RegraEmocional {
  const base = MAPA_BASE[emocao];
  const ajuste = AJUSTES_CONTEXTO[contexto];

  // Acolher usa as tags da própria emoção; levantar usa as de contraste.
  const principais = intencao === "levantar" ? CONTRASTE[emocao] : base.tags;

  // O tema entra nas duas intenções, mas com peso menor ao levantar: ali o
  // objetivo é mudar o estado, e insistir no assunto puxaria de volta.
  const doTema = MAPA_TEMA[tema].map(({ tag, peso }) => ({
    tag,
    peso: intencao === "levantar" ? peso * 0.4 : peso,
  }));

  const pesos = new Map<Tag, number>();
  for (const { tag, peso } of [...principais, ...doTema, ...(ajuste?.tags ?? [])]) {
    pesos.set(tag, Math.max(pesos.get(tag) ?? 0, peso));
  }

  const energiaBase = ajuste?.energia ?? base.energia;

  return {
    energia: intencao === "levantar" ? ENERGIA_AO_LEVANTAR[energiaBase] : energiaBase,
    tags: [...pesos.entries()]
      .map(([tag, peso]) => ({ tag, peso }))
      .sort((a, b) => b.peso - a.peso),
  };
}
