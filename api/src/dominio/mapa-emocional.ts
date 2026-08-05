import type { Contexto, Emocao, Energia, Tag } from "./taxonomia.ts";

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
 * Combina a regra base da emoção com o ajuste do contexto.
 * Quando a mesma tag aparece nos dois, fica o peso maior.
 */
export function resolverRegra(emocao: Emocao, contexto: Contexto): RegraEmocional {
  const base = MAPA_BASE[emocao];
  const ajuste = AJUSTES_CONTEXTO[contexto];

  if (!ajuste) {
    return base;
  }

  const pesos = new Map<Tag, number>();
  for (const { tag, peso } of [...base.tags, ...ajuste.tags]) {
    pesos.set(tag, Math.max(pesos.get(tag) ?? 0, peso));
  }

  return {
    energia: ajuste.energia ?? base.energia,
    tags: [...pesos.entries()]
      .map(([tag, peso]) => ({ tag, peso }))
      .sort((a, b) => b.peso - a.peso),
  };
}
