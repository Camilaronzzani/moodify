import assert from "node:assert/strict";
import test, { describe } from "node:test";
import { ehTagValida } from "../../dominio/taxonomia.ts";
import { LexicoProvider } from "./lexico.ts";

/**
 * Testes do classificador de linha de base.
 *
 * Ele é o fallback que nunca pode falhar: se o LLM cair, é isto que responde.
 * Os testes garantem que ele sempre devolve um perfil utilizável — nunca
 * tags inválidas, nunca lista vazia.
 */

const lexico = new LexicoProvider();

describe("LexicoProvider — reconhece emoções", () => {
  const casos: [string, string][] = [
    ["hoje estou cansado, sem energia nenhuma", "cansado"],
    ["estou muito feliz e alegre", "feliz"],
    ["estou triste, chorando e magoado", "triste"],
    ["que raiva, estou muito irritado", "irritado"],
    ["preciso de foco para estudar", "focado"],
    ["que saudade daquela época", "nostalgico"],
    ["estou ansioso e preocupado", "ansioso"],
    ["quero relaxar e ficar tranquilo", "calmo"],
    ["estou apaixonado", "apaixonado"],
  ];

  for (const [texto, esperada] of casos) {
    test(`"${texto}" → ${esperada}`, async () => {
      const perfil = await lexico.analisarHumor(texto);
      assert.equal(perfil.emotion, esperada);
    });
  }
});

describe("LexicoProvider — casos ambíguos", () => {
  /**
   * "triste e sozinho" tem pista de emoção (triste) e de tema (solidão, que
   * mapeia para melancólico). As duas leituras são defensáveis e levam a
   * músicas parecidas — o teste aceita qualquer uma em vez de cravar uma
   * resposta que o produto não precisa garantir.
   */
  test("triste + sozinho aceita tristeza ou melancolia", async () => {
    const perfil = await lexico.analisarHumor("estou triste e sozinho");
    assert.ok(
      ["triste", "melancolico"].includes(perfil.emotion),
      `esperava triste ou melancolico, veio: ${perfil.emotion}`,
    );
  });
});

describe("LexicoProvider — reconhece contexto", () => {
  test("academia vira contexto de treino", async () => {
    const perfil = await lexico.analisarHumor("vou treinar na academia agora");
    assert.equal(perfil.context, "treino");
    assert.equal(perfil.energy, "high");
  });

  test("madrugada muda a energia para baixa", async () => {
    const perfil = await lexico.analisarHumor("nao consigo dormir de madrugada");
    assert.equal(perfil.context, "madrugada");
    assert.equal(perfil.energy, "low");
  });

  test("sem pista de contexto usa 'qualquer'", async () => {
    const perfil = await lexico.analisarHumor("estou feliz");
    assert.equal(perfil.context, "qualquer");
  });
});

describe("LexicoProvider — garantias do contrato", () => {
  test("nunca devolve tag fora da taxonomia", async () => {
    const textos = [
      "estou cansado",
      "vou treinar",
      "texto sem nenhuma pista reconhecivel aqui",
      "",
    ];

    for (const texto of textos) {
      const perfil = await lexico.analisarHumor(texto);
      for (const tag of perfil.tags) {
        assert.ok(ehTagValida(tag), `tag inválida devolvida: ${tag}`);
      }
    }
  });

  test("sempre devolve ao menos uma tag", async () => {
    const perfil = await lexico.analisarHumor("blablabla xyz");
    assert.ok(perfil.tags.length > 0, "lista vazia deixaria a tela sem conteúdo");
  });

  test("texto irreconhecível cai em reflexivo com confiança baixa", async () => {
    const perfil = await lexico.analisarHumor("zzz qqq www");
    assert.equal(perfil.emotion, "reflexivo");
    assert.ok(perfil.confidence < 0.35, "confiança deve sinalizar que foi um chute");
  });

  test("mais pistas resultam em mais confiança", async () => {
    const fraco = await lexico.analisarHumor("triste");
    const forte = await lexico.analisarHumor("triste, chorando, sozinho e magoado");
    assert.ok(
      forte.confidence > fraco.confidence,
      "texto com mais pistas deveria dar mais confiança",
    );
  });

  test("confiança nunca passa de 1", async () => {
    const perfil = await lexico.analisarHumor(
      "triste chorar choro sozinho solidao magoado chateado acabou",
    );
    assert.ok(perfil.confidence <= 1);
  });
});
